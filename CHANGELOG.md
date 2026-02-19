# Changelog

## [3.0.0] - 2026-02-18

### Adicionado — CLI Instalável
- **`bin/openclaw.js`**: Entry point do CLI com parsing de argumentos sem dependências externas
- **Comando `init`**: Copia `templates/.agent/` para o projeto, cria `openclaw.json` com defaults, exibe tree visual da instalação
- **Comando `update`**: Atualiza templates comparando SHA-256, preserva customizações com backup `.bak`
- **Comando `status`**: Lista componentes instalados, mascara tokens, exibe configuração ativa
- **Comando `doctor`**: Healthcheck automatizado com relatório ✅/⚠️/❌ (config, porta, VPN, integridade)
- **`package.json`** atualizado: `bin`, `files`, `keywords`, pronto para `npm publish`

### Adicionado — Scripts Operacionais (`lib/ops/`)
- **`vpn.js`**: Verificação WireGuard, geração de chaves/configs, validação de conectividade
- **`enroll.js`**: Ciclo host completo (gerar identidade, registrar, aprovar, revogar)
- **`policy.js`**: RBAC com 3 perfis, break-glass com expiração, allowlists deny-by-default
- **`exec.js`**: Execução segura de runbooks com request_id, timeout, cancel e auditoria
- **`transfer.js`**: Transferência com allowlist, SHA-256 pré/pós, limite de tamanho
- **`audit.js`**: Log JSONL diário, redaction automática de segredos, rotação com retenção
- **`update-safe.js`**: Snapshots de backup, canary, healthcheck pós-update, rollback automático
- **`healthcheck.js`**: Circuit breaker (closed/open/half-open), heartbeat, auto-restart com limites

### Adicionado — Hooks e Workflows
- **`pre-tool-use.js`**: Bloqueia 12+ padrões destrutivos (rm -rf, mkfs, dd, fork bombs, curl|sh), suporte a break-glass
- **4 workflows como slash commands**: `/healthcheck`, `/restart`, `/setup`, `/doctor`
- **Agent persona enriquecida**: Tools permitidas, limites operacionais, circuit breaker

### Alterado — Estrutura do Projeto
- Migração de `agents/`, `rules/`, `skills/`, `workflows/` para `templates/.agent/`
- Módulos `lib/` (detect, config, security, channels) copiados para raiz `lib/`
- README.md reescrito com foco no CLI
- 78 testes passando em 8 suites

## [2.0.0] - 2026-02-18

### Adicionado — Modularização e Testes
- **`lib/detect.js`**: Detecção de ambiente (Docker, WSL2, Windows, macOS, Linux)
- **`lib/config.js`**: Leitura/escrita segura de JSON com operação atômica
- **`lib/security.js`**: Mascaramento de segredos, geração de tokens, verificação de portas
- **`lib/channels.js`**: Validação e configuração de canais (Telegram, Discord, WhatsApp)
- 37 testes unitários com Vitest

### Alterado — Refatoração do Wizard
- `config_wizard.js` reduzido de 354 para 160 linhas
- Toda a lógica duplicada extraída para módulos `lib/`
- WhatsApp adicionado como canal suportado

## [1.0.0] - 2026-02-17

### Adicionado — Versão Inicial
- Skills `universal-setup` com wizard interativo
- Skills `openclaw-ops` com 8 checklists operacionais
- Agent persona `sysadmin-proativo`
- Rules de segurança
- Workflows healthcheck e restart
- `install.sh` para instalação rápida
