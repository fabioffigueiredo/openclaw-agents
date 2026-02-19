/**
 * Módulo de detecção de ambiente para o OpenClaw Setup Wizard.
 * Identifica o tipo de sistema operacional e contexto de execução
 * (Docker, WSL2, VPS, local) para adaptar o comportamento do wizard.
 * 
 * @module lib/detect
 */
const fs = require("fs");
const os = require("os");

/**
 * Detecta se o processo está rodando dentro de um container Docker.
 * Verifica dois indicadores: /.dockerenv e menção a "docker" no cgroup.
 * @returns {boolean} true se está em Docker
 */
function isDocker() {
    return fs.existsSync("/.dockerenv") ||
        (fs.existsSync("/proc/1/cgroup") && fs.readFileSync("/proc/1/cgroup", "utf8").includes("docker"));
}

/**
 * Detecta se o processo está rodando dentro do WSL2.
 * Usa o release do kernel ("microsoft") e a env WSL_DISTRO_NAME.
 * @returns {boolean} true se está em WSL2
 */
function isWSL() {
    return os.platform() === "linux" &&
        (os.release().toLowerCase().includes("microsoft") || !!process.env.WSL_DISTRO_NAME);
}

/**
 * Detecta o ambiente de execução para adaptar o wizard.
 * Ordem de prioridade: Docker > WSL2 > Windows > Mac > Linux VPS (root) > Linux > desconhecido.
 * @returns {"docker"|"wsl2"|"windows"|"mac"|"linux-vps-root"|"linux"|"unknown"} Tipo de ambiente
 */
function detectEnvironment() {
    if (isDocker()) return "docker";
    if (isWSL()) return "wsl2";
    if (os.platform() === "win32") return "windows";
    if (os.platform() === "darwin") return "mac";
    if (os.platform() === "linux") {
        const user = os.userInfo().username;
        if (user === "root") return "linux-vps-root";
        return "linux";
    }
    return "unknown";
}

module.exports = { isDocker, isWSL, detectEnvironment };
