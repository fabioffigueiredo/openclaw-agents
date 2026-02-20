"use strict";

/**
 * Comando CLI: update
 *
 * Atualiza templates .agent/ preservando customizações do usuário.
 * Compara arquivos por hash SHA-256 e só sobrescreve se:
 * - O arquivo não foi customizado pelo usuário (hash original)
 * - Ou se o template tem uma versão mais nova
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const readline = require("readline");
const { detectContext, getAuditHeader } = require("../context");
const { writeCliAudit } = require("../utils/audit-writer");
const { guardPlan } = require("../utils/scope_guard");

// Caminho dos templates incluídos no pacote
const TEMPLATES_DIR = path.join(__dirname, "..", "..", "templates", ".agent");

function ask(q) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    return new Promise((res) => rl.question(q, (ans) => { rl.close(); res(ans.trim()); }));
}

function safeRel(targetPath, p) {
    return path.relative(targetPath, p);
}

// writeAudit extraído para lib/utils/audit-writer.js (DRY)
function writeAudit(targetPath, lines, flags) {
    writeCliAudit(targetPath, lines, flags, "update");
}

/**
 * Calcula o SHA-256 de um arquivo (Utilitário mantido)
 */
function fileHash(filePath) {
    const content = fs.readFileSync(filePath);
    return crypto.createHash("sha256").update(content).digest("hex");
}

/**
 * Simples gerador de diff rústico mas efetivo para CLI
 */
function simpleDiff(oldStr, newStr) {
    const oldLines = oldStr.split("\n");
    const newLines = newStr.split("\n");
    let diffStr = "";

    const maxLength = Math.max(oldLines.length, newLines.length);
    let diffCount = 0;

    for (let i = 0; i < maxLength && diffCount < 10; i++) {
        if (oldLines[i] !== newLines[i]) {
            if (oldLines[i] !== undefined) diffStr += `\x1b[31m- ${oldLines[i]}\x1b[0m\n`;
            if (newLines[i] !== undefined) diffStr += `\x1b[32m+ ${newLines[i]}\x1b[0m\n`;
            diffCount++;
        }
    }
    if (diffCount >= 10) diffStr += `\x1b[90m... (diff truncado para 10 linhas)\x1b[0m\n`;

    return diffStr || "  (Nenhuma diferença detetada no payload comparável)";
}

/**
 * Analisa atualizações necessárias.
 * Retorna lista de ações planejadas.
 */
function planUpdates(src, dest, actions = { added: [], updated: [], skipped: [] }) {
    if (!fs.existsSync(dest)) {
        // Diretório não existe no destino, será acompanhado na copia de arquivos
    }

    const entries = fs.readdirSync(src, { withFileTypes: true });

    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);

        if (entry.isDirectory()) {
            if (!fs.existsSync(destPath)) {
                // Diretório novo, tudo dentro será added
                // Simplificação: marcar diretório como added e não recursar? 
                // Melhor recursar para listar arquivos
            }
            planUpdates(srcPath, destPath, actions);
        } else {
            if (!fs.existsSync(destPath)) {
                actions.added.push({ src: srcPath, dest: destPath });
            } else {
                const srcHash = fileHash(srcPath);
                const destHash = fileHash(destPath);
                if (srcHash === destHash) {
                    actions.skipped.push({ src: srcPath, dest: destPath });
                } else {
                    actions.updated.push({ src: srcPath, dest: destPath });
                }
            }
        }
    }
    return actions;
}

/**
 * Executa o comando update com segurança.
 */
