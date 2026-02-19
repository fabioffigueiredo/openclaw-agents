---
name: vpn-networking
description: Setup e gerenciamento de VPNs (WireGuard, Tailscale, OpenVPN, Cloudflare Tunnel, ZeroTier, Headscale) e networking seguro entre VPS, Mac, Docker e cloud.
triggers:
  - vpn
  - wireguard
  - tailscale
  - openvpn
  - cloudflare tunnel
  - zerotier
  - headscale
  - rede
  - network
  - tunel
  - tunnel
  - peer
  - mesh
  - overlay
  - site-to-site
---

# VPN & Networking

## Objetivo
Configurar redes privadas seguras entre VPS, dispositivos locais e containers, usando a solução de VPN mais adequada para cada cenário.

## Soluções VPN — Comparativo

| VPN | Tipo | Setup | Performance | Self-hosted | Free | Melhor para |
|-----|------|-------|------------|------------|------|------------|
| **WireGuard** | Kernel VPN | Médio | ⚡⚡⚡ Excelente | ✅ Total | ✅ | Site-to-site, alta performance |
| **Tailscale** | Mesh overlay | ⚡ Fácil | ⚡⚡ Boa | ⚠️ Parcial | ✅ (3 users) | Zero-config, multi-device |
| **Headscale** | Mesh overlay | Médio | ⚡⚡ Boa | ✅ Total | ✅ | Tailscale self-hosted |
| **OpenVPN** | TLS VPN | Complexo | ⚡ OK | ✅ Total | ✅ | Legacy, compatibilidade |
| **Cloudflare Tunnel** | Reverse tunnel | ⚡ Fácil | ⚡⚡ Boa | ❌ Cloudflare | ✅ | Expor serviços sem IP público |
| **ZeroTier** | Mesh overlay | ⚡ Fácil | ⚡⚡ Boa | ✅ Total | ✅ (25 devices) | IoT, redes grandes |
| **Nebula** | Mesh overlay | Médio | ⚡⚡⚡ Excelente | ✅ Total | ✅ | Escala enterprise (Slack) |

---

## WireGuard — Setup Completo

### Cenário: VPS → Mac (ponto a ponto)

**No servidor (VPS):**
```bash
# Instalar
apt install wireguard

# Gerar chaves
wg genkey | tee /etc/wireguard/private.key | wg pubkey > /etc/wireguard/public.key
chmod 600 /etc/wireguard/private.key

# Configurar /etc/wireguard/wg0.conf
[Interface]
PrivateKey = <CHAVE_PRIVADA_VPS>
Address = 10.66.0.1/24
ListenPort = 51820
PostUp = iptables -A FORWARD -i wg0 -j ACCEPT; iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
PostDown = iptables -D FORWARD -i wg0 -j ACCEPT; iptables -t nat -D POSTROUTING -o eth0 -j MASQUERADE

[Peer]
PublicKey = <CHAVE_PUBLICA_MAC>
AllowedIPs = 10.66.0.2/32

# Ativar
wg-quick up wg0
systemctl enable wg-quick@wg0
```

**No Mac (peer):**
```bash
# Instalar via Homebrew ou App Store
brew install wireguard-tools

# Configurar /etc/wireguard/wg0.conf
[Interface]
PrivateKey = <CHAVE_PRIVADA_MAC>
Address = 10.66.0.2/24

[Peer]
PublicKey = <CHAVE_PUBLICA_VPS>
Endpoint = <IP_PUBLICO_VPS>:51820
AllowedIPs = 10.66.0.0/24
PersistentKeepalive = 25

# Conectar
wg-quick up wg0
```

### Dashboard (WGDashboard — Docker)
```yaml
# docker-compose.yml
services:
  wgdashboard:
    image: donaldzou/wgdashboard:latest
    cap_add: [NET_ADMIN, SYS_MODULE]
    ports:
      - "10086:10086"
      - "51820:51820/udp"
    volumes:
      - ./wg-data:/etc/wireguard
    sysctls:
      net.ipv4.ip_forward: 1
```

---

## Tailscale — Zero-Config

```bash
# VPS
curl -fsSL https://tailscale.com/install.sh | sh
tailscale up --ssh

# Mac
brew install tailscale
tailscale up

# Verificar rede
tailscale status
# Dispositivos se encontram automaticamente (MagicDNS)
```

**Vantagens:** Zero-config, NAT traversal automático, MagicDNS, SSH integrado, ACLs
**Limitações:** Depende de coord server (Tailscale Inc.), free até 3 users

---

## Headscale — Tailscale Self-Hosted

```bash
# No servidor (control plane)
wget https://github.com/juanfont/headscale/releases/latest/download/headscale_linux_amd64
chmod +x headscale_linux_amd64
mv headscale_linux_amd64 /usr/local/bin/headscale

# Configurar /etc/headscale/config.yaml
# Registrar namespace e nodes
headscale namespaces create minha-rede
headscale nodes register --namespace minha-rede --key <node-key>
```

---

## Cloudflare Tunnel — Sem IP Público

```bash
# Instalar cloudflared
curl -fsSL https://pkg.cloudflare.com/cloudflare-main.gpg | sudo tee /usr/share/keyrings/cloudflare-main.gpg
apt install cloudflared

# Autenticar
cloudflared tunnel login

# Criar túnel
cloudflared tunnel create meu-tunel
cloudflared tunnel route dns meu-tunel app.meudominio.com

# Configurar ~/.cloudflared/config.yml
tunnel: <TUNNEL_ID>
ingress:
  - hostname: app.meudominio.com
    service: http://localhost:3000
  - service: http_status:404

# Rodar
cloudflared tunnel run meu-tunel
```

---

## Cenários comuns e recomendação

| Cenário | VPN recomendada | Motivo |
|---------|----------------|--------|
| VPS pessoal + Mac | WireGuard | Performance, controle total |
| Múltiplos dispositivos pessoais | Tailscale | Zero-config, fácil |
| Empresa/Team | Headscale ou Tailscale Pro | ACLs, controle |
| Expor serviço sem IP fixo | Cloudflare Tunnel | Sem porta aberta |
| IoT / muitos devices | ZeroTier | Escalável, simples |
| Legacy / compatibilidade | OpenVPN | Suporte universal |
| Alta performance + escala | Nebula | Kernel-level, mesh |

## Troubleshooting comum

| Problema | Diagnóstico | Solução |
|---------|------------|---------|
| Peer não conecta | `wg show` (handshake?) | Verificar endpoint, firewall, chaves |
| Tráfego não passa | `ping 10.66.0.X` falha | Verificar AllowedIPs, ip_forward |
| DNS não resolve | `dig @10.66.0.1` | Configurar DNS no wg0.conf |
| Conexão cai | Sem keepalive | Adicionar `PersistentKeepalive = 25` |
| Performance ruim | `iperf3` entre peers | Verificar MTU (1420 para WG) |

## Regras de segurança
- ✅ Chaves WireGuard devem ter permissão 600
- ✅ Firewall deve permitir apenas porta da VPN publicamente
- ✅ SSH deve ser acessível SOMENTE via VPN quando possível
- ❌ Nunca compartilhar chaves privadas entre peers
- ❌ Nunca usar AllowedIPs = 0.0.0.0/0 sem entender as implicações
