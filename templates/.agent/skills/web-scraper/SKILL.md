---
name: web-scraper
description: Extrai conteúdo de sites de forma responsável (respeitando robots.txt/ToS), usando Playwright ou um serviço (Browserless/Firecrawl) em sandbox.
triggers:
  - scraping
  - extrair tabela
  - coletar dados
  - baixar conteúdo
  - crawler
  - web scraping
---

# Web Scraper

## Objetivo
Extrair dados estruturados de páginas web de forma responsável, respeitando robots.txt, ToS e limites de taxa, usando ferramentas em sandbox.

## Contexto necessário
- Lista de URLs alvo
- Formato de saída desejado (markdown/json/csv)
- Política de respeito a robots.txt (verificar antes)

## Fluxo (inspect → plan → consent → apply → audit)

1. **INSPECT**: Verificar robots.txt e se há API oficial alternativa ao scraping
2. **PLAN**: Estimar volume e taxa; escolher ferramenta (Playwright local vs serviço)
3. **CONSENT**: Confirmar execução e destino dos dados extraídos
4. **APPLY**: Rodar scraping em sandbox; salvar outputs em `.agent/state/scrapes/`
5. **AUDIT**: Registrar URLs, timestamps, erros e retries

## Ferramentas disponíveis

| Ferramenta | Tipo | Melhor para |
|-----------|------|------------|
| Playwright | Local/Docker | Páginas dinâmicas, SPA, login flows |
| Browserless | SaaS (BaaS) | Elasticidade, sem infra local |
| Firecrawl | Serviço + CLI | Scraping/crawling em lote |

## Restrições de segurança e compliance

- ✅ Respeitar robots.txt (não é autorização, mas é prática obrigatória)
- ✅ Preferir APIs oficiais quando existirem
- ✅ Limitar taxa de requests (rate limiting autoimposto)
- ✅ Executar em sandbox (Docker/VM) sempre que possível
- ❌ Nunca fazer scraping de plataformas que proíbem explicitamente (ex: LinkedIn)
- ❌ Nunca extrair dados pessoais sem autorização
- ❌ Nunca burlar CAPTCHAs ou proteções anti-bot

## Armazenamento
- `.agent/state/scrapes/` — outputs organizados por domínio/data
- `.agent/audit/` — log com URLs, volume, taxa e erros
