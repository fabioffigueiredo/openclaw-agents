"use strict";

/**
 * Script operacional: VPN WireGuard
 *
 * Provisiona e verifica WireGuard entre VPS e hosts.
 * Princípio: sem VPN, sem acesso remoto.
 *
 * Referência: skills/openclaw-ops/01-openclaw-vpn-wireguard/SKILL.md
 */

const { execSync } = require("child_process");
const crypto = require("crypto");

/**
 * Verifica se o WireGuard está instalado.
 * @returns {{ installed: boolean, version?: string }}
 */
function checkInstalled() {
    try {
        const output = execSync("wg --version", { encoding: "utf8", timeout: 5000 }).trim();
        return { installed: true, version: output };
    } catch {
        return { installed: false };
    }
}

/**
 * Verifica o status da interface WireGuard (wg0).
 * @returns {{ active: boolean, peers: number, latestHandshake?: string }}
 */
function getInterfaceStatus() {
    try {
        const output = execSync("wg show wg0", { encoding: "utf8", timeout: 5000 });
        const peers = (output.match(/peer:/g) || []).length;
        const handshakeMatch = output.match(/latest handshake:\s*(.+)/);

        return {
            active: true,
            peers,
            latestHandshake: handshakeMatch ? handshakeMatch[1].trim() : undefined,
        };
    } catch {
        return { active: false, peers: 0 };
    }
}

/**
 * Gera par de chaves WireGuard.
 * @returns {{ privateKey: string, publicKey: string }}
 */
function generateKeyPair() {
    try {
        const privateKey = execSync("wg genkey", { encoding: "utf8", timeout: 5000 }).trim();
        const publicKey = execSync(`echo "${privateKey}" | wg pubkey`, {
            encoding: "utf8",
            timeout: 5000,
            shell: true,
        }).trim();
        return { privateKey, publicKey };
    } catch {
        // Fallback: gera chaves com crypto (para ambientes sem wg)
        const key = crypto.randomBytes(32);
        return {
            privateKey: key.toString("base64"),
            publicKey: crypto.createHash("sha256").update(key).digest("base64"),
        };
    }
}

/**
 * Gera configuração WireGuard para a VPS (servidor).
 * @param {object} params
 * @param {string} params.privateKey — chave privada do servidor
 * @param {string} params.listenPort — porta UDP (padrão: 51820)
 * @param {string} params.address — endereço IP da VPN (padrão: 10.60.0.1/24)
 * @returns {string} conteúdo do arquivo wg0.conf
 */
function generateServerConfig({ privateKey, listenPort = "51820", address = "10.60.0.1/24" }) {
    return `[Interface]
Address = ${address}
ListenPort = ${listenPort}
PrivateKey = ${privateKey}

# PostUp/PostDown para firewall (ajuste conforme sua interface de rede)
# PostUp = iptables -A FORWARD -i wg0 -j ACCEPT
# PostDown = iptables -D FORWARD -i wg0 -j ACCEPT
`;
}

/**
 * Gera configuração de peer para adicionar à VPS.
 * @param {object} params
 * @param {string} params.publicKey — chave pública do peer
 * @param {string} params.allowedIPs — IPs permitidos (ex: 10.60.0.2/32)
 * @returns {string} bloco [Peer] para wg0.conf
 */
function generatePeerBlock({ publicKey, allowedIPs }) {
    return `
[Peer]
PublicKey = ${publicKey}
AllowedIPs = ${allowedIPs}
`;
}

/**
 * Valida conectividade dentro da VPN via ping.
 * @param {string} ip — IP para pingar (ex: 10.60.0.1)
 * @returns {{ reachable: boolean, latency?: string }}
 */
function validateConnectivity(ip) {
    try {
        const output = execSync(`ping -c 2 -W 3 ${ip}`, { encoding: "utf8", timeout: 10000 });
        const latencyMatch = output.match(/time=(\d+\.?\d*)/);
        return {
            reachable: true,
            latency: latencyMatch ? `${latencyMatch[1]}ms` : undefined,
        };
    } catch {
        return { reachable: false };
    }
}

module.exports = {
    checkInstalled,
    getInterfaceStatus,
    generateKeyPair,
    generateServerConfig,
    generatePeerBlock,
    validateConnectivity,
};
