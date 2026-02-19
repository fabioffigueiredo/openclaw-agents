# Guia de Deploy — OpenClaw OS

Este documento descreve como preparar, publicar e implantar o OpenClaw OS em produção.

## 1. Preparação do Pacote npm

O projeto é estruturado como um pacote npm instalável.

1. **Testes**: Garanta que todos passem.
   ```bash
   npm test
   npm run test:coverage
   ```

2. **Build Docker**: Verifique se a imagem constrói corretamente.
   ```bash
   npm run docker:build
   ```

3. **Versão**: Atualize `package.json` e `CHANGELOG.md`.
   ```bash
   npm version patch  # ou minor/major
   ```

## 2. Publicação (npm registry)

Para publicar no npm (público ou privado):

```bash
npm login
npm publish --access public
```

Isso disponibilizará o comando `npx openclaw` globalmente.

## 3. Deploy em VPS (Ubuntu/Debian)

### Pré-requisitos
- VPS com IP público
- Acesso root (ou sudo)
- Porta 51820/UDP liberada (se usar WireGuard)

### Instalação

1. **Instale Node.js 18+**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

2. **Instale OpenClaw**
   ```bash
   mkdir -p ~/openclaw-workspace
   cd ~/openclaw-workspace
   npx @fabioforest/openclaw init
   ```

3. **Configuração**
   Rode o wizard interativo:
   ```bash
   npx @fabioforest/openclaw setup
   ```
   Siga as instruções para configurar token e canais.

4. **Setup Operacional (WireGuard)**
   Se for o gateway primário, gere a VPN:
   ```bash
   # (Exemplo hipotético - script ops/vpn.js deve ser integrado aqui ou rodado via node)
   # node node_modules/openclaw/lib/ops/vpn.js setup
   ```

5. **Process Manager (PM2)**
   Para manter rodando em produção:
   ```bash
   sudo npm install -g pm2
   pm2 start "npx openclaw start" --name openclaw  # se houver comando start
   # Ou rodar via Docker (recomendado)
   ```

## 4. Deploy com Docker (Recomendado)

O método mais robusto e isolado.

1. **No servidor:**
   ```bash
   mkdir openclaw && cd openclaw
   # Baixe docker-compose.yml do repositório ou crie um
   curl -o docker-compose.yml https://raw.githubusercontent.com/fabioffigueiredo/openclaw-agents/main/docker/docker-compose.yml
   ```

2. **Configure .env:**
   ```bash
   echo "OPENCLAW_TOKEN=$(openssl rand -hex 32)" > .env
   ```

3. **Suba o serviço:**
   ```bash
   docker compose up -d
   ```

4. **Verifique:**
   ```bash
   docker compose logs -f
   ```

## 5. Atualização

### Via npm/npx
Dentro do diretório do projeto:
```bash
npx openclaw update
```
Isso atualizará os templates `.agent/` mantendo suas customizações.

### Via Docker
```bash
docker compose pull
docker compose up -d
```
