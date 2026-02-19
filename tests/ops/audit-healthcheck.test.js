"use strict";

/**
 * Testes dos scripts operacionais: audit e healthcheck
 *
 * Verifica redaction de segredos, escrita/leitura de logs,
 * circuit breaker e heartbeat.
 */

const fs = require("fs");
const path = require("path");
const os = require("os");
const {
    redactSensitive,
    createAuditEntry,
    writeAuditLog,
    readAuditLogs,
    rotateLogs,
} = require("../../lib/ops/audit");
const { createCircuitBreaker } = require("../../lib/ops/healthcheck");

let tmpDir;

beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "openclaw-test-ops-"));
});

afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
});

// === Audit Tests ===
describe("redactSensitive", () => {
    it("mascara campos sensíveis", () => {
        const obj = {
            user: "admin",
            token: "super-secret-token-12345",
            password: "minha-senha",
        };

        const result = redactSensitive(obj);
        expect(result.user).toBe("admin");
        expect(result.token).not.toBe("super-secret-token-12345");
        expect(result.token).toContain("…");
        expect(result.password).toContain("…");
    });

    it("mascara campos aninhados", () => {
        const obj = {
            config: {
                apiKey: "key-12345",
                name: "test",
            },
        };

        const result = redactSensitive(obj);
        expect(result.config.name).toBe("test");
        expect(result.config.apiKey).toContain("…");
    });

    it("retorna objetos não-sensíveis inalterados", () => {
        const obj = { name: "test", count: 42 };
        const result = redactSensitive(obj);
        expect(result).toEqual(obj);
    });

    it("lida com null/undefined graciosamente", () => {
        expect(redactSensitive(null)).toBe(null);
        expect(redactSensitive(undefined)).toBe(undefined);
    });
});

describe("createAuditEntry", () => {
    it("cria entrada com campos obrigatórios", () => {
        const entry = createAuditEntry({
            event: "exec.started",
            requestId: "req-123",
        });

        expect(entry.event).toBe("exec.started");
        expect(entry.requestId).toBe("req-123");
        expect(entry.timestamp).toBeDefined();
        expect(entry.operator).toBe("system");
    });

    it("mascara detalhes sensíveis", () => {
        const entry = createAuditEntry({
            event: "auth.login",
            requestId: "req-456",
            details: { token: "secret-value" },
        });

        expect(entry.details.token).toContain("…");
    });
});

describe("writeAuditLog + readAuditLogs", () => {
    it("escreve e lê entradas JSONL", () => {
        const logDir = path.join(tmpDir, "logs");
        const entry = createAuditEntry({
            event: "test.write",
            requestId: "req-789",
        });

        writeAuditLog(logDir, entry);
        writeAuditLog(logDir, createAuditEntry({
            event: "test.write2",
            requestId: "req-790",
        }));

        const logs = readAuditLogs(logDir);
        expect(logs.length).toBe(2);
        expect(logs[0].event).toBe("test.write");
    });

    it("filtra por evento", () => {
        const logDir = path.join(tmpDir, "logs-filter");
        writeAuditLog(logDir, createAuditEntry({ event: "a", requestId: "r1" }));
        writeAuditLog(logDir, createAuditEntry({ event: "b", requestId: "r2" }));
        writeAuditLog(logDir, createAuditEntry({ event: "a", requestId: "r3" }));

        const logs = readAuditLogs(logDir, { event: "a" });
        expect(logs.length).toBe(2);
    });

    it("retorna vazio para diretório inexistente", () => {
        const logs = readAuditLogs("/nao-existe");
        expect(logs).toEqual([]);
    });
});

describe("rotateLogs", () => {
    it("remove logs mais antigos que o período de retenção", () => {
        const logDir = path.join(tmpDir, "logs-rotate");
        fs.mkdirSync(logDir, { recursive: true });

        // Cria arquivo antigo
        const oldFile = path.join(logDir, "audit-2020-01-01.jsonl");
        fs.writeFileSync(oldFile, '{"event":"old"}\n');
        // Seta mtime para 60 dias atrás
        const oldTime = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
        fs.utimesSync(oldFile, oldTime, oldTime);

        // Cria arquivo recente
        const recentFile = path.join(logDir, "audit-2030-01-01.jsonl");
        fs.writeFileSync(recentFile, '{"event":"recent"}\n');

        const removed = rotateLogs(logDir, 30);
        expect(removed).toBe(1);
        expect(fs.existsSync(oldFile)).toBe(false);
        expect(fs.existsSync(recentFile)).toBe(true);
    });
});

// === Circuit Breaker Tests ===
describe("createCircuitBreaker", () => {
    it("inicia no estado closed", () => {
        const cb = createCircuitBreaker();
        expect(cb.getState().state).toBe("closed");
        expect(cb.canExecute().allowed).toBe(true);
    });

    it("abre após threshold de falhas", () => {
        const cb = createCircuitBreaker({ failureThreshold: 2 });
        cb.record(false);
        expect(cb.getState().state).toBe("closed");
        cb.record(false);
        expect(cb.getState().state).toBe("open");
        expect(cb.canExecute().allowed).toBe(false);
    });

    it("reseta após sucesso", () => {
        const cb = createCircuitBreaker({ failureThreshold: 2 });
        cb.record(false);
        cb.record(true);
        expect(cb.getState().state).toBe("closed");
        expect(cb.getState().failures).toBe(0);
    });

    it("permite reset manual", () => {
        const cb = createCircuitBreaker({ failureThreshold: 1 });
        cb.record(false);
        expect(cb.getState().state).toBe("open");
        cb.reset();
        expect(cb.getState().state).toBe("closed");
    });

    it("transita para half-open após timeout", () => {
        const cb = createCircuitBreaker({ failureThreshold: 1, resetTimeoutMs: 10 });
        cb.record(false);
        expect(cb.getState().state).toBe("open");

        // Espera timeout
        const start = Date.now();
        while (Date.now() - start < 15) { /* busy wait */ }

        const result = cb.canExecute();
        expect(result.state).toBe("half-open");
        expect(result.allowed).toBe(true);
    });
});
