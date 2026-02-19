/**
 * Módulo de configuração de canais de comunicação para o OpenClaw Setup Wizard.
 * Suporta Telegram, Discord e WhatsApp com validação de formato de token.
 * 
 * @module lib/channels
 */

/**
 * Mapa de validadores de token por canal.
 * Cada entrada contém:
 * - fn: função de validação que retorna boolean
 * - hint: dica de formato para exibição em caso de erro
 * @type {Object.<string, {fn: Function, hint: string}>}
 */
const CHANNEL_VALIDATORS = {
    telegram: {
        fn: (token) => /^\d+:[A-Za-z0-9_-]{20,}$/.test(token),
        hint: "Formato esperado: 123456789:ABCDefghIJKLMnopqr...",
    },
    discord: {
        fn: (token) => /^[A-Za-z0-9_.-]{50,}$/.test(token),
        hint: "Token do bot (50+ caracteres alfanuméricos com pontos)",
    },
    whatsapp: {
        fn: (token) => /^[A-Za-z0-9_.-]{20,}$/.test(token),
        hint: "Token da API WhatsApp Business (20+ caracteres)",
    },
};

/**
 * Lista de canais suportados pelo wizard.
 * @returns {string[]} Nomes dos canais suportados
 */
function supportedChannels() {
    return Object.keys(CHANNEL_VALIDATORS);
}

/**
 * Valida o formato de um token para um canal específico.
 * @param {string} channelName - Nome do canal ("telegram", "discord", "whatsapp")
 * @param {string} token - Token a validar
 * @returns {{ valid: boolean, hint: string }} Resultado da validação com hint
 */
function validateToken(channelName, token) {
    const validator = CHANNEL_VALIDATORS[channelName];
    if (!validator) return { valid: false, hint: `Canal desconhecido: ${channelName}` };
    return {
        valid: validator.fn(token),
        hint: validator.hint,
    };
}

/**
 * Configura um canal no objeto de configuração.
 * Solicita token via askFn, valida formato e salva na config.
 * @param {object} config - Objeto de config do openclaw.json (referência, modificado in-place)
 * @param {string} channelName - Nome do canal ("telegram", "discord", "whatsapp")
 * @param {Function} askFn - Função async para perguntar ao usuário (recebe string, retorna string)
 * @returns {Promise<boolean>} true se o canal foi configurado com sucesso
 */
async function configureChannel(config, channelName, askFn) {
    if (!CHANNEL_VALIDATORS[channelName]) {
        console.log(`✖ Canal desconhecido: ${channelName}`);
        return false;
    }

    const token = await askFn(`${channelName} token: `);
    if (!token) return false;

    const { valid, hint } = validateToken(channelName, token);
    if (!valid) {
        console.log(`⚠ Formato de token inválido. ${hint}`);
        const force = await askFn("Salvar mesmo assim? (y/n): ");
        if (force.toLowerCase() !== "y") return false;
    }

    config.channels = config.channels || {};
    config.channels[channelName] = { token };
    const displayName = channelName.charAt(0).toUpperCase() + channelName.slice(1);
    console.log(`✔ ${displayName} configurado.`);
    return true;
}

module.exports = { CHANNEL_VALIDATORS, supportedChannels, validateToken, configureChannel };
