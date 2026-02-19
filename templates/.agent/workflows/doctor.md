---
description: Diagnóstico completo do ambiente OpenClaw com verificações de segurança.
---

## Passos

1. Executar diagnóstico completo
   ```bash
   openclaw doctor
   ```

2. Verificações realizadas:
   - ✅ `openclaw.json` — bind, token, canais configurados
   - ✅ Porta 18789 — serviço respondendo
   - ✅ WireGuard — handshake recente (se VPN ativa)
   - ✅ `.agent/` — integridade dos templates
   - ✅ Hook `pre-tool-use` — bloqueio de comandos ativo
   - ✅ Permissões — arquivos sensíveis com 0600

3. Relatório final com ✅ (ok) ou ❌ (problema) + sugestões de correção
