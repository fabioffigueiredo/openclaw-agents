---
name: smoke-tester
description: Validação automática pós-alteração. Testa se mudanças funcionam como esperado usando testes automatizados, browser testing (quando disponível) ou verificações programáticas.
triggers:
  - testar alteração
  - verificar se funciona
  - smoke test
  - validar
  - testar se funciona
  - funciona?
  - está funcionando
  - conferir
  - healthcheck pós-deploy
  - verificação
  - pós-alteração
---

# Smoke Tester (Validação Pós-Alteração)

## Objetivo
Após **qualquer alteração** no projeto (novo agente, config, deploy, código), executar automaticamente uma bateria de testes para confirmar que tudo funciona como esperado.

> **Princípio**: Nenhuma alteração é considerada completa sem validação. O agente DEVE testar após aplicar.

## Contexto necessário
- O que foi alterado (config, código, agente, infra)
- Ambiente (local, Docker, VPS, IDE)
- Ferramentas disponíveis (browser tool, terminal, API)

## Fluxo automático pós-alteração

```
ALTERAÇÃO → DETECTAR TIPO → ESCOLHER TESTE → EXECUTAR → REPORTAR
```

### 1. Detectar tipo de alteração

| Tipo | Exemplos | Teste adequado |
|------|----------|---------------|
| Config de agente | Novo agente, modelo, fallback | Health ping + resposta de teste |
| Config de gateway | Porta, bind, auth, CORS | Curl/HTTP request + status check |
| Config de canal | Telegram, Discord, Slack | Enviar mensagem de teste + verificar status |
| Código (backend) | API, lógica, módulo | Unit tests + integration tests |
| Código (frontend) | UI, componente, página | Browser testing (screenshot + assertions) |
| Infraestrutura | Docker, VPN, firewall | Connectivity check + healthcheck |
| Dependências | npm install, pip install | Build + test suite |

### 2. Métodos de teste por ambiente

#### Terminal/CLI (sempre disponível)
```bash
# Verificar se processo está rodando
docker ps | grep <container>
systemctl status <service>

# Testar endpoint HTTP
curl -s -o /dev/null -w "%{http_code}" http://localhost:PORT/health

# Verificar conectividade
ping -c 1 <host>
ssh -o ConnectTimeout=5 <host> echo "OK"

# Rodar suite de testes
npm test
pytest
go test ./...
```

#### Browser Testing (Antigravity, Cursor com browser tool)
Quando o agente tem acesso ao browser tool:
```
1. Abrir URL alvo no navegador
2. Verificar se a página carrega (screenshot)
3. Verificar elementos esperados na DOM
4. Clicar em elementos interativos
5. Verificar console do navegador (sem erros)
6. Capturar screenshot final como prova
```

**Cenários de browser testing:**
- Dashboard do OpenClaw: verificar se carrega, dropdown de agentes presente
- Site/App: verificar homepage, navegação, formulários
- Página de login: testar fluxo completo
- API docs: verificar se Swagger/OpenAPI renderiza

#### API Testing (programático)
```bash
# Testar agente do OpenClaw
curl -X POST http://localhost:18789/api/chat \
  -H "Authorization: Bearer <token>" \
  -d '{"message": "ping"}' \
  | jq '.response'

# Verificar status de agentes
curl http://localhost:18789/api/status --json | jq '.agents'
```

### 3. Checklists por tipo de alteração

#### Novo Agente Adicionado
- [ ] Config válida no `openclaw.json` (id, model, workspace)
- [ ] Reiniciar gateway/container
- [ ] Verificar que o agente aparece no status (`/api/status`)
- [ ] Enviar mensagem de teste e confirmar resposta
- [ ] Se tem browser: verificar dropdown no dashboard
- [ ] Verificar logs do container (sem erros)

#### Novo Modelo/Provedor de IA
- [ ] API Key configurada (env var ou config)
- [ ] Modelo acessível (fazer request de teste)
- [ ] Fallback funcionando (simular falha do primário)
- [ ] Rate limits conhecidos e documentados
- [ ] Custo estimado por request documentado

#### Configuração Multi-Agente
- [ ] Cada agente tem workspace separado
- [ ] Cada agente responde individualmente
- [ ] Sessões não se misturam entre agentes
- [ ] Fallback de modelo funciona para cada agente
- [ ] Dashboard mostra todos os agentes no dropdown

#### Alteração de VPN/Rede
- [ ] Pingar IP da VPN (`ping 10.66.0.X`)
- [ ] SSH via VPN funciona
- [ ] Portas esperadas acessíveis (curl healthcheck)
- [ ] Firewall não bloqueia tráfego esperado
- [ ] DNS resolve corretamente

#### Alteração de Código
- [ ] Build passa sem erros
- [ ] Testes unitários passam
- [ ] Testes de integração passam (se existirem)
- [ ] Sem erros no console do navegador (se frontend)
- [ ] Screenshot de referência comparado (se UI)

### 4. Relatório de validação

Após cada teste, gerar relatório em `.agent/audit/`:

```markdown
# Validação Pós-Alteração
- **Data**: 2026-02-19T11:24:00
- **Alteração**: Adicionado agente "browser" com modelo Gemini 3 Flash
- **Testes executados**: 5
- **Resultados**:
  - ✅ Config válida
  - ✅ Gateway reiniciado
  - ✅ Agente aparece no status
  - ✅ Resposta de teste recebida
  - ⚠️ Dropdown no dashboard: não verificado (sem browser tool)
- **Status**: PASS (4/5 OK, 1 não aplicável)
```

## Regras
- ✅ SEMPRE testar após qualquer alteração. Sem exceção
- ✅ Se o browser tool está disponível, USAR para verificação visual
- ✅ Capturar screenshots como prova de validação
- ✅ Se um teste falha, reportar imediatamente e propor correção
- ❌ Nunca considerar uma alteração "pronta" sem pelo menos 1 teste de verificação
- ❌ Nunca pular validação em produção
