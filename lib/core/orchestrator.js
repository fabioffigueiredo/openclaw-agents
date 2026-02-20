"use strict";

/**
 * Core Orchestrator do OpenClaw AI OS
 * 
 * Atua como o "Kernel" do sistema, centralizando o ciclo de vida:
 * INSPECT -> PLAN -> CONSENT -> APPLY -> AUDIT
 */

const readline = require("readline");
const fs = require("fs");
const path = require("path");
const { guardPlan } = require("../utils/scope_guard");
const { writeCliAudit } = require("../utils/audit-writer");

function ask(q) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    return new Promise((res) => rl.question(q, (ans) => { rl.close(); res(ans.trim()); }));
}

/**
 * Executa uma ação unificada no OpenClaw AI OS.
 * Garante que regras de segurança, escopo e auditoria sejam aplicadas.
 * 
 * @param {Object} options
 * @param {string} options.actionName - Nome da ação (ex: "ide install", "uninstall")
 * @param {Object} options.context - Contexto do workspace/módulo coletado
 * @param {Object} options.flags - Flags da CLI (--apply, --force, --yes)
 * @param {Object} options.intents - { writes: [], deletes: [], overwrites: [] }
 * @param {Function} options.executeFn - Função assíncrona que aplica as mudanças de fato
 * @param {Function} options.planFn - Função de exibição do plano (read-only)
 * @param {string} options.targetPath - Root path do projeto
 * @param {boolean} options.skipAudit - Se true, não grava o audit log no .agent/audit (útil para uninstall)
 * @param {boolean} options.skipConfirm - Se true, pula o prompt padrão de apply (útil para per-file diff loops)
 * @returns {boolean} true se executado, false se cancelado ou em modo plan
 */
async function executeAction({
    actionName,
    context,
    flags,
    intents = { writes: [], deletes: [], overwrites: [] },
    executeFn,
    planFn,
    confirmationWord = null,
    targetPath,
    skipAudit = false,
    skipConfirm = false
}) {
    const planMode = !flags.apply;

    // 1. INSPECT / PLAN - Scope Guard
    await guardPlan(targetPath, intents, flags);

    // Exibir o plano real
    if (planFn && typeof planFn === "function") {
        await planFn();
    }

    if (planMode) {
        console.log(`\n🔒 Modo PLAN (Read-Only). Nenhuma alteração feita.`);
        console.log(`   Para aplicar, rode com a flag --apply`);
        return false;
    }

    // 2. CONSENT
    if (!flags.yes && !skipConfirm) {
        if (confirmationWord) {
            const confirm = await ask(`\n⚠️  Ação destrutiva requer confirmação forte. Digite '${confirmationWord}' para confirmar: `);
            if (confirm !== confirmationWord) {
                console.log("⏹️  Cancelado. Nenhuma alteração feita.");
                return false;
            }
        } else {
            const confirm = await ask(`\n⚠️  Deseja APLICAR as alterações acima? (s/N): `);
            if (confirm.toLowerCase() !== "s") {
                console.log("⏹️  Cancelado. Nenhuma alteração feita.");
                return false;
            }
        }
    }

    // 3. APPLY
    console.log(`\n⚙️  Executando [${actionName}]...`);
    try {
        await executeFn();
        console.log(`✅ Ação [${actionName}] concluída com sucesso.`);
    } catch (err) {
        console.error(`❌ Erro ao executar [${actionName}]:`, err.message);
        throw err;
    }

    // 4. AUDIT
    if (!skipAudit && flags.audit !== false) {
        try {
            const auditPayload = [
                `--- AUDIT LOG: ${actionName} ---`,
                `Date: ${new Date().toISOString()}`,
                `User Flags: ${JSON.stringify(flags)}`,
                `Intents: writes=${intents.writes.length} overwrites=${intents.overwrites.length} deletes=${intents.deletes.length}`,
                `Status: SUCCESS`
            ];

            // Reutiliza a função de escrita de log da CLI
            writeCliAudit(targetPath, auditPayload, flags, actionName);
        } catch (e) {
            console.log("⚠️ Não foi possível escrever o audit log.");
        }
    }

    return true;
}

module.exports = { executeAction };
