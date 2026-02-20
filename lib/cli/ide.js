"use strict";

/**
 * Comando CLI: ide
 *
 * Gerencia a instalação do OpenClaw AI OS em IDEs.
 * Sub-comandos: install (plan/apply), doctor.
 * Sempre segue o protocolo consent-first.
 */

const fs = require("fs");
const path = require("path");
const readline = require("readline");
const { detectContext, getAuditHeader } = require("../context");
const { copyDirRecursive } = require("./init");
const { writeCliAudit } = require("../utils/audit-writer");
const { guardPlan } = require("../utils/scope_guard");

// Caminho dos templates do pacote
const TEMPLATES_DIR = path.join(__dirname, "..", "..", "templates");

function ask(q) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    return new Promise((res) => rl.question(q, (ans) => { rl.close(); res(ans.trim()); }));
}

// writeAudit extraído para lib/utils/audit-writer.js (DRY)
function writeAudit(targetPath, lines, flags) {
    writeCliAudit(targetPath, lines, flags, "ide");
}

async function run({ targetPath, flags }) {
    // Detectar sub-comando alinhado com o parseArgs global
    const subCmd = flags.subcommand || "install";

    if (subCmd === "doctor") {
        return runDoctor({ targetPath, flags });
    }

    return runInstall({ targetPath, flags });
}

/**
 * Sub-comando: ide install
 * Instala .agent/ no projeto para uso em IDEs (plan/apply).
 */
async function runInstall({ targetPath, flags }) {
    const agentDst = path.join(targetPath, ".agent");
    const agentSrc = path.join(TEMPLATES_DIR, ".agent");
    const ctx = detectContext(targetPath);
    const planMode = !flags.apply;
    const audit = [getAuditHeader(ctx, "ide install", flags)];

    console.log(`\n🧭 IDE Install — Plano (${planMode ? "SIMULAÇÃO" : "APPLY"}):\n`);
    console.log(`   Contexto: ${ctx.env} | IDE: ${ctx.ide}\n`);

    if (fs.existsSync(agentDst) && !flags.force) {
        console.log("  ✅ KEEP    .agent/ (já existe)");
        console.log("  📦 MERGE   Novos templates serão adicionados (preservando existentes)");
    } else if (fs.existsSync(agentDst) && flags.force) {
        console.log("  🔥 DELETE  .agent/ (--force)");
        console.log("  📦 COPY    templates/.agent -> .agent/");
    } else {
        console.log("  📁 CREATE  .agent/");
        console.log("  📦 COPY    templates/.agent -> .agent/");
    }

    // State templates (mission_control.json, MEMORY.md)
    const stateDir = path.join(agentDst, "state");
    if (!fs.existsSync(stateDir)) {
        console.log("  📁 CREATE  .agent/state/ (Mission Control + MEMORY)");
    } else {
        console.log("  ✅ KEEP    .agent/state/ (já existe)");
    }

    // 2.5 Scope Guard
    const intents = { writes: [agentDst, stateDir], deletes: [], overwrites: [] };
    // Se for um force, significa que um overwrite/delete de diretório ocorrerá
    if (fs.existsSync(agentDst) && flags.force) {
        intents.deletes.push(agentDst);
        intents.overwrites.push(agentDst);
    }

    await guardPlan(targetPath, intents, flags);

    if (planMode) {
        console.log("\n🔒 Modo PLAN (Read-Only). Nenhuma alteração feita.");
        console.log("   Para aplicar, rode: npx openclaw ide install --apply");
        return;
    }

    // Confirmação
    if (!flags.yes) {
        if (flags.force && fs.existsSync(agentDst)) {
            const phrase = await ask("⚠️  Digite 'DELETE .agent' para confirmar: ");
            if (phrase !== "DELETE .agent") {
                console.log("⏹️  Cancelado.");
                return;
            }
        } else {
            const ok = await ask("\nAplicar instalação IDE? (y/N): ");
            if (ok.toLowerCase() !== "y") {
                console.log("⏹️  Cancelado.");
                return;
            }
        }
    }

    // Execução
    try {
        console.log("\n🚀 Executando...");

        if (fs.existsSync(agentDst) && flags.force) {
            fs.rmSync(agentDst, { recursive: true, force: true });
            audit.push("- ACT: DELETED .agent/");
        }

        const isMerge = fs.existsSync(agentDst);
        const stats = copyDirRecursive(agentSrc, agentDst, undefined, isMerge);
        audit.push(`- ACT: ${isMerge ? "MERGED" : "COPIED"} templates (Files: ${stats.files}, Skipped: ${stats.skipped})`);

        // Criar state se necessário
        const stateTarget = path.join(agentDst, "state");
        if (!fs.existsSync(stateTarget)) {
            fs.mkdirSync(stateTarget, { recursive: true });
            // Criar mission_control.json default
            const mcDefault = {
                project_status: "active",
                project_name: path.basename(targetPath),
                sprint_goal: "",
                agents: [
                    { id: "orchestrator", role: "orchestrator", active: true },
                    { id: "researcher", role: "researcher", active: true },
                    { id: "writer", role: "writer", active: true },
                ],
                task_queue: [],
                history: [],
                settings: {
                    work_dir: "mission_control",
                    max_tasks_per_tick: 2,
                    default_priority: "medium",
                },
            };
            fs.writeFileSync(path.join(stateTarget, "mission_control.json"), JSON.stringify(mcDefault, null, 2));
            fs.writeFileSync(path.join(stateTarget, "MEMORY.md"), "# Memória Persistente\n\n(Adicione aqui resumos e decisões importantes)\n");
            audit.push("- ACT: CREATED .agent/state/ (mission_control.json + MEMORY.md)");
        }

        console.log("\n✨ IDE install concluído com sucesso!");
        writeAudit(targetPath, audit, flags);

    } catch (err) {
        console.error(`\n❌ Falha: ${err.message}`);
        audit.push(`\n## ERROR: ${err.message}`);
        writeAudit(targetPath, audit, flags);
        process.exit(1);
    }
}

