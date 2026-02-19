"use strict";

/**
 * Comando CLI: init
 *
 * Copia templates/.agent/ para o diretório destino.
 * Verifica se .agent/ já existe (bloqueia sem --force).
 * Cria openclaw.json com defaults via lib/config.js.
 */

const fs = require("fs");
const path = require("path");
const readline = require("readline");
const { initConfigDefaults, writeJsonSafe } = require("../config");
const { detectContext, getAuditHeader } = require("../context");

// Caminho dos templates incluídos no pacote
const TEMPLATES_DIR = path.join(__dirname, "..", "..", "templates", ".agent");

function ask(q) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    return new Promise((res) => rl.question(q, (ans) => { rl.close(); res(ans.trim()); }));
}

function safeRel(targetPath, p) {
    return path.relative(targetPath, p);
}

function writeAudit(targetPath, lines, flags) {
    if (flags.audit === false) return;
    const auditDir = path.join(targetPath, ".agent", "audit");
    if (!fs.existsSync(auditDir)) {
        // Tenta criar apenas se estivermos em modo apply, mas aqui já devemos estar
        try { fs.mkdirSync(auditDir, { recursive: true }); } catch (e) { }
    }
    const filename = `init-${new Date().toISOString().replace(/[:.]/g, "-")}.md`;
    const auditPath = path.join(auditDir, filename);
    try {
        fs.writeFileSync(auditPath, lines.join("\n") + "\n", "utf8");
    } catch (e) {
        console.error("⚠️  Falha ao gravar auditoria:", e.message);
    }
}

/**
 * Copia diretório recursivamente (Utilitário mantido)
 */
function copyDirRecursive(src, dest, stats = { files: 0, dirs: 0, skipped: 0 }, merge = false) {
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
        stats.dirs++;
    }

    const entries = fs.readdirSync(src, { withFileTypes: true });

    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);

        if (entry.isDirectory()) {
            copyDirRecursive(srcPath, destPath, stats, merge);
        } else {
            if (merge && fs.existsSync(destPath)) {
                stats.skipped++;
            } else {
                fs.copyFileSync(srcPath, destPath);
                stats.files++;
            }
        }
    }
    return stats;
}

/**
 * Executa o comando init com segurança.
 */
