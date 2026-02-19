/**
 * Testes para o módulo lib/security.js
 * Valida masking de segredos, geração de tokens e verificação de porta.
 */
const { mask, generateToken, portInUse } = require("../lib/security");

describe("security", () => {
    describe("mask", () => {
        it("retorna string vazia para input vazio", () => {
            expect(mask("")).toBe("");
            expect(mask(null)).toBe("");
            expect(mask(undefined)).toBe("");
        });

        it("retorna '***' para strings curtas (≤6 chars)", () => {
            expect(mask("abc")).toBe("***");
            expect(mask("abcdef")).toBe("***");
        });

        it("mascara strings longas mostrando 3 primeiro + 3 últimos", () => {
            expect(mask("abcdefghij")).toBe("abc…hij");
            expect(mask("1234567890abcdef")).toBe("123…def");
        });
    });

    describe("generateToken", () => {
        it("gera token hexadecimal de 48 caracteres", () => {
            const token = generateToken();
            expect(token).toHaveLength(48);
            expect(/^[0-9a-f]{48}$/.test(token)).toBe(true);
        });

        it("gera tokens únicos a cada chamada", () => {
            const t1 = generateToken();
            const t2 = generateToken();
            expect(t1).not.toBe(t2);
        });
    });

    describe("portInUse", () => {
        it("retorna false para porta não utilizada", async () => {
            const result = await portInUse("127.0.0.1", 59999);
            expect(result).toBe(false);
        });
    });
});
