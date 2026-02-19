"use strict";

/**
 * Script operacional: Audit Logging
 *
 * Auditoria estruturada (JSON) para todos os eventos do OpenClaw.
 * Inclui request_id, redaction de segredos e rotação de logs.
 *
 * Referência: skills/openclaw-ops/06-openclaw-audit-logging/SKILL.md
 */

const fs = require("fs");
const path = require("path");
const { mask } = require("../security");

// Campos que devem ter seus valores mascarados no log
const SENSITIVE_FIELDS = ["token", "password", "secret", "privateKey", "apiKey", "auth_token"];

/**
 * Mascara campos sensíveis recursivamente em um objeto.
 * @param {object} obj — objeto a ser processado
 * @returns {object} cópia com valores sensíveis mascarados
 */
function redactSensitive(obj) {
    if (!obj || typeof obj !== "object") return obj;

    const redacted = Array.isArray(obj) ? [...obj] : { ...obj };

    for (const [key, value] of Object.entries(redacted)) {
        if (typeof value === "object" && value !== null) {
            redacted[key] = redactSensitive(value);
        } else if (typeof value === "string" && SENSITIVE_FIELDS.includes(key)) {
            redacted[key] = mask(value);
        }
    }

    return redacted;
}

/**
 * Cria uma entrada de log de auditoria.
 * @param {object} params
 * @param {string} params.event — tipo do evento (ex: "exec.started")
 * @param {string} params.requestId — ID da requisição
 * @param {string} [params.operator] — quem iniciou a ação
 * @param {string} [params.hostId] — host onde ocorreu
 * @param {object} [params.details] — detalhes adicionais
 * @returns {object} entrada de auditoria formatada
 */
function createAuditEntry({ event, requestId, operator, hostId, details = {} }) {
    return {
        timestamp: new Date().toISOString(),
        event,
        requestId,
        operator: operator || "system",
        hostId: hostId || "local",
        details: redactSensitive(details),
    };
}

/**
 * Escreve uma entrada de auditoria no arquivo de log.
 * @param {string} logDir — diretório de logs
 * @param {object} entry — entrada de auditoria
 */
function writeAuditLog(logDir, entry) {
    if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
    }

    // Arquivo de log diário
    const date = new Date().toISOString().split("T")[0];
    const logFile = path.join(logDir, `audit-${date}.jsonl`);

    // Append em formato JSONL (uma linha JSON por entrada)
    fs.appendFileSync(logFile, JSON.stringify(entry) + "\n", "utf8");
}

/**
 * Lê entradas de auditoria de um período.
 * @param {string} logDir — diretório de logs
 * @param {object} [filter] — filtros opcionais
 * @param {string} [filter.date] — data específica (YYYY-MM-DD)
 * @param {string} [filter.event] — filtrar por tipo de evento
 * @param {string} [filter.requestId] — filtrar por request_id
 * @param {number} [filter.limit=100] — limite de entradas
 * @returns {object[]} entradas de auditoria
 */
function readAuditLogs(logDir, filter = {}) {
    if (!fs.existsSync(logDir)) return [];

    const date = filter.date || new Date().toISOString().split("T")[0];
    const logFile = path.join(logDir, `audit-${date}.jsonl`);

    if (!fs.existsSync(logFile)) return [];

    const lines = fs.readFileSync(logFile, "utf8")
        .split("\n")
        .filter((line) => line.trim());

    let entries = lines.map((line) => {
        try {
            return JSON.parse(line);
        } catch {
            return null;
        }
    }).filter(Boolean);

    // Aplicar filtros
    if (filter.event) {
        entries = entries.filter((e) => e.event === filter.event);
    }
    if (filter.requestId) {
        entries = entries.filter((e) => e.requestId === filter.requestId);
    }

    // Limite
    const limit = filter.limit || 100;
    return entries.slice(-limit);
}

/**
 * Rotaciona logs mais antigos que o período de retenção.
 * @param {string} logDir — diretório de logs
 * @param {number} [retentionDays=30] — dias de retenção
 * @returns {number} quantidade de arquivos removidos
 */
function rotateLogs(logDir, retentionDays = 30) {
    if (!fs.existsSync(logDir)) return 0;

    const cutoff = Date.now() - retentionDays * 24 * 60 * 60 * 1000;
    let removed = 0;

    const files = fs.readdirSync(logDir).filter((f) => f.startsWith("audit-") && f.endsWith(".jsonl"));

    for (const file of files) {
        const filePath = path.join(logDir, file);
        const stats = fs.statSync(filePath);

        if (stats.mtimeMs < cutoff) {
            fs.unlinkSync(filePath);
            removed++;
        }
    }

    return removed;
}

module.exports = {
    redactSensitive,
    createAuditEntry,
    writeAuditLog,
    readAuditLogs,
    rotateLogs,
    SENSITIVE_FIELDS,
};
