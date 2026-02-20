
# ⚠️ IMPORTANTE: POLÍTICA DE USO DA INTERFACE
**Não use este chat como interface principal do OpenClaw.** 
Use este chat *apenas* para configurar, manter, corrigir bugs ou criar novas skills do OpenClaw (via PLAN -> APPLY).
A operação final do agente (runtime) e uso diário das skills ocorre através do terminal, do Gateway e da Web UI. Nunca assuma o controle operacional.

# OpenClaw — Copilot Instructions (VS Code / GitHub)

# OpenClaw IDE Chat Protocol (Consent-First)

**Regra de ouro:** nunca altere arquivos ou execute comandos sem autorização explícita do usuário.

Workflow padrão:
1) **INSPECT (read-only):** entenda o projeto e o contexto antes de agir.
2) **PLAN:** escreva um plano com lista de arquivos que seriam tocados.
3) **CONSENT:** pergunte “posso aplicar?”.
4) **APPLY:** só então execute.
5) **AUDIT:** registre tudo (o que mudou, por que, o que falhou, como desfazer).

Referência interna do projeto:
- `.agent/workflows/chat-router.md` (roteamento e passos)
- `.agent/rules/CONSENT_FIRST.md` e `.agent/rules/ROUTER_PROTOCOL.md`

Quando eu pedir para "aplicar", siga o plano e **mostre o diff** antes de concluir.
Se eu não disser "aplicar", trate como **simulação**.
