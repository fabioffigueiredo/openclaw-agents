#!/bin/bash
# ========================================================
# Script de Teste E2E do OpenClaw CLI
# Roda dentro do container Docker para validar o fluxo completo.
# ========================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PASS=0
FAIL=0
WARN=0

pass() { echo -e "${GREEN}✅ PASS${NC} — $1"; PASS=$((PASS+1)); }
fail() { echo -e "${RED}❌ FAIL${NC} — $1"; FAIL=$((FAIL+1)); }
warn() { echo -e "${YELLOW}⚠️  WARN${NC} — $1"; WARN=$((WARN+1)); }
info() { echo -e "${BLUE}ℹ️  $1${NC}"; }

echo ""
echo "=========================================="
echo "  🦀 OpenClaw CLI — Teste E2E em Docker"
echo "=========================================="
echo ""

# ----- 1. Verificar se o CLI está instalado -----
info "1. Verificando instalação do CLI..."
if openclaw --version 2>/dev/null | grep -q "openclaw v"; then
    pass "CLI instalado — $(openclaw --version 2>&1 | head -1)"
else
    fail "CLI não encontrado"
    exit 1
fi

# ----- 2. Test: init --plan (simulação, não altera nada) -----
info "2. Testando init --plan (simulação)..."
mkdir -p /workspace/test-project && cd /workspace/test-project

INIT_PLAN=$(openclaw init --path . 2>&1)
if echo "$INIT_PLAN" | grep -q "SIMULAÇÃO"; then
    pass "init --plan mostra simulação"
else
    fail "init --plan não mostrou simulação"
fi

# Verificar que nada foi criado (plan mode)
if [ ! -d ".agent" ]; then
    pass "init --plan não criou .agent/ (read-only)"
else
    fail "init --plan criou .agent/ — deveria ser somente simulação"
fi

# ----- 3. Test: init --apply --yes (instalação real) -----
info "3. Testando init --apply --yes (instalação real)..."
INIT_APPLY=$(openclaw init --apply --yes --path . 2>&1)
if echo "$INIT_APPLY" | grep -q "sucesso"; then
    pass "init --apply instalou com sucesso"
else
    fail "init --apply falhou: $INIT_APPLY"
fi

# Verificar estrutura criada
for dir in agents rules skills workflows hooks; do
    if [ -d ".agent/$dir" ]; then
        count=$(ls .agent/$dir/ 2>/dev/null | wc -l | tr -d ' ')
        pass ".agent/$dir/ criado ($count itens)"
    else
        fail ".agent/$dir/ não encontrado"
    fi
done

if [ -f "openclaw.json" ]; then
    pass "openclaw.json criado"
else
    fail "openclaw.json não encontrado"
fi

# ----- 4. Test: status -----
info "4. Testando comando status..."
STATUS=$(openclaw status --path . 2>&1)
if echo "$STATUS" | grep -q "OpenClaw Status"; then
    pass "status funciona"
else
    fail "status falhou"
fi

# ----- 5. Test: doctor -----
info "5. Testando comando doctor..."
DOCTOR=$(openclaw doctor --path . 2>&1 || true)
if echo "$DOCTOR" | grep -q "Resumo"; then
    pass "doctor funciona"
else
    fail "doctor falhou"
fi

# ----- 6. Test: inspect -----
info "6. Testando comando inspect..."
INSPECT=$(openclaw inspect --path . 2>&1)
if echo "$INSPECT" | grep -q "Skills instaladas"; then
    SKILLS_COUNT=$(echo "$INSPECT" | grep -c "•")
    pass "inspect funciona — $SKILLS_COUNT skills detectadas"
else
    fail "inspect falhou"
fi

# ----- 7. Test: Verificar skills críticas -----
info "7. Verificando skills críticas..."
CRITICAL_SKILLS=(
    "smoke-tester"
    "ai-provider-setup"
    "vps-cloud-infra"
    "vpn-networking"
    "security-scanner"
    "test-engineer"
    "devops-toolkit"
    "code-quality"
)

for skill in "${CRITICAL_SKILLS[@]}"; do
    if [ -f ".agent/skills/$skill/SKILL.md" ]; then
        pass "Skill $skill instalada"
    else
        fail "Skill $skill NÃO encontrada"
    fi
done

# ----- 8. Test: update --plan (simulação) -----
info "8. Testando update --plan..."
# Modificar um arquivo para simular customização
echo "CUSTOMIZADO" > .agent/agents/sysadmin-proativo.md

