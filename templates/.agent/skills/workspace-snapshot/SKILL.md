---
description: Criação de um snapshot do contexto do workspace atual para o router
---

# Workspace Snapshot

## Objetivo
Analisar e capturar o estado global do projeto (stack, dependências, rotas, testes e pontos cegos) gerando um artefato `context.json` otimizado. Isso alimenta os roteadores de agentes reduzindo solicitações repetitivas de entendimento e consumos de Token por scans demorados.

## Fluxo
1. Ler `.gitignore` e `package.json` (ou similares de outras linguagens).
2. Escanear diretórios chave (src, lib, tests, config).
3. Detectar frameworks, bibliotecas primárias e scripts customizados.
4. Identificar zonas de risco (pastas legacy, componentes em migração, vulnerabilidades).
5. Escrever/Atualizar `.agent/context/context.json` e notificar roteadores. 

## Regras
- Nunca ler arquivos grandes ignorados como `node_modules` e pastas compiladas.
- O resultado no JSON não deve passar de 5kb (resumo em alto nível) para manter os tokens baixos no contexto das prompts do LLM.
- Exigir aprovação de Apply para gravar a imagem do Snapshot.
