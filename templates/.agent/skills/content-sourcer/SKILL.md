---
name: content-sourcer
description: Busca fontes públicas e gera um "dossiê citável" (links + trechos) para alimentar posts e páginas.
triggers:
  - buscar fontes
  - referências
  - pesquisa web
  - dossiê
  - fontes
  - pesquisar
  - research
---

# Content Sourcer

## Objetivo
Pesquisar fontes públicas sobre um tema e gerar um dossiê citável com links, trechos e relevância, útil para posts, artigos, apresentações e projetos.

## Contexto necessário
- Tema de pesquisa
- País/idioma preferido
- Critérios de qualidade (recência, autoridade, fontes primárias)

## Fluxo (inspect → plan → apply → audit)

1. **INSPECT**: Escolher provedor de busca e validar orçamento (queries disponíveis)
2. **PLAN**: Definir queries, critérios de filtragem e quantidade de fontes
3. **APPLY**: Executar busca, extrair resumo por fonte, salvar em `.agent/state/research/`
4. **AUDIT**: Registrar queries executadas, provedores usados e custos estimados

## Provedores de busca suportados

| Provedor | Free tier | Limites | Nota |
|---------|---------|--------|------|
| SerpAPI | 250 buscas/mês (free) | Throughput/hora definido | Amplo (Google, Bing, etc.) |
| Brave Search API | US$ 5 créditos/mês | Preço por 1.000 queries | Boa relação custo/qualidade |
| Google Custom Search | 100 queries/dia (free) | Descontinuação prevista (2027) | Usar com cautela |

## Requisitos de segurança
- ✅ Usar API keys do próprio usuário (nunca embutir chaves no skill)
- ✅ Respeitar limites de taxa e quotas dos provedores
- ✅ Citar fontes com links completos (transparência)
- ❌ Nunca plagiar conteúdo (apenas resumir e citar)
- ❌ Nunca gastar créditos sem confirmar com o usuário

## Armazenamento
- `.agent/state/research/` — dossiês por tema/data
- `.agent/audit/` — log com queries, custos e provedores
