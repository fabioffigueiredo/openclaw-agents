---
name: site-tester
description: Testa páginas (performance, SEO, acessibilidade, regressão visual) com Lighthouse/LHCI + Playwright em sandbox (Docker).
triggers:
  - testar site
  - lighthouse
  - pagespeed
  - performance
  - seo
  - acessibilidade
  - teste de performance
---

# Site Tester

## Objetivo
Auditar páginas web em termos de performance, SEO, acessibilidade e PWA usando Lighthouse, PageSpeed Insights API e Playwright em ambiente isolado (sandbox/Docker).

## Contexto necessário
- URLs alvo
- Ambiente (staging/prod)
- Se exige login (sim/não)
- Thresholds desejados (ex: performance > 90)

## Fluxo (inspect → plan → consent → apply → audit)

1. **INSPECT**: Validar URLs e verificar robots.txt/ToS do domínio
2. **PLAN**: Definir métricas, thresholds e escolher ferramentas:
   - PageSpeed Insights API (dados de campo CrUX + laboratório Lighthouse)
   - Lighthouse local (mais controle, permite autenticação)
   - Playwright (regressão visual, interação, screenshots)
3. **CONSENT**: Confirmar carga e execução (impacto em tráfego)
4. **APPLY**: Executar auditorias; salvar relatórios em `.agent/state/site-tests/`
5. **AUDIT**: Registrar resultados e recomendações priorizadas

## Ferramentas suportadas

| Ferramenta | Uso | Requer setup |
|-----------|-----|-------------|
| PageSpeed Insights API | Dados CrUX + Lighthouse web | API Key |
| Lighthouse CLI | Auditoria completa local | Node.js |
| Lighthouse CI (LHCI) | CI/CD + servidor auto-hospedado | Docker/Node |
| Playwright | Screenshots, regressão visual, login flow | Docker recomendado |

## Requisitos de segurança
- ✅ Executar em sandbox (Docker) quando possível
- ✅ Se exige login: usuário autoriza método (cookie storage state ou manual)
- ❌ Nunca armazenar credenciais de login no state
- ❌ Nunca executar contra domínios sem autorização do dono
