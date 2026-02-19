/**
 * Testes para o módulo lib/channels.js
 * Valida validação de tokens e configuração de canais.
 */
const { validateToken, supportedChannels, configureChannel } = require("../lib/channels");

describe("channels", () => {
    describe("supportedChannels", () => {
        it("retorna todos os canais suportados", () => {
            const channels = supportedChannels();
            expect(channels).toContain("telegram");
            expect(channels).toContain("discord");
            expect(channels).toContain("whatsapp");
        });
    });

    describe("validateToken — Telegram", () => {
        it("aceita token válido do Telegram", () => {
            const result = validateToken("telegram", "123456789:ABCDefghIJKLMnopqrstuvwxyz");
            expect(result.valid).toBe(true);
        });

        it("rejeita token sem número antes do ':'", () => {
            const result = validateToken("telegram", "abc:ABCDefghIJKLMnopqrstuvwxyz");
            expect(result.valid).toBe(false);
        });

        it("rejeita token sem ':'", () => {
            const result = validateToken("telegram", "123456789ABCDefghIJKL");
            expect(result.valid).toBe(false);
        });

        it("rejeita token com parte curta após ':'", () => {
            const result = validateToken("telegram", "123456789:abc");
            expect(result.valid).toBe(false);
        });
    });

    describe("validateToken — Discord", () => {
        it("aceita token válido do Discord (50+ chars)", () => {
            const token = "A".repeat(60) + ".B".repeat(5);
            const result = validateToken("discord", token);
            expect(result.valid).toBe(true);
        });

        it("rejeita token curto do Discord (<50 chars)", () => {
            const result = validateToken("discord", "abc123");
            expect(result.valid).toBe(false);
        });
    });

    describe("validateToken — WhatsApp", () => {
        it("aceita token válido do WhatsApp (20+ chars)", () => {
            const token = "EAABsbCS1iogBO" + "x".repeat(20);
            const result = validateToken("whatsapp", token);
            expect(result.valid).toBe(true);
        });

        it("rejeita token curto do WhatsApp (<20 chars)", () => {
            const result = validateToken("whatsapp", "short");
            expect(result.valid).toBe(false);
        });
    });

    describe("validateToken — canal desconhecido", () => {
        it("retorna invalid para canal inexistente", () => {
            const result = validateToken("slack", "abc123");
            expect(result.valid).toBe(false);
            expect(result.hint).toContain("desconhecido");
        });
    });

    describe("configureChannel", () => {
        it("configura canal com token válido", async () => {
            const config = { channels: {} };
            const askFn = vi.fn()
                .mockResolvedValueOnce("123456789:ABCDefghIJKLMnopqrstuvwxyz");

            const result = await configureChannel(config, "telegram", askFn);
            expect(result).toBe(true);
            expect(config.channels.telegram.token).toBe("123456789:ABCDefghIJKLMnopqrstuvwxyz");
        });

        it("rejeita quando token inválido e user diz não", async () => {
            const config = { channels: {} };
            const askFn = vi.fn()
                .mockResolvedValueOnce("bad-token")
                .mockResolvedValueOnce("n");

            const result = await configureChannel(config, "telegram", askFn);
            expect(result).toBe(false);
            expect(config.channels.telegram).toBeUndefined();
        });

        it("permite salvar token inválido com confirmação forçada", async () => {
            const config = { channels: {} };
            const askFn = vi.fn()
                .mockResolvedValueOnce("bad-token")
                .mockResolvedValueOnce("y");

            const result = await configureChannel(config, "telegram", askFn);
            expect(result).toBe(true);
            expect(config.channels.telegram.token).toBe("bad-token");
        });

        it("retorna false quando token vazio", async () => {
            const config = { channels: {} };
            const askFn = vi.fn().mockResolvedValueOnce("");

            const result = await configureChannel(config, "discord", askFn);
            expect(result).toBe(false);
        });

        it("retorna false para canal desconhecido", async () => {
            const config = { channels: {} };
            const askFn = vi.fn();

            const result = await configureChannel(config, "slack", askFn);
            expect(result).toBe(false);
        });
    });
});
