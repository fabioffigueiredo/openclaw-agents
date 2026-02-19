#!/usr/bin/env node
"use strict";

/**
 * Hook PreToolUse — bloqueia comandos destrutivos antes da execução.
 *
 * Este hook é chamado pelo agente antes de executar qualquer tool.
 * Se o comando for considerado perigoso, retorna { blocked: true, reason }.
 *
 * Integra-se com a policy de break-glass: se o break-glass estiver ativo
 * e aprovado, o comando é liberado com auditoria completa.
 */

// Padrões de comandos destrutivos que requerem bloqueio
const BLOCKED_PATTERNS = [
    { pattern: /rm\s+(-[a-zA-Z]*f[a-zA-Z]*\s+)?\/(\s|$)/, reason: "rm -rf / detectado — remoção da raiz bloqueada" },
    { pattern: /rm\s+-[a-zA-Z]*r[a-zA-Z]*f/, reason: "rm recursivo com force — requer aprovação" },
    { pattern: /mkfs/, reason: "mkfs — formatação de disco bloqueada" },
    { pattern: /dd\s+if=/, reason: "dd if= — escrita direta em dispositivo bloqueada" },
    { pattern: /shutdown/, reason: "shutdown — desligamento requer aprovação humana" },
    { pattern: /reboot/, reason: "reboot — reinicialização requer aprovação humana" },
    { pattern: />\s*\/dev\/[sh]d[a-z]/, reason: "Redirecionamento para dispositivo de bloco bloqueado" },
    { pattern: /chmod\s+777/, reason: "chmod 777 — permissão aberta demais, requer aprovação" },
    { pattern: /chown\s+root/, reason: "chown root — mudança de proprietário para root requer aprovação" },
    { pattern: /:(){ :\|:& };:/, reason: "Fork bomb detectada — execução bloqueada" },
    { pattern: /curl\s+.*\|\s*(ba)?sh/, reason: "Pipe de URL para shell — execução remota bloqueada" },
    { pattern: /wget\s+.*\|\s*(ba)?sh/, reason: "Pipe de URL para shell — execução remota bloqueada" },
];

// Lista de diretórios protegidos (não podem ser alvo de write/delete)
const PROTECTED_PATHS = [
    "/etc/passwd",
    "/etc/shadow",
    "/etc/sudoers",
    "/boot",
    "/usr/bin",
    "/usr/sbin",
];

/**
 * Verifica se um comando deve ser bloqueado.
 * @param {string} command — o comando a ser verificado
 * @param {object} [options] — opções adicionais
 * @param {boolean} [options.breakGlassActive] — se break-glass está ativo
 * @returns {{ blocked: boolean, reason?: string, requiresApproval?: boolean }}
 */
function checkCommand(command, options = {}) {
    if (!command || typeof command !== "string") {
        return { blocked: false };
    }

    const normalized = command.trim().toLowerCase();

    // Verifica padrões destrutivos
    for (const { pattern, reason } of BLOCKED_PATTERNS) {
        if (pattern.test(command)) {
            // Se break-glass ativo, permite mas marca como requiring approval
            if (options.breakGlassActive) {
                return {
                    blocked: false,
                    requiresApproval: true,
                    reason: `[BREAK-GLASS] ${reason} — liberado com auditoria`,
                };
            }
            return { blocked: true, reason };
        }
    }

    // Verifica caminhos protegidos
    for (const protectedPath of PROTECTED_PATHS) {
        if (command.includes(protectedPath) && /write|delete|rm|mv|cp.*>/.test(normalized)) {
            return {
                blocked: true,
                reason: `Operação em caminho protegido: ${protectedPath}`,
            };
        }
    }

    return { blocked: false };
}

/**
 * Verifica se um caminho de arquivo é seguro para operações de escrita.
 * @param {string} filePath — caminho do arquivo
 * @returns {{ allowed: boolean, reason?: string }}
 */
function checkFilePath(filePath) {
    if (!filePath || typeof filePath !== "string") {
        return { allowed: true };
    }

    for (const protectedPath of PROTECTED_PATHS) {
        if (filePath.startsWith(protectedPath)) {
            return {
                allowed: false,
                reason: `Escrita em caminho protegido bloqueada: ${protectedPath}`,
            };
        }
    }

    return { allowed: true };
}

module.exports = {
    checkCommand,
    checkFilePath,
    BLOCKED_PATTERNS,
    PROTECTED_PATHS,
};
