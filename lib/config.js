/**
 * Módulo de manipulação de configuração (JSON) para o OpenClaw Setup Wizard.
 * Oferece leitura/escrita atômica de JSON e criação idempotente de arquivos.
 * 
 * @module lib/config
 */
const fs = require("fs");
const path = require("path");

/**
 * Lê e parseia um arquivo JSON de forma segura.
 * Retorna null se o arquivo não existir ou não for JSON válido.
 * @param {string} filePath - Caminho absoluto do arquivo JSON
 * @returns {object|null} Objeto parseado ou null em caso de erro
 */
function readJsonSafe(filePath) {
    try {
        return JSON.parse(fs.readFileSync(filePath, "utf8"));
    } catch {
        return null;
    }
}

/**
 * Escreve um objeto como JSON de forma atômica (write-then-rename).
 * Previne corrupção de arquivo em caso de falha durante escrita.
 * @param {string} filePath - Caminho absoluto do arquivo destino
 * @param {object} obj - Objeto a ser serializado como JSON
 */
function writeJsonSafe(filePath, obj) {
    const tmp = filePath + ".tmp";
    fs.writeFileSync(tmp, JSON.stringify(obj, null, 2), "utf8");
    fs.renameSync(tmp, filePath);
}

/**
 * Garante que um arquivo existe, criando com conteúdo padrão se necessário.
 * Não sobrescreve arquivos existentes (idempotente).
 * @param {string} filePath - Caminho absoluto do arquivo
 * @param {string} content - Conteúdo padrão caso o arquivo precise ser criado
 * @returns {boolean} true se o arquivo foi criado, false se já existia
 */
function ensureFile(filePath, content) {
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, content, "utf8");
        console.log(`✔ Criado ${path.basename(filePath)}`);
        return true;
    }
    return false;
}

/**
 * Inicializa a estrutura de configuração com seções padrão.
 * Não sobrescreve seções que já existam no objeto config.
 * @param {object} config - Objeto de configuração parcial
 * @returns {object} Configuração com todas as seções garantidas
 */
function initConfigDefaults(config) {
    config.gateway = config.gateway || {};
    config.auth = config.auth || {};
    config.channels = config.channels || {};
    config.filesystem = config.filesystem || {};
    config.filesystem.allowlist = config.filesystem.allowlist || [];
    config.sandbox = config.sandbox || {};
    return config;
}

module.exports = { readJsonSafe, writeJsonSafe, ensureFile, initConfigDefaults };
