# 🦀 OpenClaw AI OS

**Sistema universal de agentes para IDEs** — instale, configure e use via chat ou terminal.

O OpenClaw transforma qualquer projeto em um workspace inteligente com skills, regras de segurança e roteamento econômico de modelos de IA. Funciona em **Cursor, VSCode, Gemini Code Assist, Antigravity** e qualquer IDE com suporte a agentes.

---

## 📦 Instalação

### Opção 1: Via npx (recomendado — sem instalar nada)

```bash
# Simula o que será feito (modo seguro, não altera nada)
npx @fabioforest/openclaw init

# Instala de fato no projeto
npx @fabioforest/openclaw init --apply
```

### Opção 2: Instalação global

```bash
npm install -g @fabioforest/openclaw
openclaw init --apply
```

### Opção 3: Instalação completa para IDEs

```bash
# Instala o "AI OS" com skills, rules, state e hooks
npx @fabioforest/openclaw ide install --apply
```

> **💡 Dica**: Todos os comandos operam em **modo PLAN por padrão** (read-only). Nada é alterado sem `--apply`.

---

## 🎯 Quando usar cada comando

### Resumo rápido

| Situação | Comando | O que faz |
|----------|---------|-----------|
| Primeira vez no projeto | `init --apply` | Cria `.agent/` com templates |
| Atualizar skills/rules | `update --apply` | Atualiza preservando customizações |
| Desinstalar do projeto | `uninstall --apply` | Remove `.agent/` com backup |
| Ver o que está instalado | `status` | Lista componentes e config |
| Algo não funciona | `doctor` | Diagnóstico completo |
| Quero entender meu ambiente | `inspect` | Análise 100% read-only |
| Preciso de ajuda geral | `assist` | Assistente com roteamento de skills |
| Instalar AI OS na IDE | `ide install --apply` | Skills + rules + state + hooks |
| Verificar IDE configurada | `ide doctor` | Checa se tudo está "armado" |
| Configurar do zero | `setup` | Wizard interativo passo a passo |
| Problemas de rede/VPN | `debug` | Diagnóstico de conectividade |
| Instalar ou reparar (automático) | `check` | Orquestrador inteligente |

---

## 📖 Manual de Uso Detalhado

### `openclaw init` — Instalar no projeto

**Quando usar:** Primeira vez que você quer adicionar o OpenClaw a um projeto.

```bash
# 1. Primeiro, simule para ver o que vai acontecer
npx @fabioforest/openclaw init
#    → Mostra plano: "CREATE .agent/", "COPY templates", "CREATE openclaw.json"
#    → Nenhum arquivo é criado

# 2. Se estiver tudo certo, aplique
npx @fabioforest/openclaw init --apply
#    → Cria .agent/ com skills, rules, hooks e workflows
#    → Cria openclaw.json com configurações default

# 3. Se já existe e quer sobrescrever (exige confirmação forte)
npx @fabioforest/openclaw init --apply --force
#    → Pede para digitar "DESTROY .agent" para confirmar
```

**Flags disponíveis:**

| Flag | O que faz |
|------|-----------|
| `--apply` | Executa de fato (sem isso, só simula) |
| `--force` | Permite sobrescrever `.agent/` existente |
| `--path ./dir` | Instala em outro diretório |
| `--yes` | Pula confirmações interativas |
| `--no-audit` | Não gera log de auditoria |

---

### `openclaw update` — Atualizar templates

**Quando usar:** Quando sair uma versão nova do OpenClaw e você quiser atualizar skills/rules sem perder customizações.

```bash
# Simula a atualização (mostra o que mudou)
npx @fabioforest/openclaw update

# Aplica a atualização
npx @fabioforest/openclaw update --apply

# Merge seguro (preserva customizações)
npx @fabioforest/openclaw update --apply --merge
```

**Como funciona:**
- Compara cada arquivo por hash SHA-256
- Se você customizou um arquivo, faz backup (`.bak`) antes de atualizar
- Novos templates são copiados normalmente
- Tudo é registrado em `.agent/audit/`

---

---

### `openclaw uninstall` — Desinstalar do projeto

