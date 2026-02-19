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
