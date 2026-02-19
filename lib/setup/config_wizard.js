#!/usr/bin/env node
/**
 * OpenClaw OS - Universal Setup Wizard
 * 
 * Orquestrador principal que delega para os módulos lib/:
 * - detect.js  → detecção de ambiente (Docker/WSL2/Mac/Linux/VPS)
 * - config.js  → leitura/escrita JSON atômica + defaults
 * - security.js → tokens, masking e verificação de porta
 * - channels.js → validação e configuração de canais
 * 
 * Princípios:
 * - Seguro por padrão: bind localhost + auth token
 * - Cross-platform: detecção automática de ambiente
 * - Não destrutivo: nunca sobrescreve sem confirmação
 * 
 * @module config_wizard
 * @version 2.0.0
 * @author OpenClaw DevOps
 */
const fs = require("fs");
const os = require("os");
const path = require("path");
const readline = require("readline");

// Módulos extraídos para lib/ — cada um com responsabilidade única
const { detectEnvironment } = require("../detect");
const { readJsonSafe, writeJsonSafe, ensureFile, initConfigDefaults } = require("../config");
const { mask, generateToken, portInUse } = require("../security");
const { supportedChannels, configureChannel } = require("../channels");

/** Interface readline para perguntas interativas */
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

/**
 * Faz uma pergunta ao usuário via stdin e retorna a resposta trimada.
 * @param {string} q - A pergunta a ser exibida
 * @returns {Promise<string>} Resposta do usuário (trimada)
 */
function ask(q) { return new Promise(res => rl.question(q, ans => res(ans.trim()))); }

/**
 * Função principal do wizard de setup.
 * Orquestra todo o fluxo interativo:
 * 1. Detecta ambiente
 * 2. Configura gateway (bind + auth)
 * 3. Gera/solicita token de autenticação
 * 4. Sugere sandbox em VPS
 * 5. Configura canais (Telegram/Discord/WhatsApp)
 * 6. Configura allowlist de filesystem
 * 7. Cria arquivos de persistência (MEMORY.md, SOUL.md, AGENTS.md)
 * 8. Verifica porta 18789
 * 9. Sugere hardening em VPS
 * @returns {Promise<void>}
 */
