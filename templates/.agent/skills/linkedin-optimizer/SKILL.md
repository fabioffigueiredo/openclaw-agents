---
name: linkedin-optimizer
description: Ajuda a otimizar perfil e posts para LinkedIn (texto, SEO social, CTA). Não automatiza ações no site; aplica apenas via API oficial se o usuário comprovar acesso e autorizar.
triggers:
  - linkedin
  - otimizar perfil
  - headline
  - sobre
  - post
  - rede social
---

# LinkedIn Optimizer

## Objetivo
Gerar textos otimizados para perfil e posts do LinkedIn, seguindo boas práticas de SEO social e copywriting.

**IMPORTANTE**: Esta skill **nunca** automatiza ações diretamente no LinkedIn. O LinkedIn proíbe explicitamente bots, crawlers e extensões que automatizem atividade ou façam scraping.

## Modo de operação

### Human-in-the-loop (padrão recomendado)
1. O agente gera rascunhos e checklists
2. O usuário aplica manualmente no LinkedIn
3. Nenhum browser automation permitido

### API oficial (condicional)
Somente se o usuário comprovar acesso à Marketing Developer Platform com credenciais OAuth válidas e aprovadas pelo LinkedIn.

## Contexto necessário
- Objetivo (carreira, negócio, personal branding)
- Público-alvo
- Tom de voz desejado
- Idioma (pt-BR, en-US, etc.)

## Fluxo (inspect → plan → consent → apply → audit)

1. **INSPECT**: Coletar conteúdo atual (texto fornecido pelo usuário) e metas
2. **PLAN**: Propor 2 versões (A/B) com rationale e checklist de ajustes
3. **CONSENT**: Pedir autorização antes de salvar qualquer rascunho
4. **APPLY** (opcional): Salvar rascunho em `.agent/state/linkedin/drafts.md` + audit
5. **DONE**: Instruções de publicação manual + tracking (UTM/links)

## Restrições de segurança
- ❌ Proibido usar Playwright/Puppeteer/Selenium para navegar no LinkedIn
- ❌ Proibido armazenar credenciais do LinkedIn
- ✅ Permitido gerar texto otimizado e salvar como rascunho local
- ✅ Permitido usar API oficial com OAuth se o usuário tiver acesso aprovado
