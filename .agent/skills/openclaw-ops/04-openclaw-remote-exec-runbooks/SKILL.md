---
name: openclaw-remote-exec-runbooks
description: Estrutura execução remota via VPN usando runbooks idempotentes, com timeout, cancel e trilha auditável.
version: 1.0
---
# Objetivo
Evitar 'shell solto'. Preferir runbooks nomeados.

# Regras
- validar entradas
- capturar stdout/stderr
- timeout/cancel
- assinar request (request_id)
