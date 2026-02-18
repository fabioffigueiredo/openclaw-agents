# Threat Model (resumo)
Ameaças relevantes:
- Prompt injection via workspace / web
- Execução de comandos destrutivos
- Exfiltração de dados (rede/FS)
- Supply chain (plugins/extensões)

Mitigações:
- VPN-first para acesso remoto
- bind localhost + token
- allowlists de rede e FS
- auditoria e request_id
- aprovação humana para ações irreversíveis
