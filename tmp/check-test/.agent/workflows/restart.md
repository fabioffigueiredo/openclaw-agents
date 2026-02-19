---
description: Reinicia serviço do OpenClaw de forma segura, registrando auditoria.
---

## Passos

1. Detectar ambiente de execução (systemd, Docker, Windows)

2. Registrar evento de restart na auditoria
   - Incluir `request_id`, timestamp e operador

3. Executar restart conforme ambiente:
   - **systemd (Linux)**: `systemctl restart openclaw`
   - **Docker**: `docker compose restart openclaw`
   - **Windows**: Reiniciar serviço/daemon conforme instalação

4. Aguardar 10s e verificar saúde pós-restart
   - Rodar `/healthcheck` automaticamente

5. Se healthcheck falhar, alertar operador e NÃO tentar restart adicional
