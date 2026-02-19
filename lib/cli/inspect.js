"use strict";

/**
 * Comando CLI: inspect
 *
 * 100% Read-Only. Coleta e exibe contexto do ambiente sem alterar nada.
 * Usado como primeiro passo antes de qualquer ação.
 */

const path = require("path");
const collectContext = require("../context/collector");

// Caminho dos templates do pacote
const TEMPLATES_DIR = path.join(__dirname, "..", "..", "templates");

/**
 * Executa o comando inspect (read-only puro).
 * @param {object} options
 * @param {string} options.targetPath — diretório alvo
 * @param {object} options.flags — flags do CLI
 */
async function run({ targetPath, flags }) {
    const ctx = collectContext({
        targetPath,
        templatesDir: TEMPLATES_DIR,
    });

    if (flags.quiet) {
        // Modo silencioso: só JSON
        console.log(JSON.stringify(ctx, null, 2));
        return ctx;
    }

    console.log("\n🔎 OpenClaw Inspect (Read-Only)\n");
    console.log(`   🖥️  Plataforma: ${ctx.env.platform}`);
    console.log(`   🐳 Docker: ${ctx.env.docker}`);
    console.log(`   🪟 WSL: ${ctx.env.wsl}`);
    console.log(`   💻 IDE: ${ctx.ide}`);
    console.log(`   📂 Path: ${ctx.targetPath}`);
    console.log(`   📦 OpenClaw instalado: ${ctx.openclaw.hasAgentDir ? "Sim" : "Não"}`);
    console.log(`   📋 Config: ${ctx.openclaw.hasConfig ? "Sim" : "Não"}`);
    console.log(`   🐙 Git repo: ${ctx.git.isRepo ? "Sim" : "Não"}`);

    if (ctx.skillsInstalled.length > 0) {
        console.log(`\n   🧠 Skills instaladas (${ctx.skillsInstalled.length}):`);
        ctx.skillsInstalled.forEach(s => console.log(`      • ${s.name}`));
    }

    if (ctx.skillsInTemplates.length > 0) {
        console.log(`\n   📦 Skills disponíveis nos templates (${ctx.skillsInTemplates.length}):`);
        ctx.skillsInTemplates.forEach(s => console.log(`      • ${s.name}`));
    }

    console.log("\n✅ Inspect concluído (nenhuma alteração feita).\n");
    return ctx;
}

module.exports = { run };
