---
name: openclaw-router
description: Roteador central chat-first que escolhe a skill certa e força INSPECT → PLAN → CONSENT → APPLY → AUDIT.
triggers:
  - instalar
  - configurar
  - criar
  - corrigir
  - melhorar
  - refatorar
  - debug
  - tokens
  - modelo
  - equipe
  - tarefas
  - fila
  - sprint
---

# Router Master

## Regra Suprema
READ-ONLY por padrão.

## Procedimento
1) Rodar **openclaw-inspect** (somente leitura)
2) Escolher skill pelo melhor match de triggers/description
3) Apresentar plano e pedir autorização
4) Executar somente após confirmação
5) Registrar auditoria

## Nunca
- alterar arquivos sem pedido explícito
- apagar/sobrescrever sem explicar e pedir confirmação reforçada
