# 🦀 OpenClaw AI OS

**O Sistema Operacional de Agentes de IA para qualquer IDE.**
*Transforme seu Cursor, VS Code, Windsurf ou Gemini no assistente de software perfeito – com total controle, segurança e sem gastar seus tokens à toa.*

![OpenClaw Architecture](./docs/assets/openclaw_architecture_1771620472113.png)

---

## 🌟 O que é o OpenClaw?

Se você já usou IA para programar (como o Cursor ou o GitHub Copilot), sabe que às vezes a IA pode "alucinar", apagar código importante ou se perder em tarefas grandes.

O **OpenClaw** resolve isso. Ele instala um "cérebro" seguro (um diretório oculto `.agent/`) dentro do seu projeto. Esse cérebro dita regras estritas de segurança, fornece "Skills" (habilidades) prontas para o seu agente usar e garante que ele nunca faça nada sem perguntar primeiro.

### Por que usar?
- 🛡️ **Zero Risco:** A IA é presa em um "sandbox" (Scope Guard). Ela não pode formatar seu PC nem apagar arquivos vitais sem você digitar uma senha explícita de confirmação.
- 🔌 **Funciona em Qualquer Lugar:** Suporte universal para as IDEs mais famosas.
- 💸 **Economia Inteligente:** O roteador embutido escolhe modelos baratos (como Gemini Flash) para tarefas fáceis e modelos caros apenas quando necessário.
- 🚀 **Skills Prontas:** Scripts pré-fabricados ensinam sua IA a fazer *web scraping*, testar sites, gerenciar infraestrutura em nuvem e muito mais.

---

## 🔌 Compatibilidade Universal (Multi-IDE)

![IDE Adapters](./docs/assets/openclaw_ide_adapters_1771620563799.png)

O OpenClaw detecta automaticamente o que você está usando e instala apenas o necessário. Suportamos nativamente através do framework *Chat-First*:
- **Cursor** (`.cursorrules`)
- **VS Code / Copilot** (`copilot-instructions.md`)
- **Windsurf** (`.windsurf`)
- **Qoder** (`.qoder`)
- **Trae** (`trae_rule.md`)
- **Google Antigravity** (`GEMINI.md`)
- **Codex** (`AGENTS.md`)

---

## 📦 Instalação Fácil (Para Iniciantes)

Você não precisa instalar nada de forma pesada no seu computador. Basta usar o comando `npx`.

### Passo 1: Preparar o Projeto
Abra o terminal na pasta do seu projeto e digite:
```bash
# Isso vai instalar as regras gerais e criar a pasta segura .agent/
npx @fabioforest/openclaw init --apply
```

### Passo 2: Integrar com a sua IDE
Para que a sua IDE (Cursor, VS Code, etc.) entenda o OpenClaw:
```bash
# O sistema vai detectar sua IDE e perguntar se deseja instalar os adaptadores.
npx @fabioforest/openclaw ide install --apply
```

### Passo 3: Verificação de Saúde
Quer garantir que deu tudo certo?
```bash
npx @fabioforest/openclaw ide doctor
```
Se tudo estiver com um ✅ verde, você está pronto para conversar com a IA no chat da sua IDE!

---

## 🔒 Como funciona a Segurança? (O Fluxo de Consentimento)

![CLI Workflow](./docs/assets/openclaw_cli_workflow_1771620533472.png)

Nós não confiamos cegamente na IA. Todo comando importante que o OpenClaw executa passa pelo **Orchestrator**, seguindo um fluxo de 5 etapas:

1. 🔎 **INSPECT:** A IA olha o seu projeto (Apenas leitura).
2. 📝 **PLAN:** A IA diz o que pretende fazer (ex: "Vou criar o arquivo index.html").
3. 🛑 **CONSENT:** A IA para e *pergunta a você* se pode continuar. Se for perigoso, o **Scope Guard** entra em ação e bloqueia.
4. ✅ **APPLY:** Apenas se você disser "Sim", a ação é feita.
5. 📋 **AUDIT:** Tudo fica registrado num log para você saber quem fez o quê e quando.