async function run({ targetPath, flags }) {
    const agentDir = path.join(targetPath, ".agent");
    const configPath = path.join(targetPath, "openclaw.json");
    const ctx = detectContext(targetPath);

    // Default: Plan Mode (read-only), exceto se --apply for passado
    const planMode = !flags.apply;

    const actions = [];
    const audit = [getAuditHeader(ctx, "init", flags)];
    const errors = [];

    // 1. Validar Templates
    if (!fs.existsSync(TEMPLATES_DIR)) {
        console.error("❌ Templates não encontrados. Pacote corrompido.");
        process.exit(1);
    }

    // 2. Construir Plano
    if (fs.existsSync(agentDir)) {
        if (!flags.force && !flags.merge) {
            console.error("❌ Diretório .agent/ já existe.");
            console.error("   Use --merge (seguro) ou --force (destrutivo).");
            process.exit(1);
        }
        if (flags.force) {
            actions.push({ type: "DELETE_DIR", path: agentDir, reason: "--force requested" });
            actions.push({ type: "CREATE_DIR", path: agentDir });
            actions.push({ type: "COPY_DIR", from: TEMPLATES_DIR, to: agentDir });
        } else if (flags.merge) {
            actions.push({ type: "MERGE_DIR", from: TEMPLATES_DIR, to: agentDir, reason: "--merge requested" });
        }
    } else {
        actions.push({ type: "CREATE_DIR", path: agentDir });
        actions.push({ type: "COPY_DIR", from: TEMPLATES_DIR, to: agentDir });
    }

    if (!fs.existsSync(configPath)) {
        actions.push({ type: "CREATE_FILE", path: configPath, reason: "Default config" });
    } else {
        actions.push({ type: "NOOP", path: configPath, reason: "Config exists" });
    }

    // 3. Exibir Plano
    console.log(`\n🧭 Plano de Execução (${planMode ? "SIMULAÇÃO" : "APPLY"}):\n`);
    console.log(`   Contexto: ${ctx.env} | IDE: ${ctx.ide}\n`);

    for (const a of actions) {
        if (a.type === "DELETE_DIR") console.log(`  🔥 DELETE  ${safeRel(targetPath, a.path)} (${a.reason})`);
        if (a.type === "CREATE_DIR") console.log(`  📁 CREATE  ${safeRel(targetPath, a.path)}`);
        if (a.type === "COPY_DIR") console.log(`  📦 COPY    templates -> ${safeRel(targetPath, a.to)}`);
        if (a.type === "MERGE_DIR") console.log(`  🔄 MERGE   templates -> ${safeRel(targetPath, a.to)} (Preservando existentes)`);
        if (a.type === "CREATE_FILE") console.log(`  📝 CREATE  ${safeRel(targetPath, a.path)}`);
        if (a.type === "NOOP") console.log(`  ✅ KEEP    ${safeRel(targetPath, a.path)}`);
    }

    if (planMode) {
        console.log("\n🔒 Modo PLAN (Read-Only). Nenhuma alteração feita.");
        console.log("   Para aplicar, rode: npx openclaw init --apply [--merge|--force]");
        return;
    }

    // 4. Confirmação
    if (!flags.yes) {
        if (actions.some(a => a.type === "DELETE_DIR")) {
            console.log("\n⚠️  PERIGO: Operação destrutiva detectada (--force).");
            const phrase = await ask("Digite 'DELETE .agent' para confirmar: ");
            if (phrase !== "DELETE .agent") {
                console.log("⏹️  Cancelado.");
                return;
            }
        } else {
            const ok = await ask("\nAplicar este plano? (y/N): ");
            if (ok.toLowerCase() !== "y") {
                console.log("⏹️  Cancelado.");
                return;
            }
        }
    }

    // 5. Execução
    try {
        console.log("\n🚀 Executando...");

        for (const a of actions) {
            if (a.type === "DELETE_DIR") {
                fs.rmSync(a.path, { recursive: true, force: true });
                audit.push(`- ACT: DELETED ${a.path}`);
            }
        }

        // Executar cópia/merge se necessário
        const copyAction = actions.find(a => a.type === "COPY_DIR" || a.type === "MERGE_DIR");
        if (copyAction) {
            const isMerge = copyAction.type === "MERGE_DIR";
            const stats = copyDirRecursive(TEMPLATES_DIR, agentDir, undefined, isMerge);
            audit.push(`- ACT: ${isMerge ? "MERGED" : "COPIED"} templates (Files: ${stats.files}, Skipped: ${stats.skipped})`);
            console.log(`   ✅ Templates processados.`);
        }

        // Criar config se necessário
        if (actions.some(a => a.type === "CREATE_FILE" && a.path === configPath)) {
            const defaults = initConfigDefaults({});
            writeJsonSafe(configPath, defaults);
            audit.push(`- ACT: CREATED openclaw.json`);
            console.log(`   ✅ Config criada.`);
        }

        // Gravar contexto se ainda não existe
        const contextDir = path.join(agentDir, "context");
        if (!fs.existsSync(contextDir)) fs.mkdirSync(contextDir, { recursive: true });
        fs.writeFileSync(path.join(contextDir, "context.json"), JSON.stringify(ctx, null, 2));

        console.log("\n✨ Concluído com sucesso!");
        writeAudit(targetPath, audit, flags);

    } catch (err) {
        console.error(`\n❌ Falha na execução: ${err.message}`);
        audit.push(`\n## ERROR: ${err.message}`);
        writeAudit(targetPath, audit, flags);
        process.exit(1);
    }
}

module.exports = { run, copyDirRecursive };

module.exports = { run, copyDirRecursive };
