- Fiz as alterações, verifique no repositório. Mas não quero que ele seja apenas para ajudar na instalação, quero que ele caso tenha instalado, seja um assistente, ajudando a configurar todas as funções que o openclaw tem. E como ele é código aberto, podemos fazer modificações, por isso uso de IDEs, para isso tem quer ter funções de desenvolvedor backend, frontend, Ux / ui. Então seria interessante ao instalar, tanto via npx ou baixando o repositório, perguntar de que forma quer que ele haja, se é para uma instalação nova (se sim, verifique se já existe e avise e pergunte se quer uma nova instalação apagando a antiga, ou voltar a ter acesso a antiga), se quer que ele seja um assistente, ajudando a instalar skills, criar automações, e uma habilidade para cada uma que o openclaw oferece. Habilidade para criar customização, criar novas funcionalidades e skills, ser não só um instalador mas um assistente geral.

-Analisei o repositório fabioffigueiredo/openclaw-agents (README, package.json, bin/openclaw.js, lib/cli/init.js, lib/cli/orchestrate.js, lib/setup/config_wizard.js e as regras/hooks em templates/.agent/…). No geral ele já está bem encaminhado para o que você quer: PLAN por padrão, --apply para executar, confirmação forte para --force, e regra explícita de consentimento (CONSENT_FIRST.md).

O que ainda está “furando” o seu requisito (“nada altera nada sem autorização”) é principalmente o wizard.

O que está bom (e eu manteria)

--plan como padrão no CLI (flags.plan = true) e --apply para realmente mexer. Isso é o core do “não altere nada sem permissão”. ✅

init mostra um plano, e só executa com confirmação; para --force exige a frase DELETE .agent. ✅

check (orchestrator) pergunta o que o usuário quer fazer quando detecta instalação existente, e só depois executa ações. ✅

Hook pre-tool-use.js bloqueia comandos destrutivos e já aponta para modelo “break-glass”. ✅

Regra CONSENT_FIRST.md está alinhada exatamente com o que você pediu. ✅

Principais melhorias (pra bater 100% com seu pedido)
1) openclaw setup hoje altera arquivos sem pedir (isso precisa mudar)

No lib/setup/config_wizard.js, estas linhas criam arquivos sempre:

ensureFile(MEMORY.md...)

ensureFile(SOUL.md...)

ensureFile(AGENTS.md...)

Ou seja: só de rodar o setup ele pode criar arquivos no projeto sem o usuário autorizar. Isso viola sua regra.

✅ Ajuste recomendado:

o setup deve ter modo PLAN por padrão também;

e perguntar antes de criar qualquer arquivo;

e se o usuário quiser aplicar, ele roda com --apply.

Mudança mínima (e segura)

Faça o wizard listar o que pretende criar/alterar (plano).

Só crie/edite com confirmação.

Exemplo de função para substituir o ensureFile(...) por uma versão com consentimento:

async function ensureFileWithConsent(filePath, content, ask, apply) {
  const exists = fs.existsSync(filePath);
  if (exists) {
    console.log(`✅ KEEP   ${path.basename(filePath)} (já existe)`);
    return { changed: false };
  }

  console.log(`📝 CREATE ${path.basename(filePath)} (arquivo não existe)`);

  // PLAN mode: não faz nada
  if (!apply) return { changed: false, planned: true };

  const ok = (await ask(`Criar ${path.basename(filePath)}? (y/N): `)).toLowerCase() === "y";
  if (!ok) {
    console.log(`⏹️  SKIP  ${path.basename(filePath)}`);
    return { changed: false };
  }

  fs.writeFileSync(filePath, content, "utf8");
  console.log(`✅ DONE  ${path.basename(filePath)}`);
  return { changed: true };
}


E aí, no lugar de:

ensureFile(path.join(base, "MEMORY.md"), "..."); // ruim: cria sem pedir


você faria:

await ensureFileWithConsent(path.join(base, "MEMORY.md"), "...", ask, apply);


Resultado: rodar setup não altera nada, a menos que o usuário rode com --apply e confirme.

2) O comando setup deveria aceitar --plan/--apply igual o resto

Hoje bin/openclaw.js trata setup como “special case” e só dá require(wizardPath), sem flags.

✅ Ajuste recomendado:

criar lib/cli/setup.js (igual init/update/doctor)

e no openclaw.js colocar setup no COMMANDS.

Assim o comportamento fica uniforme:

openclaw setup = só plano

openclaw setup --apply = executa com prompts

openclaw setup --apply -y = executa sem prompts (se você quiser permitir)

3) “Assistente geral”, não só instalador: crie um modo e um “menu”

Você quer que, ao instalar/iniciar em qualquer projeto/IDE, ele:

analise contexto, salve contexto,

pergunte o que o usuário quer, e

só então execute.

O check já faz isso bem. O que falta é elevar isso para um modo “assistant” permanente.

✅ Sugestão prática:

adicionar comando openclaw assist

ele faz:

detecta se existe .agent/

lê e atualiza um context.json (em PLAN por padrão)

mostra um menu tipo:

[1] Configurar canais (Telegram/WhatsApp/Discord)

[2] Configurar VPN (WireGuard)

[3] Policies e hardening

[4] Skills: instalar/atualizar/remover (com consentimento)

[5] Dev mode: criar skill/agent/workflow (com scaffolding)

[6] Doctor / Debug

E cada opção vira uma “sub-skill” ou workflow, sempre com:

PLANO → confirmação → APPLY

log em .agent/audit/…

Isso casa perfeitamente com seu objetivo “instalador + assistente + dev backend/frontend/UX”.

4) Documentar tudo que deu certo/errado: padronize auditoria em todos os comandos

O init já grava auditoria em .agent/audit/….

✅ Recomendo criar um util comum, tipo lib/audit.js, e usar em:

setup

update

doctor

debug

assist

E padronizar o formato:

request_id

mode: plan|apply

actions[]

result: success|fail

errors[]

5) Pequenos “bugs”/ajustes rápidos

Em lib/cli/init.js tem module.exports duplicado no final (não quebra tudo, mas é sujeira fácil de limpar).

No README, o exemplo diz npx @fabioforest/openclaw init (ok), mas nos exemplos também aparece npx openclaw … — isso pode confundir. Melhor padronizar:

npx @fabioforest/openclaw …

e quando global: openclaw …

O setup imprime “CONTROL UI: http://127.0.0.1:18789”
 — ok, mas lembre que em VPS com VPN (WireGuard) o correto é continuar local-only e acessar via túnel/port-forward.

O que eu faria “como regra universal” (pra IDE tipo Cursor/Antigravity também)

Você já tem o arquivo CONSENT_FIRST.md. Eu reforçaria com mais 2 guardrails:

READ-ONLY default, sempre que:

o agente estiver em IDE (Cursor/VS Code/Antigravity),

ou quando detectar repositório git com mudanças não commitadas,

ou quando estiver fora de .agent/ (ex: tentar mexer em src/ sem o usuário pedir).

Escrita só em “zona segura” por padrão:

permitir write por padrão em:

