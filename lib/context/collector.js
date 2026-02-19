"use strict";

/**
 * Context Collector — Read-only snapshot do ambiente.
 * Nunca altera arquivos. Apenas lê e retorna dados.
 *
 * Baseado no módulo do openclaw-agents-addons,
 * adaptado para o projeto principal.
 */

const fs = require("fs");
const os = require("os");
const path = require("path");

function exists(p) {
    try { return fs.existsSync(p); } catch { return false; }
}

/**
 * Detecta IDE ativa no workspace.
 */
function detectIDE(targetPath) {
    if (exists(path.join(targetPath, ".cursor"))) return "cursor";
    if (exists(path.join(targetPath, ".vscode"))) return "vscode";
    if (exists(path.join(targetPath, ".idea"))) return "jetbrains";
    return "unknown";
}

/**
 * Detecta ambiente de execução (SO, Docker, WSL).
 */
function detectEnvironment() {
    const platform = os.platform();
    const docker = exists("/.dockerenv") ||
        (exists("/proc/1/cgroup") && fs.readFileSync("/proc/1/cgroup", "utf8").includes("docker"));
    const wsl = platform === "linux" &&
        (os.release().toLowerCase().includes("microsoft") || !!process.env.WSL_DISTRO_NAME);
    return { platform, docker, wsl };
}

/**
 * Detecta instalação existente do OpenClaw.
 */
function detectOpenClaw(targetPath) {
    const agentDir = path.join(targetPath, ".agent");
    const config = path.join(targetPath, "openclaw.json");
    const dockerCompose = path.join(targetPath, "docker-compose.yml");
    return {
        hasAgentDir: exists(agentDir),
        hasConfig: exists(config),
        hasDockerCompose: exists(dockerCompose),
    };
}

/**
 * Lista skills disponíveis nos templates.
 */
function listSkillsFromTemplates(templatesDir) {
    const skillsDir = path.join(templatesDir, ".agent", "skills");
    if (!exists(skillsDir)) return [];
    const out = [];
    for (const name of fs.readdirSync(skillsDir)) {
        const skillPath = path.join(skillsDir, name, "SKILL.md");
        if (exists(skillPath)) out.push({ name, skillPath });
    }
    return out;
}

/**
 * Lista skills instaladas no workspace do usuário.
 */
function listInstalledSkills(targetPath) {
    const skillsDir = path.join(targetPath, ".agent", "skills");
    if (!exists(skillsDir)) return [];
    const out = [];
    for (const name of fs.readdirSync(skillsDir)) {
        const skillPath = path.join(skillsDir, name, "SKILL.md");
        if (exists(skillPath)) out.push({ name, skillPath });
    }
    return out;
}

/**
 * Coleta contexto completo (read-only).
 * @param {object} options
 * @param {string} options.targetPath — diretório do workspace
 * @param {string} options.templatesDir — diretório de templates do pacote
 * @returns {object} snapshot do contexto
 */
function collectContext({ targetPath, templatesDir }) {
    const env = detectEnvironment();
    return {
        targetPath,
        env,
        ide: detectIDE(targetPath),
        openclaw: detectOpenClaw(targetPath),
        git: { isRepo: exists(path.join(targetPath, ".git")) },
        skillsInTemplates: listSkillsFromTemplates(templatesDir),
        skillsInstalled: listInstalledSkills(targetPath),
        ts: new Date().toISOString(),
    };
}

module.exports = collectContext;
