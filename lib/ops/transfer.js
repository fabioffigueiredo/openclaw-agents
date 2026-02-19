"use strict";

/**
 * Script operacional: File Transfer Safe
 *
 * Transferência de arquivos via VPN com allowlist de diretórios,
 * hashing, limites de tamanho e auditoria.
 *
 * Referência: skills/openclaw-ops/05-openclaw-file-transfer-safe/SKILL.md
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

// Tamanho máximo padrão: 50MB
const DEFAULT_MAX_SIZE = 50 * 1024 * 1024;

/**
 * Calcula o SHA-256 de um arquivo.
 * @param {string} filePath — caminho do arquivo
 * @returns {string} hash hex
 */
function hashFile(filePath) {
    const content = fs.readFileSync(filePath);
    return crypto.createHash("sha256").update(content).digest("hex");
}

/**
 * Verifica se um caminho está dentro da allowlist.
 * @param {string} filePath — caminho do arquivo
 * @param {string[]} allowedDirs — diretórios permitidos
 * @returns {{ allowed: boolean, reason?: string }}
 */
function checkAllowlist(filePath, allowedDirs) {
    const resolved = path.resolve(filePath);

    for (const dir of allowedDirs) {
        const resolvedDir = path.resolve(dir);
        if (resolved.startsWith(resolvedDir + path.sep) || resolved === resolvedDir) {
            return { allowed: true };
        }
    }

    return {
        allowed: false,
        reason: `Caminho '${resolved}' fora da allowlist de diretórios`,
    };
}

/**
 * Verifica se o arquivo não excede o tamanho máximo.
 * @param {string} filePath — caminho do arquivo
 * @param {number} [maxSize] — tamanho máximo em bytes
 * @returns {{ allowed: boolean, size: number, reason?: string }}
 */
function checkFileSize(filePath, maxSize = DEFAULT_MAX_SIZE) {
    const stats = fs.statSync(filePath);
    if (stats.size > maxSize) {
        const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
        const maxMB = (maxSize / 1024 / 1024).toFixed(2);
        return {
            allowed: false,
            size: stats.size,
            reason: `Arquivo (${sizeMB}MB) excede o limite de ${maxMB}MB`,
        };
    }
    return { allowed: true, size: stats.size };
}

/**
 * Executa transferência segura de arquivo com validações.
 * @param {object} params
 * @param {string} params.source — caminho do arquivo fonte
 * @param {string} params.destination — caminho do destino
 * @param {string[]} params.allowedDirs — diretórios permitidos
 * @param {number} [params.maxSize] — tamanho máximo em bytes
 * @param {string} params.operator — quem está fazendo a transferência
 * @returns {{ success: boolean, auditEntry: object, error?: string }}
 */
function transferFile({ source, destination, allowedDirs, maxSize, operator }) {
    const auditEntry = {
        action: "file.transfer",
        operator,
        source: path.resolve(source),
        destination: path.resolve(destination),
        timestamp: new Date().toISOString(),
        hashBefore: null,
        hashAfter: null,
        size: null,
        success: false,
    };

    // 1. Verificar se o arquivo fonte existe
    if (!fs.existsSync(source)) {
        auditEntry.error = "Arquivo fonte não encontrado";
        return { success: false, auditEntry, error: auditEntry.error };
    }

    // 2. Verificar allowlist para fonte e destino
    const srcCheck = checkAllowlist(source, allowedDirs);
    if (!srcCheck.allowed) {
        auditEntry.error = `Fonte: ${srcCheck.reason}`;
        return { success: false, auditEntry, error: auditEntry.error };
    }

    const destCheck = checkAllowlist(destination, allowedDirs);
    if (!destCheck.allowed) {
        auditEntry.error = `Destino: ${destCheck.reason}`;
        return { success: false, auditEntry, error: auditEntry.error };
    }

    // 3. Verificar tamanho
    const sizeCheck = checkFileSize(source, maxSize);
    if (!sizeCheck.allowed) {
        auditEntry.error = sizeCheck.reason;
        auditEntry.size = sizeCheck.size;
        return { success: false, auditEntry, error: auditEntry.error };
    }
    auditEntry.size = sizeCheck.size;

    // 4. Hash antes da cópia
    auditEntry.hashBefore = hashFile(source);

    // 5. Copiar o arquivo
    const destDir = path.dirname(destination);
    if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
    }
    fs.copyFileSync(source, destination);

    // 6. Hash depois da cópia (verificar integridade)
    auditEntry.hashAfter = hashFile(destination);

    if (auditEntry.hashBefore !== auditEntry.hashAfter) {
        auditEntry.error = "Integridade comprometida: hash pré/pós não confere";
        // Remove arquivo corrompido
        fs.unlinkSync(destination);
        return { success: false, auditEntry, error: auditEntry.error };
    }

    auditEntry.success = true;
    return { success: true, auditEntry };
}

module.exports = {
    hashFile,
    checkAllowlist,
    checkFileSize,
    transferFile,
    DEFAULT_MAX_SIZE,
};
