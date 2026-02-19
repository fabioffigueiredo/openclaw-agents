/**
 * Módulo de segurança para o OpenClaw Setup Wizard.
 * Contém verificação de portas, mascaramento de segredos e geração de tokens.
 * 
 * @module lib/security
 */
const crypto = require("crypto");
const net = require("net");

/**
 * Verifica se uma porta está em uso em um host específico.
 * Usa timeout curto (600ms) para não travar o wizard.
 * @param {string} host - Endereço do host (ex: "127.0.0.1")
 * @param {number} port - Número da porta
 * @returns {Promise<boolean>} true se a porta respondeu (em uso)
 */
function portInUse(host, port) {
    return new Promise((resolve) => {
        const socket = new net.Socket();
        socket.setTimeout(600);
        socket.once("error", () => resolve(false));
        socket.once("timeout", () => { socket.destroy(); resolve(false); });
        socket.connect(port, host, () => { socket.end(); resolve(true); });
    });
}

/**
 * Mascara um segredo para exibição segura (logs/console).
 * Mostra apenas os 3 primeiros e 3 últimos caracteres.
 * @param {string} s - String secreta a ser mascarada
 * @returns {string} String mascarada (ex: "abc…xyz") ou "***" se curta
 */
function mask(s) {
    if (!s) return "";
    if (s.length <= 6) return "***";
    return s.slice(0, 3) + "…" + s.slice(-3);
}

/**
 * Gera um token de autenticação seguro usando crypto.randomBytes.
 * Produz 48 caracteres hexadecimais (24 bytes de entropia).
 * @returns {string} Token hexadecimal de 48 caracteres
 */
function generateToken() {
    return crypto.randomBytes(24).toString("hex");
}

module.exports = { portInUse, mask, generateToken };
