"use strict";

const fs = require("fs");
const path = require("path");
const os = require("os");
const dns = require("dns").promises;
const https = require("https");
const { execSync } = require("child_process");

/**
 * Utilitário de log colorido
 */
const colors = {
    reset: "\x1b[0m",
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    bold: "\x1b[1m"
};

function log(msg, color = colors.reset) {
    console.log(`${color}${msg}${colors.reset}`);
}

function success(msg) { log(`✅ ${msg}`, colors.green); }
function warn(msg) { log(`⚠️  ${msg}`, colors.yellow); }
function fail(msg) { log(`❌ ${msg}`, colors.red); }
function info(msg) { log(`ℹ️  ${msg}`, colors.blue); }

/**
 * Verifica conectividade HTTP
 */
function checkHttp(url) {
    return new Promise((resolve) => {
        const req = https.get(url, { timeout: 5000 }, (res) => {
            if (res.statusCode >= 200 && res.statusCode < 400) {
                resolve({ ok: true, status: res.statusCode });
            } else {
                resolve({ ok: false, status: res.statusCode });
            }
        });
        req.on("error", (err) => resolve({ ok: false, error: err.message }));
        req.on("timeout", () => { req.destroy(); resolve({ ok: false, error: "timeout" }); });
    });
}

async function runDebug() {
    log("\n🔍 OpenClaw Installation Debugger\n", colors.bold);

    const report = {
        timestamp: new Date().toISOString(),
        system: {},
        network: {},
        installation: {}
    };

    // 1. Sistema
    info("Checando sistema...");
    try {
        report.system.platform = os.platform();
        report.system.release = os.release();
        report.system.arch = os.arch();
        report.system.node = process.version;

        try {
            report.system.npm = execSync("npm -v").toString().trim();
        } catch (e) { report.system.npm = "não encontrado"; }

        try {
            execSync("docker -v", { stdio: "ignore" });
            report.system.docker = "instalado";
        } catch (e) { report.system.docker = "não encontrado"; }

        success(`Node: ${report.system.node}, NPM: ${report.system.npm}, OS: ${report.system.platform}`);
    } catch (err) {
        fail(`Erro ao ler sistema: ${err.message}`);
    }

    // 2. Rede
    info("\nChecando rede...");

    // DNS
    try {
        await dns.lookup("google.com");
        success("DNS Resolution: OK");
        report.network.dns = "ok";
    } catch (err) {
        fail(`DNS Resolution falhou: ${err.message}`);
        report.network.dns = "falhou";
    }

    // NPM Registry
    const npmCheck = await checkHttp("https://registry.npmjs.org/");
    if (npmCheck.ok) {
        success("NPM Registry (https): OK");
        report.network.npm = "ok";
    } else {
        fail(`NPM Registry inacessível: ${npmCheck.error || npmCheck.status}`);
        report.network.npm = "falhou";
        warn("  -> Verifique se há proxy ou firewall bloqueando o NPM.");
    }

    // GitHub
    const githubCheck = await checkHttp("https://github.com/");
    if (githubCheck.ok) {
        success("GitHub (https): OK");
        report.network.github = "ok";
    } else {
        fail(`GitHub inacessível: ${githubCheck.error || githubCheck.status}`);
        report.network.github = "falhou";
    }

    // 3. Instalação Local
    info("\nChecando instalação local (.agent/)...");
    const agentDir = path.resolve(".agent");
    if (fs.existsSync(agentDir)) {
        success(".agent/ encontrado.");
        report.installation.found = true;

        // Verificar permissões de escrita
        try {
            const testFile = path.join(agentDir, ".perm_check");
            fs.writeFileSync(testFile, "ok");
            fs.unlinkSync(testFile);
            success("Permissão de escrita em .agent/: OK");
            report.installation.write_perm = "ok";
        } catch (err) {
            fail(`Sem permissão de escrita em .agent/: ${err.message}`);
            report.installation.write_perm = "falhou";
        }

    } else {
        warn(".agent/ NÃO encontrado no diretório atual.");
        report.installation.found = false;
        info("  -> Execute 'npx @fabioforest/openclaw init' para instalar.");
    }

    // 4. Configuração Global (npm)
    info("\nChecando configuração global do NPM...");
    try {
        const proxy = execSync("npm config get proxy").toString().trim();
        const httpsProxy = execSync("npm config get https-proxy").toString().trim();
        const registry = execSync("npm config get registry").toString().trim();

        if (proxy !== "null") warn(`Proxy HTTP configurado: ${proxy}`);
        if (httpsProxy !== "null") warn(`Proxy HTTPS configurado: ${httpsProxy}`);
        success(`Registry atual: ${registry}`);
    } catch (e) {
        warn("Não foi possível ler configurações do NPM.");
    }

    log("\n🏁 Debug concluído.", colors.bold);
    return report;
}

// Executar se chamado diretamente
if (require.main === module) {
    runDebug().catch(err => {
        console.error("Erro fatal no debugger:", err);
        process.exit(1);
    });
}

module.exports = { runDebug };
