---
description: Verifica saúde do OpenClaw (config, porta local, VPN) e gera relatório.
---

## Passos

1. Verificar existência e validade de `openclaw.json`
   - `bind` deve ser `127.0.0.1`
   - `auth.mode` deve ser `token`
   - Token deve existir e ter pelo menos 24 caracteres

2. Checar porta 18789 em `127.0.0.1`
   - Se não estiver em uso, alertar que o serviço pode estar parado

3. Checar WireGuard handshake (se VPN configurada)
   - `wg show wg0 latest-handshakes`
   - Alertar se handshake > 5 minutos atrás

4. Verificar integridade dos arquivos `.agent/`
   - Confirmar que skills, agents e rules existem

5. Emitir relatório ✅/❌ com sugestões de correção
