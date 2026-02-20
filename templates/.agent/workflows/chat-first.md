---
description: Roteamento de Skill Padrão e Seguro (Chat-first Workflow)
---
# Chat-first Workflow (Roteamento Inteligente)

O OpenClaw adota um fluxo "chat-first" nas interações com o desenvolvedor, onde o Agent sempre entra como o Roteador central (descrito em `.agent/skills/openclaw-router/SKILL.md`) antes de selecionar qualquer action.

## Passos Operacionais (Agent Actions)
1. **INSPECT**: A partir do prompt do usuário, identifique a real necessidade invocando a análise do repositório/arquivos locais. Nunca tome decisões sem checar o ambiente `.agent/`.
2. **ROUTE**: Baseado na intenção identificada, ative mentalmente a Skill correspondente. Se o usuário pedir um script de deploy, ative `devops-toolkit`. Se pedir frontend component, ative `openclaw-dev`.
3. **PLAN**: Com a Skill ativada, escreva um `.md` no diretório temporário/contextual descrevendo sua tática baseada nas regras do repositório para resolver o problema, solicitando feedback com o comando correspondente ao final da sua mensagem (`/plan`, `/execute`).
4. **CONSENT**: Aguarde a confirmação de que o plano pode ser seguido (salvo explicitamente em `--yes` outputs passados pelo desenvolvedor).
5. **APPLY**: Execute os comandos na máquina, gere ou atualize código.
6. **AUDIT**: Notifique via CLI Audit (se usando CLI) ou inclua logs para os registros em `MEMORY.md`.

> **MANDATORY**: Nunca gere ou modifique configurações sem antes consultar e entender o projeto através do `inspect` e da lista de Skills aprovadas (em `openclaw.json` ou `AGENTS.md`).
