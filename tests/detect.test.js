/**
 * Testes para o módulo lib/detect.js
 * 
 * Estratégia: como o módulo detect usa require("fs") e require("os") 
 * internamente, testamos o comportamento real no ambiente atual e 
 * validamos que a função retorna valores esperados para o cenário.
 * O teste de Docker/WSL é feito via teste de integração leve.
 */
const { isDocker, isWSL, detectEnvironment } = require("../lib/detect");
const os = require("os");

describe("detect", () => {
    describe("isDocker", () => {
        it("retorna boolean", () => {
            const result = isDocker();
            expect(typeof result).toBe("boolean");
        });

        // No ambiente de teste (macOS local), não estamos em Docker
        it("retorna false fora do Docker", () => {
            if (os.platform() === "darwin" || os.platform() === "win32") {
                expect(isDocker()).toBe(false);
            }
        });
    });

    describe("isWSL", () => {
        it("retorna boolean", () => {
            const result = isWSL();
            expect(typeof result).toBe("boolean");
        });

        // Em macOS/Windows nativo, WSL é false
        it("retorna false fora do WSL", () => {
            if (os.platform() === "darwin" || os.platform() === "win32") {
                expect(isWSL()).toBe(false);
            }
        });
    });

    describe("detectEnvironment", () => {
        it("retorna uma string válida", () => {
            const env = detectEnvironment();
            expect(typeof env).toBe("string");
            expect(["docker", "wsl2", "windows", "mac", "linux-vps-root", "linux", "unknown"]).toContain(env);
        });

        // No macOS, deve detectar "mac"
        it("detecta ambiente atual corretamente", () => {
            const env = detectEnvironment();
            const platform = os.platform();

            if (platform === "darwin") {
                expect(env).toBe("mac");
            } else if (platform === "win32") {
                expect(env).toBe("windows");
            } else if (platform === "linux") {
                expect(["docker", "wsl2", "linux", "linux-vps-root"]).toContain(env);
            }
        });
    });
});
