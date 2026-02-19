"use strict";

/**
 * Comando CLI: status
 *
 * Mostra status da instalação do OpenClaw no projeto.
 * Verifica presença de .agent/, openclaw.json, lista componentes
 * e exibe configuração ativa sem revelar tokens.
 */

const fs = require("fs");
const path = require("path");
const { readJsonSafe } = require("../config");
const { mask } = require("../security");

const pkg = require("../../package.json");

/**
 * Conta arquivos em um diretório recursivamente.
 * @param {string} dir — diretório para contar
 * @returns {number} contagem de arquivos
 */
function countFiles(dir) {
    if (!fs.existsSync(dir)) return 0;
    let count = 0;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        if (entry.isDirectory()) {
            count += countFiles(path.join(dir, entry.name));
        } else {
            count++;
        }
    }
    return count;
}

/**
 * Lista itens de um diretório (primeiro nível).
 * @param {string} dir — diretório para listar
 * @returns {string[]} nomes dos itens
 */
function listItems(dir) {
    if (!fs.existsSync(dir)) return [];
    return fs.readdirSync(dir, { withFileTypes: true })
        .filter((e) => e.isDirectory())
        .map((e) => e.name);
}

/**
 * Executa o comando status.
 * @param {object} options
 * @param {string} options.targetPath — diretório alvo
 * @param {object} options.flags — flags do CLI
 */
async function run({ targetPath, flags }) {
    const agentDir = path.join(targetPath, ".agent");
    const configPath = path.join(targetPath, "openclaw.json");

    console.log(`\n🦀 OpenClaw Status — v${pkg.version}\n`);
    console.log(`📂 Projeto: ${targetPath}\n`);

    // Verificar .agent/
    const agentExists = fs.existsSync(agentDir);
    console.log(`${agentExists ? "✅" : "❌"} .agent/            ${agentExists ? "instalado" : "não encontrado"}`);

    if (agentExists) {
        // Listar componentes instalados
        const skillsDir = path.join(agentDir, "skills");
        const agentsDir = path.join(agentDir, "agents");
        const rulesDir = path.join(agentDir, "rules");
        const workflowsDir = path.join(agentDir, "workflows");
        const hooksDir = path.join(agentDir, "hooks");

        const skills = listItems(skillsDir);
        const agentFiles = fs.existsSync(agentsDir)
            ? fs.readdirSync(agentsDir).filter((f) => f.endsWith(".md"))
            : [];
        const ruleFiles = fs.existsSync(rulesDir)
            ? fs.readdirSync(rulesDir).filter((f) => f.endsWith(".md"))
            : [];
        const workflowFiles = fs.existsSync(workflowsDir)
            ? fs.readdirSync(workflowsDir).filter((f) => f.endsWith(".md"))
            : [];
        const hookFiles = fs.existsSync(hooksDir)
            ? fs.readdirSync(hooksDir).filter((f) => f.endsWith(".js"))
            : [];

        console.log(`\n📦 Componentes instalados:`);
        console.log(`   Skills:     ${skills.length > 0 ? skills.join(", ") : "nenhuma"}`);
        console.log(`   Agents:     ${agentFiles.length > 0 ? agentFiles.map((f) => f.replace(".md", "")).join(", ") : "nenhum"}`);
        console.log(`   Rules:      ${ruleFiles.length > 0 ? ruleFiles.map((f) => f.replace(".md", "")).join(", ") : "nenhuma"}`);
        console.log(`   Workflows:  ${workflowFiles.length > 0 ? workflowFiles.map((f) => f.replace(".md", "")).join(", ") : "nenhum"}`);
        console.log(`   Hooks:      ${hookFiles.length > 0 ? hookFiles.join(", ") : "nenhum"}`);
        console.log(`   Total:      ${countFiles(agentDir)} arquivos`);
    }

    // Verificar openclaw.json
    const configExists = fs.existsSync(configPath);
    console.log(`\n${configExists ? "✅" : "❌"} openclaw.json      ${configExists ? "encontrado" : "não encontrado"}`);

    if (configExists) {
        const config = readJsonSafe(configPath);
        if (config) {
            console.log(`\n⚙️  Configuração ativa:`);
            console.log(`   bind:       ${config.gateway?.bind || "não definido"}`);
            console.log(`   auth.mode:  ${config.auth?.mode || "não definido"}`);
            console.log(`   token:      ${config.auth?.token ? mask(config.auth.token) : "não definido"}`);

            // Canais configurados
            const channels = config.channels || {};
            const activeChannels = Object.entries(channels)
                .filter(([, v]) => v && v.token)
                .map(([k]) => k);
            console.log(`   canais:     ${activeChannels.length > 0 ? activeChannels.join(", ") : "nenhum"}`);

            // Ambiente
            if (config.environment) {
                console.log(`   ambiente:   ${config.environment}`);
            }
        } else {
            console.log("   ⚠️  Erro ao ler openclaw.json — arquivo pode estar corrompido");
        }
    }

    console.log("");
}

module.exports = { run };
