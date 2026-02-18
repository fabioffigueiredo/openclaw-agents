# OpenClaw OS (starter kit)

Este repositório é um **kit completo** para começar uma instalação segura do OpenClaw em:
- Linux (VPS ou local)
- macOS
- Windows (incluindo WSL2)
- Docker (recomendado para padronizar ambiente)

## O que vem aqui dentro
- `skills/universal-setup/`: Super Skill interativa (wizard) que configura `openclaw.json`, memória e canais.
- `skills/openclaw-ops/`: Skills operacionais (VPN WireGuard, enroll, policy, exec, transfer, audit, update, health).
- `agents/`: Personas/operadores sugeridos.
- `rules/`: Guardrails (segurança por padrão).
- `workflows/`: Runbooks de operação (healthcheck, restart, coletar logs).
- `docker/`: Compose e templates para rodar em container.
- `docs/`: Threat model, checklist e guia de hardening.

## Como usar (rápido)
1) Extraia o zip (ou clone o repo).
2) Copie as skills para o workspace do OpenClaw:
   - Linux/macOS/VPS: `~/.openclaw/workspace/skills/`
   - Docker: para o volume mapeado do seu workspace
3) Rode o wizard:
   ```bash
   node scripts/config_wizard.js
   ```
   (ou no chat do agente: **"rodar setup universal"**)

## Segurança (importante)
- Use **somente em máquinas que você possui ou tem permissão explícita**.
- Padrão: **VPN-first + bind localhost + token**.
- Não exponha painel/API publicamente.

## Gerar zip
Linux/macOS:
```bash
zip -r openclaw-agents.zip .
```
Windows PowerShell:
```powershell
Compress-Archive -Path * -DestinationPath openclaw-agents.zip
```

## Publicar no GitHub
```bash
git init
git remote add origin git@github.com:fabioffigueiredo/openclaw-agents.git
git add .
git commit -m "OpenClaw OS starter kit"
git push -u origin main
```