UPDATE_PLAN=$(openclaw update --path . 2>&1)
if echo "$UPDATE_PLAN" | grep -q "SIMULAÇÃO"; then
    pass "update --plan mostra simulação"
else
    fail "update --plan falhou"
fi

# ----- 9. Test: update --apply --yes (preserva customização) -----
info "9. Testando update --apply --yes..."
UPDATE_APPLY=$(openclaw update --apply --yes --path . 2>&1)
if echo "$UPDATE_APPLY" | grep -q "concluída"; then
    pass "update --apply concluído"
else
    fail "update --apply falhou"
fi

# Verificar backup
if [ -f ".agent/agents/sysadmin-proativo.md.bak" ]; then
    pass "Backup da customização criado (.bak)"
else
    warn "Backup não encontrado (pode ter sido idêntico)"
fi

# Verificar audit log
AUDIT_COUNT=$(ls .agent/audit/ 2>/dev/null | wc -l | tr -d ' ')
if [ "$AUDIT_COUNT" -gt 0 ]; then
    pass "Audit logs gerados ($AUDIT_COUNT arquivos)"
else
    warn "Nenhum audit log encontrado"
fi

# ----- 10. Test: Ollama (se disponível) -----
info "10. Testando conectividade com Ollama..."
OLLAMA_URL="${OLLAMA_HOST:-http://host.docker.internal:11434}"
OLLAMA_RESP=$(curl -s --connect-timeout 3 "$OLLAMA_URL/api/tags" 2>&1 || echo "FALHA")

if echo "$OLLAMA_RESP" | grep -q "models"; then
    MODELS=$(echo "$OLLAMA_RESP" | jq -r '.models[].name' 2>/dev/null | tr '\n' ', ')
    pass "Ollama acessível — Modelos: $MODELS"
    
    # Testar geração rápida
    info "    Testando geração com Ollama..."
    GEN_RESP=$(curl -s --connect-timeout 10 "$OLLAMA_URL/api/generate" \
        -d '{"model":"qwen2.5:1.5b","prompt":"Responda apenas: OK","stream":false}' 2>&1 || echo "FALHA")
    
    if echo "$GEN_RESP" | grep -q "response"; then
        ANSWER=$(echo "$GEN_RESP" | jq -r '.response' 2>/dev/null | head -1)
        pass "Ollama gerou resposta: \"$ANSWER\""
    else
        warn "Ollama conectado mas geração falhou"
    fi
else
    warn "Ollama não acessível em $OLLAMA_URL (não é erro crítico)"
fi

# ----- 11. Test: ide install --plan -----
info "11. Testando ide install --plan..."
mkdir -p /workspace/test-ide-project && cd /workspace/test-ide-project
IDE_PLAN=$(openclaw ide install --path . 2>&1)
if echo "$IDE_PLAN" | grep -q "SIMULAÇÃO\|PLAN"; then
    pass "ide install --plan funciona"
else
    fail "ide install --plan falhou"
fi
cd /workspace/test-project

# ----- 12. Test: uninstall --plan -----
info "12. Testando uninstall --plan..."
UNINSTALL_PLAN=$(openclaw uninstall --path . 2>&1)
if echo "$UNINSTALL_PLAN" | grep -q "Modo PLAN"; then
    pass "uninstall --plan mostra simulação (sem remover nada)"
else
    fail "uninstall --plan falhou"
fi

# Verificar que .agent/ ainda existe (plan mode não remove)
if [ -d ".agent" ]; then
    pass "uninstall --plan preservou .agent/ (read-only)"
else
    fail "uninstall --plan removeu .agent/ indevidamente!"
fi

# ========================================
# RELATÓRIO FINAL
# ========================================
echo ""
echo "=========================================="
echo "  📊 Relatório Final"
echo "=========================================="
echo -e "  ${GREEN}✅ Pass: $PASS${NC}"
echo -e "  ${YELLOW}⚠️  Warn: $WARN${NC}"
echo -e "  ${RED}❌ Fail: $FAIL${NC}"
echo ""

if [ $FAIL -eq 0 ]; then
    echo -e "  ${GREEN}🎉 TODOS OS TESTES PASSARAM!${NC}"
    exit 0
else
    echo -e "  ${RED}⚠️  $FAIL TESTE(S) FALHARAM${NC}"
    exit 1
fi