**Quando usar:** Quando quiser remover completamente o OpenClaw de um projeto.

```bash
# 1. Simula a remoção (mostra o que seria deletado)
npx @fabioforest/openclaw uninstall
#    → Mostra tree de .agent/ e openclaw.json
#    → Alerta sobre audit logs e state que seriam perdidos
#    → Nenhum arquivo é removido

# 2. Aplica a remoção (com backup automático)
npx @fabioforest/openclaw uninstall --apply
#    → Pede para digitar "UNINSTALL" como confirmação
#    → Oferece fazer backup (.agent.backup-<timestamp>/)
#    → Remove .agent/ e openclaw.json
#    → Salva log de auditoria no diretório

# 3. Remoção forçada (sem backup, com --yes pula confirmação)
npx @fabioforest/openclaw uninstall --apply --force --yes
```

**Saída de exemplo (modo PLAN):**

```
🗑️  OpenClaw Uninstall

   📂 Diretório: /home/user/meu-projeto

   🔴 REMOVER  .agent/ (25 arquivos)
      📁 agents (3 arquivos)
      📁 audit (1 arquivos)
      📁 hooks (1 arquivos)
      📁 rules (5 arquivos)
      📁 skills (11 arquivos)
      📁 workflows (7 arquivos)
   🔴 REMOVER  openclaw.json

   ⚠️  1 log(s) de auditoria serão perdidos!

🔒 Modo PLAN (Read-Only). Nenhuma alteração feita.
   Para desinstalar, rode: npx @fabioforest/openclaw uninstall --apply
```

---

### `openclaw inspect` — Analisar ambiente (read-only)

**Quando usar:** Antes de qualquer ação, para entender o contexto. 100% read-only — nunca altera nada.

```bash
npx @fabioforest/openclaw inspect
```

**Saída de exemplo:**

```
🔎 OpenClaw Inspect (Read-Only)

   🖥️  Plataforma: darwin
   🐳 Docker: false
   🪟 WSL: false
   💻 IDE: cursor
   📂 Path: /home/user/meu-projeto
   📦 OpenClaw instalado: Sim
   📋 Config: Sim
   🐙 Git repo: Sim

   🧠 Skills instaladas (15):
      • content-sourcer    • context-flush
      • drive-organizer    • linkedin-optimizer
      • mission-control    • openclaw-router
      • smart-router       • web-scraper
      ...

✅ Inspect concluído (nenhuma alteração feita).
```

**Modo JSON (para automações):**

```bash
npx @fabioforest/openclaw inspect --quiet
# → Retorna JSON puro, ideal para pipes e scripts
```

---

### `openclaw assist` — Assistente geral com roteamento

**Quando usar:** Quando não sabe qual skill usar. O assist analisa sua solicitação e sugere a skill mais adequada.

```bash
npx @fabioforest/openclaw assist
```

**Como funciona:**
1. Detecta contexto (IDE, plataforma, skills disponíveis)
2. Pede sua solicitação em linguagem natural
3. Roteia para a skill mais relevante via triggers
4. Mostra alternativas e protocolo recomendado

**Exemplo de interação:**

```
🧠 OpenClaw Assist — Modo PLAN por padrão (seguro)
   IDE: cursor | OpenClaw: instalado

Descreva o que deseja fazer:
> otimizar meu perfil do linkedin

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 Skill selecionada: linkedin-optimizer
   Descrição: Ajuda a otimizar perfil e posts para LinkedIn

   Alternativas:
      • content-sourcer: Busca fontes públicas
      • smart-router: Roteia para perfis de modelo
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

### `openclaw ide install` — Instalar AI OS na IDE

**Quando usar:** Para preparar sua IDE para usar o OpenClaw como agente via chat. Instala skills, rules, hooks e state templates.

```bash
# Simula a instalação (mostra o plano)
npx @fabioforest/openclaw ide install

# Aplica a instalação
npx @fabioforest/openclaw ide install --apply