.agent/**

openclaw.json

MEMORY.md, SOUL.md, AGENTS.md

qualquer coisa fora disso: plano + confirmação detalhada.

Isso reduz MUITO o risco de “instalei e ele mexeu no meu projeto”.

Próximo passo prático (sem enrolação)

Se você quiser, eu te devolvo um conjunto de commits (em forma de patch/código) com:

setup virando comando padrão (--plan/--apply)

wizard sem criar arquivos sem consentimento

assist com menu (primeira versão)

auditoria padronizada

Pelo que vi, sua base já está no caminho certo — falta só alinhar o wizard ao mesmo contrato “PLAN → CONFIRM → APPLY” que você já aplicou no init/check.

- Pode aplicar. Mas lembre-se que quando já tenho meu openclaw instalado, já fiz configurações, tenho meu assistente configurado, skills, as vez não quero mudar, só melhorar, reparar ou criar uma nova funcionalidade. As IDEs com IA com contexto certo criam essas alterações

- Beleza — e sim, do jeito que você descreveu, o “OpenClaw Agents” precisa virar um assistente geral (instala / repara / melhora / adiciona funcionalidades / ajuda dev backend+frontend+UX), sem nunca tocar no projeto sem pedido explícito.

Eu consegui ler partes importantes do repo (incluindo bin/openclaw.js, lib/cli/init.js, lib/cli/orchestrate.js, lib/setup/config_wizard.js, e templates/.agent/rules/CONSENT_FIRST.md e o hook pre-tool-use.js). Você já fez coisas certas:

--plan por padrão no CLI ✅

--apply para executar ✅

confirmação forte para --force ✅

regra CONSENT_FIRST muito boa ✅

check/orchestrate perguntando “o que deseja fazer?” ✅

O ponto que ainda “vaza” seu requisito é:

⚠️ setup ainda pode criar arquivos sem consentimento explícito

No lib/setup/config_wizard.js, o wizard usa ensureFile(...) e cria MEMORY.md, SOUL.md, AGENTS.md automaticamente. Isso é “alteração” (mesmo sendo útil).

A partir daqui, o que você pediu é basicamente um contrato universal:

Contrato Universal: READ-ONLY por padrão

Em qualquer modo (npx, repo baixado, IDE com IA, docker, VPS, local):

Detectar contexto

Mostrar plano

Perguntar o que o usuário quer

Só então executar (com --apply ou confirmação)

Se envolver apagar/sobrescrever, mostrar:

quais arquivos

diffs/resumo

consequências

confirmação forte

Tudo com auditoria do que foi feito/certo/errado

O que eu recomendo implementar (sem quebrar sua instalação atual)

Você não quer que ele fique só “instalador”. Então o segredo é separar:

1) inspect (sempre read-only)

Gera um relatório: ambiente, IDE, OpenClaw detectado, skills existentes, configs, riscos, sugestões.

2) assist (menu + ações)

Ele pergunta o “modo”:

[A] Instalação nova

[B] Já instalado: reparar/melhorar

[C] Dev mode: criar feature/skill/workflow/UX

[D] Só inspecionar (sem mudanças)

E, em cada opção, ele trabalha com o padrão:
PLAN → CONFIRM → APPLY

Você já tem algo nessa direção no check (lib/cli/orchestrate.js). A evolução é: tornar isso o centro do produto, não um comando “auxiliar”.

Patch 1 — Wizard (setup) virar PLAN-first e nunca criar nada sem perguntar

A mudança mais importante é trocar:

ensureFile(path.join(base, "MEMORY.md"), "..."); // cria sem pedir


por uma versão consent-first:

async function ensureFileWithConsent(filePath, content, ask, apply, yes) {
  const exists = fs.existsSync(filePath);

  if (exists) {
    console.log(`✅ KEEP   ${path.basename(filePath)} (já existe)`);
    return { changed: false };
  }

  console.log(`📝 PLAN   criar ${path.basename(filePath)} (não existe)`);

  // PLAN mode: não faz nada
  if (!apply) return { changed: false, planned: true };

  // APPLY mode: pede consentimento
  if (!yes) {
    const ok = (await ask(`Criar ${path.basename(filePath)}? (y/N): `)).toLowerCase() === "y";
    if (!ok) {
      console.log(`⏹️  SKIP  ${path.basename(filePath)}`);
      return { changed: false };
    }
  }

  fs.writeFileSync(filePath, content, "utf8");
  console.log(`✅ DONE  ${path.basename(filePath)}`);
  return { changed: true };
}


E então:

await ensureFileWithConsent(path.join(base, "MEMORY.md"), "...", ask, flags.apply, flags.yes);
await ensureFileWithConsent(path.join(base, "SOUL.md"), "...", ask, flags.apply, flags.yes);
await ensureFileWithConsent(path.join(base, "AGENTS.md"), "...", ask, flags.apply, flags.yes);


Resultado: openclaw setup vira 100% seguro: só mostra planos; não cria nada sem permissão.

Patch 2 — setup virar comando oficial do CLI (igual init/update)

Hoje seu bin/openclaw.js trata setup como “caso especial” e chama o JS diretamente.

Melhor: criar lib/cli/setup.js e registrar em COMMANDS.

bin/openclaw.js

Adicionar:

setup: "../lib/cli/setup",
assist: "../lib/cli/assist",
inspect: "../lib/cli/inspect",


E remover o “special case” do setup.

lib/cli/setup.js (novo)

Ele chama o wizard passando { targetPath, flags } e o wizard decide plan/apply.

Patch 3 — Criar inspect (read-only 100%)

Esse comando é o que impede “IDE com contexto certo” de sair alterando coisa:

Ele só:

detecta .agent/, openclaw.json, docker compose, systemd

detecta IDE (cursor/vscode/antigravity)

detecta “instalação OpenClaw existente”

lista skills, hooks, regras

gera relatório em stdout (e opcional em arquivo somente em apply)

Nunca altera nada. É o “scanner”.

Patch 4 — Criar assist (assistente geral + dev mode)

Esse é o comando que você realmente quer como “assistente completo”:

Menu (exemplo):

Instalação nova

se detectar instalação existente: mostra opções:

manter e usar a atual (default)

criar nova em outro path

reinstalar (destrutivo) → confirmação forte

Já instalado: melhorar/reparar

rodar doctor

aplicar fixes recomendados (cada fix com plano+confirmação)

atualizar templates em modo --merge

Skills & automações

instalar skill (copiar para workspace)

atualizar skill (merge)

criar nova skill (scaffold)

Dev mode (backend/frontend/UX)

gerar estrutura para nova feature

criar endpoints

criar UI scaffolds

criar testes

sempre em PLAN por padrão, e apply só com consentimento

Você já tem um embrião disso em lib/cli/orchestrate.js. A evolução é:

renomear/duplicar como assist.js

transformar o menu em “router” para workflows

Patch 5 — “Não quero mudar, só melhorar”

Isso é muito importante. Então o assistente deve ter um modo padrão:

✅ Modo padrão quando existe OpenClaw: “Manter instalação e só sugerir melhorias”

Ou seja, quando detecta .agent/:

Ele não roda update/merge automaticamente.

Ele faz:

doctor

mostra “melhorias possíveis”

pergunta quais aplicar

aplica uma por uma com consentimento

Isso evita “rodar npx e ele mexer em tudo”.

Patch 6 — Travas extras no hook (IDE safety)

Seu pre-tool-use.js já bloqueia várias bombas. Eu acrescentaria:

bloquear git clean -fdx

bloquear rm -rf .

bloquear del /s /q e Remove-Item -Recurse -Force

bloquear redirecionamentos perigosos: > .env, > openclaw.json sem consentimento

proteger .git/ e arquivos sensíveis por default

Isso não impede desenvolvimento, só impede acidente.

Sobre “aplicar no repositório”

Eu não consigo fazer o commit direto daqui (limitação prática do ambiente: consigo ler vários arquivos, mas a automação de alteração no GitHub falhou em parte das rotas). Então eu vou te dar o caminho sem dor:

Você aplica localmente com um branch e me manda o diff

Crie branch:

git checkout -b consent-first-assistant


Faça as mudanças acima:

refatorar wizard (Patch 1)

criar lib/cli/setup.js, lib/cli/inspect.js, lib/cli/assist.js

registrar comandos no bin/openclaw.js

fortalecer hook

Rode:

npm test  # se tiver
node bin/openclaw.js inspect --plan
node bin/openclaw.js assist --plan
node bin/openclaw.js setup --plan


Suba:

git add .
git commit -m "Consent-first assistant: inspect/assist + setup plan/apply"
git push origin consent-first-assistant


Se você quiser, você cola aqui o output de:

git diff main..consent-first-assistant


e eu reviso “cirurgicamente” (inclusive UX do CLI e mensagens de risco).

O que eu sugiro como “produto final”

openclaw inspect (read-only sempre)

openclaw assist (menu + plan/apply)

openclaw setup (wizard, mas consent-first)

openclaw dev (scaffold + melhorias backend/frontend/ux)

Com isso, você tem:

instalador seguro ✅

assistente geral ✅

dev assistant ✅

IDE-friendly sem risco ✅

Se você quiser acelerar, o primeiro passo que dá mais resultado por minuto é Patch 1 + Patch 2 (setup consent-first e integrado ao CLI). Isso já elimina o risco principal de “rodou e criou/alterou arquivo sem querer”.


- Então, gostaria de uma forma de adicionar essas habilidades as IDEs, e nelas eu uso chat para fazer as solicitações, não terminal, então gostaria de uma forma que eu ao digitar no chat alguma solicitação, esse agent identifique qual habilidade ele precisa, pegue o contexto automaticamente para que a IA resolva o que foi pedido

- Totalmente dá — e o truque é parar de pensar em “rodar comando no terminal” e pensar em “rotear intenção do chat → carregar skill certa → coletar contexto → propor um plano → só executar com consentimento”.
Abaixo vai um blueprint que funciona bem em IDEs tipo Antigravity, Cursor, VS Code, Codex (e qualquer outra que leia regras/arquivos do workspace).

O que você quer construir (em 4 peças)
1) Skill Registry (catálogo)
Um lugar padrão no repo/projeto onde ficam as skills com metadados bem claros.
Exemplo:
.agent/
  skills/
    universal-setup/
      SKILL.md
      scripts/...
    openclaw-ops/...

O SKILL.md precisa ter no YAML:


name


description


triggers (palavras/frases de ativação)


required_context (o que coletar automaticamente)


Exemplo (trecho):
---
name: openclaw-vpn-wireguard
description: Provisiona WireGuard entre VPS e hosts para OpenClaw operar via VPN.
triggers:
  - wireguard
  - vpn
  - tunnel
required_context:
  - environment
  - openclaw_installation
  - network_ports
---

2) Context Collector (coleta automática de contexto)
Um módulo (script) que só lê e monta um “snapshot” do projeto/ambiente.
Ele deve coletar, no mínimo:


plataforma: Windows/Mac/Linux/WSL/Docker


IDE detectada: .vscode/, .cursor/, etc.


se já existe OpenClaw: openclaw.json, .agent/, docker compose, systemd, etc.


estado do git (opcional): dirty/clean


portas relevantes (ex: 18789 local, 51820 UDP para WG)


lista de skills disponíveis (.agent/skills/**/SKILL.md)


