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
const { executeAction } = require("../core/orchestrator");

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

    const ideSrc = path.join(TEMPLATES_DIR, "ide");
    let availableAdapters = [];
    if (fs.existsSync(ideSrc)) {
        availableAdapters = fs.readdirSync(ideSrc).filter(f => fs.statSync(path.join(ideSrc, f)).isDirectory());
    }

    let selectedAdapters = [];
    if (flags["ide-adapters"] !== undefined || flags.ide !== undefined) {
        const val = flags["ide-adapters"] || flags.ide;
        if (val === true || val === "all") {
            selectedAdapters = [...availableAdapters];
        } else if (typeof val === "string") {
            const requested = val.split(",").map(i => i.trim().toLowerCase());
            selectedAdapters = availableAdapters.filter(a => requested.includes(a.toLowerCase()));
        }
    } else if (!flags.yes && availableAdapters.length > 0) {
        let hint = "";
        if (availableAdapters.includes(ctx.ide)) {
            hint = ` (Recomendado: ${ctx.ide})`;
        }
        const wantAdapters = await ask(`\n💡 Instalar adaptadores de IDE opcionais?${hint} (y/N): `);
        if (wantAdapters.toLowerCase() === "y") {
            const which = await ask(`   Quais? (${availableAdapters.join(", ")}, ou 'all'): `);
            if (which.trim().toLowerCase() === "all" || which.trim() === "*") {
                selectedAdapters = [...availableAdapters];
            } else {
                const requested = which.split(",").map(i => i.trim().toLowerCase());
                selectedAdapters = availableAdapters.filter(a => requested.includes(a.toLowerCase()));
            }
        }
    }

    // State templates (mission_control.json, MEMORY.md)
    const stateDir = path.join(agentDst, "state");
    if (!fs.existsSync(stateDir)) {
        console.log("  📁 CREATE  .agent/state/ (Mission Control + MEMORY)");
    } else {
        console.log("  ✅ KEEP    .agent/state/ (já existe)");
    }

    if (selectedAdapters.length > 0) {
        console.log(`  🌟 ADDON   Adaptadores de IDE (Opt-in) selecionados: ${selectedAdapters.join(", ")}`);
    }

    const adapterWrites = [];
    for (const adpt of selectedAdapters) {
        const adptPath = path.join(ideSrc, adpt);
        const items = fs.readdirSync(adptPath);
        for (const it of items) {
            adapterWrites.push(path.join(targetPath, it));
        }
    }

    // 2.5 Scope Guard
    const intents = {
        writes: [
            agentDst,
            stateDir,
            ...adapterWrites
        ],
        deletes: [],
        overwrites: []
    };

    const confirmationWord = (flags.force && fs.existsSync(agentDst)) ? "DELETE .agent" : null;

    await executeAction({
        actionName: "ide install",
        context: ctx,
        flags,
        intents,
        targetPath,
        confirmationWord,
        planFn: async () => { }, // O console.log inicial já fez o plan visual acima
        executeFn: async () => {
            if (fs.existsSync(agentDst) && flags.force) {
                fs.rmSync(agentDst, { recursive: true, force: true });
            }

            const isMerge = fs.existsSync(agentDst);
            copyDirRecursive(agentSrc, agentDst, undefined, isMerge);

            // Copiar adaptadores selecionados
            for (const adpt of selectedAdapters) {
                copyDirRecursive(path.join(ideSrc, adpt), targetPath, undefined, true);
            }

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
            }
        }
    });
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

    // Verificar adaptadores multi-IDE (Opcionais)
    const ideSrc = path.join(TEMPLATES_DIR, "ide");
    if (fs.existsSync(ideSrc)) {
        console.log("\n   [Adaptadores Multi-IDE - Opcional]");
        const availableAdapters = fs.readdirSync(ideSrc).filter(f => fs.statSync(path.join(ideSrc, f)).isDirectory());

        for (const adpt of availableAdapters) {
            const adptPath = path.join(ideSrc, adpt);
            const items = fs.readdirSync(adptPath);
            const hasAll = items.length > 0 && items.every(it => fs.existsSync(path.join(targetPath, it)));
            const icon = hasAll ? "✅" : "⚪";
            console.log(`   ${icon} ${adpt} (opcional)`);
        }
    }

    if (allOk) {
        console.log("\n🎉 IDE está totalmente configurada!");
    } else {
        console.log("\n⚠️  Componentes ausentes. Rode: npx openclaw ide install --apply");
    }
}

module.exports = { run };
