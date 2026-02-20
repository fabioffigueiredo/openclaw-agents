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
    uninstall: "../lib/cli/uninstall",
    status: "../lib/cli/status",
    doctor: "../lib/cli/doctor",
    debug: "../lib/cli/debug",
    check: "../lib/cli/orchestrate",
    inspect: "../lib/cli/inspect",
    assist: "../lib/cli/assist",
    ide: "../lib/cli/ide",
    setup: "../lib/cli/setup",
};

/**
 * Parseia os argumentos da linha de comando.
 * @param {string[]} argv — process.argv.slice(2)
 * @returns {{ command: string|null, flags: object }}
 */
function parseArgs(argv) {
    const flags = {
        plan: true, // Default: PLAN mode (read-only)
        audit: true, // Default: Generate audit logs
        _: [] // Captura subcomandos/args
    };
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
            flags.path = argv[++i] || ".";
        } else if (arg === "--quiet" || arg === "-q") {
            flags.quiet = true;
        } else if (arg === "--apply") {
            flags.apply = true;
        } else if (arg === "--plan") {
            flags.plan = true;
        } else if (arg === "--yes" || arg === "-y") {
            flags.yes = true;
        } else if (arg === "--no-audit") {
            flags.audit = false;
        } else if (arg === "--merge") {
            flags.merge = true;
        } else if (!arg.startsWith("-")) {
            if (!command) {
                command = arg;
            } else {
                flags._.push(arg); // Captura subcomandos/args
            }
        }
    }

    // Regra de precedência: apply sempre vence plan
    if (flags.apply) flags.plan = false;

    // Constrói ajudantes semânticos a partir de _
    flags.subcommand = flags._[0] || null;
    flags.args = flags._.slice(1);

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
    uninstall Remove .agent/ e openclaw.json (com backup)
    status    Mostra status da instalação
    doctor    Healthcheck automatizado do ambiente
    setup     Roda wizard interativo de configuração
    debug     Diagnóstico avançado de instalação e rede
    check     Orquestrador inteligente (instala ou repara)
    inspect   Analisa ambiente e contexto (100% read-only)
    assist    Assistente geral com roteamento de skills
    ide       Instala AI OS na IDE (ide install / ide doctor)

  Opções Globais:
    --path, -p <dir>   Diretório alvo (padrão: ./)
    --plan             Modo Simulação (PADRÃO): Mostra o que será feito sem alterar nada
    --apply            Modo Execução: Aplica as alterações propostas
    --yes, -y          Confirma automaticamente (skip prompts)
    --force, -f        Permite operações destrutivas (exige confirmação forte)
    --no-audit         Desabilita geração de logs de auditoria
    --merge            Atualização segura (não sobrescreve customizações)
    --quiet, -q        Saída mínima
    --help, -h         Mostra esta ajuda
    --version, -v      Mostra a versão

  Exemplos:
    npx openclaw init --plan           (Simula instalação)
    npx openclaw init --apply          (Instala de fato)
    npx openclaw check                 (Orquestrador seguro)
    npx openclaw inspect               (Analisa contexto)
    npx openclaw assist                (Assistente geral)
    npx openclaw ide install --apply   (Instala AI OS na IDE)
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
