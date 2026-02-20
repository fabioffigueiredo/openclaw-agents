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
const { writeCliAudit } = require("../utils/audit-writer");
const { executeAction } = require("../core/orchestrator");

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
    writeCliAudit(targetPath, lines, flags, "init");
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

    // 2.5. Acionar Scope Guard
    const intents = { writes: [], deletes: [], overwrites: [] };
    for (const a of actions) {
        if (a.type === "DELETE_DIR") intents.deletes.push(a.path);
        if (a.type === "CREATE_DIR") intents.writes.push(a.path);
        if (a.type === "CREATE_FILE") intents.writes.push(a.path);
        if (a.type === "COPY_DIR" || a.type === "MERGE_DIR") intents.writes.push(a.to);
    }

    // Definir Palavra de Confirmação Forte se houver Force Delete
    const hasDelete = actions.some(a => a.type === "DELETE_DIR");
    const confirmationWord = hasDelete ? "DELETE .agent" : null;

    // Delegar todo o fluxo final (Guard, Confirm, Execute, Audit) para o Orchestrator
    await executeAction({
        actionName: "init",
        context: ctx,
        flags,
        intents,
        targetPath,
        confirmationWord,
        planFn: async () => {
            console.log(`\n🧭 Plano de Execução:\n`);
            console.log(`   Contexto: ${ctx.env.platform} | IDE: ${ctx.ide}\n`);
            for (const a of actions) {
                if (a.type === "DELETE_DIR") console.log(`  🔥 DELETE  ${safeRel(targetPath, a.path)} (${a.reason})`);
                if (a.type === "CREATE_DIR") console.log(`  📁 CREATE  ${safeRel(targetPath, a.path)}`);
                if (a.type === "COPY_DIR") console.log(`  📦 COPY    templates -> ${safeRel(targetPath, a.to)}`);
                if (a.type === "MERGE_DIR") console.log(`  🔄 MERGE   templates -> ${safeRel(targetPath, a.to)} (Preservando existentes)`);
                if (a.type === "CREATE_FILE") console.log(`  📝 CREATE  ${safeRel(targetPath, a.path)}`);
                if (a.type === "NOOP") console.log(`  ✅ KEEP    ${safeRel(targetPath, a.path)}`);
            }
        },
        executeFn: async () => {
            for (const a of actions) {
                if (a.type === "DELETE_DIR") {
                    fs.rmSync(a.path, { recursive: true, force: true });
                }
            }

            // Executar cópia/merge se necessário
            const copyAction = actions.find(a => a.type === "COPY_DIR" || a.type === "MERGE_DIR");
            if (copyAction) {
                const isMerge = copyAction.type === "MERGE_DIR";
                copyDirRecursive(TEMPLATES_DIR, agentDir, undefined, isMerge);
                console.log(`   ✅ Templates processados.`);
            }

            // Criar config se necessário
            if (actions.some(a => a.type === "CREATE_FILE" && a.path === configPath)) {
                const defaults = initConfigDefaults({});
                writeJsonSafe(configPath, defaults);
                console.log(`   ✅ Config criada.`);
            }

            // Gravar contexto se ainda não existe
            const contextDir = path.join(agentDir, "context");
            if (!fs.existsSync(contextDir)) fs.mkdirSync(contextDir, { recursive: true });
            fs.writeFileSync(path.join(contextDir, "context.json"), JSON.stringify(ctx, null, 2));
        }
    });
}

module.exports = { run, copyDirRecursive };