# Força reinstalação completa
npx @fabioforest/openclaw ide install --apply --force
```

**O que é instalado:**

```
.agent/
├── agents/            # Personas (sysadmin, automator, setup)
├── hooks/             # pre-tool-use.js (bloqueia comandos destrutivos)
├── rules/             # 5 regras de segurança
│   ├── CONSENT_FIRST.md
│   ├── SECURITY.md
│   ├── ROUTER_PROTOCOL.md
│   ├── DEV_MODE.md
│   └── WEB_AUTOMATION.md
├── skills/            # 15 skills disponíveis
│   ├── openclaw-router/       # Roteador central chat-first
│   ├── openclaw-inspect/      # Inspeção read-only
│   ├── smart-router/          # Roteador econômico de modelos
│   ├── mission-control/       # Empresa de Agentes
│   ├── linkedin-optimizer/    # Otimização de LinkedIn
│   ├── drive-organizer/       # Google Drive via API
│   ├── site-tester/           # Lighthouse + Playwright
│   ├── web-scraper/           # Scraping responsável
│   ├── content-sourcer/       # Pesquisa de fontes
│   └── ... (+ 6 skills operacionais)
├── state/             # Estado persistente
│   ├── mission_control.json   # Empresa de Agentes
│   └── MEMORY.md              # Memória do workspace
└── workflows/         # Slash commands e runbooks
```

---

### `openclaw ide doctor` — Verificar IDE

**Quando usar:** Para confirmar que sua IDE está "armada" com todas as regras e skills necessárias.

```bash
npx @fabioforest/openclaw ide doctor
```

**Saída de exemplo:**

```
🏥 IDE Doctor — Verificando instalação para IDE:

   ✅ .agent/
   ✅ rules/CONSENT_FIRST.md
   ✅ rules/ROUTER_PROTOCOL.md
   ✅ skills/openclaw-router/SKILL.md
   ✅ skills/openclaw-inspect/SKILL.md
   ✅ skills/openclaw-dev/SKILL.md
   ✅ hooks/pre-tool-use.js

