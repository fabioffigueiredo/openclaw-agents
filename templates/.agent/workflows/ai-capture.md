---
description: Exemplo de workflow avançado usando AI Capture e nós interativos para coleta de tickets de suporte.
params:
  - userId
  - message
---

## Support Ticket Capture Workflow

Este workflow demonstra como capturar dados estruturados de uma conversa natural.

### 1. Saudação Interativa
- **Message Node**: Olá! Sou o assistente de suporte inteligente. Vou coletar os dados do seu chamado.

### 2. Coleta de Dados (AI Capture)
- **Interactive Node**: Por favor, descreva o problema que está enfrentando com o máximo de detalhes possível.
- **AI Capture Node**:
  - **Prompt**: Analise a resposta do usuário e extraia os seguintes campos em JSON:
    - `summary`: Resumo de uma linha do problema.
    - `category`: Categoria (Hardware, Software, Rede, Acesso).
    - `urgency`: Urgência (Baixa, Média, Alta) baseada no tom.
    - `details`: O relato completo do usuário.
  - **Validation**: Verifique se `details` tem mais de 10 caracteres. Se não, peça para detalhar mais.

### 3. Confirmação
- **Message Node**: Obrigado! Registrei o chamado:
  - **Resumo**: {{capture.summary}}
  - **Categoria**: {{capture.category}}
  - **Urgência**: {{capture.urgency}}

### 4. Ação (Skill Call)
- **Skill Node**: `openclaw-ops/create-ticket` (simulado)
  - **Args**:
    - title: {{capture.summary}}
    - body: {{capture.details}}
    - priority: {{capture.urgency}}

### 5. Finalização
- **Message Node**: Chamado criado com sucesso! Um técnico entrará em contato em breve.
