---
name: openclaw-policy-baseline
description: Define RBAC e allowlists (deny-by-default) para execução remota via VPN com break-glass expirável.
version: 1.0
---
# Objetivo
Políticas antes do poder. Deny-by-default.

# Perfis
- viewer: leitura
- operator: runbooks permitidos
- admin: ações elevadas com confirmação extra e auditoria

# Break-glass
- janela curta
- expiração automática
- alerta e auditoria
