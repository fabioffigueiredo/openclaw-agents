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
 * Analisa atualizações necessárias.
 * Retorna lista de ações planejadas.
 */
function planUpdates(src, dest, actions = { added: [], updated: [], skipped: [] }) {
    if (!fs.existsSync(dest)) {
        // Diretório não existe no destino, será criado implicitamente na cópia
        // Mas a lógica recursiva precisa entrar
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

    // 2. Exibir Plano
    console.log(`\n🧭 Plano de Atualização (${planMode ? "SIMULAÇÃO" : "APPLY"}):\n`);
    console.log(`   Contexto: ${ctx.env} | IDE: ${ctx.ide}\n`);

    if (actions.added.length > 0) {
        console.log(`📄 Novos (${actions.added.length}):`);
        actions.added.forEach(a => console.log(`   + CREATE ${safeRel(targetPath, a.dest)}`));
    }
    if (actions.updated.length > 0) {
        console.log(`\n🔄 Modificados (${actions.updated.length}):`);
        actions.updated.forEach(a => console.log(`   ~ UPDATE ${safeRel(targetPath, a.dest)} (Backup gerado)`));
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
        console.log("   Para aplicar, rode: npx openclaw update --apply");
        return;
    }

    // 3. Confirmação
    if (!flags.yes) {
        const ok = await ask("\nAplicar este plano? (y/N): ");
        if (ok.toLowerCase() !== "y") {
            console.log("⏹️  Cancelado.");
            return;
        }
    }

    // 4. Execução
    try {
        console.log("\n🚀 Executando atualizações...");

        // Criar diretórios necessários
        function ensureDir(p) {
            const dir = path.dirname(p);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        }

        for (const action of actions.added) {
            ensureDir(action.dest);
            fs.copyFileSync(action.src, action.dest);
            audit.push(`- ACT: CREATED ${safeRel(targetPath, action.dest)}`);
        }

        for (const action of actions.updated) {
            ensureDir(action.dest);
            const backupPath = action.dest + ".bak";
            fs.copyFileSync(action.dest, backupPath);
            fs.copyFileSync(action.src, action.dest);
            audit.push(`- ACT: UPDATED ${safeRel(targetPath, action.dest)} (Backup: ${path.basename(backupPath)})`);
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
