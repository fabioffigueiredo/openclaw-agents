---
name: legacy-cleanup
description: Analisa e refatora código legado de forma segura. Identifica dead code, dependências obsoletas, padrões deprecados e propõe modernização incremental.
triggers:
  - código legado
  - legacy
  - refatorar
  - dead code
  - código morto
  - deprecado
  - obsoleto
  - modernizar
  - dívida técnica
  - technical debt
  - cleanup
  - limpar código
---

# Legacy Cleanup

## Objetivo
Identificar e remover código legado, dead code, dependências obsoletas e padrões deprecados de forma **segura e incremental**, sem quebrar funcionalidades existentes.

## Contexto necessário
- Linguagem/framework do projeto
- Se há testes automatizados (cobertura atual)
- Áreas prioritárias (ou análise completa)
- Tolerância a risco (conservador vs agressivo)

## Fluxo (inspect → plan → consent → apply → verify → audit)

1. **INSPECT** (read-only):
   - Identificar dead code (funções/classes/módulos não referenciados)
   - Listar dependências sem uso no `package.json` / `requirements.txt` / `Gemfile`
   - Detectar padrões deprecados (callbacks → promises, var → const/let, etc.)
   - Mapear duplicações (DRY violations)
   - Verificar TODOs/FIXMEs/HACKs antigos
   - Medir complexidade ciclomática por arquivo

2. **PLAN** — Propor ações categorizadas por risco:

   | Risco | Ação | Exemplo |
   |-------|------|---------|
   | 🟢 Baixo | Remover imports não usados | `import * as _ from 'lodash'` sem uso |
   | 🟡 Médio | Remover funções sem referência | Função helper nunca chamada |
   | 🔴 Alto | Substituir padrão arquitetural | Migrar callbacks → async/await |

3. **CONSENT**: Confirmar cada categoria de risco separadamente
4. **APPLY**: Executar refatorações + rodar testes após cada batch
5. **VERIFY**: Confirmar que testes passam e build funciona
6. **AUDIT**: Registrar métricas antes/depois (linhas, complexidade, dependências)

## Ferramentas recomendadas por linguagem

| Linguagem | Dead code | Deps não usadas | Complexidade |
|-----------|-----------|-----------------|-------------|
| JavaScript/TS | `ts-prune`, ESLint `no-unused-vars` | `depcheck` | `plato`, ESLint |
| Python | `vulture`, `pylint` | `pip-autoremove` | `radon`, `flake8` |
| Go | `deadcode`, `staticcheck` | `go mod tidy` | `gocyclo` |
| Java | IntelliJ inspections, `spotbugs` | Maven dependency plugin | `PMD` |

## Regras de segurança
- ✅ Sempre rodar testes antes E depois de cada refatoração
- ✅ Commits atômicos (1 refatoração = 1 commit)
- ✅ Nunca remover código que tenha referência dinâmica sem confirmar
- ❌ Nunca refatorar sem testes que cubram a área alterada
- ❌ Nunca misturar refatoração com mudança de lógica de negócio