🎉 IDE está totalmente configurada!
```

---

### `openclaw status` — Ver status da instalação

**Quando usar:** Para ver rapidamente o que está instalado e configurado.

```bash
npx @fabioforest/openclaw status
```

Mostra: componentes instalados, versão, config ativa (com tokens mascarados).

---

### `openclaw doctor` — Healthcheck completo

**Quando usar:** Quando algo não funciona. Faz diagnóstico completo do ambiente.

```bash
npx @fabioforest/openclaw doctor
npx @fabioforest/openclaw doctor --quiet  # Saída mínima
```

Verifica: config, portas, VPN, integridade de arquivos, dependências.

---

### `openclaw setup` — Wizard interativo

**Quando usar:** Primeira configuração completa com perguntas guiadas.

```bash
npx @fabioforest/openclaw setup
```

Guia passo a passo para configurar ambiente, modelo de IA, canais e segurança.

---

### `openclaw check` — Orquestrador inteligente

**Quando usar:** Quando não sabe se precisa instalar ou reparar. Ele decide por você.

```bash
npx @fabioforest/openclaw check
```

Detecta se o OpenClaw já existe e oferece opções: instalar, atualizar, reparar ou forçar.

---

### `openclaw debug` — Diagnóstico avançado

**Quando usar:** Problemas de rede, VPN, npm ou GitHub.

```bash
npx @fabioforest/openclaw debug
```

Verifica conectividade, proxy, versões e integridade do ambiente.

---

## 🧠 Skills Disponíveis (25)

### Core — Infraestrutura do AI OS

| Skill | O que faz | Quando usar |
|-------|-----------|-------------|
| `openclaw-router` | Roteador central chat-first | Sempre ativo — decide qual skill usar |
| `openclaw-inspect` | Inspeção read-only | Para analisar sem alterar |
| `openclaw-dev` | Modo Devin-like | Para criar features, backend, frontend |
| `openclaw-security` | Hardening | Para melhorar segurança do workspace |
| `openclaw-assist` | Assistente geral | Para menu de ações e ajuda |
| `mission-control` | Empresa de Agentes | Para orquestrar múltiplos agentes |
| `smart-router` | Roteador econômico | Para escolher modelo de IA por custo |
| `context-flush` | Flush de memória | Para economizar tokens em sessões longas |

### Engenharia de Software — Código, Testes e Qualidade

| Skill | O que faz | Quando usar |
|-------|-----------|-------------|
| `code-quality` | SOLID, DRY, KISS, Clean Code | Para revisar e melhorar qualidade de código |
| `legacy-cleanup` | Refatoração segura de legado | Para remover dead code, deps obsoletas |
| `test-engineer` | Testes unit/integração/E2E | Para criar e melhorar suite de testes |
| `smoke-tester` | Validação pós-alteração | Para testar automaticamente após qualquer mudança |
| `security-scanner` | SAST, DAST, OWASP Top 10 | Para auditoria de segurança e vulnerabilidades |

### DevOps, MLOps & Infra

| Skill | O que faz | Quando usar |
|-------|-----------|-------------|
| `devops-toolkit` | Docker, CI/CD, K8s, Terraform | Para automação de infra e deploy |
| `mlops-pipeline` | Treinamento, serving, RAG, drift | Para pipelines de ML em produção |
| `vps-cloud-infra` | 9 provedores VPS/Cloud, hardening | Para provisionar e gerenciar servidores |
| `vpn-networking` | 7 soluções VPN, troubleshooting | Para redes privadas seguras |
| `ai-provider-setup` | 10+ provedores de IA, API keys | Para adicionar novos modelos/provedores |

### Produtividade — Automação e Web

| Skill | O que faz | Quando usar |
|-------|-----------|-------------|
| `linkedin-optimizer` | Textos para LinkedIn | Para otimizar perfil/posts (human-in-the-loop) |
| `drive-organizer` | Google Drive via API | Para organizar arquivos na nuvem |
| `site-tester` | Lighthouse + Playwright | Para testar performance/SEO/acessibilidade |
| `web-scraper` | Scraping responsável | Para extrair dados de sites |
| `content-sourcer` | Pesquisa de fontes | Para criar dossiês citáveis |

### Operacionais — Setup e Debug

| Skill | O que faz | Quando usar |
|-------|-----------|-------------|
| `universal-setup` | Setup em qualquer ambiente | Para instalação em VPS/Docker/Mac/Windows |
| `openclaw-installation-debugger` | Debug de instalação | Para resolver problemas de setup |

---

## 🤖 Agentes Especializados (Personas)

O OpenClaw vem com **agentes pré-configurados** que combinam skills específicas para realizar funções complexas:

| Persona | Foco | Skills Principais |
|---------|------|-------------------|
| **`sysadmin-proativo`** | Manutenção de servidores, logs, segurança | `vps-cloud-infra`, `openclaw-ops`, `openclaw-security` |
| **`workflow-automator`** | Criação e execução de automações | `ai-capture`, `mission-control`, `openclaw-dev` |
| **`setup-specialist`** | Onboarding e configuração inicial | `universal-setup`, `ai-provider-setup`, `openclaw-installation-debugger` |

**Como usar:**
Basta pedir no chat: *"Atue como sysadmin e verifique os logs do servidor"* ou *"Inicie o workflow-automator para criar uma automação de tickets"*. O `openclaw-router` ativará a persona correta.

---

## ⚡ Workflows Prontos

Além de skills isoladas, o OpenClaw traz **fluxos de trabalho completos** (runbooks executáveis):

| Workflow | Descrição | Comando Trigger |
|----------|-----------|-----------------|
| **`ai-capture`** | Captura inteligente de dados/tickets usando IA | *"Iniciar captura de dados"* |
| **`doctor`** | Diagnóstico e reparo automático do ambiente | `openclaw doctor` |
| **`healthcheck`** | Verificação rápida de saúde (API, DB, cache) | `openclaw healthcheck` |
| **`restart-openclaw`** | Reinício seguro e auditado do serviço | `openclaw restart` |

**Execução:**
Workflows são arquivos `.md` em `.agent/workflows/` que o agente lê e executa passo a passo, garantindo consistência e auditoria.

---

## 🔒 Segurança

O OpenClaw segue 3 princípios fundamentais:

### 1. Read-only por padrão
Todo comando opera em **modo PLAN** (simulação). Nada é alterado sem `--apply`.

### 2. Consent-first
Antes de qualquer alteração, o sistema mostra exatamente o que vai fazer e pede confirmação. Ações destrutivas exigem **confirmação forte** (digitar frase específica).

### 3. Audit-first
Toda ação gera log detalhado em `.agent/audit/` com timestamp, comando, modo, contexto e resultado.

### Proteções ativas

| Proteção | Como funciona |
|----------|---------------|
| **Hook pre-tool-use** | Bloqueia 12+ padrões destrutivos (`rm -rf`, `mkfs`, `dd`, `shutdown`) |
| **VPN-first** | Sem VPN, sem acesso remoto |
| **Bind localhost** | Serviços só acessíveis localmente por padrão |
| **Auth token** | Token obrigatório para acesso |
| **Break-glass** | Acesso emergencial com expiração automática |
| **WEB_AUTOMATION rule** | Checklist de compliance para automação web |

---

## 💰 Roteador Econômico de Modelos

O `smart-router` escolhe automaticamente o modelo de IA mais econômico para cada tarefa:

| Perfil | Quando | Provedor default (free) |
|--------|--------|------------------------|
| **cheap** | Tarefas simples, formatação, resumos | Gemini Flash-Lite → Groq |
| **smart** | Planejamento, análise, raciocínio | Gemini Pro → Claude |
| **coding** | Código, debug, refactor, testes | Gemini Pro → GPT-5.2 |

Prioridade: **free-first** — só usa provedores pagos com autorização explícita.

---

## 🚀 Guia Rápido: Do Zero ao Funcionando

```bash
# 1. Instale no seu projeto
npx @fabioforest/openclaw ide install --apply

