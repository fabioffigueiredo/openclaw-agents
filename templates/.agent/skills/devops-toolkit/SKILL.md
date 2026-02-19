---
name: devops-toolkit
description: Automação de infraestrutura, CI/CD, containerização, monitoramento e deploy. Suporte a Docker, GitHub Actions, Terraform, Ansible e Kubernetes.
triggers:
  - devops
  - ci/cd
  - pipeline
  - deploy
  - docker
  - dockerfile
  - docker-compose
  - kubernetes
  - k8s
  - terraform
  - ansible
  - github actions
  - gitlab ci
  - infraestrutura
  - infra
  - monitoramento
  - observabilidade
  - nginx
  - proxy reverso
  - ssl
  - https
---

# DevOps Toolkit

## Objetivo
Automatizar infraestrutura, CI/CD, containerização, monitoramento e deploy seguindo boas práticas de Infrastructure as Code (IaC) e GitOps.

## Contexto necessário
- Provedor de cloud (AWS, GCP, Azure, VPS, local)
- Ferramenta de CI/CD em uso (GitHub Actions, GitLab CI, Jenkins)
- Stack do projeto (linguagem, framework, banco de dados)
- Ambiente alvo (dev, staging, prod)

## Fluxo (inspect → plan → consent → apply → verify → audit)

1. **INSPECT**: Analisar infra existente (Dockerfile, compose, CI configs, deploy scripts)
2. **PLAN**: Propor melhorias com diagrama de arquitetura
3. **CONSENT**: Confirmar antes de qualquer alteração em infra
4. **APPLY**: Gerar/modificar configs
5. **VERIFY**: Testar build, healthcheck, deploy em staging
6. **AUDIT**: Registrar mudanças de infra

## Capacidades

### 🐳 Containerização
- Criar/otimizar Dockerfiles (multi-stage builds, cache layers)
- Docker Compose para desenvolvimento local
- Boas práticas: non-root user, .dockerignore, health checks
- Reduzir tamanho de imagem (Alpine, distroless, slim)

### 🔄 CI/CD Pipelines
- GitHub Actions (workflows, matrix, caching, secrets)
- GitLab CI (stages, artifacts, environments)
- Estratégias: lint → test → build → deploy
- Cache de dependências para acelerar builds
- Deploy com rollback automático

### ☁️ Infrastructure as Code
- Terraform: providers, modules, state management
- Ansible: playbooks, roles, inventários
- Kubernetes: manifests, Helm charts, kustomize

### 📊 Monitoramento e Observabilidade
- Healthchecks e readiness probes
- Logging estruturado (JSON, correlação de requests)
- Métricas (Prometheus, Grafana, Datadog)
- Alertas baseados em SLOs/SLIs

### 🔒 Segurança de Infra
- Scan de vulnerabilidades em imagens Docker (Trivy, Snyk)
- Secrets management (Vault, SOPS, GitHub Secrets)
- Network policies e firewall rules
- TLS/SSL com renovação automática (Let's Encrypt, Certbot)

## Checklists

### Dockerfile
- [ ] Multi-stage build (builder + runner)
- [ ] Usuário non-root
- [ ] .dockerignore configurado
- [ ] HEALTHCHECK definido
- [ ] Apenas dependências de produção na imagem final
- [ ] Layers ordenadas por frequência de mudança (cache)

### CI/CD Pipeline
- [ ] Lint e testes rodam em cada PR
- [ ] Build e push de imagem em merge na main
- [ ] Deploy automático em staging, manual em prod
- [ ] Cache de dependências configurado
- [ ] Secrets não expostos em logs
- [ ] Rollback automático se healthcheck falhar

### Deploy em Produção
- [ ] Blue-green ou canary deployment
- [ ] Database migrations antes do deploy
- [ ] Backup antes de mudanças destrutivas
- [ ] Monitoramento ativo pós-deploy (5-15 min)
- [ ] Runbook de rollback documentado

## Regras de segurança
- ✅ Nunca commitar secrets no repositório
- ✅ Testar em staging antes de prod
- ✅ Infraestrutura versionada no Git (IaC)
- ❌ Nunca fazer deploy direto em prod sem pipeline
- ❌ Nunca rodar containers como root em produção
