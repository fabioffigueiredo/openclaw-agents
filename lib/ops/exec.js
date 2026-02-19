"use strict";

/**
 * Script operacional: Remote Exec (Runbooks)
 *
 * Estrutura execução remota via VPN usando runbooks nomeados,
 * idempotentes, com timeout, cancel e trilha auditável.
 *
 * Referência: skills/openclaw-ops/04-openclaw-remote-exec-runbooks/SKILL.md
 */

const { execSync, spawn } = require("child_process");
const crypto = require("crypto");

/**
 * Gera um request_id único para rastrear a execução.
 * @returns {string} request_id no formato "req-<uuid>"
 */
function generateRequestId() {
    return `req-${crypto.randomUUID()}`;
}

/**
 * Valida as entradas de um runbook antes da execução.
 * @param {object} runbook — definição do runbook
 * @param {string} runbook.name — nome do runbook
 * @param {string} runbook.command — comando a executar
 * @param {string[]} [runbook.allowedArgs] — args permitidos
 * @param {object} [inputs] — inputs do usuário
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validateInputs(runbook, inputs = {}) {
    const errors = [];

    if (!runbook.name) errors.push("Nome do runbook é obrigatório");
    if (!runbook.command) errors.push("Comando do runbook é obrigatório");

    // Validar que inputs não contêm injection
    for (const [key, value] of Object.entries(inputs)) {
        if (typeof value === "string" && /[;&|`$()]/.test(value)) {
            errors.push(`Input '${key}' contém caracteres proibidos: ${value}`);
        }
    }

    return { valid: errors.length === 0, errors };
}

/**
 * Executa um runbook de forma segura com timeout e captura de saída.
 * @param {object} params
 * @param {string} params.command — comando a executar
 * @param {number} [params.timeoutMs=30000] — timeout em ms
 * @param {string} [params.cwd] — diretório de trabalho
 * @returns {{ requestId: string, exitCode: number, stdout: string, stderr: string, timedOut: boolean, duration: number }}
 */
function executeRunbook({ command, timeoutMs = 30000, cwd }) {
    const requestId = generateRequestId();
    const startTime = Date.now();

    try {
        const stdout = execSync(command, {
            encoding: "utf8",
            timeout: timeoutMs,
            cwd: cwd || undefined,
            maxBuffer: 1024 * 1024, // 1MB
        });

        return {
            requestId,
            exitCode: 0,
            stdout: stdout.trim(),
            stderr: "",
            timedOut: false,
            duration: Date.now() - startTime,
        };
    } catch (err) {
        return {
            requestId,
            exitCode: err.status || 1,
            stdout: (err.stdout || "").trim(),
            stderr: (err.stderr || err.message || "").trim(),
            timedOut: err.killed || false,
            duration: Date.now() - startTime,
        };
    }
}

/**
 * Executa um runbook em background com possibilidade de cancelamento.
 * @param {object} params
 * @param {string} params.command — comando a executar
 * @param {number} [params.timeoutMs=30000] — timeout em ms
 * @returns {{ requestId: string, process: object, cancel: function }}
 */
function executeAsync({ command, timeoutMs = 30000 }) {
    const requestId = generateRequestId();
    const parts = command.split(" ");
    const child = spawn(parts[0], parts.slice(1), {
        timeout: timeoutMs,
        stdio: ["ignore", "pipe", "pipe"],
    });

    const cancel = () => {
        if (!child.killed) {
            child.kill("SIGTERM");
            // Force kill após 5s se não responder
            setTimeout(() => {
                if (!child.killed) child.kill("SIGKILL");
            }, 5000);
        }
    };

    return { requestId, process: child, cancel };
}

/**
 * Formata o resultado de uma execução para log.
 * @param {object} result — resultado da execução
 * @returns {object} objeto formatado para auditoria
 */
function formatForAudit(result) {
    return {
        requestId: result.requestId,
        exitCode: result.exitCode,
        timedOut: result.timedOut,
        duration: `${result.duration}ms`,
        timestamp: new Date().toISOString(),
        // Trunca saída para auditoria (max 500 chars)
        stdoutPreview: result.stdout.slice(0, 500),
        stderrPreview: result.stderr.slice(0, 500),
    };
}

module.exports = {
    generateRequestId,
    validateInputs,
    executeRunbook,
    executeAsync,
    formatForAudit,
};
