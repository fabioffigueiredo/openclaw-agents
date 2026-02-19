"use strict";

/**
 * Comando CLI: init
 *
 * Copia templates/.agent/ para o diretório destino.
 * Verifica se .agent/ já existe (bloqueia sem --force).
 * Cria openclaw.json com defaults via lib/config.js.
 */

const fs = require("fs");
const path = require("path");
const { initConfigDefaults, writeJsonSafe } = require("../config");

// Caminho dos templates incluídos no pacote
const TEMPLATES_DIR = path.join(__dirname, "..", "..", "templates", ".agent");

/**
 * Copia diretório recursivamente.
 * @param {string} src — diretório fonte
 * @param {string} dest — diretório destino
 * @param {object} [stats] — contador de arquivos copiados
 * @returns {object} stats com { files, dirs }
 */
function copyDirRecursive(src, dest, stats = { files: 0, dirs: 0 }) {
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
        stats.dirs++;
    }

    const entries = fs.readdirSync(src, { withFileTypes: true });

    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);

        if (entry.isDirectory()) {
            copyDirRecursive(srcPath, destPath, stats);
        } else {
            fs.copyFileSync(srcPath, destPath);
            stats.files++;
        }
    }

    return stats;
}

/**
 * Executa o comando init.
 * @param {object} options
 * @param {string} options.targetPath — diretório alvo
 * @param {object} options.flags — flags do CLI (force, quiet)
 */
async function run({ targetPath, flags }) {
    const agentDir = path.join(targetPath, ".agent");
    const configPath = path.join(targetPath, "openclaw.json");

    // Verificar se já existe
    if (fs.existsSync(agentDir) && !flags.force) {
        console.error("❌ Diretório .agent/ já existe.");
        console.error("   Use --force para sobrescrever ou 'openclaw update' para atualizar.");
        process.exit(1);
    }

    // Verificar se templates existem
    if (!fs.existsSync(TEMPLATES_DIR)) {
        console.error("❌ Templates não encontrados. Pacote pode estar corrompido.");
        process.exit(1);
    }

    if (!flags.quiet) {
        console.log("🦀 OpenClaw — Inicializando projeto...\n");
    }

    // Se --force e já existe, alertar
    if (fs.existsSync(agentDir) && flags.force) {
        if (!flags.quiet) {
            console.log("⚠️  --force: substituindo .agent/ existente\n");
        }
        fs.rmSync(agentDir, { recursive: true, force: true });
    }

    // Copiar templates
    const stats = copyDirRecursive(TEMPLATES_DIR, agentDir);

    if (!flags.quiet) {
        console.log(`✅ .agent/ instalado com sucesso!`);
        console.log(`   📁 ${stats.dirs} diretórios criados`);
        console.log(`   📄 ${stats.files} arquivos copiados\n`);
    }

    // Criar openclaw.json com defaults (se não existir)
    if (!fs.existsSync(configPath)) {
        const defaults = initConfigDefaults({});
        writeJsonSafe(configPath, defaults);

        if (!flags.quiet) {
            console.log("📋 openclaw.json criado com configurações padrão\n");
        }
    } else if (!flags.quiet) {
        console.log("📋 openclaw.json já existe — mantido\n");
    }

    // Resumo final
    if (!flags.quiet) {
        console.log("📂 Estrutura instalada:");
        listInstalledStructure(agentDir, "   ");

        console.log("\n🚀 Próximos passos:");
        console.log("   1. openclaw setup    — configurar ambiente");
        console.log("   2. openclaw doctor   — verificar saúde");
        console.log("   3. openclaw status   — ver status\n");
    }
}

/**
 * Lista a estrutura instalada de forma visual.
 * @param {string} dir — diretório para listar
 * @param {string} prefix — prefixo para indentação
 */
function listInstalledStructure(dir, prefix = "") {
    const entries = fs.readdirSync(dir, { withFileTypes: true })
        .sort((a, b) => {
            // Diretórios primeiro, depois arquivos
            if (a.isDirectory() && !b.isDirectory()) return -1;
            if (!a.isDirectory() && b.isDirectory()) return 1;
            return a.name.localeCompare(b.name);
        });

    for (let i = 0; i < entries.length; i++) {
        const entry = entries[i];
        const isLast = i === entries.length - 1;
        const connector = isLast ? "└── " : "├── ";
        const icon = entry.isDirectory() ? "📁" : "📄";

        console.log(`${prefix}${connector}${icon} ${entry.name}`);

        if (entry.isDirectory()) {
            const childPrefix = prefix + (isLast ? "    " : "│   ");
            listInstalledStructure(path.join(dir, entry.name), childPrefix);
        }
    }
}

module.exports = { run, copyDirRecursive };
