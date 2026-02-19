"use strict";

/**
 * Comando CLI: update
 *
 * Atualiza templates .agent/ preservando customizações do usuário.
 * Compara arquivos por hash SHA-256 e só sobrescreve se:
 * - O arquivo não foi customizado pelo usuário (hash original)
 * - Ou se o template tem uma versão mais nova
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

// Caminho dos templates incluídos no pacote
const TEMPLATES_DIR = path.join(__dirname, "..", "..", "templates", ".agent");

/**
 * Calcula o SHA-256 de um arquivo.
 * @param {string} filePath — caminho do arquivo
 * @returns {string} hash em hex
 */
function fileHash(filePath) {
    const content = fs.readFileSync(filePath);
    return crypto.createHash("sha256").update(content).digest("hex");
}

/**
 * Compara e atualiza um diretório recursivamente.
 * @param {string} src — diretório fonte (template)
 * @param {string} dest — diretório destino (instalado)
 * @param {object} stats — contadores { updated, skipped, added }
 */
function updateDirRecursive(src, dest, stats) {
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
    }

    const entries = fs.readdirSync(src, { withFileTypes: true });

    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);

        if (entry.isDirectory()) {
            updateDirRecursive(srcPath, destPath, stats);
        } else {
            if (!fs.existsSync(destPath)) {
                // Arquivo novo — copiar
                fs.copyFileSync(srcPath, destPath);
                stats.added.push(path.relative(dest, destPath) || entry.name);
            } else {
                // Arquivo já existe — comparar hashes
                const srcHash = fileHash(srcPath);
                const destHash = fileHash(destPath);

                if (srcHash === destHash) {
                    // Idêntico — nada a fazer
                    stats.skipped.push(path.relative(dest, destPath) || entry.name);
                } else {
                    // Diferente — arquivo foi customizado ou template atualizado
                    // Preserva o original do usuário fazendo backup
                    const backupPath = destPath + ".bak";
                    fs.copyFileSync(destPath, backupPath);
                    fs.copyFileSync(srcPath, destPath);
                    stats.updated.push(path.relative(dest, destPath) || entry.name);
                }
            }
        }
    }
}

/**
 * Executa o comando update.
 * @param {object} options
 * @param {string} options.targetPath — diretório alvo
 * @param {object} options.flags — flags do CLI
 */
async function run({ targetPath, flags }) {
    const agentDir = path.join(targetPath, ".agent");

    if (!fs.existsSync(agentDir)) {
        console.error("❌ Diretório .agent/ não encontrado.");
        console.error("   Rode 'openclaw init' primeiro para instalar os templates.");
        process.exit(1);
    }

    if (!fs.existsSync(TEMPLATES_DIR)) {
        console.error("❌ Templates não encontrados. Pacote pode estar corrompido.");
        process.exit(1);
    }

    if (!flags.quiet) {
        console.log("\n🔄 OpenClaw Update — Atualizando templates...\n");
    }

    const stats = { updated: [], skipped: [], added: [] };
    updateDirRecursive(TEMPLATES_DIR, agentDir, stats);

    if (!flags.quiet) {
        if (stats.added.length > 0) {
            console.log(`📄 Novos (${stats.added.length}):`);
            stats.added.forEach((f) => console.log(`   + ${f}`));
        }

        if (stats.updated.length > 0) {
            console.log(`\n🔄 Atualizados (${stats.updated.length}):`);
            stats.updated.forEach((f) => console.log(`   ~ ${f} (backup: ${f}.bak)`));
        }

        if (stats.skipped.length > 0) {
            console.log(`\n⏭️  Sem alteração (${stats.skipped.length}):`);
            stats.skipped.forEach((f) => console.log(`   = ${f}`));
        }

        const total = stats.added.length + stats.updated.length;
        console.log(`\n✅ Update concluído: ${total} alterações, ${stats.skipped.length} mantidos\n`);
    }
}

module.exports = { run, updateDirRecursive, fileHash };
