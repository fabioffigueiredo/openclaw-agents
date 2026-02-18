#!/usr/bin/env bash
set -euo pipefail

echo "[openclaw-os] Instalador rápido (starter kit)"
echo "Este script prepara o diretório de skills e aplica permissões seguras."
echo ""

TARGET="${1:-$HOME/.openclaw/workspace/skills}"

mkdir -p "$TARGET"
echo "[openclaw-os] Copiando skills para: $TARGET"

cp -R ./skills/universal-setup "$TARGET/"
cp -R ./skills/openclaw-ops "$TARGET/" || true

find "$TARGET" -type f -name "*.sh" -exec chmod 0755 {} \; || true
find "$TARGET" -type f -name "*.ps1" -exec chmod 0644 {} \; || true
find "$TARGET" -type f -name "*.js" -exec chmod 0755 {} \; || true

echo "[openclaw-os] OK. Reinicie o OpenClaw e diga: "rodar setup universal"."