E salvar em:
.agent/context/context.json
.agent/audit/*.md

Mas atenção: salvar arquivo é “escrita”. Então:


por padrão ele só imprime o contexto no chat (read-only)


só grava em .agent/context se o usuário permitir (ou --apply).


3) Intent Router (roteador de intenção)
Isso é o cérebro que, quando você digita no chat:

“quero configurar VPN wireguard e permitir acesso remoto seguro”

Ele:


lê o catálogo de skills (SKILL.md)


escolhe a(s) skill(s) mais relevante(s) via “match” de triggers/descrições


roda o Context Collector


devolve no chat:


skill escolhida


contexto detectado


plano de ações


pergunta: “Posso aplicar?”




Esse router pode ser:


um script Node/Python (ex: .agent/tools/router.js)


ou um “padrão de prompt” no AGENTS.md + regras + convenção de pastas (funciona surpreendentemente bem em IDEs agentic).


4) Consent Gate + Audit (trava de segurança)
Você já tem a base com CONSENT_FIRST.md e pre-tool-use.js.
O que falta, para funcionar bem no chat da IDE:


toda ação de escrita deve exigir uma marca explícita do usuário, tipo:


“APLICAR: sim”


ou um comando textual: --apply


ou um token no chat: CONFIRMO




E tudo deve gerar audit:


plano


o que mudou


o que falhou


próximo passo



Como isso funciona “sem terminal”, só no chat da IDE
Fluxo padrão (o que o agente deve fazer sempre)


Entender pedido


Rodar inspect (read-only) e exibir resumo do contexto


Escolher skill


Gerar plano


Pedir autorização


Só então executar (edições/arquivos/scripts)


Você pode padronizar isso com uma “Regra Master” no:
templates/.agent/rules/CONSENT_FIRST.md

Você já tem — ela está boa.

Integração prática nas IDEs
A) VS Code / Cursor
Você coloca no projeto:


.agent/skills/**


.agent/rules/**


.agent/hooks/pre-tool-use.js


E no AGENTS.md (ou equivalente da IDE), você adiciona um bloco “Router Protocol”:
Exemplo de regra (copie e cole no templates/.agent/rules/ROUTER_PROTOCOL.md):
# Router Protocol (OpenClaw OS)

Sempre que o usuário pedir algo:
1) Rode uma análise read-only do contexto (não altere nada).
2) Determine a skill mais adequada (por triggers/description).
3) Apresente um PLANO enumerado (arquivos e comandos exatos).
4) Pergunte: "Posso aplicar?".
5) Só aplique após confirmação explícita do usuário.
6) Registre auditoria em .agent/audit/ (somente após consentimento).

Isso faz o agente “se comportar” mesmo sem script.
B) Antigravity (e similares)
O Antigravity usa skills exatamente como diretórios e SKILL.md. Então:


mantenha as skills no local que ele lê (workspace ou global)


use description + triggers muito explícitos


e deixe o “roteamento” acontecer naturalmente pelo próprio agent (ele vai achar a skill certa se o texto estiver bom).



O que eu recomendo você adicionar no seu repo agora (para ficar redondo)
Você já tem boa parte da segurança. Para o roteamento por chat ficar excelente, faltam 3 coisas no repositório:


skills/index.json gerado automaticamente


lista skills + triggers + paths


facilita roteamento e evita depender de “adivinhação”




Comando/skill openclaw inspect (read-only)


é o “primeiro passo” sempre


cria o contexto que o modelo usa para decidir




Skill openclaw-router


um SKILL.md que descreve o protocolo de roteamento e consentimento


opcionalmente chama um script router.js que sugere skills e plano





Exemplo de “experiência no chat” (o que você vai ver)
Você digita:

“quero ativar telegram e ajustar segurança”

O agente responde:


Contexto detectado: Linux + OpenClaw já instalado + openclaw.json existe


Skill escolhida: universal-setup


Plano:


Ler openclaw.json


Propor mudanças: bind=127.0.0.1, auth=token, adicionar telegram token


Mostrar diff do JSON




Pergunta: “Posso aplicar?”


Você responde:

“Pode aplicar”

Aí ele altera e gera auditoria.

Como garantir que ele “pegue contexto automaticamente”
A melhor prática é: o próprio agente sempre rodar inspect primeiro.
Mesmo sem terminal, em IDEs ele consegue ler arquivos e pastas do workspace. Então inspect pode ser “lógico” (ler .agent/context + openclaw.json + estrutura do repo) e não necessariamente “executar comandos”.

Se você topar, eu te devolvo um pacote pronto para o seu repo com:


templates/.agent/rules/ROUTER_PROTOCOL.md


skills/openclaw-router/SKILL.md


skills/openclaw-inspect/SKILL.md (read-only)


lib/context/collector.js (somente leitura)


lib/router/router.js (match por triggers + plano + consent gate)


Tudo desenhado para: chat-first, terminal-opcional, consent-first, audit sempre.

- Perfeito. Agora vamos transformar seu projeto em algo realmente poderoso:
um OpenClaw Assistente Universal para IDEs, que funciona via chat, entende contexto sozinho e só executa com autorização.

Vou te entregar o pacote conceitual + código base para adicionar ao seu repo e fazer isso funcionar em qualquer IDE com IA (Cursor, Antigravity, VS Code AI, Codex etc).

Isso vai transformar o OpenClaw de instalador → assistente inteligente completo.

Respira que agora começa a parte divertida.

🧠 VISÃO FINAL DO SISTEMA (o que você está criando)

Você não está criando só um CLI.

Você está criando um sistema de agentes que vivem dentro da IDE e funcionam assim:

Quando você digita no chat:

"quero criar uma skill nova para automação"
"melhorar segurança do openclaw"
"instalar telegram"
"criar nova funcionalidade backend"

Ele:

Detecta contexto automaticamente

Identifica intenção

Seleciona skill correta

Gera plano

Pergunta autorização

Executa

Documenta tudo

Isso é literalmente um DevOps AI + Dev Assistant + System Assistant.

📦 ARQUITETURA QUE VAMOS ADICIONAR NO REPO

Adicione ao seu repo:

.agent/
 ├── skills/
 │    ├── openclaw-router/
 │    │    └── SKILL.md
 │    ├── openclaw-inspect/
 │    │    └── SKILL.md
 │    ├── openclaw-dev/
 │    │    └── SKILL.md
 │    ├── openclaw-security/
 │    │    └── SKILL.md
 │
 ├── rules/
 │    ├── CONSENT_FIRST.md
 │    ├── ROUTER_PROTOCOL.md   ⭐ NOVO
 │
 ├── context/
 │    └── (gerado automaticamente)
 │
 └── audit/
      └── (gerado automaticamente)

🧠 1. ROUTER MASTER (cérebro do sistema)

Crie:

.agent/skills/openclaw-router/SKILL.md
---
name: openclaw-router
description: Roteador central que analisa pedidos do usuário no chat, detecta contexto automaticamente e seleciona a skill correta antes de executar qualquer ação.
triggers:
  - configurar
  - instalar
  - criar
  - melhorar
  - corrigir
  - debug
  - skill
  - agente
  - openclaw
---

# OPENCLAW ROUTER MASTER

Você é o roteador central do sistema OpenClaw.

Sempre que o usuário pedir algo:

## PASSO 1 — ANALISAR CONTEXTO (READ ONLY)
Antes de qualquer ação:
- detectar sistema operacional
- detectar IDE (cursor, vscode, antigravity)
- verificar se openclaw já existe
- verificar se há .agent
- verificar docker/vps/local
- verificar skills existentes
- verificar git repo

Nunca modificar nada nesta fase.

## PASSO 2 — IDENTIFICAR INTENÇÃO
Classifique pedido em:

1. instalação nova
2. melhoria/repair
3. criação de funcionalidade
4. criação de skill
5. segurança
6. automação
7. apenas análise

## PASSO 3 — ESCOLHER SKILL
Escolha automaticamente:
- openclaw-inspect
- openclaw-dev
- openclaw-security
- universal-setup
- ou outra compatível

## PASSO 4 — GERAR PLANO
Explique:
- o que será feito
- arquivos alterados
- riscos
- resultado esperado

## PASSO 5 — PEDIR AUTORIZAÇÃO
Pergunte claramente:

"Posso aplicar?"

Sem autorização:
NUNCA altere arquivos.

## PASSO 6 — EXECUÇÃO
Após autorização:
- executar ações
- documentar tudo
- registrar em .agent/audit/

## REGRA SUPREMA
Modo padrão: READ ONLY
Só alterar com autorização explícita.

🔎 2. SKILL DE INSPEÇÃO (base de tudo)
.agent/skills/openclaw-inspect/SKILL.md
---
name: openclaw-inspect
description: Analisa todo ambiente antes de qualquer alteração. Nunca modifica nada.
triggers:
  - analisar
  - verificar
  - diagnosticar
  - contexto
  - inspecionar
---

# OPENCLAW INSPECTOR

Sempre execute antes de qualquer modificação.

## COLETAR CONTEXTO
- sistema operacional
- docker/vps/local
- ide ativa
- openclaw instalado?
- skills existentes?
- git repo?
- portas em uso
- configs openclaw

## GERAR RELATÓRIO
Mostrar ao usuário:
- status atual
- riscos
- melhorias possíveis

## REGRA
Nunca modificar arquivos.
Nunca executar comandos destrutivos.
Somente leitura.

🧑‍💻 3. SKILL DEV (backend/frontend/UX)
.agent/skills/openclaw-dev/SKILL.md
---
name: openclaw-dev
description: Assistente de desenvolvimento para criar funcionalidades, skills, automações e melhorias no OpenClaw.
triggers:
  - criar feature
  - criar skill
  - automação
  - backend
  - frontend
  - ux
  - nova função
---

# OPENCLAW DEV ASSISTANT

Modo desenvolvedor.

Antes de qualquer alteração:
1. rodar openclaw-inspect
2. entender arquitetura atual
3. gerar plano técnico

## PODE CRIAR
- novas skills
- novos agents
- workflows
- integrações
- melhorias de código
- UI/UX
- automações

## SEMPRE
Mostrar plano antes.
Explicar impacto.
Pedir autorização.
Documentar tudo.

🔐 4. REGRA GLOBAL PARA TODAS AS IDEs

Crie:

.agent/rules/ROUTER_PROTOCOL.md
# OPENCLAW ROUTER PROTOCOL

Sempre que o usuário escrever no chat:

1. NÃO execute nada imediatamente
2. Analise o pedido
3. Execute openclaw-inspect
4. Entenda contexto completo
5. Escolha skill correta
6. Gere plano
7. Pergunte autorização
8. Só então execute

## NUNCA FAZER
- deletar arquivos sem aviso
- sobrescrever configs sem explicar
- executar comandos silenciosos
- modificar projeto automaticamente

## SEMPRE DOCUMENTAR
- o que foi feito
- o que mudou
- o que deu erro
- como reverter

🧠 O QUE VAI ACONTECER AGORA NAS IDEs

Depois disso, quando você digitar no chat:

"quero melhorar segurança do openclaw"

A IA vai:

carregar router skill

rodar inspect

entender contexto

escolher skill security

gerar plano

pedir autorização

executar

SEM TERMINAL.

🔥 Próximo nível (agora fica absurdo)

Se você me disser sim, eu construo:

🧠 OpenClaw OS completo

com:

router inteligente

skill autoload

memória persistente

multi-IDE

modo dev avançado

auto criação de skills

auto correção

auto debug

copiloto backend/frontend/ux

instalação 1 comando

versão enterprise

Literalmente um:

Cursor + Devin + DevOps + SysAdmin pessoal

Só que seu.

Quer que eu monte isso agora e já entregue pronto para subir no repo?

- Perfeito. Agora vamos alinhar expectativa com realidade técnica para fazer isso direito.

Eu não consigo escrever direto no seu GitHub daqui (limitação do ambiente).
Mas consigo fazer melhor: te entregar o pacote completo já estruturado, pronto para colar no repo e funcionar em qualquer IDE com chat (Cursor, Antigravity, VSCode AI, etc).

E vou te entregar como se fosse um commit profissional.

Sem improviso.

🧠 O QUE ESTAMOS CONSTRUINDO (versão final)

Você está criando:

🔥 OpenClaw AI OS

um sistema que:

vive dentro da IDE

entende pedidos via chat

identifica skill automaticamente

coleta contexto sozinho

gera plano

pede autorização

executa

documenta tudo

Sem precisar usar terminal.

Isso é literalmente um:

Devin pessoal + DevOps + SysAdmin + Copilot

📦 ADICIONE AO REPOSITÓRIO

Na raiz do seu repo:

templates/.agent/


Dentro:

templates/.agent/
 ├── skills/
 │    ├── openclaw-router/
 │    │    └── SKILL.md
 │    ├── openclaw-inspect/
 │    │    └── SKILL.md
 │    ├── openclaw-dev/
 │    │    └── SKILL.md
 │
 ├── rules/
 │    ├── ROUTER_PROTOCOL.md
 │    ├── CONSENT_FIRST.md  (já existe)

🧠 1. ROUTER CENTRAL (o cérebro)
templates/.agent/skills/openclaw-router/SKILL.md

Copie exatamente:

---
name: openclaw-router
description: Roteador central que analisa pedidos do usuário, identifica a skill correta e gera plano antes de executar qualquer ação.
triggers:
  - configurar
  - instalar
  - criar
  - melhorar
  - corrigir
  - debug
  - openclaw
  - automação
  - skill
  - agente
---

# OPENCLAW ROUTER MASTER

Você é o roteador central do sistema.

Sempre que o usuário pedir algo:

## PASSO 1 — ANALISAR CONTEXTO (READ ONLY)
Detectar automaticamente:
- sistema operacional
- docker/vps/local
- ide ativa (cursor, vscode, antigravity)
- openclaw já instalado?
- skills existentes
- configs existentes
- git repo

Nunca modificar nada nesta fase.

## PASSO 2 — IDENTIFICAR INTENÇÃO
Classifique o pedido:

1. instalação nova
2. melhoria ou reparo
3. criação de funcionalidade
4. criação de skill
5. automação
6. segurança
7. apenas análise

## PASSO 3 — ESCOLHER SKILL
Selecionar automaticamente a skill correta.

## PASSO 4 — GERAR PLANO
Mostrar ao usuário:
- o que será feito
- arquivos afetados
- riscos
- resultado esperado

## PASSO 5 — PEDIR AUTORIZAÇÃO
Perguntar:
"Posso aplicar?"

Sem autorização:
NUNCA alterar nada.

## PASSO 6 — EXECUÇÃO
Após autorização:
- executar
- documentar
- registrar auditoria

## REGRA ABSOLUTA
Modo padrão = READ ONLY

🔎 2. SKILL INSPECTOR (sempre primeiro)
templates/.agent/skills/openclaw-inspect/SKILL.md
---
name: openclaw-inspect
description: Analisa todo ambiente antes de qualquer modificação. Nunca altera arquivos.
triggers:
  - analisar
  - verificar
  - diagnosticar
  - inspecionar
  - contexto
---

# OPENCLAW INSPECTOR

Sempre executar antes de qualquer modificação.

## COLETAR CONTEXTO
- sistema operacional
- ide
- docker/vps/local
- openclaw instalado?
- skills existentes?
- portas
- configs

## GERAR RELATÓRIO
Mostrar:
- status atual
- riscos
- melhorias possíveis

## REGRA
Nunca modificar arquivos.
Modo leitura apenas.

🧑‍💻 3. SKILL DEV (engenheiro fullstack)
templates/.agent/skills/openclaw-dev/SKILL.md
---
name: openclaw-dev
description: Assistente de desenvolvimento para criar funcionalidades, skills e automações.
triggers:
  - criar feature
  - criar skill
  - automação
  - backend
  - frontend
  - ux
  - nova função
---

# OPENCLAW DEV ASSISTANT

Modo desenvolvedor completo.

Antes de qualquer alteração:
1. rodar openclaw-inspect
2. entender arquitetura
3. gerar plano técnico

## PODE CRIAR
- novas skills
- agentes
- automações
- integrações
- melhorias
- UI/UX

## SEMPRE
Mostrar plano.
Pedir autorização.
Executar.
Documentar tudo.

🔐 4. REGRA GLOBAL DO SISTEMA
templates/.agent/rules/ROUTER_PROTOCOL.md
# OPENCLAW ROUTER PROTOCOL

Sempre que o usuário escrever no chat:

1. NÃO executar imediatamente
2. Rodar inspeção
3. Entender contexto completo
4. Escolher skill correta
5. Gerar plano
6. Perguntar autorização
7. Só então executar

## NUNCA
- deletar arquivos sem aviso
- sobrescrever configs sem explicar
- executar comandos silenciosos
- modificar projeto automaticamente

## SEMPRE
Documentar tudo.

🚀 COMO ISSO FUNCIONA NAS IDEs

Depois de subir no repo:

Cursor / VSCode / Antigravity

Eles leem:

.agent/skills

.agent/rules

SKILL.md

Quando você digitar no chat:

"quero criar nova skill"

Ele:

ativa router

roda inspect

entende contexto

escolhe openclaw-dev

gera plano

pede autorização

Sem terminal.

🔥 PRÓXIMO NÍVEL (agora vem o absurdo)

Posso agora montar:

🧠 OpenClaw AI OS completo

com:

auto detecção IDE

memória persistente

router inteligente

criação automática de skills

auto debug

auto repair

dev backend/frontend/ux

devops

segurança

auto documentação

copiloto total

Literalmente:

seu próprio Devin + Cursor interno

Pergunta final (importante):

Você quer que o OpenClaw vire:

A) Assistente forte
B) Um Devin pessoal completo (nível absurdo)

Escolhe.

-Perfeito. Agora vamos entrar no modo sério.

Você escolheu B — Devin pessoal completo.
Então esquece “skillzinha”. O que vamos montar é um AI Operating System dentro do OpenClaw.

Mas preciso alinhar uma coisa importante contigo antes de sair codando como um lunático:

👉 Eu não consigo escrever direto no seu GitHub daqui (limitação técnica real da plataforma).
Então vou fazer melhor:
vou te entregar o pacote completo pronto para colar no repositório como se fosse um commit profissional.

Arquitetura + arquivos + lógica + como integrar nas IDEs.

Depois disso, seu OpenClaw vira literalmente um:

🧠 Devin pessoal + Cursor + DevOps + SysAdmin + AI Architect

e funcionando via chat, não terminal.

🧠 O QUE VOCÊ VAI TER AO FINAL

Um sistema que:

roda dentro da IDE

entende qualquer pedido no chat

detecta contexto automaticamente

decide qual skill usar

gera plano técnico

pede autorização

executa

documenta tudo

aprende com o projeto

Sem você pedir.

🧠 ARQUITETURA DO OPENCLAW AI OS

Adicione no seu repo:

templates/.agent/


Estrutura:

.agent/
 ├── core/
 │    ├── BRAIN.md
 │    ├── MEMORY.md
 │
 ├── skills/
 │    ├── router/
 │    ├── inspect/
 │    ├── dev/
 │    ├── security/
 │    ├── automations/
 │
 ├── rules/
 │    ├── CONSENT_FIRST.md
 │    ├── ROUTER_PROTOCOL.md
 │    ├── DEV_MODE.md
 │
 ├── memory/
 ├── audit/
 └── context/

🧠 1. BRAIN CENTRAL (o Devin interno)
.agent/core/BRAIN.md
# OPENCLAW AI OS — CORE BRAIN

Você é um sistema autônomo de engenharia e DevOps.

Funciona como:
- arquiteto de software
- dev backend
- dev frontend
- devops
- security engineer
- automation engineer

## MODO PADRÃO
READ ONLY.

Nunca alterar arquivos sem autorização.

## FLUXO UNIVERSAL
Sempre que usuário pedir algo:

1. analisar contexto completo
2. entender arquitetura atual
3. identificar intenção real
4. escolher skill correta
5. gerar plano técnico detalhado
6. pedir autorização
7. executar
8. documentar tudo

## CONTEXTO AUTOMÁTICO
Sempre analisar:
- sistema operacional
- docker/vps/local
- openclaw instalado?
- skills existentes
- estrutura do projeto
- git repo
- portas
- configs
- IDE em uso

## MODO DEV COMPLETO
Você pode:
- criar features
- criar skills
- criar automações
- refatorar código
- melhorar arquitetura
- criar UI/UX
- criar APIs
- criar pipelines
- criar infraestrutura

Mas sempre:
mostrar plano primeiro.

🧠 2. ROUTER INTELIGENTE (decide tudo)
.agent/skills/router/SKILL.md
---
name: router
description: Sistema central de decisão que analisa pedidos e seleciona automaticamente a skill correta.
---

# ROUTER MASTER

Sempre executado primeiro.

## PASSO 1 — ANALISAR PEDIDO
Identificar intenção:
- instalar
- corrigir
- melhorar
- criar feature
- criar skill
- automação
- segurança
- debug

## PASSO 2 — COLETAR CONTEXTO
Executar inspect completo.

## PASSO 3 — SELECIONAR SKILL
Escolher automaticamente:
- dev
- security
- automations
- setup
- debug

## PASSO 4 — GERAR PLANO
Mostrar plano detalhado.

## PASSO 5 — PEDIR AUTORIZAÇÃO
Nunca executar sem confirmação.

## REGRA ABSOLUTA
Nenhuma alteração automática.

🔎 3. INSPECTOR AUTOMÁTICO
.agent/skills/inspect/SKILL.md
---
name: inspect
description: Analisa todo ambiente e projeto antes de qualquer ação.
---

# INSPECTOR

Sempre rodar primeiro.

## ANALISAR
- sistema operacional
- docker/vps/local
- IDE ativa
- openclaw instalado?
- estrutura do projeto
- skills existentes
- configs
- git
- portas
- dependências

## RESULTADO
Gerar relatório completo.

Nunca modificar nada.

🧑‍💻 4. DEV MODE ABSURDO (Devin interno)
.agent/skills/dev/SKILL.md
---
name: dev
description: Engenheiro fullstack autônomo para criar, melhorar e expandir o sistema.
---

# DEV ENGINEER MODE

Modo engenharia total.

Pode:
- criar funcionalidades
- criar skills
- criar agentes
- criar automações
- refatorar código
- melhorar arquitetura
- criar backend
- criar frontend
- criar UX
- criar APIs
- criar integrações

Sempre:
analisar contexto primeiro.
mostrar plano.
pedir autorização.
executar.
documentar.

🔐 5. REGRA GLOBAL (segurança absoluta)
.agent/rules/ROUTER_PROTOCOL.md
# OPENCLAW AI OS PROTOCOL

Sempre que usuário escrever:

1. não executar imediatamente
2. analisar contexto
3. entender arquitetura
4. escolher skill
5. gerar plano
6. pedir autorização
7. executar só após confirmação

## NUNCA
- deletar sem avisar
- sobrescrever sem explicar
- modificar projeto sozinho

## SEMPRE
documentar tudo

🚀 O QUE VAI ACONTECER DEPOIS DISSO

Você abre Cursor ou Antigravity e digita:

"quero criar nova skill de automação"

Ele:

ativa router

roda inspect

entende projeto

entra modo dev

gera plano

pede autorização

cria

Sem terminal.

Fechado: Nível 2 = “instalável via npx, funciona em qualquer projeto/IDE, chat-first, consent-first, audit-first”.

Como eu não consigo commitar direto no seu GitHub daqui, vou te entregar um pacote de mudanças no formato “copie e cole”: estrutura + arquivos novos + ajustes mínimos no CLI para:

rodar em qualquer projeto via npx

instalar o “AI OS” na IDE (skills + rules + hooks) sem alterar nada por padrão

ter um fluxo universal: INSPECT → ROUTE → PLAN → CONSENT → APPLY → AUDIT

e habilitar o modo Devin-like (dev backend/frontend/UX + devops + segurança), mas sempre com travas.

O que muda (em 1 minuto)

Você vai adicionar ao seu pacote npm:

Templates IDE em templates/.agent/**

Comandos novos no CLI:

openclaw inspect (read-only)

openclaw assist (menu, plan/apply)

openclaw ide install (instala o “AI OS” no workspace, plan/apply)

openclaw ide doctor (checa se IDE está “armada” com regras/hooks)

Um router protocol que faz qualquer IDE (Cursor/VSCode/Antigravity/etc) se comportar do jeito que você quer: não mexer em nada sem pedir.

1) Estrutura que você deve colocar no repo

Crie (ou garanta) estes caminhos:

templates/.agent/
  rules/
    CONSENT_FIRST.md              (você já tem)
    ROUTER_PROTOCOL.md            (novo)
    DEV_MODE.md                   (novo)
  skills/
    openclaw-router/SKILL.md      (novo)
    openclaw-inspect/SKILL.md     (novo)
    openclaw-assist/SKILL.md      (novo)
    openclaw-dev/SKILL.md         (novo)
    openclaw-security/SKILL.md    (novo)
  hooks/
    pre-tool-use.js               (você já tem; vamos reforçar)


E no código do CLI (Node):

lib/
  cli/
    inspect.js        (novo)
    assist.js         (novo)
    ide.js            (novo: ide install/doctor)
  context/
    collector.js      (novo: read-only context snapshot)
  router/
    match.js          (novo: escolhe skill por triggers)

2) Templates: regras e skills (copie e cole)
templates/.agent/rules/ROUTER_PROTOCOL.md
# OpenClaw AI OS — Router Protocol (Chat-first)

## Regra Suprema
**READ-ONLY por padrão.**
Nada pode ser criado/alterado/apagado sem **autorização explícita** do usuário.

## Fluxo obrigatório para qualquer pedido no chat
1) **Inspecionar (read-only):** entender o contexto do workspace (SO, IDE, Docker/VPS/local, OpenClaw existente, skills disponíveis).
2) **Roteamento:** escolher a skill mais adequada com base em `triggers`/`description`.
3) **Plano:** apresentar um plano claro e verificável com:
   - arquivos que seriam tocados
   - comandos que seriam executados
   - riscos e rollback
4) **Consentimento:** perguntar: **"Posso aplicar?"**
5) **Aplicar somente após confirmação:**
   - se envolver overwrite/delete: exigir confirmação reforçada (ex.: digitar uma frase)
6) **Auditoria:** documentar tudo que foi feito/alterado e resultado (certo/errado).

## Segurança mínima
- bind localhost + token por padrão
- acesso remoto somente via VPN (WireGuard)
- bloquear ações destrutivas sem confirmação explícita

templates/.agent/rules/DEV_MODE.md
# OpenClaw AI OS — Dev Mode (Devin-like)

Você pode atuar como:
- backend engineer
- frontend engineer
- UX/UI
- devops
- security engineer

## Mas com travas
- Sempre começar com INSPECT (read-only)
- Sempre gerar PLANO com lista de arquivos impactados
- Sempre pedir CONSENTIMENTO antes de editar/criar/deletar
- Sempre gerar AUDIT do que foi feito/certo/errado

## Defaults seguros
- escrever por padrão somente em `.agent/**` e arquivos explicitamente aprovados
- qualquer alteração fora disso exige confirmação detalhada

templates/.agent/skills/openclaw-router/SKILL.md
---
name: openclaw-router
description: Roteador central chat-first que escolhe a skill certa e força o protocolo INSPECT → PLAN → CONSENT → APPLY → AUDIT.
triggers:
  - instalar
  - configurar
  - criar
  - corrigir
  - melhorar
  - refatorar
  - debug
  - skill
  - agente
  - openclaw
---

# Router Master

## Regra Suprema
READ-ONLY por padrão.

## Procedimento
1) Rodar **openclaw-inspect** (somente leitura)
2) Escolher skill pelo melhor match de triggers/description
3) Apresentar plano e pedir autorização
4) Executar somente após confirmação
5) Registrar auditoria

## Nunca
- alterar arquivos sem pedido explícito
- apagar/sobrescrever sem explicar e pedir confirmação reforçada

templates/.agent/skills/openclaw-inspect/SKILL.md
---
name: openclaw-inspect
description: Inspeção read-only do projeto/ambiente/IDE/OpenClaw. Nunca altera nada.
triggers:
  - inspecionar
  - analisar
  - diagnosticar
  - contexto
  - status
---

# Inspect (read-only)

Coletar:
- SO (win/mac/linux/wsl), docker/vps/local
- IDE (cursor/vscode/antigravity/jetbrains)
- existência de OpenClaw (openclaw.json, .agent, docker compose, systemd)
- skills disponíveis
- riscos e sugestões

Regra: **não criar nem editar arquivos**.

templates/.agent/skills/openclaw-dev/SKILL.md
---
name: openclaw-dev
description: Modo Devin-like para criar features, skills, backend, frontend e UX/UI com consentimento e auditoria.
triggers:
  - feature
  - backend
  - frontend
  - ux
  - ui
  - endpoint
  - api
  - tela
  - componente
  - refatorar
---

# Dev Mode

Sempre:
1) inspect (read-only)
2) plano (arquivos, diffs, riscos)
3) consentimento explícito
4) aplicar + auditar

Preferência:
- criar PRs/commits e mostrar diffs antes de aplicar no workspace

templates/.agent/skills/openclaw-security/SKILL.md
---
name: openclaw-security
description: Hardening e segurança do OpenClaw e do workspace. VPN-first, bind localhost, token obrigatório, bloqueios de comandos destrutivos.
triggers:
  - segurança
  - hardening
  - firewall
  - token
  - bind
  - wireguard
---

# Security Mode

Foco:
- validar bind localhost + token
- sugerir VPN (WireGuard) para acesso remoto
- checar portas e exposição
- reforçar hooks e regras

Sempre: plano → consentimento → aplicar → auditoria.

3) Código: Context Collector + Router Matcher (chat-first de verdade)
lib/context/collector.js (novo, read-only)
const fs = require("fs");
const os = require("os");
const path = require("path");

function exists(p) { try { return fs.existsSync(p); } catch { return false; } }

function detectIDE(targetPath) {
  if (exists(path.join(targetPath, ".cursor"))) return "cursor";
  if (exists(path.join(targetPath, ".vscode"))) return "vscode";
  if (exists(path.join(targetPath, ".idea"))) return "jetbrains";
  // antigravity pode não ter pasta padrão; deixamos como unknown se não houver sinais
  return "unknown";
}

function detectEnvironment() {
  const platform = os.platform();
  const docker = exists("/.dockerenv") || (exists("/proc/1/cgroup") && fs.readFileSync("/proc/1/cgroup","utf8").includes("docker"));
  const wsl = platform === "linux" && (os.release().toLowerCase().includes("microsoft") || process.env.WSL_DISTRO_NAME);
  return { platform, docker, wsl };
}

function detectOpenClaw(targetPath) {
  const agentDir = path.join(targetPath, ".agent");
  const config = path.join(targetPath, "openclaw.json");
  const dockerCompose = path.join(targetPath, "docker-compose.yml");
  return {
    hasAgentDir: exists(agentDir),
    hasConfig: exists(config),
    hasDockerCompose: exists(dockerCompose),
  };
}

function listSkillsFromTemplates(templatesDir) {
  const skillsDir = path.join(templatesDir, ".agent", "skills");
  if (!exists(skillsDir)) return [];
  const out = [];
  for (const name of fs.readdirSync(skillsDir)) {
    const skillPath = path.join(skillsDir, name, "SKILL.md");
    if (exists(skillPath)) out.push({ name, skillPath });
  }
  return out;
}

module.exports = function collectContext({ targetPath, templatesDir }) {
  const env = detectEnvironment();
  return {
    targetPath,
    env,
    ide: detectIDE(targetPath),
    openclaw: detectOpenClaw(targetPath),
    git: { isRepo: exists(path.join(targetPath, ".git")) },
    skillsInTemplates: listSkillsFromTemplates(templatesDir),
    ts: new Date().toISOString(),
  };
};

lib/router/match.js (novo)

Match simples (triggers + description). Depois você pode trocar por scoring melhor, mas já resolve.

const fs = require("fs");
const path = require("path");

function parseFrontmatter(md) {
  const m = md.match(/^---\s*\n([\s\S]*?)\n---\s*\n/);
  if (!m) return null;
  const yaml = m[1];
  const getList = (key) => {
    const r = new RegExp(`^${key}:\\s*\\n([\\s\\S]*?)(\\n\\w|$)`, "m");
    const mm = yaml.match(r);
    if (!mm) return [];
    return mm[1]
      .split("\n")
      .map(l => l.trim())
      .filter(l => l.startsWith("-"))
      .map(l => l.replace(/^-\\s*/, "").trim())
      .filter(Boolean);
  };
  const getScalar = (key) => {
    const r = new RegExp(`^${key}:\\s*(.+)$`, "m");
    const mm = yaml.match(r);
    return mm ? mm[1].trim() : "";
  };
  return {
    name: getScalar("name"),
    description: getScalar("description"),
    triggers: getList("triggers"),
  };
}

