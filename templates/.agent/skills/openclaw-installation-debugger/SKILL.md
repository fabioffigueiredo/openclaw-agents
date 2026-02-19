---
name: openclaw-installation-debugger
description: Diagnóstico profundo de falhas na instalação, conectividade e integridade do OpenClaw. Verifica rede (NPM/GitHub), proxy, versões e integridade de arquivos.
version: 1.0
author: Fabioforest
---

# OpenClaw Installation Debugger

Esta skill fornece ferramentas avançadas para diagnosticar por que uma instalação falhou ou por que o agente não está operando corretamente.

## Scripts Disponíveis

### `debug.js`
Executa uma bateria de testes detalhados e gera um relatório JSON/Texto.

**Verificações:**
1.  **Ambiente**: SO, Node.js version, NPM version, Docker (se disponível).
2.  **Rede**:
    - Ping para `registry.npmjs.org` (verifica bloqueio de firewall/proxy).
    - Ping para `github.com`.
    - Resolução DNS.
3.  **Instalação**:
    - Integridade da pasta `.agent/` (arquivos esperados vs encontrados).
    - Permissões de escrita no diretório atual.
    - Validade do `openclaw.json` (se existir).

## Como usar
Execute via CLI (se disponível):
```bash
npx @fabioforest/openclaw debug
```

Ou diretamente via node se estiver debugando o pacote local:
```bash
node templates/.agent/skills/openclaw-installation-debugger/scripts/debug.js
```
