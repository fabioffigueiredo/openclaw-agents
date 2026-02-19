---
name: WEB_AUTOMATION
description: Regra de compliance para automação web, scraping e integração com serviços externos.
---

# Web Automation — Regras de Compliance e Segurança

## Princípio central
**Separar "planejar" de "executar"**: a IA pode planejar e escrever scripts/patches, mas execução real vem **após consentimento explícito** do usuário.

## Checklist obrigatório antes de qualquer automação web

### 1. ToS e legalidade
- [ ] Verificar se o site/plataforma permite automação (ex: LinkedIn **proíbe** bots)
- [ ] Verificar `robots.txt` — não é autorização, mas é prática obrigatória respeitá-lo
- [ ] Preferir APIs oficiais quando existirem (Google Drive API, SerpAPI, PageSpeed, etc.)
- [ ] Só automatizar contas que o usuário controla e autorizou

### 2. Credenciais e autenticação
- [ ] Preferir OAuth (Google/Microsoft) com escopos mínimos (ex: `drive.file`)
- [ ] Nunca armazenar senhas — usar variáveis de ambiente ou secret manager
- [ ] Cookies/storage state tratados como segredo (criptografar, expirar, consentimento)
- [ ] Nunca logar tokens ou chaves em texto puro

### 3. Execução isolada
- [ ] Executar em sandbox (Docker/VM) quando possível
- [ ] Preferir modo `non-main` ou `all` para sessões de automação
- [ ] Rate limiting autoimposto (nunca saturar servidores alvo)
- [ ] Timeout e retry com backoff exponencial

### 4. Dados e privacidade
- [ ] Minimizar dados enviados a provedores externos (evitar PII, segredos, dumps)
- [ ] Documentar qual provedor/modelo foi usado e sua política de retenção
- [ ] Ativar Zero Data Retention (ZDR) quando disponível e necessário
- [ ] Masking/redação de dados sensíveis antes de enviar a LLMs

### 5. Auditoria
- [ ] Registrar cada execução com entradas, saídas, status e artefatos
- [ ] Incluir timestamps, URLs, volume de dados e erros
- [ ] Manter trilha de decisões (por que fallback, por que retry)

## Plataformas com restrições conhecidas

| Plataforma | Restrição | Ação permitida |
|-----------|-----------|---------------|
| LinkedIn | Proíbe bots/crawlers/extensões que automatizam | Gerar textos + checklist; execução manual |
| Facebook/Instagram | Restrições em automação de perfil | Usar APIs oficiais com aprovação |
| Twitter/X | Rate limits estritos na API | Usar API oficial com chave própria |
| Google (busca) | Custom Search com limites; descontinuação prevista | Usar SerpAPI/Brave como alternativa |

## Nota sobre skills de terceiros
Skills de terceiros devem ser **revisadas antes de uso**. Há relatos públicos de skills maliciosas em marketplaces/registries. Tratar como código não confiável e preferir execuções sandboxed.
