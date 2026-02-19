---
name: universal-setup
description: Setup universal e seguro do OpenClaw em VPS, Windows (incl. WSL2), Mac ou Docker. Configura gateway, auth token, canais, persistência e hardening básico.
version: 1.1
author: OpenClaw DevOps
---

# Universal Setup (Wizard)
Esta skill roda um assistente interativo que:
- Detecta ambiente (Docker / Linux VPS / Linux local / macOS / Windows)
- Garante `gateway.bind = 127.0.0.1` e `auth.mode = token`
- Cria templates de memória (MEMORY.md, SOUL.md) se faltarem
- Configura canais (Telegram/Discord) com validação básica
- Sugere hardening em VPS (usuário não-root, firewall, fail2ban)
- Oferece opção de acesso a arquivos locais com **princípio do menor privilégio**
  (o usuário escolhe quais pastas o agente pode acessar)

## Como usar
- `npx openclaw setup`
ou peça no chat:
- "rodar setup universal"
- "configure meu ambiente"

## Segurança
- Nunca exponha o OpenClaw publicamente.
- Para acesso remoto, use VPN (WireGuard) e políticas (deny-by-default).