*(Qualquer comando no terminal roda em modo de Simulação (PLAN) por padrão. Nada acontece de verdade a menos que você use a flag `--apply` no terminal).*

---

## 🎯 Guia Rápido de Comandos

Aqui estão os comandos que você mais vai usar no dia a dia:

| Comando | Para que serve? |
|---------|-----------------|
| `openclaw assist` | O **Assistente Amigável**. Não sabe o que fazer? Digite isso e ele te guia. |
| `openclaw status` | Mostra um painel rápido de tudo que está ativo no seu projeto. |
| `openclaw check` | O "mecânico inteligente". Ele detecta sozinho se você precisa instalar ou reparar algo. |
| `openclaw update --apply` | Atualiza o OpenClaw salvando suas personalizações com segurança. |
| `openclaw uninstall --apply`| Remove o OpenClaw limpando tudo bonitinho e fazendo backup. |

*(Nota: Sempre que usar pelo terminal, comece com `npx @fabioforest/openclaw ...`)*

---

## 🧠 Super-Poderes Embutidos (Skills)

O OpenClaw vem com **25+ Skills** organizadas por pastas. Quando você pedir algo no chat da sua IDE, ela vai automaticamente usar essas Skills.

**Algumas das favoritas:**
- **🛠️ Modo Devin (`openclaw-dev`):** Constrói features inteiras com autonomia vigiada.
- **🧹 Faxina de Código (`legacy-cleanup`):** Refatora código velho e bagunçado com segurança.
- **🌐 Testador de Sites (`site-tester`):** Avalia a velocidade e o SEO do seu site sozinho.
- **☁️ Setup em Nuvem (`vps-cloud-infra`):** Configura do zero servidores na nuvem (DigitalOcean, AWS, etc.).
- **👔 LinkedIn Pro (`linkedin-optimizer`):** Ajuda a escrever posts otimizados para o seu perfil.

**Como usar? (A Regra de Ouro)**

O OpenClaw divide perfeitamente o seu uso em dois momentos distintos:

✅ **1. Uso Diário (Runtime via Terminal ou Web UI)**
A execução real das skills do OpenClaw para realizar suas tarefas do dia a dia acontece *fora da IDE*:
- Inicie o OpenClaw pelo terminal (ex: `npx openclaw gateway status`);
- Acesse a interface local pelo seu navegador (ex: `http://localhost:8000`);
- Consuma as skills (ex: *site-tester*, *linkedin-optimizer*) através desse Gateway ou via comandos da CLI. Essa é a forma desenhada para ser segura e isolada.

🛠️ **2. Manutenção do OpenClaw (Via Chat da IDE)**
O chat de IA da sua IDE (como Cursor, Windsurf, GitHub Copilot) se torna o **Painel de Configuração** do seu agente. Use essas threads *apenas* para gerenciar o OpenClaw:
- *"Verifique o arquivo openclaw.json e corrija problemas de porta."*
- *"Crie uma nova skill que faça backup de dados (PLAN -> APPLY)."*
- *"Instale e atualize os adaptadores para o projeto."*

**Lembre-se:** A IDE serve para construir e consertar o motor de IA. A pista onde o carro roda é o Web Gateway e a API!

---

## 🙋 Dúvidas Frequentes

**Isso vai pesar no meu projeto?**
Não. O OpenClaw é extremamente leve. Ele cria apenas uma pasta oculta `.agent/` contendo arquivos de texto simples (Markdown) que instruem a IA.

**Preciso saber programar para usar?**
Não para os comandos básicos! O comando `npx @fabioforest/openclaw setup` faz perguntas simples em português para deixar tudo rodando em 1 minuto.

**A IA pode apagar meu banco de dados?**
Não. O **Scope Guard** intercepta comandos destrutivos (como `rm -rf`, deleções em massa) e a regra de `CONSENT_FIRST` impede a execução autônoma severa. O OpenClaw te devolve o controle.

---
**Feito com 🩵 para revolucionar a forma como nós e as máquinas trabalhamos juntos.**
*Licença MIT*