# 2. Verifique se está tudo OK
npx @fabioforest/openclaw ide doctor

# 3. Analise seu ambiente
npx @fabioforest/openclaw inspect

# 4. Use o assistente
npx @fabioforest/openclaw assist
```

**Ou via chat na IDE (Cursor, VSCode, Antigravity, Gemini):**
- Basta perguntar no chat! As skills e rules em `.agent/` guiam o agente automaticamente.
- O `openclaw-router` decide qual skill usar com base nos triggers de cada uma.
- Tudo segue o fluxo: **INSPECT → PLAN → CONSENT → APPLY → AUDIT**.

---

## 💬 Exemplo Real: Usando o OpenClaw na IDE (Chat)

O OpenClaw funciona como agente via chat na IDE. Aqui está uma simulação de como seria o fluxo real:

### Exemplo 1: Otimizar perfil do LinkedIn

```
👤 Você (chat na IDE):
   "Quero otimizar meu perfil do LinkedIn para vagas de AI Engineer"

🤖 Agente (openclaw-router detecta: linkedin-optimizer):
   📋 INSPECT ─ Coletando contexto:
      • Objetivo: otimizar perfil LinkedIn para AI Engineer
      • Idioma: pt-BR
      • Skills instaladas: linkedin-optimizer ✅

   📝 PLAN ─ Proposta de ações:
      1. Analisar headline atual e propor 2 versões A/B
      2. Reescrever seção "Sobre" com keywords de AI/MLOps
      3. Sugerir ajustes nas experiências com métricas
      4. Gerar checklist de publicação

   ⚠️  RESTRIÇÃO: LinkedIn proíbe automação. Todo conteúdo
       será gerado como rascunho para aplicação manual.

   Deseja prosseguir? (S/n)

👤 Você: "S"

🤖 Agente:
   ✅ APPLY ─ Rascunhos salvos em .agent/state/linkedin/drafts.md

   ## Headline (opção A)
   "AI Engineer | MLOps | Python | RAG & LLMs | Open Source"

   ## Headline (opção B)
   "Engenheiro de IA | Construindo pipelines de ML em produção"

   📝 AUDIT ─ log salvo em .agent/audit/
```

### Exemplo 2: Testar performance de um site

```
👤 Você:
   "Testa a performance do meu site https://meu-portfolio.dev"

