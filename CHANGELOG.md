# Changelog

## [3.7.0] - 2026-02-19

### Adicionado — Validação, Setup de IA e Infra Expandida (Fase 16)
- **`smoke-tester`**: Validação automática pós-alteração (browser testing, CLI, API), checklists por tipo de mudança (agente, modelo, VPN, código), relatórios de validação
- **`ai-provider-setup`**: Guia passo a passo para 10+ provedores de IA (Gemini, OpenAI, Claude, Groq, Mistral, Ollama, Cohere, DeepSeek, HuggingFace, OpenRouter) com obtenção de API keys e comparativo
- **`vps-cloud-infra`**: Setup de 9 provedores VPS/Cloud (Contabo, Hetzner, DigitalOcean, Linode, Vultr, Oracle, AWS, GCP, Azure) com hardening SSH, firewall, Docker e monitoramento
- **`vpn-networking`**: 7 soluções VPN (WireGuard, Tailscale, Headscale, OpenVPN, Cloudflare Tunnel, ZeroTier, Nebula) com setup completo, comparativo e troubleshooting

## [3.6.0] - 2026-02-19

### Adicionado — Engenharia, DevOps, MLOps e Segurança (Fase 15)
- **6 skills novas**: `legacy-cleanup` (refatoração segura de código legado), `code-quality` (SOLID/DRY/KISS/Clean Code), `devops-toolkit` (Docker/CI-CD/K8s/Terraform), `mlops-pipeline` (experiment tracking/model serving/RAG/drift), `security-scanner` (SAST/DAST/OWASP/secrets), `test-engineer` (unit/integration/E2E/performance/TDD)
- **README atualizado** com catálogo de 21 skills organizadas em 5 categorias

## [3.5.0] - 2026-02-19

### Adicionado
- **Comando `uninstall`**: Remove `.agent/` e `openclaw.json` com backup automático, confirmação forte ("UNINSTALL") e audit. Plan-first por padrão

### Alterado
- **README reescrito** como manual completo: instalação (3 opções), 11 comandos com exemplos, 4 simulações reais de uso via chat na IDE, catálogo de 15 skills, diagrama de ciclo de vida e tabela de flags

## [3.4.0] - 2026-02-19

### Adicionado — Automação Web, Produtividade e Roteador Econômico (Fase 14)
- **5 skills novas** em `templates/.agent/skills/`: `linkedin-optimizer`, `drive-organizer`, `site-tester`, `web-scraper`, `content-sourcer`
- **Rule `WEB_AUTOMATION.md`**: Checklist de compliance para automação (ToS, robots.txt, sandbox, OAuth, privacidade)

### Alterado
- **`smart-router` reescrito**: Tabela de 8 provedores (Gemini, Groq, OpenRouter, Cohere, HF, Mistral, OpenAI, Anthropic), chains de fallback por perfil (cheap/smart/coding), config de privacidade (standard/strict), prompts otimizados por perfil, técnicas de economia (caching, batch, compaction)

## [3.3.0] - 2026-02-19

### Adicionado — OpenClaw AI OS (Fase 13)
- **8 skills novas** em `templates/.agent/skills/`: `openclaw-router`, `openclaw-inspect`, `openclaw-dev`, `openclaw-security`, `openclaw-assist`, `mission-control`, `smart-router`, `context-flush`
- **2 rules novas** em `templates/.agent/rules/`: `ROUTER_PROTOCOL.md`, `DEV_MODE.md`
- **Comando `inspect`**: Análise 100% read-only do ambiente (SO, IDE, Docker, skills, Git)
- **Comando `assist`**: Assistente geral com roteamento automático de skills por triggers
- **Comando `ide install`**: Instala AI OS na IDE (plan/apply, consent-first)
- **Comando `ide doctor`**: Verifica se IDE está "armada" com rules, skills e hooks
- **`lib/context/collector.js`**: Context collector avançado (WSL, Docker cgroup, skills installed)
- **`lib/router/match.js`**: Parser YAML frontmatter + scoring de skills por triggers
- **State templates**: `mission_control.json` + `MEMORY.md` para empresa de agentes

### Corrigido
- Removido `module.exports` duplicado em `lib/cli/init.js`

### Alterado
- `lib/context.js` reorganizado para `lib/context/index.js` (compatibilidade mantida)
- Help text do CLI atualizado com 10 comandos

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
