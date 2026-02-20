"use strict";

/**
 * Comando CLI: uninstall
 *
 * Remove a instalação do OpenClaw (.agent/) de um projeto.
 * Segue o protocolo consent-first:
 *   - Modo PLAN por padrão (mostra o que seria removido)
 *   - Exige --apply para executar
 *   - Exige confirmação forte (digitar frase)
 *   - Backup opcional antes de remover
 */

const fs = require("fs");
const path = require("path");
const readline = require("readline");
const { detectContext, getAuditHeader } = require("../context");
const { guardPlan } = require("../utils/scope_guard");

function ask(q) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    return new Promise((res) => rl.question(q, (ans) => { rl.close(); res(ans.trim()); }));
}

/**
 * Conta arquivos recursivamente em um diretório.
 */
function countFiles(dir) {
    let count = 0;
    if (!fs.existsSync(dir)) return 0;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (entry.isDirectory()) {
            count += countFiles(path.join(dir, entry.name));
        } else {
            count++;
        }
    }
    return count;
}

/**
 * Lista o conteúdo de um diretório de forma visual (tree).
 */
function listTree(dir, prefix = "") {
    const lines = [];
    if (!fs.existsSync(dir)) return lines;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    entries.forEach((entry, i) => {
        const isLast = i === entries.length - 1;
        const connector = isLast ? "└── " : "├── ";
        const icon = entry.isDirectory() ? "📁" : "📄";
        lines.push(`${prefix}${connector}${icon} ${entry.name}`);
        if (entry.isDirectory()) {
            const childPrefix = prefix + (isLast ? "    " : "│   ");
            lines.push(...listTree(path.join(dir, entry.name), childPrefix));
        }
    });
    return lines;
}

/**
 * Executa o comando uninstall.
 * @param {object} options
 * @param {string} options.targetPath — diretório alvo
 * @param {object} options.flags — flags do CLI
 */
async function run({ targetPath, flags }) {
    const agentDir = path.join(targetPath, ".agent");
    const configFile = path.join(targetPath, "openclaw.json");
    const planMode = !flags.apply;
    const ctx = detectContext(targetPath);

    console.log("\n🗑️  OpenClaw Uninstall\n");

    // Verificar se existe instalação
    if (!fs.existsSync(agentDir) && !fs.existsSync(configFile)) {
        console.log("ℹ️  Nenhuma instalação do OpenClaw encontrada neste diretório.");
        console.log(`   Path: ${targetPath}`);
        return;
    }

    // Mostrar o que será removido
    console.log(`   📂 Diretório: ${targetPath}`);
    console.log("");

    const toRemove = [];

    if (fs.existsSync(agentDir)) {
        const fileCount = countFiles(agentDir);
        toRemove.push({ path: agentDir, label: ".agent/", files: fileCount, isDir: true });
        console.log(`   🔴 REMOVER  .agent/ (${fileCount} arquivos)`);

        // Mostrar tree resumido (primeiro nível)
        const entries = fs.readdirSync(agentDir, { withFileTypes: true });
        entries.forEach(e => {
            const icon = e.isDirectory() ? "📁" : "📄";
            const subCount = e.isDirectory() ? ` (${countFiles(path.join(agentDir, e.name))} arquivos)` : "";
            console.log(`      ${icon} ${e.name}${subCount}`);
        });
    }

    if (fs.existsSync(configFile)) {
        toRemove.push({ path: configFile, label: "openclaw.json", isDir: false });
        console.log(`   🔴 REMOVER  openclaw.json`);
    }

    // Acionar Scope Guard para todos os deletes listados
    const intents = { writes: [], deletes: toRemove.map(i => i.path), overwrites: [] };
    await guardPlan(targetPath, intents, flags);

    // Verificar audit logs que seriam perdidos
    const auditDir = path.join(agentDir, "audit");
    if (fs.existsSync(auditDir)) {
        const auditCount = countFiles(auditDir);
        if (auditCount > 0) {
            console.log(`\n   ⚠️  ${auditCount} log(s) de auditoria serão perdidos!`);
        }
    }

    // Verificar state que seria perdido
    const stateDir = path.join(agentDir, "state");
    if (fs.existsSync(stateDir)) {
        const stateCount = countFiles(stateDir);
        if (stateCount > 0) {
            console.log(`   ⚠️  ${stateCount} arquivo(s) de estado serão perdidos (mission_control, MEMORY)!`);
        }
    }

    // Modo PLAN: não faz nada
    if (planMode) {
        console.log("\n🔒 Modo PLAN (Read-Only). Nenhuma alteração feita.");
        console.log("   Para desinstalar, rode: npx @fabioforest/openclaw uninstall --apply");
        return;
    }

    // Modo APPLY: pedir confirmação forte
    console.log("");
    if (!flags.yes) {
        const confirm = await ask("⚠️  Digite 'UNINSTALL' para confirmar a remoção: ");
        if (confirm !== "UNINSTALL") {
            console.log("⏹️  Cancelado. Nada foi removido.");
            return;
        }
    }

    // Backup opcional
    if (!flags.force) {
        const doBackup = flags.yes ? "s" : await ask("💾 Fazer backup antes de remover? (S/n): ");
        if (doBackup.toLowerCase() !== "n") {
            const backupName = `.agent.backup-${Date.now()}`;
            const backupPath = path.join(targetPath, backupName);
            try {
                fs.cpSync(agentDir, backupPath, { recursive: true });
                console.log(`   ✅ Backup criado: ${backupName}/`);
            } catch (err) {
                console.error(`   ⚠️  Falha no backup: ${err.message}`);
                const cont = await ask("   Continuar sem backup? (y/N): ");
                if (cont.toLowerCase() !== "y") {
                    console.log("⏹️  Cancelado.");
                    return;
                }
            }
        }
    }

    // Executar remoção
    const audit = [getAuditHeader(ctx, "uninstall", flags)];

    try {
        for (const item of toRemove) {
            if (item.isDir) {
                fs.rmSync(item.path, { recursive: true, force: true });
            } else {
                fs.unlinkSync(item.path);
            }
            console.log(`   ✅ Removido: ${item.label}`);
            audit.push(`- ACT: REMOVED ${item.label}`);
        }

        console.log("\n✨ OpenClaw desinstalado com sucesso!");
        console.log("   Para reinstalar: npx @fabioforest/openclaw init --apply\n");

        // Gravar audit no diretório pai (já que .agent/ foi removido)
        if (flags.audit !== false) {
            const filename = `openclaw-uninstall-${new Date().toISOString().replace(/[:.]/g, "-")}.md`;
            const auditPath = path.join(targetPath, filename);
            try {
                fs.writeFileSync(auditPath, audit.join("\n") + "\n", "utf8");
                console.log(`   📝 Log de auditoria: ${filename}`);
            } catch (e) { /* silencioso */ }
        }

    } catch (err) {
        console.error(`\n❌ Falha: ${err.message}`);
        process.exit(1);
    }
}

module.exports = { run };
