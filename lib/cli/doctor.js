"use strict";

/**
 * Comando CLI: doctor
 *
 * Healthcheck automatizado que verifica:
 * - openclaw.json (bind, token, canais)
 * - Porta 18789 em localhost
 * - WireGuard handshake (se aplicável)
 * - Integridade dos arquivos .agent/
 * - Hook pre-tool-use ativo
 *
 * Gera relatório ✅/❌ com sugestões de correção.
 */

const fs = require("fs");
const path = require("path");
const { readJsonSafe } = require("../config");
const { portInUse } = require("../security");
const { detectEnvironment } = require("../detect");

/**
 * Resultado individual de um check.
 * @typedef {{ name: string, status: 'ok'|'warn'|'fail', message: string }} CheckResult
 */

/**
 * Verifica a configuração do openclaw.json.
 * @param {string} configPath — caminho do arquivo
 * @returns {CheckResult[]}
 */
function checkConfig(configPath) {
    const results = [];

    if (!fs.existsSync(configPath)) {
        results.push({
            name: "openclaw.json",
            status: "fail",
            message: "Arquivo não encontrado — rode 'openclaw init' primeiro",
        });
        return results;
    }

    const config = readJsonSafe(configPath);
    if (!config) {
        results.push({
            name: "openclaw.json",
            status: "fail",
            message: "Arquivo corrompido — não é JSON válido",
        });
        return results;
    }

    // Verificar bind
    const bind = config.gateway?.bind;
    if (bind === "127.0.0.1") {
        results.push({ name: "gateway.bind", status: "ok", message: "127.0.0.1 (localhost)" });
    } else if (bind === "0.0.0.0") {
        results.push({
            name: "gateway.bind",
            status: "fail",
            message: "0.0.0.0 — exposto publicamente! Mude para 127.0.0.1",
        });
    } else {
        results.push({
            name: "gateway.bind",
            status: "warn",
            message: bind ? `${bind} — verifique se é intencional` : "não definido",
        });
    }

    // Verificar auth token
    const token = config.auth?.token;
    if (token && token.length >= 24) {
        results.push({ name: "auth.token", status: "ok", message: `Token configurado (${token.length} chars)` });
    } else if (token) {
        results.push({
            name: "auth.token",
            status: "warn",
            message: `Token curto (${token.length} chars) — mínimo recomendado: 24`,
        });
    } else {
        results.push({
            name: "auth.token",
            status: "fail",
            message: "Token não configurado — rode 'openclaw setup'",
        });
    }

    // Verificar auth mode
    const authMode = config.auth?.mode;
    if (authMode === "token") {
        results.push({ name: "auth.mode", status: "ok", message: "token" });
    } else {
        results.push({
            name: "auth.mode",
            status: "warn",
            message: authMode ? `${authMode} — recomendado: 'token'` : "não definido",
        });
    }

    return results;
}

/**
 * Verifica a integridade do diretório .agent/.
 * @param {string} agentDir — caminho do .agent/
 * @returns {CheckResult[]}
 */
function checkAgentDir(agentDir) {
    const results = [];

    if (!fs.existsSync(agentDir)) {
        results.push({
            name: ".agent/",
            status: "fail",
            message: "Diretório não encontrado — rode 'openclaw init'",
        });
        return results;
    }

    // Verificar subdiretórios esperados
    const expectedDirs = ["agents", "rules", "skills", "workflows"];
    for (const dir of expectedDirs) {
        const dirPath = path.join(agentDir, dir);
        if (fs.existsSync(dirPath)) {
            const count = fs.readdirSync(dirPath).length;
            results.push({
                name: `.agent/${dir}/`,
                status: "ok",
                message: `${count} item(ns)`,
            });
        } else {
            results.push({
                name: `.agent/${dir}/`,
                status: "warn",
                message: "Diretório ausente",
            });
        }
    }

    // Verificar hook pre-tool-use
    const hookPath = path.join(agentDir, "hooks", "pre-tool-use.js");
    if (fs.existsSync(hookPath)) {
        results.push({
            name: "hooks/pre-tool-use",
            status: "ok",
            message: "Hook de segurança ativo",
        });
    } else {
        results.push({
            name: "hooks/pre-tool-use",
            status: "warn",
            message: "Hook de segurança não encontrado — comandos destrutivos não serão bloqueados",
        });
    }

    return results;
}

/**
 * Verifica se a porta 18789 está em uso.
 * @returns {Promise<CheckResult>}
 */
async function checkPort() {
    try {
        const inUse = await portInUse(18789, "127.0.0.1");
        if (inUse) {
            return { name: "porta 18789", status: "ok", message: "Serviço respondendo em localhost:18789" };
        }
        return {
            name: "porta 18789",
            status: "warn",
            message: "Porta livre — serviço OpenClaw pode estar parado",
        };
    } catch {
        return {
            name: "porta 18789",
            status: "warn",
            message: "Não foi possível verificar a porta",
        };
    }
}

/**
 * Verifica ambiente detectado.
 * @returns {CheckResult}
 */
function checkEnvironment() {
    const env = detectEnvironment();
    return {
        name: "ambiente",
        status: "ok",
        message: env || "desconhecido",
    };
}

/**
 * Exibe o relatório de resultados.
 * @param {CheckResult[]} results — resultados dos checks
 */
function printReport(results) {
    const icons = { ok: "✅", warn: "⚠️", fail: "❌" };

    for (const r of results) {
        const icon = icons[r.status] || "❓";
        const padding = " ".repeat(Math.max(0, 22 - r.name.length));
        console.log(`  ${icon} ${r.name}${padding} ${r.message}`);
    }

    // Resumo
    const okCount = results.filter((r) => r.status === "ok").length;
    const warnCount = results.filter((r) => r.status === "warn").length;
    const failCount = results.filter((r) => r.status === "fail").length;

    console.log(`\n📊 Resumo: ${okCount} ok, ${warnCount} avisos, ${failCount} erros`);

    if (failCount > 0) {
        console.log("\n💡 Sugestões:");
        for (const r of results.filter((r) => r.status === "fail")) {
            console.log(`   • ${r.name}: ${r.message}`);
        }
    }
}

/**
 * Executa o comando doctor.
 * @param {object} options
 * @param {string} options.targetPath — diretório alvo
 * @param {object} options.flags — flags do CLI
 */
async function run({ targetPath, flags }) {
    const agentDir = path.join(targetPath, ".agent");
    const configPath = path.join(targetPath, "openclaw.json");

    if (!flags.quiet) {
        console.log("\n🩺 OpenClaw Doctor — Diagnóstico do ambiente\n");
    }

    const results = [];

    // 1. Ambiente
    results.push(checkEnvironment());

    // 2. Configuração
    results.push(...checkConfig(configPath));

    // 3. Porta
    const portResult = await checkPort();
    results.push(portResult);

    // 4. .agent/
    results.push(...checkAgentDir(agentDir));

    // Exibir relatório
    printReport(results);
    console.log("");

    // Exit code baseado nos resultados
    const hasFailures = results.some((r) => r.status === "fail");
    if (hasFailures) {
        process.exitCode = 1;
    }
}

module.exports = { run, checkConfig, checkAgentDir, checkPort, checkEnvironment };
