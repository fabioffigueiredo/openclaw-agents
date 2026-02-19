"use strict";

/**
 * Script operacional: Policy Baseline
 *
 * Define RBAC e allowlists (deny-by-default) para execução remota
 * via VPN com break-glass expirável.
 *
 * Referência: skills/openclaw-ops/03-openclaw-policy-baseline/SKILL.md
 */

const { readJsonSafe, writeJsonSafe } = require("../config");

/**
 * Perfis RBAC disponíveis com suas permissões.
 */
const PROFILES = {
    viewer: {
        description: "Somente leitura — pode consultar status e logs",
        permissions: ["read:status", "read:logs", "read:config"],
    },
    operator: {
        description: "Pode executar runbooks permitidos",
        permissions: ["read:status", "read:logs", "read:config", "exec:runbook", "write:transfer"],
    },
    admin: {
        description: "Ações elevadas com confirmação extra e auditoria",
        permissions: [
            "read:status", "read:logs", "read:config",
            "exec:runbook", "exec:command", "write:transfer",
            "write:config", "manage:hosts", "manage:policy",
        ],
    },
};

/**
 * Verifica se um perfil tem uma determinada permissão.
 * @param {string} profile — nome do perfil (viewer, operator, admin)
 * @param {string} permission — permissão a verificar (ex: "exec:runbook")
 * @returns {boolean}
 */
function hasPermission(profile, permission) {
    const p = PROFILES[profile];
    if (!p) return false;
    return p.permissions.includes(permission);
}

/**
 * Cria uma sessão break-glass com expiração automática.
 * @param {string} policyPath — caminho do arquivo de políticas
 * @param {object} params
 * @param {string} params.requestedBy — quem solicitou
 * @param {string} params.reason — motivo do break-glass
 * @param {number} [params.durationMinutes=15] — duração em minutos
 * @returns {{ id: string, expiresAt: string }}
 */
function createBreakGlass(policyPath, { requestedBy, reason, durationMinutes = 15 }) {
    const policy = readJsonSafe(policyPath) || { breakGlass: [] };

    const expiresAt = new Date(Date.now() + durationMinutes * 60 * 1000).toISOString();
    const id = `bg-${Date.now()}`;

    const entry = {
        id,
        requestedBy,
        reason,
        createdAt: new Date().toISOString(),
        expiresAt,
        active: true,
    };

    if (!policy.breakGlass) policy.breakGlass = [];
    policy.breakGlass.push(entry);
    writeJsonSafe(policyPath, policy);

    return { id, expiresAt };
}

/**
 * Verifica se existe um break-glass ativo e válido.
 * @param {string} policyPath — caminho do arquivo de políticas
 * @returns {{ active: boolean, entry?: object }}
 */
function checkBreakGlass(policyPath) {
    const policy = readJsonSafe(policyPath);
    if (!policy || !policy.breakGlass) return { active: false };

    const now = new Date();
    const activeEntry = policy.breakGlass.find(
        (bg) => bg.active && new Date(bg.expiresAt) > now
    );

    if (activeEntry) {
        return { active: true, entry: activeEntry };
    }

    return { active: false };
}

/**
 * Expira todos os break-glass vencidos.
 * @param {string} policyPath — caminho do arquivo de políticas
 * @returns {number} quantidade de break-glass expirados
 */
function expireBreakGlass(policyPath) {
    const policy = readJsonSafe(policyPath);
    if (!policy || !policy.breakGlass) return 0;

    const now = new Date();
    let count = 0;

    for (const bg of policy.breakGlass) {
        if (bg.active && new Date(bg.expiresAt) <= now) {
            bg.active = false;
            count++;
        }
    }

    if (count > 0) writeJsonSafe(policyPath, policy);
    return count;
}

/**
 * Retorna a allowlist de comandos permitidos para um perfil.
 * @param {string} profile — nome do perfil
 * @returns {string[]} lista de padrões de comando permitidos
 */
function getAllowedCommands(profile) {
    const allowlists = {
        viewer: [],
        operator: [
            "systemctl status *",
            "docker ps",
            "docker compose ps",
            "wg show *",
            "ping *",
            "cat /var/log/*",
            "tail -f /var/log/*",
        ],
        admin: ["*"], // Admin pode tudo (com confirmação)
    };

    return allowlists[profile] || [];
}

module.exports = {
    PROFILES,
    hasPermission,
    createBreakGlass,
    checkBreakGlass,
    expireBreakGlass,
    getAllowedCommands,
};
