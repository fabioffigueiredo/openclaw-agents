---
name: security-scanner
description: Análise de segurança de código e infraestrutura — SAST, DAST, dependency audit, secrets scanning, OWASP Top 10 e hardening.
triggers:
  - segurança
  - security
  - vulnerabilidade
  - cve
  - owasp
  - pentest
  - scan
  - auditoria de segurança
  - secrets
  - injection
  - xss
  - csrf
  - sql injection
  - hardening
  - sast
  - dast
  - dependências vulneráveis
---

# Security Scanner

## Objetivo
Identificar vulnerabilidades de segurança no código, dependências e infraestrutura, seguindo OWASP Top 10 e boas práticas de AppSec.

## Contexto necessário
- Linguagem/framework do projeto
- Tipo de aplicação (web, API, mobile, CLI)
- Ambiente (dev, staging, prod)
- Requisitos de compliance (SOC2, LGPD, PCI-DSS, HIPAA)

## Fluxo (inspect → plan → consent → apply → verify → audit)

1. **INSPECT** (read-only):
   - Scan de dependências (CVEs conhecidos)
   - Busca de secrets no código (API keys, senhas, tokens)
   - Análise estática (SAST): injection, XSS, CSRF
   - Verificação de configuração (CORS, headers, CSP)
   - Análise de Dockerfile/compose (imagem base, root, ports)

2. **PLAN** — Relatório de vulnerabilidades por severidade:

   | Severidade | Exemplo | Ação |
   |-----------|---------|------|
   | 🔴 Crítica | SQL injection, secret exposto | Fix imediato |
   | 🟠 Alta | Dependência com CVE alto | Update urgente |
   | 🟡 Média | CORS permissivo, headers faltando | Planejar fix |
   | 🟢 Baixa | Versão desatualizada sem CVE | Monitorar |

3. **CONSENT**: Confirmar correções propostas
4. **APPLY**: Aplicar fixes + atualizar dependências
5. **VERIFY**: Re-scan para confirmar correção
6. **AUDIT**: Relatório de segurança antes/depois

## Capacidades

### 🔍 SAST (Static Application Security Testing)
- Análise de código sem executar
- Detecção de injection (SQL, NoSQL, command, LDAP)
- Cross-Site Scripting (XSS) e Cross-Site Request Forgery (CSRF)
- Insecure deserialization
- Path traversal e file inclusion

### 📦 Dependency Audit
- `npm audit` / `yarn audit` (JavaScript)
- `pip-audit` / `safety` (Python)
- `cargo audit` (Rust)
- `go vuln check` (Go)
- Snyk, Dependabot, Renovate para automação

### 🔑 Secrets Scanning
- Busca de: API keys, passwords, tokens, private keys, connection strings
- Ferramentas: gitleaks, truffleHog, detect-secrets
- Verificação em histórico do Git (commits antigos)
- Pre-commit hooks para prevenir novos leaks

### 🌐 DAST (Dynamic Application Security Testing)
- Scan de endpoint em runtime
- Ferramentas: OWASP ZAP, Nuclei, Burp Suite
- Verificação de headers de segurança (CSP, HSTS, X-Frame-Options)
- Teste de rate limiting e brute force

### 🏗️ Infrastructure Security
- Scan de imagens Docker (Trivy, Grype)
- Verificação de configuração cloud (Checkov, ScoutSuite)
- Network security (ports expostas, firewall rules)
- TLS/SSL assessment (testssl.sh, SSL Labs)

## OWASP Top 10 — Checklist

- [ ] **A01 Broken Access Control**: Verificar RBAC, IDOR, path traversal
- [ ] **A02 Cryptographic Failures**: TLS, hashing de senhas (bcrypt/argon2), encryption at rest
- [ ] **A03 Injection**: SQL, NoSQL, OS command, LDAP, XSS
- [ ] **A04 Insecure Design**: Threat modeling, abuse cases
- [ ] **A05 Security Misconfiguration**: Default configs, debug mode em prod, headers
- [ ] **A06 Vulnerable Components**: Dependencies com CVEs, EOL libraries
- [ ] **A07 Authentication Failures**: MFA, session management, brute force protection
- [ ] **A08 Data Integrity Failures**: CI/CD security, deserialization, updates sem verificação
- [ ] **A09 Logging Failures**: Logs sem dados sensíveis, monitoramento de atividade suspeita
- [ ] **A10 SSRF**: Validação de URLs, allowlists de destinos

## Ferramentas recomendadas

| Categoria | Ferramenta | Linguagem |
|-----------|-----------|-----------|
| SAST | Semgrep, CodeQL, SonarQube | Multi-linguagem |
| Deps | npm audit, pip-audit, Snyk | JS, Python, multi |
| Secrets | gitleaks, truffleHog | Qualquer |
| DAST | OWASP ZAP, Nuclei | Web apps |
| Docker | Trivy, Grype | Containers |
| Infra | Checkov, tfsec | Terraform, Cloud |

## Regras de segurança
- ✅ Scan de segurança deve rodar no CI/CD em cada PR
- ✅ Vulnerabilidades críticas bloqueiam merge
- ✅ Secrets encontrados devem ser revogados IMEDIATAMENTE
- ❌ Nunca ignorar CVEs críticos sem justificativa documentada
- ❌ Nunca publicar relatório de segurança detalhado em canal público
