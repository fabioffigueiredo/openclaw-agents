---
name: restart-openclaw
description: Reinicia serviço do OpenClaw de forma segura, registrando auditoria.
---
Passos:
- systemd (Linux): systemctl restart openclaw (se existir)
- Docker: docker compose restart openclaw
- Windows: reiniciar serviço/daemon conforme instalação
