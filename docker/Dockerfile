## Dockerfile multi-stage para OpenClaw OS
##
## Build: docker build -t openclaw -f docker/Dockerfile .
## Run:   docker run -d --name openclaw -p 127.0.0.1:18789:18789 openclaw

# --- Stage 1: Build ---
FROM node:22-slim AS builder

WORKDIR /app

# Copia apenas package*.json para cache de dependências
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts

# Copia código-fonte necessário
COPY bin/ ./bin/
COPY lib/ ./lib/
COPY templates/ ./templates/

# --- Stage 2: Runtime ---
FROM node:22-slim AS runtime

# Labels de metadados OCI
LABEL org.opencontainers.image.title="OpenClaw OS"
LABEL org.opencontainers.image.description="CLI e runtime para configuração segura do OpenClaw"
LABEL org.opencontainers.image.version="3.0.0"

# Cria usuário não-root para segurança
RUN groupadd -r openclaw && useradd -r -g openclaw -m openclaw

WORKDIR /app

# Copia artefatos do builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/bin ./bin
COPY --from=builder /app/lib ./lib
COPY --from=builder /app/templates ./templates

# Permissão de execução no CLI
RUN chmod +x bin/openclaw.js

# Cria diretórios para workspace e logs
RUN mkdir -p /workspace /var/log/openclaw \
    && chown -R openclaw:openclaw /app /workspace /var/log/openclaw

# Troca para usuário não-root
USER openclaw

# Inicializa .agent/ no workspace
RUN node bin/openclaw.js init --path /workspace --quiet || true

# Porta padrão do OpenClaw
EXPOSE 18789

# Healthcheck embutido
HEALTHCHECK --interval=30s --timeout=10s --retries=3 --start-period=15s \
    CMD node -e "require('net').createConnection({port:18789}).on('error',()=>process.exit(1)).on('connect',()=>process.exit(0))"

# Entry point: mantém container vivo para execução de comandos
CMD ["node", "-e", "console.log('🦀 OpenClaw OS v3.0.0 pronto'); setInterval(()=>{},1<<30)"]
