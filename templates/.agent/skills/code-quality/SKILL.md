---
name: code-quality
description: Aplica boas práticas de código (SOLID, DRY, KISS, Clean Code). Analisa estilo, naming, estrutura, documentação e propõe melhorias.
triggers:
  - boas práticas
  - code review
  - clean code
  - solid
  - dry
  - kiss
  - qualidade de código
  - code quality
  - lint
  - estilo
  - naming
  - convenção
  - padrão de código
  - documentação
---

# Code Quality

## Objetivo
Garantir que o código siga boas práticas reconhecidas (SOLID, DRY, KISS, Clean Code), com foco em legibilidade, manutenibilidade e consistência.

## Contexto necessário
- Linguagem/framework do projeto
- Guia de estilo existente (se houver)
- Foco: revisão geral ou área específica

## Fluxo (inspect → plan → consent → apply → audit)

1. **INSPECT** (read-only):
   - Verificar configuração de linter/formatter existente
   - Analisar convenções de naming (camelCase, snake_case, PascalCase)
   - Detectar violações de SOLID:
     - **S**ingle Responsibility: classes/funções com mais de 1 responsabilidade
     - **O**pen/Closed: código que exige modificação para extensão
     - **L**iskov Substitution: subclasses que quebram contratos
     - **I**nterface Segregation: interfaces muito grandes
     - **D**ependency Inversion: dependências concretas no lugar de abstrações
   - Detectar violações de DRY (duplicações)
   - Verificar documentação (JSDoc, docstrings, README)
   - Medir tamanho de funções/classes (threshold: 200 linhas/arquivo, 30 linhas/função)

2. **PLAN** — Propor melhorias categorizadas:

   | Categoria | Exemplo |
   |-----------|---------|
   | 📝 Naming | `data` → `userProfiles`, `fn` → `calculateDiscount` |
   | 📦 Estrutura | Extrair classe com 500 linhas em 3 módulos |
   | 📖 Documentação | Adicionar JSDoc em funções públicas |
   | 🔧 Linting | Configurar ESLint/Prettier/Ruff/Black |
   | 🧪 Testabilidade | Injetar dependências para facilitar mocks |

3. **CONSENT**: Confirmar antes de aplicar
4. **APPLY**: Gerar patches unificados para cada melhoria
5. **AUDIT**: Registrar métricas antes/depois

## Checklists por cenário

### Criando código novo
- [ ] Nomes descritivos (sem abreviações crípticas)
- [ ] Funções com no máximo 30 linhas e 1 responsabilidade
- [ ] Arquivos com no máximo 200-300 linhas
- [ ] Sem dados simulados fora de testes
- [ ] Comentários explicam "por quê", não "o quê"
- [ ] Tratamento de erros com mensagens úteis
- [ ] Tipos/interfaces/schemas definidos

### Revisando código existente
- [ ] Sem variáveis não utilizadas
- [ ] Sem imports não utilizados
- [ ] Sem TODO/FIXME sem prazo
- [ ] Sem console.log/print de debug em produção
- [ ] Sem credenciais hardcoded
- [ ] Sem números mágicos (extrair constantes)
- [ ] Sem funções com mais de 3 níveis de aninhamento

## Ferramentas recomendadas

| Categoria | JavaScript/TS | Python | Go |
|-----------|--------------|--------|-----|
| Linter | ESLint | Ruff, Pylint | golangci-lint |
| Formatter | Prettier | Black, Ruff format | gofmt |
| Type check | TypeScript | mypy, pyright | built-in |
| Docs | JSDoc, TypeDoc | Sphinx, mkdocs | godoc |
| Complexidade | ESLint complexity | radon | gocyclo |

## Regras de segurança
- ✅ Nunca alterar lógica de negócio durante refatoração de estilo
- ✅ Commits separados: formatação vs refatoração vs lógica
- ❌ Nunca introduzir um novo padrão sem remover o antigo
