#!/usr/bin/env node
"use strict";

/**
 * OpenClaw CLI — Entry point principal.
 *
 * Parseia argumentos e despacha para o comando correto.
 * Sem dependências externas — usa apenas process.argv.
 *
 * Comandos:
 *   init   [--force] [--path <dir>]  Instala templates .agent/ no projeto
 *   update [--path <dir>]            Atualiza templates preservando customizações
 *   status [--path <dir>]            Mostra status da instalação
 *   doctor [--path <dir>]            Healthcheck automatizado
 *   setup                            Roda wizard interativo
 *   --help                           Mostra ajuda
 *   --version                        Mostra versão
 */

const path = require("path");
const pkg = require("../package.json");

// Comandos disponíveis e seus módulos
const COMMANDS = {
    init: "../lib/cli/init",
    update: "../lib/cli/update",
    status: "../lib/cli/status",
    doctor: "../lib/cli/doctor",
};

/**
 * Parseia os argumentos da linha de comando.
 * @param {string[]} argv — process.argv.slice(2)
 * @returns {{ command: string|null, flags: object }}
 */
function parseArgs(argv) {
    const flags = {};
    let command = null;

    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i];

        if (arg === "--help" || arg === "-h") {
            flags.help = true;
        } else if (arg === "--version" || arg === "-v") {
            flags.version = true;
        } else if (arg === "--force" || arg === "-f") {
            flags.force = true;
        } else if (arg === "--path" || arg === "-p") {
            // Próximo argumento é o caminho
            flags.path = argv[++i] || ".";
        } else if (arg === "--quiet" || arg === "-q") {
            flags.quiet = true;
        } else if (!arg.startsWith("-") && !command) {
            command = arg;
        }
    }

    return { command, flags };
}

/**
 * Exibe a mensagem de ajuda.
 */
function showHelp() {
    console.log(`
  🦀 OpenClaw CLI v${pkg.version}

  Uso: openclaw <comando> [opções]

  Comandos:
    init      Instala templates .agent/ no projeto atual
    update    Atualiza templates preservando customizações
    status    Mostra status da instalação
    doctor    Healthcheck automatizado do ambiente
    setup     Roda wizard interativo de configuração

  Opções:
    --path, -p <dir>   Diretório alvo (padrão: ./)
    --force, -f        Sobrescreve .agent/ existente (init)
    --quiet, -q        Saída mínima
    --help, -h         Mostra esta ajuda
    --version, -v      Mostra a versão

  Exemplos:
    npx openclaw init
    npx openclaw init --force --path ./meu-projeto
    npx openclaw doctor
    npx openclaw status
`);
}

/**
 * Ponto de entrada principal.
 */
async function main() {
    const { command, flags } = parseArgs(process.argv.slice(2));

    // Flags globais
    if (flags.version) {
        console.log(`openclaw v${pkg.version}`);
        return;
    }

    if (flags.help || !command) {
        showHelp();
        return;
    }

    // Resolver caminho de destino
    const targetPath = path.resolve(flags.path || ".");

    // Comando setup — roda wizard diretamente
    if (command === "setup") {
        const wizardPath = path.join(__dirname, "..", "lib", "setup", "config_wizard.js");
        try {
            require(wizardPath);
        } catch (err) {
            console.error(`❌ Erro ao rodar setup wizard: ${err.message}`);
            process.exit(1);
        }
        return;
    }

    // Verificar se o comando existe
    if (!COMMANDS[command]) {
        console.error(`❌ Comando desconhecido: "${command}"`);
        console.error(`   Use "openclaw --help" para ver comandos disponíveis.`);
        process.exit(1);
    }

    // Carregar e executar o comando
    try {
        const commandModule = require(COMMANDS[command]);
        await commandModule.run({ targetPath, flags });
    } catch (err) {
        console.error(`❌ Erro ao executar "${command}": ${err.message}`);
        if (!flags.quiet) {
            console.error(err.stack);
        }
        process.exit(1);
    }
}

main().catch((err) => {
    console.error("❌ Erro inesperado:", err.message);
    process.exit(1);
});
