---
name: openclaw-vpn-wireguard
description: Provisiona WireGuard entre VPS e hosts para que o OpenClaw opere somente via rede privada. Inclui hardening, checklist e validação.
version: 1.0
---
# Objetivo
Criar VPN WireGuard (VPN-first). Sem VPN, sem acesso remoto.

# Checklist (alto nível)
- Instalar WireGuard (VPS e host)
- Gerar chaves por host (nunca reutilizar)
- Configurar wg0 na VPS (10.60.0.1/24)
- Adicionar peers com AllowedIPs /32
- Validar handshake e ping dentro da VPN
- Definir procedimento de revogação (remover peer)

# Hardening
- Expor publicamente apenas UDP do WireGuard
- Não usar 0.0.0.0/0 por padrão
- Registrar auditoria de add/remove peer
