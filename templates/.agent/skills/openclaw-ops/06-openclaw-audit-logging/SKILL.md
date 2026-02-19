---
name: openclaw-audit-logging
description: Auditoria estruturada (JSON) para VPN/enroll/policy/exec/transfer/update/health. Inclui retenção e redaction de segredos.
version: 1.0
---
# Objetivo
Logar tudo com request_id e sem vazar segredos.

# Eventos
- vpn.peer_added/removed
- host.approved/revoked
- policy.changed
- exec.started/finished/denied
