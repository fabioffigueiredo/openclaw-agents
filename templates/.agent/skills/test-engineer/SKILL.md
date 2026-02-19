---
name: test-engineer
description: Criação e melhoria de testes (unitários, integração, E2E, performance). Cobertura, TDD, mocking, fixtures e estratégias de teste.
triggers:
  - teste
  - test
  - tdd
  - unitário
  - integração
  - e2e
  - end-to-end
  - cobertura
  - coverage
  - mock
  - fixture
  - pytest
  - jest
  - vitest
  - playwright
  - cypress
  - benchmark
  - performance test
  - load test
---

# Test Engineer

## Objetivo
Criar, melhorar e manter testes robustos (unitários, integração, E2E, performance), garantindo cobertura adequada e confiança no deploy.

## Contexto necessário
- Linguagem/framework do projeto
- Framework de teste existente (Jest, Vitest, Pytest, Go test)
- Cobertura atual (se disponível)
- Áreas prioritárias ou código novo

## Fluxo (inspect → plan → consent → apply → verify → audit)

1. **INSPECT** (read-only):
   - Verificar framework de teste configurado
   - Medir cobertura atual por módulo
   - Identificar áreas sem testes (módulos críticos)
   - Listar funcionalidades sem cobertura E2E

2. **PLAN** — Estratégia de testes por camada:

   | Camada | Proporção (Pirâmide) | Framework sugerido |
   |--------|---------------------|-------------------|
   | Unitários | ~70% | Jest, Vitest, Pytest, Go test |
   | Integração | ~20% | Supertest, httpx, testcontainers |
   | E2E | ~10% | Playwright, Cypress |

3. **CONSENT**: Confirmar escopo dos testes a criar
4. **APPLY**: Gerar testes + fixtures + mocks
5. **VERIFY**: Rodar testes, verificar cobertura
6. **AUDIT**: Registrar métricas de cobertura antes/depois

## Capacidades

### 🧪 Testes Unitários
- Testes isolados de funções/classes
- Mocking de dependências externas (APIs, DB, FS)
- Parametrização para múltiplos cenários
- Edge cases: null, undefined, empty, overflow, unicode
- Padrão AAA: Arrange → Act → Assert

### 🔗 Testes de Integração
- Testes de endpoints API (request → response)
- Testes com banco de dados real (testcontainers)
- Testes de filas/eventos (pub/sub, webhooks)
- Testes de contratos (consumer-driven contracts)

### 🌐 Testes E2E (End-to-End)
- Fluxos críticos de usuário (login, checkout, signup)
- Testes visuais (screenshot comparison)
- Testes cross-browser (Chrome, Firefox, Safari)
- Testes de acessibilidade (axe-core)

### ⚡ Testes de Performance
- Load testing (k6, Artillery, Locust)
- Benchmark de funções críticas
- Testes de latência e throughput
- Stress testing e limites de escalabilidade

### 📊 Cobertura e Métricas
- Cobertura de linhas, branches, funções
- Mutation testing (Stryker, mutmut) para medir qualidade dos testes
- Relatórios de tendência (cobertura ao longo do tempo)

## Checklists

### Escrevendo testes unitários
- [ ] Nome descritivo: `should_return_error_when_input_is_empty`
- [ ] Um assert por teste (preferencialmente)
- [ ] Sem dependência de estado externo (DB, rede, FS)
- [ ] Mocks com reset/cleanup entre testes
- [ ] Cobrir happy path + edge cases + error cases
- [ ] Sem sleep/wait — usar async assertions

### Escrevendo testes E2E
- [ ] Testar fluxo completo, não fragmentos
- [ ] Usar page objects / fixtures reutilizáveis
- [ ] Screenshots em caso de falha
- [ ] Retry para flakiness controlado
- [ ] Dados de teste isolados (seed + cleanup)

### Antes de deploy
- [ ] Todos os testes passam
- [ ] Cobertura mínima atendida (ex: 80%+)
- [ ] Nenhum teste flaky (intermitente)
- [ ] Testes de regressão validam fix de bugs anteriores
- [ ] Performance baseline mantida

## Ferramentas recomendadas

| Tipo | JavaScript/TS | Python | Go |
|------|--------------|--------|-----|
| Unitário | Jest, Vitest | Pytest | testing |
| API | Supertest | httpx, pytest-httpx | net/http/httptest |
| E2E | Playwright, Cypress | Playwright | chromedp |
| Performance | k6, Artillery | Locust | go-wrk |
| Cobertura | c8, istanbul | coverage.py | go test -cover |
| Mutation | Stryker | mutmut | go-mutesting |

## Regras de segurança
- ✅ Testes nunca devem conter dados reais de produção
- ✅ Fixtures devem usar dados sintéticos (faker, factory)
- ❌ Nunca desabilitar testes que falham — investigar e corrigir
- ❌ Nunca testar contra APIs de produção (usar mocks ou staging)
