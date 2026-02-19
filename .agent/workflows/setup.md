---
description: Roda o wizard interativo de configuração do OpenClaw.
---

## Passos

1. Executar wizard de setup universal
   ```bash
   openclaw setup
   ```

2. O wizard irá:
   - Detectar ambiente (Docker / Linux VPS / macOS / Windows / WSL2)
   - Configurar `openclaw.json` (bind, auth token)
   - Configurar canais de comunicação (Telegram, Discord, WhatsApp)
   - Sugerir hardening para VPS

3. Após conclusão, rodar `/healthcheck` para validar a configuração
