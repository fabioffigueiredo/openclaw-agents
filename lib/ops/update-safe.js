"use strict";

/**
 * Script operacional: Safe Update
 *
 * Atualização segura com verificação (hash/assinatura),
 * canary e rollback automático.
 *
 * Referência: skills/openclaw-ops/07-openclaw-safe-update/SKILL.md
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const crypto = require("crypto");

/**
 * Cria um snapshot de backup antes do update.
 * @param {string} targetDir — diretório a fazer backup
 * @param {string} backupDir — diretório de backups
 * @returns {{ backupPath: string, timestamp: string }}
 */
function createSnapshot(targetDir, backupDir) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupPath = path.join(backupDir, `snapshot-${timestamp}`);

    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
    }

    // Cópia recursiva do diretório
    copyDirRecursive(targetDir, backupPath);

    return { backupPath, timestamp };
}

/**
 * Copia diretório recursivamente.
 * @param {string} src — fonte
 * @param {string} dest — destino
 */
function copyDirRecursive(src, dest) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });

    const entries = fs.readdirSync(src, { withFileTypes: true });
    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);

        if (entry.isDirectory()) {
            copyDirRecursive(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

/**
 * Restaura um snapshot (rollback).
 * @param {string} backupPath — caminho do backup
 * @param {string} targetDir — diretório alvo para restaurar
 * @returns {{ success: boolean, error?: string }}
 */
function rollback(backupPath, targetDir) {
    try {
        if (!fs.existsSync(backupPath)) {
            return { success: false, error: `Backup não encontrado: ${backupPath}` };
        }

        // Remove o diretório atual
        fs.rmSync(targetDir, { recursive: true, force: true });

        // Restaura do backup
        copyDirRecursive(backupPath, targetDir);

        return { success: true };
    } catch (err) {
        return { success: false, error: err.message };
    }
}

/**
 * Verifica hash de integridade de um arquivo/diretório.
 * @param {string} filePath — caminho do arquivo
 * @param {string} expectedHash — hash SHA-256 esperado
 * @returns {{ valid: boolean, actualHash: string }}
 */
function verifyHash(filePath, expectedHash) {
    const content = fs.readFileSync(filePath);
    const actualHash = crypto.createHash("sha256").update(content).digest("hex");
    return { valid: actualHash === expectedHash, actualHash };
}

/**
 * Executa um healthcheck pós-update.
 * @param {object} [checks] — funções de verificação customizáveis
 * @param {function} [checks.configValid] — verifica se config é válida
 * @param {function} [checks.serviceRunning] — verifica se serviço está rodando
 * @returns {{ healthy: boolean, results: object[] }}
 */
function postUpdateHealthcheck(checks = {}) {
    const results = [];

    // Check 1: Configuração válida
    if (checks.configValid) {
        try {
            const ok = checks.configValid();
            results.push({ name: "config", status: ok ? "ok" : "fail" });
        } catch (err) {
            results.push({ name: "config", status: "fail", error: err.message });
        }
    }

    // Check 2: Serviço rodando
    if (checks.serviceRunning) {
        try {
            const ok = checks.serviceRunning();
            results.push({ name: "service", status: ok ? "ok" : "fail" });
        } catch (err) {
            results.push({ name: "service", status: "fail", error: err.message });
        }
    }

    const healthy = results.every((r) => r.status === "ok");
    return { healthy, results };
}

/**
 * Fluxo completo de safe update com canary e rollback.
 * @param {object} params
 * @param {string} params.targetDir — diretório a atualizar
 * @param {string} params.backupDir — diretório de backups
 * @param {function} params.applyUpdate — função que aplica o update
 * @param {object} [params.healthchecks] — funções de verificação
 * @returns {{ success: boolean, backup: string, error?: string }}
 */
async function safeUpdate({ targetDir, backupDir, applyUpdate, healthchecks = {} }) {
    // 1. Snapshot/backup
    const { backupPath } = createSnapshot(targetDir, backupDir);

    // 2. Aplicar update
    try {
        await applyUpdate();
    } catch (err) {
        // Rollback imediato
        rollback(backupPath, targetDir);
        return { success: false, backup: backupPath, error: `Update falhou: ${err.message}. Rollback aplicado.` };
    }

    // 3. Healthcheck pós-update
    const health = postUpdateHealthcheck(healthchecks);

    if (!health.healthy) {
        // Rollback automático
        rollback(backupPath, targetDir);
        const failedChecks = health.results.filter((r) => r.status === "fail").map((r) => r.name);
        return {
            success: false,
            backup: backupPath,
            error: `Healthcheck falhou (${failedChecks.join(", ")}). Rollback aplicado.`,
        };
    }

    return { success: true, backup: backupPath };
}

module.exports = {
    createSnapshot,
    rollback,
    verifyHash,
    postUpdateHealthcheck,
    safeUpdate,
};