🤖 Agente (openclaw-router detecta: site-tester):
   📋 INSPECT:
      • URL: https://meu-portfolio.dev
      • robots.txt: verificado ✅
      • Ferramentas disponíveis: PageSpeed Insights API

   📝 PLAN:
      1. Rodar Lighthouse via PageSpeed Insights (sem infra local)
      2. Coletar métricas: Performance, SEO, Acessibilidade, PWA
      3. Listar as 5 principais oportunidades de melhoria
      4. Salvar relatório em .agent/state/site-tests/

   Confirmar execução?

👤 Você: "sim"

🤖 Agente:
   ✅ Resultados:
      • Performance: 87 → otimizar imagens (ganho estimado: +8pts)
      • SEO: 95 ✅
      • Acessibilidade: 72 → falta alt em 3 imagens + contraste baixo
      • PWA: 60 → falta manifest.json e service worker

   📊 Relatório salvo em .agent/state/site-tests/2026-02-19.json
   📝 Audit salvo
```

### Exemplo 3: Atualizar skills após nova versão

```
👤 Você:
   "Saiu versão nova do OpenClaw, como atualizo?"

🤖 Agente (openclaw-router detecta: assist):
   Recomendo o seguinte fluxo:

   1. Primeiro, veja o que mudaria (modo PLAN, seguro):
      $ npx @fabioforest/openclaw update

   2. Se estiver tudo OK, aplique:
      $ npx @fabioforest/openclaw update --apply

   3. Para preservar customizações:
      $ npx @fabioforest/openclaw update --apply --merge

   O update faz backup automático de arquivos customizados
   antes de sobrescrever, e copia novos templates.

   Quer que eu execute o passo 1 agora?
```

### Exemplo 4: Desinstalar o OpenClaw de um projeto

```
👤 Você:
   "Quero remover o OpenClaw deste projeto"

🤖 Agente:
   Vou simular a remoção primeiro (modo PLAN, seguro):

   $ npx @fabioforest/openclaw uninstall

   🗑️  PLAN — Seria removido:
      .agent/ (25 arquivos, 15 skills, 5 rules)
      openclaw.json
      ⚠️  3 logs de auditoria seriam perdidos

   Para aplicar de fato:
   $ npx @fabioforest/openclaw uninstall --apply

   O sistema vai pedir que você digite "UNINSTALL"
   e oferecerá fazer backup antes de remover.

   Quer que eu execute?
```

---

## 🔄 Ciclo de Vida Completo

```
📦 INSTALAR        →  npx @fabioforest/openclaw init --apply
                       ou: npx @fabioforest/openclaw ide install --apply

🔍 INSPECIONAR     →  npx @fabioforest/openclaw inspect
                       npx @fabioforest/openclaw status

🛠️ USAR            →  Chat na IDE (skills + router fazem o resto)
                       ou: npx @fabioforest/openclaw assist

🔄 ATUALIZAR       →  npx @fabioforest/openclaw update --apply
                       (preserva customizações com --merge)

🏥 DIAGNOSTICAR    →  npx @fabioforest/openclaw doctor
                       npx @fabioforest/openclaw debug

🗑️ DESINSTALAR     →  npx @fabioforest/openclaw uninstall --apply
                       (backup automático + confirmação forte)
```

---

## 🛠️ Desenvolvimento

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

---

## 📋 Flags Globais

Todas as flags funcionam com qualquer comando:

| Flag | Descrição | Padrão |
|------|-----------|--------|
| `--plan` | Modo simulação (read-only) | **Sim** |
| `--apply` | Modo execução (aplica alterações) | Não |
| `--yes, -y` | Pula confirmações interativas | Não |
| `--force, -f` | Permite operações destrutivas (sem backup no uninstall) | Não |
| `--path, -p <dir>` | Diretório alvo | `./` |
| `--quiet, -q` | Saída mínima | Não |
| `--no-audit` | Desabilita logs de auditoria | Não |
| `--merge` | Atualização segura (preserva customizações) | Não |

---

## 📄 Licença

MIT
