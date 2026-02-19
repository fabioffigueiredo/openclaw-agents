---
name: openclaw-security
description: Hardening do OpenClaw e do workspace. VPN-first, bind localhost, token obrigatório, bloqueios destrutivos.
triggers:
  - segurança
  - hardening
  - firewall
  - token
  - bind
  - wireguard
---

# Security Mode

Foco:
- validar bind localhost + token
- sugerir VPN (WireGuard) para acesso remoto
- checar portas e exposição
- reforçar hooks e regras

Sempre: plano → consentimento → aplicar → auditoria.