function loadSkills(templatesDir) {
  const dir = path.join(templatesDir, ".agent", "skills");
  if (!fs.existsSync(dir)) return [];
  const skills = [];
  for (const folder of fs.readdirSync(dir)) {
    const p = path.join(dir, folder, "SKILL.md");
    if (!fs.existsSync(p)) continue;
    const md = fs.readFileSync(p, "utf8");
    const meta = parseFrontmatter(md);
    if (!meta) continue;
    skills.push({ ...meta, path: p, folder });
  }
  return skills;
}

function scoreSkill(skill, text) {
  const t = text.toLowerCase();
  let s = 0;
  for (const trig of (skill.triggers || [])) {
    if (t.includes(trig.toLowerCase())) s += 5;
  }
  if (skill.description && t.includes(skill.description.toLowerCase().slice(0, 12))) s += 1;
  return s;
}

module.exports = function matchSkill({ templatesDir, userText }) {
  const skills = loadSkills(templatesDir);
  const ranked = skills
    .map(sk => ({ sk, score: scoreSkill(sk, userText) }))
    .sort((a,b)=>b.score-a.score);

  return {
    chosen: ranked[0]?.sk || null,
    alternatives: ranked.slice(1, 4).map(x => x.sk),
    ranked,
  };
};

4) Comandos CLI (para “Nível 2” via npx)
openclaw ide install (plan/apply)

