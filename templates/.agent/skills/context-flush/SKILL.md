---
name: context-flush
description: Resume contexto útil e propõe anexar a MEMORY.md e/ou history do Mission Control; só aplica com consentimento.
triggers:
  - flush
  - limpar contexto
  - resumir
  - economizar tokens
  - reset
---

# Context Flush (economia)

## Fluxo
1) Produzir um resumo curto com:
   - objetivo atual
   - decisões tomadas
   - pendências
   - links/arquivos relevantes
2) Propor onde salvar:
   - `.agent/state/MEMORY.md` (por projeto) ou `MEMORY.md` do workspace
   - `.agent/state/mission_control.json` (history)
3) Mostrar PLANO: quais arquivos seriam alterados e como.
4) Perguntar: "Posso aplicar?"
5) Se aprovado, anexar e registrar auditoria.

## Regras
- Nunca apagar histórico automaticamente.
- Nunca rodar reset automaticamente.
- Sempre deixar o usuário decidir.
