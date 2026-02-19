# OpenClaw OS

CLI e starter kit para configuração segura do OpenClaw em VPS, Mac, Windows e Docker.

## Instalação

```bash
# Via npx (recomendado)
npx @fabioforest/openclaw init

# Ou instale globalmente
npm install -g @fabioforest/openclaw
openclaw init
```

## Comandos

| Comando | Descrição |
|---------|-----------|
| `openclaw init` | Instala templates `.agent/` no projeto |
| `openclaw update` | Atualiza templates preservando customizações |
| `openclaw status` | Mostra status da instalação |
| `openclaw doctor` | Healthcheck automatizado do ambiente |
| `openclaw setup` | Roda wizard interativo de configuração |

### Opções

```bash
openclaw init --force          # Sobrescreve .agent/ existente
openclaw init --path ./dir     # Instala em diretório específico
openclaw doctor --quiet        # Saída mínima
```

## O que é instalado

O comando `init` cria a seguinte estrutura no seu projeto:

```
.agent/
├── agents/            # Personas de agente (ex: sysadmin-proativo)
├── hooks/             # Hooks de segurança (PreToolUse)
├── rules/             # Guardrails de segurança
├── skills/
│   ├── universal-setup/   # Wizard de configuração interativo
│   └── openclaw-ops/      # 8 skills operacionais
└── workflows/         # Runbooks e slash commands
```

### Skills Operacionais

| # | Skill | Descrição |
|---|-------|-----------|
| 01 | VPN WireGuard | Provisiona VPN entre VPS e hosts |
| 02 | Enroll Host | Onboarding com aprovação humana |
| 03 | Policy Baseline | RBAC + allowlists deny-by-default |
| 04 | Remote Exec | Runbooks com timeout e auditoria |
| 05 | File Transfer | Transferência com hash e allowlist |
| 06 | Audit Logging | Log JSON com redaction de segredos |
| 07 | Safe Update | Canary + rollback automático |
| 08 | Healthchecks | Circuit breaker + auto-restart |

## Segurança

- **VPN-first** — sem VPN, sem acesso remoto
- **bind localhost** + **auth token** por padrão
- **Hook `pre-tool-use`** — bloqueia comandos destrutivos (`rm -rf`, `mkfs`, `dd`, `shutdown`)
- **Break-glass** — acesso emergencial com expiração automática
- **Auditoria** — todos os eventos logados com `request_id`

## Desenvolvimento

```bash
# Instalar dependências
npm install

# Rodar testes
npm test

# Testes com watch
npm run test:watch

# Coverage
npm run test:coverage
```

## Licença

MIT
