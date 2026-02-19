"use strict";

/**
 * Script operacional: Enroll Host
 *
 * Onboarding seguro de host na malha WireGuard + OpenClaw
 * com aprovação humana, identidade e revogação rápida.
 *
 * Referência: skills/openclaw-ops/02-openclaw-enroll-host/SKILL.md
 */

const crypto = require("crypto");
const os = require("os");
const path = require("path");
const { readJsonSafe, writeJsonSafe } = require("../config");

/**
 * Gera um identificador único para o host.
 * @returns {{ hostId: string, fingerprint: string, hostname: string }}
 */
function generateHostIdentity() {
    const hostId = crypto.randomUUID();
    const hostname = os.hostname();

    // Fingerprint baseado em hostname + timestamp + random
    const raw = `${hostname}-${Date.now()}-${crypto.randomBytes(8).toString("hex")}`;
    const fingerprint = crypto.createHash("sha256").update(raw).digest("hex").slice(0, 16);

    return { hostId, fingerprint, hostname };
}

/**
 * Registra um host no registro de hosts pendentes.
 * @param {string} registryPath — caminho do arquivo de registro
 * @param {object} hostInfo — informações do host (hostId, fingerprint, hostname)
 * @returns {{ success: boolean, host: object }}
 */
function registerHost(registryPath, hostInfo) {
    const registry = readJsonSafe(registryPath) || { hosts: [] };

    const entry = {
        ...hostInfo,
        status: "pending",
        registeredAt: new Date().toISOString(),
        approvedAt: null,
        approvedBy: null,
    };

    registry.hosts.push(entry);
    writeJsonSafe(registryPath, registry);

    return { success: true, host: entry };
}

/**
 * Aprova um host pendente.
 * @param {string} registryPath — caminho do arquivo de registro
 * @param {string} hostId — ID do host a aprovar
 * @param {string} approvedBy — quem aprovou
 * @returns {{ success: boolean, host?: object, error?: string }}
 */
function approveHost(registryPath, hostId, approvedBy) {
    const registry = readJsonSafe(registryPath);
    if (!registry || !registry.hosts) {
        return { success: false, error: "Registro de hosts não encontrado" };
    }

    const host = registry.hosts.find((h) => h.hostId === hostId);
    if (!host) {
        return { success: false, error: `Host ${hostId} não encontrado` };
    }

    if (host.status === "approved") {
        return { success: false, error: `Host ${hostId} já está aprovado` };
    }

    host.status = "approved";
    host.approvedAt = new Date().toISOString();
    host.approvedBy = approvedBy;

    writeJsonSafe(registryPath, registry);
    return { success: true, host };
}

/**
 * Revoga um host (remove acesso).
 * @param {string} registryPath — caminho do arquivo de registro
 * @param {string} hostId — ID do host a revogar
 * @param {string} revokedBy — quem revogou
 * @returns {{ success: boolean, host?: object, error?: string }}
 */
function revokeHost(registryPath, hostId, revokedBy) {
    const registry = readJsonSafe(registryPath);
    if (!registry || !registry.hosts) {
        return { success: false, error: "Registro de hosts não encontrado" };
    }

    const host = registry.hosts.find((h) => h.hostId === hostId);
    if (!host) {
        return { success: false, error: `Host ${hostId} não encontrado` };
    }

    host.status = "revoked";
    host.revokedAt = new Date().toISOString();
    host.revokedBy = revokedBy;

    writeJsonSafe(registryPath, registry);
    return { success: true, host };
}

/**
 * Lista hosts filtrados por status.
 * @param {string} registryPath — caminho do arquivo de registro
 * @param {string} [statusFilter] — filtrar por status (pending, approved, revoked)
 * @returns {object[]} lista de hosts
 */
function listHosts(registryPath, statusFilter) {
    const registry = readJsonSafe(registryPath);
    if (!registry || !registry.hosts) return [];

    if (statusFilter) {
        return registry.hosts.filter((h) => h.status === statusFilter);
    }
    return registry.hosts;
}

module.exports = {
    generateHostIdentity,
    registerHost,
    approveHost,
    revokeHost,
    listHosts,
};
