# OpenClaw AI OS — Router Protocol (Chat-first)

## Regra Suprema
**READ-ONLY por padrão.**
Nada pode ser criado/alterado/apagado sem **autorização explícita** do usuário.

## Fluxo obrigatório para qualquer pedido no chat
1) **Inspecionar (read-only):** entender o contexto do workspace (SO, IDE, Docker/VPS/local, OpenClaw existente, skills disponíveis).
2) **Roteamento:** escolher a skill mais adequada com base em `triggers`/`description`.
3) **Plano:** apresentar um plano claro e verificável com:
   - arquivos que seriam tocados
   - comandos que seriam executados
   - riscos e rollback
4) **Consentimento:** perguntar: **"Posso aplicar?"**
5) **Aplicar somente após confirmação:**
   - se envolver overwrite/delete: exigir confirmação reforçada (ex.: digitar uma frase)
6) **Auditoria:** documentar tudo que foi feito/alterado e resultado (certo/errado).

## Segurança mínima
- bind localhost + token por padrão
- acesso remoto somente via VPN (WireGuard)
- bloquear ações destrutivas sem confirmação explícita
