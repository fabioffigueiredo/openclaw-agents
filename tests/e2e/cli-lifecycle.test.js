"use strict";

const fs = require("fs");
const path = require("path");
const os = require("os");
const childProcess = require("child_process");

const CLI_PATH = path.resolve(__dirname, "../../bin/openclaw.js");

function runCli(args, cwd) {
    return childProcess.spawnSync("node", [CLI_PATH, ...args], {
        cwd,
        encoding: "utf8",
        env: { ...process.env, FORCE_COLOR: "0" }, // desabilita cores para facilitar assert
    });
}

describe("CLI End-to-End Lifecycle", () => {
    let tmpDir;

    beforeEach(() => {
        tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "openclaw-e2e-"));
    });

    afterEach(() => {
        fs.rmSync(tmpDir, { recursive: true, force: true });
    });

    it("fluxo completo: init -> status -> doctor -> update", () => {
        // 1. INIT (--apply --yes necessários: plan-first por padrão + prompt interativo)
        const initRes = runCli(["init", "--apply", "--yes", "--path", "."], tmpDir);
        expect(initRes.status).toBe(0);
        expect(initRes.stdout).toContain("concluída com sucesso");
        expect(fs.existsSync(path.join(tmpDir, ".agent/agents/sysadmin-proativo.md"))).toBe(true);
        expect(fs.existsSync(path.join(tmpDir, "openclaw.json"))).toBe(true);

        // 2. STATUS
        const statusRes = runCli(["status", "--path", "."], tmpDir);
        expect(statusRes.status).toBe(0);
        expect(statusRes.stdout).toContain("OpenClaw Status");
        // O output real pode variar ligeiramente em formatação, mas deve conter o nome do agent
        expect(statusRes.stdout).toContain("sysadmin-proativo");

        // 3. DOCTOR (deve falhar pois token não configurado)
        const doctorRes = runCli(["doctor", "--path", "."], tmpDir);
        expect(doctorRes.status).toBe(1); // esperado erro
        expect(doctorRes.stdout).toContain("auth.token");

        // 4. CUSTOMIZAÇÃO DO USUÁRIO
        const agentFile = path.join(tmpDir, ".agent/agents/sysadmin-proativo.md");
        const customContent = "CUSTOMIZADO PELO USUÁRIO";
        fs.writeFileSync(agentFile, customContent);

        // 5. UPDATE (--apply --yes: plan-first + prompt interativo)
        const updateRes = runCli(["update", "--apply", "--yes", "--path", "."], tmpDir);
        expect(updateRes.status).toBe(0);
        expect(updateRes.stdout).toContain("concluída com sucesso");

        // Verifica se customização foi movida para backup
        expect(fs.existsSync(agentFile + ".bak")).toBe(true);
        expect(fs.readFileSync(agentFile + ".bak", "utf8")).toBe(customContent);

        // Verifica se arquivo principal foi atualizado pelo template
        const templateContent = fs.readFileSync(path.join(__dirname, "../../templates/.agent/agents/sysadmin-proativo.md"), "utf8");
        expect(fs.readFileSync(agentFile, "utf8")).toBe(templateContent);

        // 6. INIT --FORCE (--apply --yes necessários)
        const forceRes = runCli(["init", "--force", "--apply", "--yes", "--path", "."], tmpDir);
        expect(forceRes.status).toBe(0);
        // Verifica se customização foi perdida (sobrescrita pelo template original)
        expect(fs.readFileSync(agentFile, "utf8")).toBe(templateContent);
    });
});
