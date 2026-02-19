"use strict";

const fs = require("fs");
const path = require("path");
const os = require("os");

/**
 * Detecta o ambiente de execução e metadados de contexto.
 * Retorna um objeto seguro para logs e auditoria.
 */
function detectContext(cwd = process.cwd()) {
    const ctx = {
        timestamp: new Date().toISOString(),
        platform: os.platform(),
        cwd: cwd,
        env: "local",
        ide: "unknown",
        isDocker: false,
        hasExistingInstall: false,
    };

    // 1. Detectar Docker
    if (fs.existsSync("/.dockerenv") || fs.existsSync("/run/.containerenv")) {
        ctx.isDocker = true;
        ctx.env = "docker";
    }

    // 2. Detectar IDEs comuns
    const ideMarkers = [
        { name: "vscode", path: ".vscode" },
        { name: "cursor", path: ".cursor" },
        { name: "idea", path: ".idea" },
        { name: "antigravity", path: ".agent/antigravity" } // Marcador fictício ou real se existir
    ];

    for (const m of ideMarkers) {
        if (fs.existsSync(path.join(cwd, m.path))) {
            ctx.ide = m.name;
            break;
        }
    }

    // 3. Detectar instalação existente
    const agentDir = path.join(cwd, ".agent");
    const configPath = path.join(cwd, "openclaw.json");

    if (fs.existsSync(agentDir) || fs.existsSync(configPath)) {
        ctx.hasExistingInstall = true;
    }

    return ctx;
}

/**
 * Gera um cabeçalho de auditoria formatado em Markdown.
 */
function getAuditHeader(ctx, command, flags) {
    return [
        `# OpenClaw Audit Log`,
        `- **Time**: ${ctx.timestamp}`,
        `- **Command**: ${command}`,
        `- **Mode**: ${flags.plan ? "PLAN (Simulation)" : "APPLY (Execution)"}`,
        `- **Environment**: ${ctx.env} (Docker: ${ctx.isDocker})`,
        `- **IDE**: ${ctx.ide}`,
        `- **Existing Install**: ${ctx.hasExistingInstall}`,
        `- **Flags**: ${JSON.stringify(flags)}`,
        `---`,
        ``
    ].join("\n");
}

module.exports = {
    detectContext,
    getAuditHeader
};
