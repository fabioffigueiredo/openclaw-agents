---
name: smart-router
description: Roteia solicitações para perfis de modelo (cheap/smart/coding) para economizar tokens. Não altera config sem consentimento.
triggers:
  - economizar
  - tokens
  - modelo
  - router
  - roteador
  - barato
  - caro
  - provedor
  - gemini
  - groq
  - openai
  - claude
  - fallback
---

# Smart Model Router (Roteador Econômico)

## Objetivo
Escolher o perfil e provedor adequado para cada solicitação, priorizando **free-first** e subindo para paid somente com autorização.

## Perfis e classificação

| Perfil | Quando usar | Objetivo |
|--------|------------|---------|
| **cheap** | Tarefas simples, formatação, reescrita curta, extração, resumo | Throughput e custo mínimo |
| **smart** | Planejamento, raciocínio multi-etapas, decisões com tradeoffs, texto longo | Qualidade e robustez |
| **coding** | Geração/correção de código, debug, refactor, testes, patches | Precisão em engenharia |

### Sinais para classificação (sem usar LLM — economiza tokens)
- **coding**: bloco de código, nomes de arquivo, stack traces, "bug", "refatorar", "compile", "SQL", "regex", "diff", "teste"
- **smart**: "planejar", "analisar", "comparar", "decidir", "estratégia", múltiplas etapas
- **cheap**: tudo que não se encaixa nos acima

## Provedores e chains de fallback

### cheap (free-first, alto volume)
1. Gemini 2.5 Flash-Lite (free) → 2. Groq free → 3. OpenRouter free → 4. Cohere Trial → 5. OpenAI GPT-5 mini (pago, se permitido)

### smart (raciocínio)
1. Gemini 2.5 Pro (free) → 2. Claude Sonnet (pago, se permitido) → 3. OpenRouter ZDR → 4. OpenAI GPT-5.2 (pago)

### coding (engenharia)
1. Gemini 2.5 Pro (free, forte em coding) → 2. Claude Sonnet (pago) → 3. OpenAI GPT-5.2 (pago) → 4. Mistral Scale (pago)

## Tabela de provedores

| Provedor | Free tier | Rate limits | Privacidade (treino) | Tipo de API |
|---------|---------|------------|---------------------|------------|
| Gemini Developer API | Sim (vários modelos) | Por modelo/região | Free: **Sim** treina / Paid: **Não** | REST (x-goog-api-key) |
| Groq | Sim (sem cartão) | RPM/RPD/TPM/TPD por modelo | Não especificado | OpenAI-compatível |
| OpenRouter | 50 req/dia + 20 rpm | Explícitos no free | Não armazena (salvo opt-in) | OpenAI-compatível |
| Cohere | Trial: 1.000 calls/mês | 20 req/min (trial) | 30 dias + ZDR possível | REST + Compatibility API |
| HuggingFace | Credits (não especificado) | Por plano/provedor | Não armazena body de req | SDK HF |
| Mistral | Experiment (free, tel. verificado) | Conservadores (free) | Experiment treina (opt-out); Scale não | REST (Bearer) |
| OpenAI | Não especificado (PAYG) | Por plano | Não treina por padrão; ZDR possível | REST (Bearer) |
| Anthropic | Créditos iniciais (pequenos) | Por tier | 30 dias; ZDR possível | REST (Messages API) |

## Configuração de privacidade

- **standard**: qualquer provedor permitido (priorizando free)
- **strict**: somente provedores com ZDR ou que não treinam por padrão

## Técnicas de economia

### Context caching
Reutilizar contexto fixo (system prompt, policies). Provedores com desconto em cache: OpenAI, Anthropic, Gemini.

### Batch API
Para tarefas não-interativas (embeddings, lint em lote). OpenAI e Gemini oferecem 50% de desconto.

### Compaction/Sumarização
Quando o contexto exceder o teto do perfil, sumarizar histórico antes de continuar:
- cheap: max ~2k tokens de entrada
- smart: max ~12k tokens
- coding: max ~24k tokens

### Cache semântico
Hash do prompt normalizado + parâmetros → evita chamadas duplicadas.

## Prompts otimizados por perfil

### cheap
```
Tarefa: Responda em pt-BR com no máximo 6 linhas.
Formato: 3 bullets curtos + 1 linha "Próxima ação sugerida: ...".
Restrições: Não invente fatos; se faltar dado, pergunte 1 coisa só.
Pedido: {{USER_REQUEST}}
```

### smart
```
Você é um analista cuidadoso.
Objetivo: propor solução e explicar tradeoffs em pt-BR.
Saída: 1) Resumo (2-3 linhas) 2) Opções A/B com prós/contras 3) Recomendação final
Contexto: {{SUMMARY_CONTEXT}}
Pedido: {{USER_REQUEST}}
```

### coding
```
Você é um engenheiro de software.
Regra: não altere arquivos; gere plano e patch unificado.
Saída: Diagnóstico + Patch (unified diff) + Comandos de teste + Riscos
Código/erro: {{PASTE_ERROR_OR_CODE}}
```

## Regras de segurança
- ❌ Não alterar `openclaw.json` automaticamente
- ❌ Não gastar créditos pagos sem autorização explícita
- ✅ Em modo IDE, apenas recomendar perfil e provedor
- ✅ Tratar 429/timeout como evento normal → fallback
- ✅ Registrar provedor/modelo/tokens/custo em audit
