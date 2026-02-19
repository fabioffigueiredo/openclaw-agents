"use strict";

/**
 * Script operacional: Healthchecks
 *
 * Heartbeat via VPN, alertas e autocura com limites.
 * Circuit breaker para bloquear exec quando instável.
 *
 * Referência: skills/openclaw-ops/08-openclaw-healthchecks/SKILL.md
 */

const { portInUse } = require("../security");

/**
 * Estado do circuit breaker.
 * @typedef {'closed'|'open'|'half-open'} CircuitState
 */

/**
 * Cria uma instância de circuit breaker.
 * @param {object} [options]
 * @param {number} [options.failureThreshold=2] — falhas consecutivas para abrir
 * @param {number} [options.resetTimeoutMs=60000] — tempo para tentar half-open (ms)
 * @returns {object} circuit breaker com métodos record, canExecute, getState, reset
 */
function createCircuitBreaker({ failureThreshold = 2, resetTimeoutMs = 60000 } = {}) {
    let state = "closed";
    let failures = 0;
    let lastFailureTime = null;

    return {
        /**
         * Registra resultado de uma operação.
         * @param {boolean} success — se a operação teve sucesso
         * @returns {CircuitState} estado atual após o registro
         */
        record(success) {
            if (success) {
                failures = 0;
                state = "closed";
                return state;
            }

            failures++;
            lastFailureTime = Date.now();

            if (failures >= failureThreshold) {
                state = "open";
            }

            return state;
        },

        /**
         * Verifica se é seguro executar uma operação.
         * @returns {{ allowed: boolean, state: CircuitState, reason?: string }}
         */
        canExecute() {
            if (state === "closed") {
                return { allowed: true, state };
            }

            if (state === "open") {
                // Verificar se já passou o timeout para half-open
                const elapsed = Date.now() - (lastFailureTime || 0);
                if (elapsed >= resetTimeoutMs) {
                    state = "half-open";
                    return { allowed: true, state, reason: "Testando recuperação (half-open)" };
                }
                return {
                    allowed: false,
                    state,
                    reason: `Circuit breaker aberto — ${failures} falhas consecutivas. Aguardando ${Math.ceil((resetTimeoutMs - elapsed) / 1000)}s`,
                };
            }

            // half-open: permite uma tentativa
            return { allowed: true, state, reason: "Half-open: tentativa de recuperação" };
        },

        /** Retorna o estado atual. */
        getState() {
            return { state, failures, lastFailureTime };
        },

        /** Reseta o circuit breaker. */
        reset() {
            state = "closed";
            failures = 0;
            lastFailureTime = null;
        },
    };
}

/**
 * Executa um heartbeat verificando a saúde básica do sistema.
 * @param {object} [options]
 * @param {number} [options.port=18789] — porta a verificar
 * @param {string} [options.host=127.0.0.1] — host a verificar
 * @returns {Promise<{ healthy: boolean, checks: object[] }>}
 */
async function heartbeat({ port = 18789, host = "127.0.0.1" } = {}) {
    const checks = [];

    // Check 1: Porta do serviço
    try {
        const inUse = await portInUse(port, host);
        checks.push({
            name: `port:${port}`,
            status: inUse ? "ok" : "fail",
            message: inUse ? `Serviço respondendo em ${host}:${port}` : `Porta ${port} livre — serviço pode estar parado`,
        });
    } catch (err) {
        checks.push({
            name: `port:${port}`,
            status: "fail",
            message: `Erro ao verificar porta: ${err.message}`,
        });
    }

    const healthy = checks.every((c) => c.status === "ok");
    return { healthy, checks, timestamp: new Date().toISOString() };
}

/**
 * Tenta auto-restart com limites de tentativas.
 * @param {object} params
 * @param {function} params.restartFn — função que executa o restart
 * @param {function} params.healthFn — função que verifica saúde
 * @param {number} [params.maxRetries=3] — máximo de tentativas
 * @param {number} [params.delayMs=5000] — delay entre tentativas (ms)
 * @returns {Promise<{ success: boolean, attempts: number, error?: string }>}
 */
async function autoRestart({ restartFn, healthFn, maxRetries = 3, delayMs = 5000 }) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            await restartFn();

            // Aguardar antes de verificar
            await new Promise((resolve) => setTimeout(resolve, delayMs));

            const healthy = await healthFn();
            if (healthy) {
                return { success: true, attempts: attempt };
            }
        } catch (err) {
            if (attempt === maxRetries) {
                return {
                    success: false,
                    attempts: attempt,
                    error: `Falha após ${maxRetries} tentativas: ${err.message}`,
                };
            }
        }

        // Delay incremental entre tentativas
        await new Promise((resolve) => setTimeout(resolve, delayMs * attempt));
    }

    return { success: false, attempts: maxRetries, error: "Excedido limite de tentativas" };
}

module.exports = {
    createCircuitBreaker,
    heartbeat,
    autoRestart,
};
