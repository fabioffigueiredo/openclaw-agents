"use strict";

/**
 * Comando CLI: assist
 *
 * Assistente geral do OpenClaw AI OS.
 * Detecta contexto, roteia para a skill correta e apresenta plano.
 * Funciona tanto via terminal quanto como "cérebro" para IDEs (chat-first).
 */

const path = require("path");
const readline = require("readline");
const collectContext = require("../context/collector");
const { matchSkill } = require("../router/match");

// Caminho dos templates e skills do pacote
const TEMPLATES_DIR = path.join(__dirname, "..", "..", "templates");
const SKILLS_DIR = path.join(TEMPLATES_DIR, ".agent", "skills");

function ask(q) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    return new Promise((res) => rl.question(q, (ans) => { rl.close(); res(ans.trim()); }));
}

/**
 * Executa o comando assist (menu interativo com roteamento de skills).
 * @param {object} options
 * @param {string} options.targetPath — diretório alvo
 * @param {object} options.flags — flags do CLI
 */
async function run({ targetPath, flags }) {
    // 1. Coletar contexto (read-only)
    const ctx = collectContext({
        targetPath,
        templatesDir: TEMPLATES_DIR,
    });

    console.log("\n🧠 OpenClaw Assist — Modo PLAN por padrão (seguro)\n");
    console.log(`   IDE: ${ctx.ide} | OpenClaw: ${ctx.openclaw.hasAgentDir ? "instalado" : "não instalado"}`);
    console.log(`   Plataforma: ${ctx.env.platform} | Docker: ${ctx.env.docker}\n`);

    // 2. Se não tem OpenClaw instalado, sugerir instalação
    if (!ctx.openclaw.hasAgentDir) {
        console.log("⚠️  OpenClaw não detectado neste workspace.");
        console.log("   Rode: npx openclaw init --apply  (para instalar)\n");
        return;
    }

    // 3. Pedir solicitação do usuário
    console.log("Descreva o que deseja fazer:");
    console.log("  (ex: 'criar skill', 'melhorar segurança', 'mission control tick')\n");
    const request = await ask("> ");

    if (!request) {
        console.log("⏹️  Nenhuma solicitação. Saindo.");
        return;
    }

    // 4. Rotear para skill correta
    const match = matchSkill({ skillsDir: SKILLS_DIR, userText: request });

    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    if (match.chosen) {
        console.log(`🎯 Skill selecionada: ${match.chosen.name}`);
        console.log(`   Descrição: ${match.chosen.description}`);
    } else {
        console.log("❓ Nenhuma skill correspondente encontrada.");
        console.log("   Tente reformular a solicitação ou use 'openclaw inspect' para ver skills disponíveis.");
    }

    if (match.alternatives.length > 0) {
        console.log(`\n   Alternativas:`);
        match.alternatives.forEach(a => console.log(`      • ${a.name}: ${a.description}`));
    }

    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("\n✅ Protocolo recomendado:");
    console.log("   1) Rodar INSPECT (read-only) e revisar o contexto");
    console.log("   2) Descrever exatamente o que quer alterar");
    console.log("   3) Confirmar APPLY para executar");
    console.log("   4) Tudo será registrado em .agent/audit/\n");
}

module.exports = { run };