async function main() {
  console.log("\n🧠 OpenClaw OS — Universal Setup Wizard\n");

  // --- 1. Detecção de ambiente (delegado para lib/detect) ---
  const env = detectEnvironment();
  console.log(`Ambiente detectado: ${env}`);

  const base = process.cwd();
  const configPath = path.join(base, "openclaw.json");

  // --- 2. Leitura da configuração existente (delegado para lib/config) ---
  let config = {};
  if (fs.existsSync(configPath)) {
    const parsed = readJsonSafe(configPath);
    if (!parsed) {
      console.error("✖ openclaw.json existe mas não é um JSON válido. Corrija e rode novamente.");
      process.exit(2);
    }
    config = parsed;
  }

  // Inicializa seções padrão sem sobrescrever existentes
  config = initConfigDefaults(config);

  let needWrite = !fs.existsSync(configPath);

  // --- 3. gateway.bind: segurança por padrão (localhost only) ---
  const desiredBind = "127.0.0.1";
  if (config.gateway.bind !== desiredBind) {
    const ans = await ask(`gateway.bind está "${config.gateway.bind ?? "(vazio)"}". Ajustar para "${desiredBind}"? (y/n): `);
    if (ans.toLowerCase() === "y") { config.gateway.bind = desiredBind; needWrite = true; }
  } else {
    console.log("✔ gateway.bind já está seguro (127.0.0.1)");
  }

  // --- 4. auth.mode: token obrigatório ---
  const desiredAuthMode = "token";
  if (config.auth.mode !== desiredAuthMode) {
    const ans = await ask(`auth.mode está "${config.auth.mode ?? "(vazio)"}". Ajustar para "${desiredAuthMode}"? (y/n): `);
    if (ans.toLowerCase() === "y") { config.auth.mode = desiredAuthMode; needWrite = true; }
  } else {
    console.log("✔ auth.mode já está em token");
  }

  // --- 5. Geração de token de autenticação (delegado para lib/security) ---
  if (config.auth.mode === "token") {
    config.auth.token = config.auth.token || "";
    if (!config.auth.token) {
      const ans = await ask("Nenhum token encontrado. Gerar um token seguro automaticamente? (y/n): ");
      if (ans.toLowerCase() === "y") {
        config.auth.token = generateToken();
        console.log(`✔ Token gerado: ${mask(config.auth.token)} (salvo no openclaw.json)`);
        needWrite = true;
      } else {
        const manual = await ask("Cole um token: ");
        if (manual) { config.auth.token = manual; needWrite = true; }
      }
    } else {
      console.log(`✔ Token já configurado (${mask(config.auth.token)})`);
    }
  }

  // --- 6. Sandbox: sugestão para VPS rodando como root ---
  if (env === "linux-vps-root") {
    if (config.sandbox.mode !== "non-main") {
      const ans = await ask(`Detectei VPS/root. Ativar sandbox mode "non-main" para isolar execuções? (y/n): `);
      if (ans.toLowerCase() === "y") { config.sandbox.mode = "non-main"; needWrite = true; }
    }
  }

  // --- 7. Configuração de canais (delegado para lib/channels) ---
  console.log("\n📣 Canais (opcional)");
  const channelList = supportedChannels().join("/");
  const ch = await ask(`Ativar agora? (${channelList}/nenhum): `);
  const channelChoice = ch.toLowerCase();

  if (supportedChannels().includes(channelChoice)) {
    // configureChannel recebe uma função ask injetável (testável)
    const configured = await configureChannel(config, channelChoice, ask);
    if (configured) needWrite = true;
  } else {
    console.log("↪ Pulando canais.");
  }

  // --- 8. Filesystem allowlist: princípio do menor privilégio ---
  console.log("\n📁 Acesso a arquivos locais (mínimo necessário)");
  console.log("Adicione apenas pastas que o OpenClaw realmente precisa acessar.");
  const addPath = await ask("Adicionar uma pasta allowlist agora? (caminho ou ENTER para pular): ");
  if (addPath) {
    const resolved = addPath.replace(/^~\//, os.homedir() + path.sep);
    config.filesystem.allowlist.push(resolved);
    needWrite = true;
    console.log(`✔ Allowlist adicionada: ${resolved}`);
  }

  // --- 9. Arquivos de persistência (delegado para lib/config.ensureFile) ---
  ensureFile(path.join(base, "MEMORY.md"), "# MEMORY.md\n\n- Preferências e notas persistentes do OpenClaw.\n");
  ensureFile(path.join(base, "SOUL.md"), "# SOUL.md\n\n- Identidade e regras de comportamento (ver AGENTS.md).\n");
  ensureFile(path.join(base, "AGENTS.md"), "# AGENTS.md\n\nVocê é um SysAdmin Proativo. Use VPN-first, bind localhost e token.\n");

  // --- 10. Checagem de porta (delegado para lib/security.portInUse) ---
  const port = 18789;
  console.log("\n🔎 Checagens rápidas");
  const inUse = await portInUse("127.0.0.1", port);
  if (inUse) console.log(`ℹ Porta ${port} respondeu em 127.0.0.1 (ok se OpenClaw está rodando).`);
  else console.log(`ℹ Porta ${port} não respondeu em 127.0.0.1 (ok se ainda não iniciou).`);

  // --- 11. Hardening: recomendações para VPS ---
  if (env === "linux-vps-root") {
    console.log("\n🛡 Hardening (recomendado)");
    console.log("- Crie um usuário não-root (ex: clawuser) e desative login por senha no SSH.");
    console.log("- Ative firewall (UFW) e fail2ban.");
    console.log("- Exponha publicamente apenas WireGuard (UDP) se usar VPN.");
  }

  // --- 12. Persistência da configuração (delegado para lib/config.writeJsonSafe) ---
  if (needWrite) {
    writeJsonSafe(configPath, config);
    console.log("\n✔ openclaw.json atualizado/criado com segurança.");
  } else {
    console.log("\n✔ Nenhuma alteração necessária no openclaw.json.");
  }

  console.log("\n✅ Setup finalizado.");
  console.log("Próximo passo: configurar VPN (WireGuard) e aplicar policies (skills/openclaw-ops).");
  rl.close();
}

main().catch((e) => {
  console.error("✖ Erro:", e && e.message ? e.message : e);
  process.exit(1);
});
