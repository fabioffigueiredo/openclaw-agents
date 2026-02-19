---
name: vps-cloud-infra
description: Setup, gerenciamento e hardening de VPS e cloud servers. Suporte a Contabo, Hetzner, DigitalOcean, Linode, Oracle Cloud, AWS Lightsail, Vultr e mais.
triggers:
  - vps
  - servidor
  - server
  - contabo
  - hetzner
  - digitalocean
  - linode
  - oracle cloud
  - aws
  - lightsail
  - vultr
  - cloud
  - ubuntu server
  - debian
  - centos
  - ssh
  - firewall
  - ufw
  - iptables
  - hardening
  - provisionamento
---

# VPS & Cloud Infrastructure

## Objetivo
Provisionar, configurar, proteger e gerenciar servidores VPS/Cloud de qualquer provedor, seguindo boas práticas de segurança e automação.

## Provedores suportados — Comparativo

| Provedor | Preço mín/mês | vCPU | RAM | Disco | Rede | Free tier | Melhor para |
|---------|--------------|------|-----|-------|------|---------|------------|
| **Contabo** | €4.99 | 4 | 6GB | 100GB SSD | 32TB | ❌ | Custo/benefício, storage |
| **Hetzner** | €3.79 | 2 | 2GB | 20GB | 20TB | ❌ | EU, performance, ARM |
| **DigitalOcean** | $6 | 1 | 1GB | 25GB | 1TB | $200 (60d) | Simplicidade, Apps |
| **Linode/Akamai** | $5 | 1 | 1GB | 25GB | 1TB | $100 (60d) | Comunidade, docs |
| **Vultr** | $2.50 | 1 | 512MB | 10GB | 500GB | $250 (30d) | Ultra-barato |
| **Oracle Cloud** | Free | 4 ARM | 24GB | 200GB | 10TB | ✅ Always Free | GPU grátis (ARM Ampere) |
| **AWS Lightsail** | $3.50 | 1 | 512MB | 20GB | 1TB | $0 (3mo) | Ecossistema AWS |
| **GCP Compute** | $6.11 | 1 | 0.6GB | 10GB | Egress $ | ✅ e2-micro | Integração Google |
| **Azure B1s** | Free | 1 | 1GB | 64GB | 15GB | ✅ 12 meses | Enterprise, .NET |

## Setup inicial de VPS — Checklist universal

### Passo 1: Acesso inicial
```bash
# Conectar via SSH (primeiro acesso, geralmente root)
ssh root@<IP_DO_SERVIDOR>

# Se exigir senha, trocar por chave imediatamente
ssh-copy-id -i ~/.ssh/id_ed25519.pub root@<IP>
```

### Passo 2: Criar usuário admin (nunca usar root no dia a dia)
```bash
adduser fabio
usermod -aG sudo fabio
mkdir -p /home/fabio/.ssh
cp /root/.ssh/authorized_keys /home/fabio/.ssh/
chown -R fabio:fabio /home/fabio/.ssh
chmod 700 /home/fabio/.ssh
chmod 600 /home/fabio/.ssh/authorized_keys
```

### Passo 3: Hardening SSH
```bash
# /etc/ssh/sshd_config
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
MaxAuthTries 3
ClientAliveInterval 300
ClientAliveCountMax 2

# Reiniciar SSH
systemctl restart sshd
```

### Passo 4: Firewall
```bash
# UFW (Ubuntu/Debian)
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable

# Para VPN: adicionar porta WireGuard
ufw allow 51820/udp
```

### Passo 5: Atualizações automáticas
```bash
apt install unattended-upgrades
dpkg-reconfigure -plow unattended-upgrades
```

### Passo 6: Docker (se necessário)
```bash
curl -fsSL https://get.docker.com | sh
usermod -aG docker fabio
# Relogar para aplicar grupo
```

### Passo 7: Monitoramento básico
```bash
# Instalar ferramentas essenciais
apt install htop iotop ncdu fail2ban

# Fail2ban (proteção contra brute force)
systemctl enable fail2ban
systemctl start fail2ban
```

## Hardening avançado

| Item | Comando/Config | Prioridade |
|------|---------------|-----------|
| SSH key-only | `PasswordAuthentication no` | 🔴 Crítico |
| Disable root login | `PermitRootLogin no` | 🔴 Crítico |
| Fail2ban | `apt install fail2ban` | 🟠 Alta |
| UFW firewall | `ufw enable` | 🟠 Alta |
| Unattended upgrades | `dpkg-reconfigure unattended-upgrades` | 🟡 Média |
| SSH port diferente | `Port 2222` em sshd_config | 🟡 Média |
| 2FA SSH | `libpam-google-authenticator` | 🟢 Opcional |
| Audit logging | `auditd` + regras | 🟢 Opcional |
| CrowdSec | Alternativa moderna ao fail2ban | 🟢 Opcional |

## Regras de segurança
- ✅ Nunca usar root para tarefas do dia a dia
- ✅ SSH somente por chave (nunca senha)
- ✅ Firewall ativo com regras mínimas
- ✅ Backups regulares (ponto de restauração antes de mudanças)
- ❌ Nunca expor portas desnecessárias sem firewall
- ❌ Nunca armazenar chaves SSH privadas no servidor