async function run({ targetPath, flags }) {
    const agentDir = path.join(targetPath, ".agent");
    const ctx = detectContext(targetPath);

    // Default: Plan Mode
    const planMode = !flags.apply;

    if (!fs.existsSync(agentDir)) {
        console.error("❌ Diretório .agent/ não encontrado.");
        console.error("   Rode 'openclaw init' primeiro.");
        process.exit(1);
    }
    if (!fs.existsSync(TEMPLATES_DIR)) {
        console.error("❌ Templates não encontrados.");
        process.exit(1);
    }

    // 1. Planejar
    const actions = planUpdates(TEMPLATES_DIR, agentDir);
    const audit = [getAuditHeader(ctx, "update", flags)];

    // 1.5 Acionar Scope Guard
    const intents = { writes: [], deletes: [], overwrites: [] };
    for (const a of actions.added) intents.writes.push(a.dest);
    for (const a of actions.updated) intents.overwrites.push(a.dest);
    await guardPlan(targetPath, intents, flags);

    // 2. Exibir Plano
    console.log(`\n🧭 Plano de Atualização (${planMode ? "SIMULAÇÃO" : "APPLY"}):\n`);
    console.log(`   Contexto: ${ctx.env} | IDE: ${ctx.ide}\n`);

    if (actions.added.length > 0) {
        console.log(`📄 Novos (${actions.added.length}):`);
        actions.added.forEach(a => console.log(`   + CREATE ${safeRel(targetPath, a.dest)}`));
    }
    if (actions.updated.length > 0) {
        console.log(`\n🔄 Modificados (${actions.updated.length}):`);
        actions.updated.forEach(a => {
            console.log(`   ~ UPDATE ${safeRel(targetPath, a.dest)} (Exige confirmação interativa)`);
        });
    }
    if (actions.skipped.length > 0) {
        console.log(`\n⏭️  Ignorados (${actions.skipped.length} arquivos idênticos)`);
    }

    if (actions.added.length === 0 && actions.updated.length === 0) {
        console.log("\n✅ Tudo atualizado. Nenhuma alteração necessária.");
        return;
    }

    if (planMode) {
        console.log("\n🔒 Modo PLAN (Read-Only). Nenhuma alteração feita.");
        console.log("   Dica: a opção --merge foi desativada no modo interativo para forçar diff por arquivo.");
        console.log("   Para aplicar e resolver conflitos: npx openclaw update --apply");
        return;
    }

    // 3. Confirmação inicial
    if (!flags.yes && actions.updated.length === 0) {
        const ok = await ask("\nAplicar e copiar arquivos novos? (y/N): ");
        if (ok.toLowerCase() !== "y") {
            console.log("⏹️  Cancelado.");
            return;
        }
    }

    // 4. Execução Interativa Segura (Conflitos file-by-file)
    try {
        console.log("\n🚀 Executando atualizações...");

        // Criar diretórios necessários
        function ensureDir(p) {
            const dir = path.dirname(p);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        }

        // Action: Added
        for (const action of actions.added) {
            ensureDir(action.dest);
            fs.copyFileSync(action.src, action.dest);
            audit.push(`- ACT: CREATED ${safeRel(targetPath, action.dest)}`);
        }

        // Action: Updated (Conflict Resolver)
        for (const action of actions.updated) {
            ensureDir(action.dest);
            const rPath = safeRel(targetPath, action.dest);

            let overwrite = flags.yes || flags.force;

            if (!overwrite) {
                console.log(`\n⚠️ CONFLITO DETECTADO: ${rPath}`);
                console.log("------------------------------------------------");
                const oldContent = fs.readFileSync(action.dest, "utf-8");
                const newContent = fs.readFileSync(action.src, "utf-8");
                console.log(simpleDiff(oldContent, newContent));
                console.log("------------------------------------------------");

                const ans = await ask(`Substituir a sua versão de ${rPath} pelo código acima? [y/N]: `);
                overwrite = ans.toLowerCase() === "y";
            }

            if (overwrite) {
                const backupPath = action.dest + ".bak";
                fs.copyFileSync(action.dest, backupPath);
                fs.copyFileSync(action.src, action.dest);
                console.log(`✅ Sobrescrito: ${rPath} (Backup guardado localmente: .bak)`);
                audit.push(`- ACT: UPDATED ${rPath} (Backup: ${path.basename(backupPath)})`);
            } else {
                console.log(`⏭️  Ignorado (Mantido customização em ${rPath})`);
                audit.push(`- ACT: SKIPPED UPDATE FOR CUSTOMIZED FILE ${rPath}`);
            }
        }

        console.log("\n✨ Atualização concluída com sucesso!");
        writeAudit(targetPath, audit, flags);

    } catch (err) {
        console.error(`\n❌ Falha na execução: ${err.message}`);
        audit.push(`\n## ERROR: ${err.message}`);
        writeAudit(targetPath, audit, flags);
        process.exit(1);
    }
}

module.exports = { run, fileHash };
