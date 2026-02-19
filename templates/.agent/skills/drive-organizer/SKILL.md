---
name: drive-organizer
description: Organiza arquivos no Google Drive (renomear, mover, criar pastas, padronizar nomenclatura) usando Drive API com OAuth e escopo mínimo.
triggers:
  - google drive
  - organizar drive
  - renomear arquivos
  - mover para pasta
  - drive
  - arquivos nuvem
---

# Drive Organizer

## Objetivo
Organizar, renomear e categorizar arquivos no Google Drive de forma segura e auditável, usando a Drive API com o escopo `drive.file` (mínimo privilégio).

## Contexto necessário
- Objetivo da organização (taxonomia/padrão)
- Pasta raiz alvo
- Regras de nomenclatura

## Fluxo (inspect → plan → consent → apply → validate → audit)

1. **INSPECT** (read-only): Listar arquivos selecionados + simular mudanças
2. **PLAN**: Tabela "antes/depois" e quantidade de mudanças previstas
3. **CONSENT**: Confirmação reforçada se houver sobrescrita ou conflito de nomes
4. **APPLY**: Executar via Drive API + registrar audit (IDs, mudanças, erros)
5. **VALIDATE**: Re-listar e conferir consistência

## Requisitos de segurança
- ✅ Usar OAuth 2.0 (sem senha) — fluxo para apps instalados
- ✅ Preferir escopo `drive.file` (usuário escolhe quais arquivos compartilhar)
- ✅ Confirmar antes de mover/renomear em lote
- ❌ Nunca armazenar refresh tokens em texto puro
- ❌ Nunca acessar arquivos fora do escopo autorizado

## Armazenamento de state
- `.agent/state/drive/last_operation.json` — resultado da última operação
- `.agent/audit/` — log completo com IDs de arquivos e mudanças aplicadas
