---
name: mission-control
description: Orquestra a “Empresa de Agentes” via mission_control.json. Lê estado, cria tarefas, respeita dependências, executa em ticks e registra auditoria.
triggers:
  - mission control
  - fila
  - tarefas
  - orquestrar
  - equipe
  - sprint
  - tick
---

# Mission Control

## Onde fica o estado (IDE / opção B)
- `.agent/state/mission_control.json`
- outputs em `.agent/state/mission_control/`

## Regras
- READ-ONLY por padrão.
- Qualquer alteração no JSON ou criação de arquivos exige consentimento explícito.
- Sempre gerar PLANO com: tarefas criadas/atualizadas, arquivos afetados, riscos.

## Fluxo (Tick)
1) Ler `mission_control.json`.
2) Identificar tarefas `pending` cujo `depends_on` esteja resolvido.
3) Selecionar até `max_tasks_per_tick` tarefas.
4) Para cada tarefa:
   - ativar persona do `role` (sem “shell solto”)
   - executar a tarefa de forma segura
   - salvar resultado em `output_file`
   - atualizar status para `completed` (ou `failed`) com timestamp e notas
5) Registrar resumo em `history`.

## Consentimento reforçado
Se `output_file` já existir e a ação for sobrescrever, mostrar resumo/diff e pedir confirmação reforçada.
