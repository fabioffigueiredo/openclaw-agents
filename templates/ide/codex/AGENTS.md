# AGENTS.md — OpenClaw (Codex / ferramentas compatíveis)

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

Escopo:
- Estas regras valem para esta pasta e subpastas.
- Regras mais específicas em AGENTS.md mais internos podem sobrescrever.

Testes:
- Se o projeto tiver scripts de teste documentados, proponha rodá-los no modo PLAN e execute apenas com APPLY.
