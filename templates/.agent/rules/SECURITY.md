# Guardrails de Segurança (OpenClaw OS)
- bind localhost (127.0.0.1) por padrão
- auth token obrigatório
- VPN-first para acesso remoto
- bloquear comandos destrutivos (rm -rf, mkfs, dd if=, shutdown/reboot) sem aprovação

Este arquivo é uma referência de políticas para sua integração em hooks (VS Code/Cursor) ou no Policy Engine do OpenClaw core.
