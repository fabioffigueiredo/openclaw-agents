"use strict";

/**
 * Utilitário compartilhado para gravação de audit logs CLI.
 *
 * Centraliza a lógica de escrita de audit logs markdown que antes
 * estava duplicada em init.js, update.js e ide.js.
 *
 * @module lib/utils/audit-writer
 */

const fs = require("fs");
const path = require("path");

/**
 * Grava um log de auditoria em formato markdown no diretório .agent/audit/.
 *
 * @param {string} targetPath — diretório raiz do projeto
 * @param {string[]} lines — linhas do relatório de auditoria
 * @param {object} flags — flags do CLI (verifica flags.audit)
 * @param {string} prefix — prefixo do arquivo (ex: "init", "update", "ide")
 */
function writeCliAudit(targetPath, lines, flags, prefix = "cli") {
    // Se auditoria desabilitada via flag --no-audit, não grava
    if (flags.audit === false) return;

    const auditDir = path.join(targetPath, ".agent", "audit");
    if (!fs.existsSync(auditDir)) {
        try {
            fs.mkdirSync(auditDir, { recursive: true });
        } catch (e) {
            // Silencia erro se não conseguir criar diretório
        }
    }

    const filename = `${prefix}-${new Date().toISOString().replace(/[:.]/g, "-")}.md`;
    const auditPath = path.join(auditDir, filename);

    try {
        fs.writeFileSync(auditPath, lines.join("\n") + "\n", "utf8");
    } catch (e) {
        console.error("⚠️  Falha ao gravar auditoria:", e.message);
    }
}

module.exports = { writeCliAudit };
