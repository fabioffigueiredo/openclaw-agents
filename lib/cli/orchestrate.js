"use strict";

const fs = require("fs");
const path = require("path");
const initCmd = require("./init");
const doctorCmd = require("./doctor");
const debugCmd = require("./debug");

const readline = require("readline");

function askQuestion(query) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    return new Promise((resolve) => rl.question(query, (ans) => {
        rl.close();
        resolve(ans);
    }));
}

module.exports = {
    run: async function ({ targetPath, flags }) {
        const agentDir = path.join(targetPath, ".agent");

        console.log("\n🤖 OpenClaw Auto-Orchestrator\n");

        if (!fs.existsSync(agentDir)) {
            console.log("⚠️  Instalação não encontrada.");
            console.log("🚀 Iniciando processo de instalação (init)...");
            await initCmd.run({ targetPath, flags });
            return;
        }

        console.log("✅ Instalação detectada! Contexto preservado.");
        console.log("   (Arquivos em .agent/ encontrados)\n");

        console.log("O que deseja fazer?");
        console.log("  [1] 🏥 Verificar Saúde (Doctor) - Recomendado");
        console.log("  [2] 🔄 Atualizar (Safe Merge) - Adiciona novidades, mantém edições");
        console.log("  [3] ⚠️  Reinstalar (Force) - ALERTA: Sobrescreve TUDO");
        console.log("  [4] 🚪 Sair\n");

        const ans = await askQuestion("Escolha uma opção [1-4]: ");
        const choice = ans.trim();

        console.log(""); // quebra de linha

        if (choice === "1" || choice === "") {
            console.log("🏥 Iniciando Doctor...");
            await doctorCmd.run({ targetPath, flags });
        } else if (choice === "2") {
            console.log("🔄 Iniciando Safe Merge...");
            // Como o usuário já confirmou interativamente aqui, passamos apply + yes
            const safeFlags = { ...flags, merge: true, apply: true, yes: true };
            await initCmd.run({ targetPath, flags: safeFlags });
        } else if (choice === "3") {
            const confirm = await askQuestion("Tem certeza? Isso apagará todas as suas customizações em .agent/. Digite 'sim' para confirmar: ");
            if (confirm.toLowerCase() === "sim") {
                console.log("⚠️  Iniciando Reinstalação Forçada...");
                // Aqui passamos force, apply e yes (já confirmou a string "sim")
                const forceFlags = { ...flags, force: true, apply: true, yes: true };
                await initCmd.run({ targetPath, flags: forceFlags });
            } else {
                console.log("⏹️  Cancelado.");
            }
        } else {
            console.log("👋 Saindo.");
        }
    }
};