/**
 * Sub-comando: ide doctor
 * Verifica se a IDE está "armada" com regras, hooks e skills.
 */
async function runDoctor({ targetPath }) {
    const agentDir = path.join(targetPath, ".agent");
    const checks = [];

    console.log("\n🏥 IDE Doctor — Verificando instalação para IDE:\n");

    // Verificar .agent/
    checks.push({ name: ".agent/", ok: fs.existsSync(agentDir) });

    // Verificar rules
    const rulesDir = path.join(agentDir, "rules");
    const requiredRules = ["CONSENT_FIRST.md", "ROUTER_PROTOCOL.md", "SECURITY.md", "WEB_AUTOMATION.md"];
    for (const rule of requiredRules) {
        checks.push({ name: `rules/${rule}`, ok: fs.existsSync(path.join(rulesDir, rule)) });
    }

    // Verificar skills críticas
    const skillsDir = path.join(agentDir, "skills");
    const criticalSkills = ["openclaw-router", "openclaw-inspect", "openclaw-dev"];
    for (const skill of criticalSkills) {
        checks.push({ name: `skills/${skill}/SKILL.md`, ok: fs.existsSync(path.join(skillsDir, skill, "SKILL.md")) });
    }

    // Verificar hooks
    const hooksDir = path.join(agentDir, "hooks");
    checks.push({ name: "hooks/pre-tool-use.js", ok: fs.existsSync(path.join(hooksDir, "pre-tool-use.js")) });

    // Verificar State Persistence
    const stateDir = path.join(agentDir, "state");
    checks.push({ name: "state/mission_control.json", ok: fs.existsSync(path.join(stateDir, "mission_control.json")) });
    checks.push({ name: "state/MEMORY.md", ok: fs.existsSync(path.join(stateDir, "MEMORY.md")) });

    // Exibir resultado
    let allOk = true;
    for (const c of checks) {
        const icon = c.ok ? "✅" : "❌";
        console.log(`   ${icon} ${c.name}`);
        if (!c.ok) allOk = false;
    }

    if (allOk) {
        console.log("\n🎉 IDE está totalmente configurada!");
    } else {
        console.log("\n⚠️  Componentes ausentes. Rode: npx openclaw ide install --apply");
    }
}

module.exports = { run };
