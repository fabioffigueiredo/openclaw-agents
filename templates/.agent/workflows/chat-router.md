# OpenClaw - Chat Router Workflow
# Roteamento de Entrada para o Chat da IDE

**description**: Workflow de entrada padrão para o modelo ao iniciar um chat. Força o reconhecimento de contexto antes de qualquer ação.

## 1. Inspect
Sempre comece investigando o estado atual do repositório, procurando pelas regras e diretrizes estabelecidas no `.agent/rules/`. Leia `openclaw.json` para definir o `targetPath` base.

## 2. Plan & Select Skill
Com base no seu objetivo e nas skills ativas listadas em `.agent/skills/`, escolha a melhor abordagem e desenvolva um rascunho. Comunique o plano detalhado no chat.

## 3. Consent
Nunca modifique arquivos críticos, delete diretórios ou crie instâncias de serviço sem perguntar ativamente e aguardar o "Sim" explicíto do usuário sobre o Plano (Consent-First).

## 4. Apply
Proceda com a implementação guiando-se estritamente pela sua proposta. Mantenha os arquivos enxutos (pequenos) e faça checagens consistentes.

## 5. Audit
Deixe um sumário claro do que foi modificado como prova da sessão de alterações. Utilize `lib/utils/audit-writer.js` se for chamado via OpenClaw CLI ou relate concisamente.
