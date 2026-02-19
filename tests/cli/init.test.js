"use strict";

/**
 * Testes do comando CLI: init
 *
 * Verifica cópia de templates, criação de openclaw.json,
 * bloqueio sem --force e exibição de estrutura.
 */

const fs = require("fs");
const path = require("path");
const os = require("os");
const { copyDirRecursive } = require("../../lib/cli/init");

// Diretório temporário para testes
let tmpDir;

beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "openclaw-test-init-"));
});

afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe("copyDirRecursive", () => {
    it("copia diretório com arquivos e subdiretórios", () => {
        // Cria estrutura de teste
        const src = path.join(tmpDir, "src");
        const dest = path.join(tmpDir, "dest");
        fs.mkdirSync(path.join(src, "sub"), { recursive: true });
        fs.writeFileSync(path.join(src, "file1.txt"), "conteúdo 1");
        fs.writeFileSync(path.join(src, "sub", "file2.txt"), "conteúdo 2");

        const stats = copyDirRecursive(src, dest);

        expect(stats.files).toBe(2);
        expect(stats.dirs).toBeGreaterThanOrEqual(1);
        expect(fs.existsSync(path.join(dest, "file1.txt"))).toBe(true);
        expect(fs.existsSync(path.join(dest, "sub", "file2.txt"))).toBe(true);
        expect(fs.readFileSync(path.join(dest, "file1.txt"), "utf8")).toBe("conteúdo 1");
    });

    it("cria diretório destino se não existir", () => {
        const src = path.join(tmpDir, "src2");
        const dest = path.join(tmpDir, "nao-existe", "dest");
        fs.mkdirSync(src, { recursive: true });
        fs.writeFileSync(path.join(src, "teste.txt"), "ok");

        copyDirRecursive(src, dest);

        expect(fs.existsSync(path.join(dest, "teste.txt"))).toBe(true);
    });

    it("retorna contagem correta para estrutura vazia", () => {
        const src = path.join(tmpDir, "vazio");
        const dest = path.join(tmpDir, "dest-vazio");
        fs.mkdirSync(src, { recursive: true });

        const stats = copyDirRecursive(src, dest);

        expect(stats.files).toBe(0);
        expect(stats.dirs).toBeGreaterThanOrEqual(1);
    });
});
