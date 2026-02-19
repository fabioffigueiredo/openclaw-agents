/**
 * Testes para o módulo lib/config.js
 * Valida leitura/escrita JSON atômica, criação idempotente de arquivos,
 * e inicialização de defaults.
 */
const fs = require("fs");
const path = require("path");
const os = require("os");

const { readJsonSafe, writeJsonSafe, ensureFile, initConfigDefaults } = require("../lib/config");

describe("config", () => {
    let tmpDir;

    beforeEach(() => {
        tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "openclaw-test-"));
    });

    afterEach(() => {
        fs.rmSync(tmpDir, { recursive: true, force: true });
    });

    describe("readJsonSafe", () => {
        it("parseia JSON válido", () => {
            const filePath = path.join(tmpDir, "valid.json");
            fs.writeFileSync(filePath, '{"key": "value"}');
            expect(readJsonSafe(filePath)).toEqual({ key: "value" });
        });

        it("retorna null para JSON inválido", () => {
            const filePath = path.join(tmpDir, "invalid.json");
            fs.writeFileSync(filePath, "não é json {{{");
            expect(readJsonSafe(filePath)).toBeNull();
        });

        it("retorna null para arquivo inexistente", () => {
            expect(readJsonSafe(path.join(tmpDir, "naoexiste.json"))).toBeNull();
        });
    });

    describe("writeJsonSafe", () => {
        it("escreve JSON formatado e legível", () => {
            const filePath = path.join(tmpDir, "output.json");
            writeJsonSafe(filePath, { gateway: { bind: "127.0.0.1" } });

            const content = fs.readFileSync(filePath, "utf8");
            const parsed = JSON.parse(content);
            expect(parsed.gateway.bind).toBe("127.0.0.1");
        });

        it("não deixa arquivo .tmp residual (escrita atômica)", () => {
            const filePath = path.join(tmpDir, "atomic.json");
            writeJsonSafe(filePath, { test: true });

            const files = fs.readdirSync(tmpDir);
            expect(files).not.toContain("atomic.json.tmp");
            expect(files).toContain("atomic.json");
        });

        it("sobrescreve arquivo existente", () => {
            const filePath = path.join(tmpDir, "overwrite.json");
            writeJsonSafe(filePath, { v: 1 });
            writeJsonSafe(filePath, { v: 2 });

            const parsed = readJsonSafe(filePath);
            expect(parsed.v).toBe(2);
        });
    });

    describe("ensureFile", () => {
        it("cria arquivo com conteúdo padrão se não existe", () => {
            const filePath = path.join(tmpDir, "NEW.md");
            const result = ensureFile(filePath, "# Template\n");

            expect(result).toBe(true);
            expect(fs.readFileSync(filePath, "utf8")).toBe("# Template\n");
        });

        it("não sobrescreve arquivo existente (idempotente)", () => {
            const filePath = path.join(tmpDir, "EXISTING.md");
            fs.writeFileSync(filePath, "conteúdo original");

            const result = ensureFile(filePath, "conteúdo novo");
            expect(result).toBe(false);
            expect(fs.readFileSync(filePath, "utf8")).toBe("conteúdo original");
        });
    });

    describe("initConfigDefaults", () => {
        it("inicializa todas as seções em config vazio", () => {
            const config = initConfigDefaults({});
            expect(config.gateway).toEqual({});
            expect(config.auth).toEqual({});
            expect(config.channels).toEqual({});
            expect(config.filesystem.allowlist).toEqual([]);
            expect(config.sandbox).toEqual({});
        });

        it("preserva valores existentes", () => {
            const config = initConfigDefaults({
                gateway: { bind: "127.0.0.1" },
                auth: { mode: "token", token: "abc" },
            });
            expect(config.gateway.bind).toBe("127.0.0.1");
            expect(config.auth.mode).toBe("token");
            expect(config.auth.token).toBe("abc");
        });
    });
});
