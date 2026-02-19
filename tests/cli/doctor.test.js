"use strict";

/**
 * Testes do comando CLI: doctor
 *
 * Verifica checks de configuração, integridade de .agent/
 * e detecção de ambiente.
 */

const fs = require("fs");
const path = require("path");
const os = require("os");
const { checkConfig, checkAgentDir, checkEnvironment } = require("../../lib/cli/doctor");

// Diretório temporário para testes
let tmpDir;

beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "openclaw-test-doctor-"));
});

afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe("checkConfig", () => {
    it("retorna fail se openclaw.json não existe", () => {
        const results = checkConfig(path.join(tmpDir, "inexistente.json"));
        expect(results[0].status).toBe("fail");
        expect(results[0].message).toContain("não encontrado");
    });

    it("retorna fail se JSON é inválido", () => {
        const configPath = path.join(tmpDir, "bad.json");
        fs.writeFileSync(configPath, "não é json {{{");

        const results = checkConfig(configPath);
        expect(results[0].status).toBe("fail");
        expect(results[0].message).toContain("corrompido");
    });

    it("retorna ok para bind 127.0.0.1", () => {
        const configPath = path.join(tmpDir, "good.json");
        fs.writeFileSync(configPath, JSON.stringify({
            gateway: { bind: "127.0.0.1" },
            auth: { mode: "token", token: "a".repeat(48) },
        }));

        const results = checkConfig(configPath);
        const bindResult = results.find((r) => r.name === "gateway.bind");
        expect(bindResult.status).toBe("ok");
    });

    it("retorna fail para bind 0.0.0.0", () => {
        const configPath = path.join(tmpDir, "exposed.json");
        fs.writeFileSync(configPath, JSON.stringify({
            gateway: { bind: "0.0.0.0" },
            auth: { mode: "token", token: "a".repeat(48) },
        }));

        const results = checkConfig(configPath);
        const bindResult = results.find((r) => r.name === "gateway.bind");
        expect(bindResult.status).toBe("fail");
    });

    it("retorna warn para token curto", () => {
        const configPath = path.join(tmpDir, "short-token.json");
        fs.writeFileSync(configPath, JSON.stringify({
            gateway: { bind: "127.0.0.1" },
            auth: { mode: "token", token: "curto" },
        }));

        const results = checkConfig(configPath);
        const tokenResult = results.find((r) => r.name === "auth.token");
        expect(tokenResult.status).toBe("warn");
    });

    it("retorna fail se token não existe", () => {
        const configPath = path.join(tmpDir, "no-token.json");
        fs.writeFileSync(configPath, JSON.stringify({
            gateway: { bind: "127.0.0.1" },
            auth: { mode: "token" },
        }));

        const results = checkConfig(configPath);
        const tokenResult = results.find((r) => r.name === "auth.token");
        expect(tokenResult.status).toBe("fail");
    });
});

describe("checkAgentDir", () => {
    it("retorna fail se .agent/ não existe", () => {
        const results = checkAgentDir(path.join(tmpDir, "nao-existe"));
        expect(results[0].status).toBe("fail");
    });

    it("retorna ok para subdiretórios esperados", () => {
        const agentDir = path.join(tmpDir, ".agent");
        fs.mkdirSync(path.join(agentDir, "agents"), { recursive: true });
        fs.mkdirSync(path.join(agentDir, "rules"), { recursive: true });
        fs.mkdirSync(path.join(agentDir, "skills"), { recursive: true });
        fs.mkdirSync(path.join(agentDir, "workflows"), { recursive: true });

        const results = checkAgentDir(agentDir);
        const okResults = results.filter((r) => r.status === "ok");
        expect(okResults.length).toBeGreaterThanOrEqual(4);
    });

    it("verifica presença do hook pre-tool-use", () => {
        const agentDir = path.join(tmpDir, ".agent");
        fs.mkdirSync(path.join(agentDir, "hooks"), { recursive: true });
        fs.writeFileSync(path.join(agentDir, "hooks", "pre-tool-use.js"), "module.exports = {};");

        const results = checkAgentDir(agentDir);
        const hookResult = results.find((r) => r.name === "hooks/pre-tool-use");
        expect(hookResult.status).toBe("ok");
    });
});

describe("checkEnvironment", () => {
    it("retorna resultado com ambiente detectado", () => {
        const result = checkEnvironment();
        expect(result.name).toBe("ambiente");
        expect(result.status).toBe("ok");
        expect(typeof result.message).toBe("string");
    });
});