Esse comando faz o que você quer para IDE:

instala .agent/ no projeto atual somente com --apply

por padrão, só mostra o plano

escreve apenas em .agent/** (zona segura)

openclaw inspect (read-only)

imprime contexto (para a IA usar no chat)

não altera nada

openclaw assist (menu)

pergunta “instalação nova” vs “já instalado: melhorar/reparar” vs “dev mode”

sempre plan → consent → apply

Se você já tem orchestrate.js, dá para reaproveitar como assist.

5) package.json (essencial para npm/npx)

Garanta que seu pacote publique os templates:

{
  "files": [
    "bin/",
    "lib/",
    "templates/",
    "README.md",
    "LICENSE"
  ],
  "bin": {
    "openclaw": "bin/openclaw.js"
  }
}


Sem isso, o npm pode publicar sem templates/ e aí as IDE skills somem.

6) Como isso funciona “no chat” (sem terminal)

Depois de openclaw ide install --apply no projeto:

a IDE vai ler .agent/rules/* e .agent/skills/* (ou templates conforme o seu padrão)

quando você pedir algo no chat, o Router Protocol força:

inspect primeiro

skill certa

plano

permissão

execução

Mesmo que a IDE “tenha poder” de editar arquivos, ela vai se comportar porque:

regras + hooks + skills guiam o agente

e seu CLI/flows reforçam consent-first

7) Publicação Nível 2 (npx)

Fluxo padrão:

npm version minor
npm publish --access public


E o usuário final usa:

npx @seu-escopo/openclaw ide install
# (vê o plano)
npx @seu-escopo/openclaw ide install --apply

- Eu peguei esse contexto no notebook Lm do Google sobre funcionalidades ou habilidades que gostaria de ter no meu openclaw. Então pedi para ele gerar esse contexto / prompt: Com base na análise detalhada dos vídeos de Bruno Okamoto (sobre a criação de um "Mission Control" e equipe de agentes), Matheus Battisti (sobre economia de tokens e modelos gratuitos) e na documentação técnica do OpenClaw, preparei o **Roteiro de Implementação Mestre**. Abaixo está o guia passo a passo, detalhando a lógica, os arquivos necessários e os comandos para replicar essa arquitetura de "Empresa de Agentes" e o "Roteador Econômico". --- ### 🏢 Parte 1: A Arquitetura "Empresa de Agentes" (Mission Control) O segredo revelado nos estudos de caso não é ter 10 IAs rodando ao mesmo tempo (o que travaria sua máquina), mas sim um sistema de **Estado Compartilhado** e **Troca de Personas**. **Conceito:** O OpenClaw atua como um "Sistema Operacional". Você cria arquivos que funcionam como "mesas de trabalho". O agente principal (CEO/Orquestrador) distribui tarefas nessas mesas, e "sub-agentes" (que são o mesmo OpenClaw trocando de contexto) acordam, leem a mesa, trabalham e voltam a dormir. #### Passo 1: Criar o Banco de Dados da Empresa (JSON) Em vez de bancos de dados complexos, usamos arquivos JSON ou Markdown que o agente lê nativamente. * **Comando:** Crie o arquivo no terminal ou peça para o agente criar. touch ~/.openclaw/workspace/mission_control.json **Conteúdo Inicial do mission_control.json:**
json
{
  "project_status": "active",
  "sprint_goal": "Criar campanha de marketing Q3",
  "agents": ["researcher", "copywriter", "reviewer"],
  "task_queue": [
    {
      "id": 101,
      "role": "researcher",
      "task": "Pesquisar tendências de IA para 2026 no Twitter e Reddit",
      "status": "pending",
      "output_file": "research_2026.md",
      "priority": "high"
    }
  ]
}
#### Passo 2: A Habilidade de Gestão (Skill: Mission Control) Esta skill permite que o agente principal leia e escreva neste arquivo, agindo como um gerente. **Arquivo:** workspace/skills/mission-control/SKILL.md
markdown
---
name: mission-control
description: Use esta skill para ler o estado do projeto, atribuir tarefas a sub-agentes ou atualizar o status de tarefas concluídas. Fundamental para orquestração de equipe.
---

# Controle de Missão

## Instruções
1. **Ler o Quadro:** Sempre inicie lendo `mission_control.json`.
2. **Atribuir:** Para criar tarefa, adicione um objeto na lista `task_queue` com `status: "pending"`.
3. **Verificar Retorno:** Se uma tarefa estiver `status: "completed"`, leia o arquivo indicado em `output_file` para validar o trabalho do sub-agente.
#### Passo 3: O "Pulso" da Empresa (Heartbeat & Cron) Para que os "funcionários" trabalhem sem você mandar, configuramos o *Heartbeat*. O OpenClaw acorda a cada intervalo (ex: 15 min), verifica se há tarefas no JSON para a persona atual e executa. **Configuração no openclaw.json (ou via Cron do Sistema):** *Isso define que, a cada hora, o agente verifica pendências.*
json
"cron": [
  {
    "schedule": "0 * * * *",
    "task": "Leia mission_control.json. Se houver tarefas pendentes, ative a persona correspondente, execute a tarefa e atualize o status para 'completed'."
  }
]
--- ### 💰 Parte 2: O "Roteador Econômico" (Smart Model Router) Baseado nas estratégias de economia de tokens, implementamos um *middleware* lógico que impede o uso de modelos caros (Claude Opus/GPT-4) para tarefas triviais. #### Passo 1: Configurar Múltiplos Modelos No arquivo de configuração, definimos o modelo "Burro/Rápido" e o "Inteligente/Caro". **Arquivo:** ~/.openclaw/openclaw.json
json
{
  "models": {
    "cheap": "google/gemini-flash-1.5", 
    "smart": "anthropic/claude-3-opus",
    "coding": "deepseek/deepseek-coder"
  }
}
*(Nota: O modelo Gemini Flash muitas vezes tem camadas gratuitas ou custo irrisório).* #### Passo 2: A Skill de Roteamento (Router Skill) Esta skill intercepta o pedido e decide quem trabalha. **Arquivo:** workspace/skills/smart-router/SKILL.md
markdown
---
name: smart-router
description: ANALISADOR DE CUSTO. Execute esta skill no início de cada interação complexa para definir qual modelo deve ser usado.
---

# Roteador Inteligente de Modelos

## Lógica de Decisão
Analise a solicitação do usuário e classifique em:

1. **Nível 1 (Simples):** Saudações, formatação de texto, perguntas factuais simples.
   -> **Ação:** Mude para o modelo `cheap`. Comando: `/model gemini-flash`

2. **Nível 2 (Raciocínio):** Planejamento, escrita criativa, análise de dados.
   -> **Ação:** Mude para o modelo `smart`. Comando: `/model claude-3-opus`

3. **Nível 3 (Código):** Gerar scripts, debug, SQL.
   -> **Ação:** Mude para o modelo `coding`. Comando: `/model deepseek-coder`

## Execução
Não pergunte ao usuário. Apenas execute a troca e confirme: "🔄 Trocando para [Modelo] para economizar tokens."
#### Passo 3: Limpeza de Memória (Context Flush) Para economizar, não mantemos o histórico lixo. Criamos uma skill que resume o útil e deleta o resto. **Arquivo:** workspace/skills/context-flush/SKILL.md
markdown
---
name: context-flush
description: Use quando a conversa ficar longa ou mudar de assunto para economizar tokens.
---
# Flush de Memória
1. Resuma os pontos vitais da conversa atual.
2. Anexe este resumo ao arquivo `~/.openclaw/workspace/MEMORY.md`.
3. Execute o comando de sistema `/reset` para limpar a janela de contexto atual (mantendo apenas a memória de longo prazo).
--- ### 🤖 Parte 3: Prompts para Geração Automática Como solicitado, aqui estão os prompts prontos para você usar no **Google Antigravity** (ou Claude/ChatGPT) para gerar todo o código e estrutura de arquivos descritos acima. #### Prompt 1: Gerar a Infraestrutura da "Empresa" > **Cole no Google Antigravity:** > "Atue como um Arquiteto de Sistemas OpenClaw Sênior. Eu quero transformar meu OpenClaw em uma agência multi-agente. > > 1. **Crie a estrutura de arquivos:** Gere o código JSON para um arquivo mission_control.json que sirva de banco de dados de tarefas, com campos para ID, Agente Responsável, Status, Prioridade e Dependências. > 2. **Crie a Skill de Gestão:** Escreva o arquivo SKILL.md completo para uma habilidade chamada 'Mission Control'. Ela deve ensinar o LLM a ler o JSON, identificar tarefas 'pending', executar a tarefa baseada na descrição e atualizar o JSON para 'done'. > 3. **Crie as Personas:** Gere o conteúdo para o arquivo AGENTS.md definindo três personas: 'Orquestrador' (Gerente), 'Pesquisador' (Usa web-search) e 'Redator' (Escreve arquivos). > > Saída esperada: Blocos de código prontos para copiar e colar nos diretórios workspace/skills/ e workspace/." #### Prompt 2: Gerar o Sistema de Economia (Router) > **Cole no Google Antigravity:** > "Atue como Engenheiro de Otimização de LLMs. Preciso de um sistema para o OpenClaw que economize tokens alternando modelos dinamicamente. > > 1. **Crie a Skill de Roteamento:** Escreva um SKILL.md para a habilidade smart-router. A lógica deve ser: se o prompt for curto/simples, use o comando /model gemini-flash. Se for complexo/coding, use /model claude-opus. Inclua exemplos 'few-shot' para o modelo entender a distinção. > 2. **Script de Verificação:** (Opcional) Crie um script Python check_tokens.py que o OpenClaw possa rodar para verificar quantos tokens foram gastos na sessão atual e avisar se passar de $0.50. > > O objetivo é custo zero em tarefas triviais e alta performance apenas quando necessário." ### Resumo do Fluxo de Trabalho (Workflow) 1. **Instalação:** Instale o OpenClaw em uma VPS (Hostinger/DigitalOcean) usando Docker para segurança [1], [2]. 2. **Setup:** Use os prompts acima para gerar os arquivos SKILL.md e mission_control.json. 3. **Operação:** * Você diz: *"Jarvis, pesquise sobre o mercado de café e escreva um post."* * A skill smart-router detecta complexidade -> Ativa Claude Opus. * A skill mission-control cria duas tarefas no JSON: 1. Pesquisa (para agente Pesquisador), 2. Escrita (para agente Redator). * O *Heartbeat* acorda, vê a tarefa 1, executa a pesquisa, salva em arquivo, marca como pronta. * O *Heartbeat* roda de novo, vê tarefa 2 desbloqueada, escreve o post. * Você recebe o aviso no Telegram: "Trabalho concluído."

- Excelente esse roteiro — dá pra encaixar perfeitamente no seu “Nível 2” (instalável via npx + chat-first em IDE) sem virar um agente que sai mexendo nas coisas sozinho.

Vou te devolver isso como um módulo completo do OpenClaw AI OS com 3 pilares:

Empresa de Agentes (Mission Control) com estado compartilhado e “troca de persona”

Roteador Econômico (Smart Model Router) que escolhe modelo por complexidade

Flush de Contexto (Context Flush) para economizar tokens sem perder memória útil

E tudo isso obedecendo suas regras:

READ-ONLY por padrão

PLANO → CONSENTIMENTO → APPLY

Nada roda em cron/heartbeat sem autorização explícita

Tudo auditado

Como encaixar isso no seu OpenClaw AI OS (Nível 2)
Novos assets que você vai adicionar no pacote (templates)

Dentro do seu repo, em templates/.agent/skills/:

mission-control/SKILL.md

smart-router/SKILL.md

context-flush/SKILL.md

E no workspace do OpenClaw (quando o usuário aceitar aplicar), você cria:

~/.openclaw/workspace/mission_control.json (ou no projeto atual, se o usuário escolher)

~/.openclaw/workspace/mission_control/ (outputs)

~/.openclaw/workspace/MEMORY.md (já existe normalmente)

~/.openclaw/workspace/SOUL.md (se usar)

Importante: no modo IDE/projeto (Cursor/VSCode/Antigravity), o default deve ser criar tudo dentro do projeto em uma pasta segura como .agent/state/ — e só criar em ~/.openclaw se o usuário pedir.

Parte 1 — “Empresa de Agentes” (Mission Control)
1) Estado compartilhado (JSON) com fila, dependências e outputs

Use este modelo (mais completo que o exemplo, mas ainda simples):

mission_control.json (template)
{
  "project_status": "active",
  "project_name": "default",
  "sprint_goal": "defina aqui",
  "agents": [
    { "id": "orchestrator", "role": "orchestrator", "active": true },
    { "id": "researcher", "role": "researcher", "active": true },
    { "id": "writer", "role": "writer", "active": true },
    { "id": "reviewer", "role": "reviewer", "active": true }
  ],
  "task_queue": [],
  "history": [],
  "settings": {
    "work_dir": "mission_control",
    "max_tasks_per_tick": 2,
    "default_priority": "medium"
  }
}

Task recomendado (com dependências e audit trail)
{
  "id": "T-101",
  "role": "researcher",
  "task": "Pesquisar tendências de IA para 2026 (fontes: web/reddit/twitter).",
  "status": "pending",
  "priority": "high",
  "depends_on": [],
  "output_file": "mission_control/research_2026.md",
  "created_at": "2026-02-19T00:00:00Z",
  "updated_at": "2026-02-19T00:00:00Z",
  "notes": ""
}

2) Skill Mission Control (chat-first + consent-first)
templates/.agent/skills/mission-control/SKILL.md
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
---

# Mission Control

## Regras
- READ-ONLY por padrão.
- Qualquer alteração no JSON ou criação de arquivos exige consentimento explícito.
- Sempre gerar PLANO com: tarefas criadas/atualizadas, arquivos afetados, riscos.

## Fluxo
1) Ler `mission_control.json`.
2) Identificar tarefas `pending` cujo `depends_on` esteja resolvido.
3) Selecionar até `max_tasks_per_tick` tarefas.
4) Para cada tarefa:
   - ativar persona do `role` (sem “shell solto”)
   - executar a tarefa de forma segura
   - salvar resultado em `output_file`
   - atualizar status para `completed` (ou `failed`) com timestamp e notas
5) Registrar resumo em `history`.

## Saídas
- Arquivo de output por tarefa.
- Atualização do mission_control.json.
- Auditoria em `.agent/audit/` (ou workspace audit).

## Consentimento
Antes de APPLY, perguntar: “Posso aplicar este plano?”
Se envolver sobrescrever output_file existente, mostrar diff/resumo e pedir confirmação reforçada.

3) Heartbeat / Cron (com trava)

Seu documento sugere rodar automaticamente a cada X minutos. Isso é legal, mas só pode ser habilitado quando o usuário autorizar, e com “modo seguro”:

Por padrão: manual tick (“rode um ciclo agora”)

Com autorização: habilita cron interno do OpenClaw OU cron do sistema

Minha recomendação pro seu “Nível 2”:

Default (sempre seguro)

usuário digita no chat: “mission control tick”

o agente executa 1 ciclo e para

Opcional (com consentimento + aviso)

habilitar um cron no openclaw.json após confirmação

e registrar isso em auditoria

E sempre com um “kill switch” no JSON: project_status: paused

Parte 2 — Roteador Econômico (Smart Model Router)

A ideia do vídeo é ótima, mas tem um detalhe: em várias IDEs você não tem comando real /model. Então o roteador deve ser:

genérico: escolhe “perfil de modelo” (cheap/smart/coding)

e compatível com o que o OpenClaw realmente suporta (ex: provider/model no config, ou “profile” interno)

Então a skill deve ser escrita como “política”, não como um comando fixo.

templates/.agent/skills/smart-router/SKILL.md
---
name: smart-router
description: Roteia solicitações para perfis de modelo (cheap/smart/coding) para economizar tokens. Nunca altera configuração sem consentimento.
triggers:
  - economizar
  - tokens
  - modelo
  - router
  - roteador
---

# Smart Model Router (econômico)

## Objetivo
Escolher o perfil de modelo adequado:
- cheap: tarefas simples / formatação / respostas curtas
- smart: planejamento / análise / escrita longa
- coding: gerar código / debug / refactor

## Regra de segurança
- Não alterar `openclaw.json` automaticamente.
- Em modo IDE, apenas recomendar o perfil a usar.
- Se o usuário quiser persistir a escolha, mostrar PLANO e pedir autorização.

## Heurística
Classificar a tarefa em:
1) Simples: <= 2 min de esforço, sem código, sem múltiplos passos → cheap
2) Raciocínio: exige plano, múltiplas etapas, texto longo → smart
3) Código: gera/edita código, testes, infra → coding

## Saída
Sempre responder com:
- "Perfil recomendado: X"
- "Por quê"
- "Se deseja aplicar como default nesta sessão/projeto, posso ajustar config. Posso aplicar?"


Isso evita “troca automática de modelo” que pode dar ruim dependendo da plataforma.

Parte 3 — Context Flush (economia sem perder memória)

O flush é ótimo, mas precisa ser consent-first porque ele altera memória.

templates/.agent/skills/context-flush/SKILL.md
---
name: context-flush
description: Resume contexto útil e propõe anexar a MEMORY.md; só aplica com consentimento. Ajuda a economizar tokens.
triggers:
  - flush
  - limpar contexto
  - resumir
  - economizar tokens
---

# Context Flush (economia)

## Fluxo
1) Produzir um resumo curto com:
   - objetivo atual
   - decisões tomadas
   - pendências
   - links/arquivos relevantes
2) Propor onde salvar:
   - MEMORY.md (long-term)
   - mission_control.json (history)
3) Mostrar PLANO: quais arquivos seriam alterados e como.
4) Perguntar: "Posso aplicar?"
5) Se aprovado, anexar e registrar auditoria.

## Regras
- Nunca apagar histórico automaticamente.
- Nunca rodar /reset automaticamente.
- Sempre deixar o usuário decidir.

Integrando com seu “Router de IDE” (chat-first)

Agora o pulo do gato: o openclaw-router (aquele roteador central que você já está construindo) deve conseguir escolher entre:

mission-control

smart-router

context-flush

openclaw-dev

openclaw-security

universal-setup

Triggers recomendadas (pra roteamento funcionar bem)

Se o usuário falar “equipe”, “tarefas”, “fila”, “sprint” → mission-control

“economizar”, “tokens”, “modelo”, “caro” → smart-router

“conversa longa”, “limpar contexto”, “ficou grande” → context-flush

Como isso vira “Nível 2” (npx + qualquer IDE)
Comandos npx que você vai oferecer

Sem precisar terminal no dia a dia, mas pra instalar o “AI OS” no projeto:

npx openclaw ide install → PLAN

npx openclaw ide install --apply → instala .agent/ (skills+rules+hooks)

npx openclaw inspect → imprime contexto (read-only)

npx openclaw assist → menu (plan/apply)

Depois disso, no chat da IDE você só digita:

“crie uma tarefa pra pesquisador e outra pra redator”

“rode um tick do mission control”

“quero economizar tokens nessa tarefa”

“faça flush de contexto”

E o roteador decide skill + pede permissão.

Uma recomendação forte (pra não virar caos)

Não faça o Heartbeat automático por padrão.
No Nível 2, o default deve ser:

✅ manual tick
✅ cron só se o usuário habilitar

Porque IDEs com IA têm poder de editar coisas — e você quer zero surpresa.