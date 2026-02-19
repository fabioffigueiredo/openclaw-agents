---
name: ai-provider-setup
description: Guia passo a passo para adicionar e configurar provedores de IA (Gemini, OpenAI, Claude, Groq, Mistral, Ollama, etc.) com obtenção de API keys, configuração e teste.
triggers:
  - adicionar ia
  - novo modelo
  - api key
  - token ia
  - configurar modelo
  - gemini
  - openai
  - claude
  - groq
  - mistral
  - ollama
  - huggingface
  - cohere
  - deepseek
  - qwen
  - provedor
  - provider
---

# AI Provider Setup

## Objetivo
Guiar o usuário passo a passo para adicionar novos provedores e modelos de IA, incluindo obtenção de API keys, configuração no projeto e validação de funcionamento.

## Provedores Suportados — Guia Completo

### 🟢 Google Gemini (Recomendado — Free Tier Generoso)

**Modelos disponíveis:** Gemini 2.5 Pro, Gemini 2.5 Flash, Gemini 2.5 Flash-Lite

**Como obter a API Key:**
1. Acesse [Google AI Studio](https://aistudio.google.com/apikey)
2. Faça login com sua conta Google
3. Clique em "Create API Key"
4. Selecione o projeto GCP (ou crie um novo)
5. Copie a chave gerada

**Limites do Free Tier:**
- Gemini Flash: 15 RPM, 1.500 RPD, 1M TPM
- Gemini Pro: 5 RPM, 25 RPD, 1M TPM
- **Atenção**: dados do free tier podem ser usados para treinamento. Para opt-out, use o plano pago

**Configuração:**
```json
{
  "env": { "vars": { "GOOGLE_API_KEY": "AIza..." } },
  "agents": {
    "defaults": {
      "model": { "primary": "gemini/gemini-2.5-flash" }
    }
  }
}
```

---

### 🟡 OpenAI (GPT-5, GPT-5 mini, Codex)

**Modelos disponíveis:** GPT-5.2, GPT-5.1-codex, GPT-5 mini, o3, o4-mini

**Como obter a API Key:**
1. Acesse [OpenAI Platform](https://platform.openai.com/api-keys)
2. Faça login ou crie conta
3. Clique em "Create new secret key"
4. Dê um nome descritivo (ex: "openclaw-vps")
5. Copie a chave (só aparece 1 vez!)

**Importante:** Requer cartão de crédito para uso (PAYG — Pay As You Go)

**Configuração:**
```json
{
  "env": { "vars": { "OPENAI_API_KEY": "sk-proj-..." } },
  "agents": {
    "defaults": {
      "model": { "primary": "openai/gpt-5.2" }
    }
  }
}
```

---

### 🟣 Anthropic Claude (Claude Opus 4.5, Sonnet 4)

**Modelos disponíveis:** Claude Opus 4.5, Claude Sonnet 4, Claude Haiku

**Como obter a API Key:**
1. Acesse [Anthropic Console](https://console.anthropic.com/settings/keys)
2. Crie uma conta (email + verificação)
3. Adicione créditos (mínimo US$ 5)
4. Clique em "Create Key"
5. Copie a chave

**Configuração:**
```json
{
  "env": { "vars": { "ANTHROPIC_API_KEY": "sk-ant-..." } },
  "agents": {
    "defaults": {
      "model": { "primary": "anthropic/claude-sonnet-4" }
    }
  }
}
```

---

### 🟠 Groq (Free, Ultra-Rápido)

**Modelos disponíveis:** Llama 3.3 70B, Mixtral 8x7B, Gemma 2 9B

**Como obter a API Key:**
1. Acesse [GroqCloud Console](https://console.groq.com/keys)
2. Faça login com Google ou GitHub
3. Clique em "Create API Key"
4. Copie a chave

**Limites do Free Tier (sem cartão):**
- 30 RPM, 14.400 RPD, 6.000 TPM (varia por modelo)
- Sem armazenamento de dados (política de privacidade forte)

**Configuração:**
```json
{
  "env": { "vars": { "GROQ_API_KEY": "gsk_..." } },
  "agents": {
    "defaults": {
      "model": { "primary": "groq/llama-3.3-70b-versatile" }
    }
  }
}
```

---

### 🔵 Mistral AI

**Modelos disponíveis:** Mistral Large, Mistral Medium, Codestral, Pixtral

**Como obter a API Key:**
1. Acesse [Mistral Console](https://console.mistral.ai/api-keys)
2. Crie conta (requer verificação por telefone no plano free)
3. Clique em "Create new key"
4. Copie a chave

**Free Tier (Experiment):** Limites conservadores, dados podem ser usados para treinamento (opt-out disponível)

**Configuração:**
```json
{
  "env": { "vars": { "MISTRAL_API_KEY": "..." } },
  "agents": {
    "defaults": {
      "model": { "primary": "mistral/mistral-large-latest" }
    }
  }
}
```

---

### 🟤 Ollama (Local, Gratuito, Privado)

**Modelos disponíveis:** Qwen 2.5 Coder, Llama 3.3, DeepSeek Coder V2, Phi-3, Mistral, Gemma

**Como instalar:**
```bash
# macOS / Linux
curl -fsSL https://ollama.com/install.sh | sh

# Baixar modelo
ollama pull qwen2.5-coder:7b

# Verificar se está rodando
ollama list
curl http://localhost:11434/api/tags
```

**Vantagens:** 100% local, sem custos, total privacidade, sem rate limits
**Desvantagens:** Requer GPU/RAM, modelos menores que APIs cloud

**Configuração (com OpenClaw):**
```json
{
  "agents": {
    "defaults": {
      "model": { "primary": "ollama/qwen2.5-coder:7b" }
    }
  }
}
```

---

### 🟢 Cohere

**Como obter:** [Cohere Dashboard](https://dashboard.cohere.com/api-keys) → Trial: 1.000 calls/mês

### 🔵 DeepSeek

**Como obter:** [DeepSeek Platform](https://platform.deepseek.com/api_keys) → Créditos iniciais gratuitos

### 🟡 HuggingFace Inference

**Como obter:** [HuggingFace Settings](https://huggingface.co/settings/tokens) → Free tier com créditos

### 🟠 OpenRouter (Multi-provedor)

**Como obter:** [OpenRouter Keys](https://openrouter.ai/keys) → 50 req/dia free, acesso a 100+ modelos

---

## Fluxo de adição de novo provedor

1. **Escolher provedor** com base em: custo, qualidade, privacidade, velocidade
2. **Obter API Key** seguindo o passo a passo acima
3. **Configurar** no `openclaw.json` (env.vars + agents.defaults.model)
4. **Testar** com um request simples (smoke-tester)
5. **Definir fallbacks** (chain de modelos por perfil)
6. **Documentar** custos estimados e limites

## Comparativo rápido

| Provedor | Free | Privacidade | Velocidade | Qualidade | Melhor para |
|---------|------|------------|-----------|----------|------------|
| Gemini | ✅ Generoso | ⚠️ Treina (free) | ⚡ Rápido | ⭐⭐⭐⭐ | Uso geral, coding |
| Groq | ✅ Sem cartão | ✅ Não armazena | ⚡⚡⚡ Ultra | ⭐⭐⭐ | Volume alto, rascunhos |
| Ollama | ✅ Totalmente | ✅ 100% local | ⚡ (com GPU) | ⭐⭐⭐ | Privacidade total |
| OpenAI | ❌ Pago | ✅ Não treina | ⚡⚡ Rápido | ⭐⭐⭐⭐⭐ | Máxima qualidade |
| Claude | ❌ Pago | ✅ 30 dias | ⚡⚡ Rápido | ⭐⭐⭐⭐⭐ | Raciocínio, ética |
| Mistral | ⚠️ Limitado | ⚠️ Opt-out | ⚡⚡ Rápido | ⭐⭐⭐⭐ | Coding, EU compliance |
| OpenRouter | ⚠️ 50/dia | ✅ Não armazena | Varia | Varia | Multi-modelo |

## Regras de segurança
- ✅ Armazenar API keys em variáveis de ambiente ou secret manager
- ✅ Testar com request simples antes de usar em produção
- ✅ Documentar custos e limites de cada provedor
- ❌ Nunca commitar API keys no Git
- ❌ Nunca logar API keys em texto puro nos audit logs
