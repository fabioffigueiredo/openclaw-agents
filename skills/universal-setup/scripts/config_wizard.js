\
#!/usr/bin/env node
/**
 * OpenClaw OS - Universal Setup Wizard
 * Seguro por padrão: bind localhost + token
 * Cross-platform: Linux/macOS/Windows/WSL/Docker
 * Não sobrescreve sem confirmação
 */
const fs = require("fs");
const os = require("os");
const path = require("path");
const crypto = require("crypto");
const net = require("net");
const readline = require("readline");

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

function ask(q) { return new Promise(res => rl.question(q, ans => res(ans.trim()))); }

function isDocker() {
  return fs.existsSync("/.dockerenv") ||
    (fs.existsSync("/proc/1/cgroup") && fs.readFileSync("/proc/1/cgroup", "utf8").includes("docker"));
}
function isWSL() {
  return os.platform() === "linux" &&
    (os.release().toLowerCase().includes("microsoft") || process.env.WSL_DISTRO_NAME);
}
function detectEnvironment() {
  if (isDocker()) return "docker";
  if (isWSL()) return "wsl2";
  if (os.platform() === "win32") return "windows";
  if (os.platform() === "darwin") return "mac";
  if (os.platform() === "linux") {
    const user = os.userInfo().username;
    if (user === "root") return "linux-vps-root";
    return "linux";
  }
  return "unknown";
}

function readJsonSafe(p) {
  try { return JSON.parse(fs.readFileSync(p, "utf8")); }
  catch { return null; }
}
function writeJsonSafe(p, obj) {
  const tmp = p + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(obj, null, 2), "utf8");
  fs.renameSync(tmp, p);
}
function ensureFile(p, content) {
  if (!fs.existsSync(p)) {
    fs.writeFileSync(p, content, "utf8");
    console.log(`✔ Criado ${path.basename(p)}`);
  }
}
function portInUse(host, port) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(600);
    socket.once("error", () => resolve(false));
    socket.once("timeout", () => { socket.destroy(); resolve(false); });
    socket.connect(port, host, () => { socket.end(); resolve(true); });
  });
}
function mask(s) {
  if (!s) return "";
  if (s.length <= 6) return "***";
  return s.slice(0, 3) + "…" + s.slice(-3);
}

async function main() {
  console.log("\n🧠 OpenClaw OS — Universal Setup Wizard\n");

  const env = detectEnvironment();
  console.log(`Ambiente detectado: ${env}`);

  const base = process.cwd();
  const configPath = path.join(base, "openclaw.json");

  let config = {};
  if (fs.existsSync(configPath)) {
    const parsed = readJsonSafe(configPath);
    if (!parsed) {
      console.error("✖ openclaw.json existe mas não é um JSON válido. Corrija e rode novamente.");
      process.exit(2);
    }
    config = parsed;
  }

  config.gateway = config.gateway || {};
  config.auth = config.auth || {};
  config.channels = config.channels || {};
  config.filesystem = config.filesystem || {};
  config.filesystem.allowlist = config.filesystem.allowlist || [];

  let needWrite = !fs.existsSync(configPath);

  // gateway.bind secure default
  const desiredBind = "127.0.0.1";
  if (config.gateway.bind !== desiredBind) {
    const ans = await ask(`gateway.bind está "${config.gateway.bind ?? "(vazio)"}". Ajustar para "${desiredBind}"? (y/n): `);
    if (ans.toLowerCase() === "y") { config.gateway.bind = desiredBind; needWrite = true; }
  } else {
    console.log("✔ gateway.bind já está seguro (127.0.0.1)");
  }

  // auth.mode secure default
  const desiredAuthMode = "token";
  if (config.auth.mode !== desiredAuthMode) {
    const ans = await ask(`auth.mode está "${config.auth.mode ?? "(vazio)"}". Ajustar para "${desiredAuthMode}"? (y/n): `);
    if (ans.toLowerCase() === "y") { config.auth.mode = desiredAuthMode; needWrite = true; }
  } else {
    console.log("✔ auth.mode já está em token");
  }

  // token
  if (config.auth.mode === "token") {
    config.auth.token = config.auth.token || "";
    if (!config.auth.token) {
      const ans = await ask("Nenhum token encontrado. Gerar um token seguro automaticamente? (y/n): ");
      if (ans.toLowerCase() === "y") {
        config.auth.token = crypto.randomBytes(24).toString("hex");
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

  // sandbox suggestion (VPS)
  config.sandbox = config.sandbox || {};
  if (env === "linux-vps-root") {
    if (config.sandbox.mode !== "non-main") {
      const ans = await ask(`Detectei VPS/root. Ativar sandbox mode "non-main" para isolar execuções? (y/n): `);
      if (ans.toLowerCase() === "y") { config.sandbox.mode = "non-main"; needWrite = true; }
    }
  }

  // channels
  console.log("\n📣 Canais (opcional)");
  const ch = await ask("Ativar agora? (telegram/discord/nenhum): ");
  if (ch.toLowerCase() === "telegram") {
    const token = await ask("Telegram bot token: ");
    if (token) { config.channels.telegram = { token }; needWrite = true; console.log("✔ Telegram configurado."); }
  } else if (ch.toLowerCase() === "discord") {
    const token = await ask("Discord bot token: ");
    if (token) { config.channels.discord = { token }; needWrite = true; console.log("✔ Discord configurado."); }
  } else {
    console.log("↪ Pulando canais.");
  }

  // filesystem allowlist
  console.log("\n📁 Acesso a arquivos locais (mínimo necessário)");
  console.log("Adicione apenas pastas que o OpenClaw realmente precisa acessar.");
  const addPath = await ask("Adicionar uma pasta allowlist agora? (caminho ou ENTER para pular): ");
  if (addPath) {
    const resolved = addPath.replace(/^~\//, os.homedir() + path.sep);
    config.filesystem.allowlist.push(resolved);
    needWrite = true;
    console.log(`✔ Allowlist adicionada: ${resolved}`);
  }

  // persistence files
  ensureFile(path.join(base, "MEMORY.md"), "# MEMORY.md\n\n- Preferências e notas persistentes do OpenClaw.\n");
  ensureFile(path.join(base, "SOUL.md"), "# SOUL.md\n\n- Identidade e regras de comportamento (ver AGENTS.md).\n");
  ensureFile(path.join(base, "AGENTS.md"), "# AGENTS.md\n\nVocê é um SysAdmin Proativo. Use VPN-first, bind localhost e token.\n");

  // port check
  const port = 18789;
  console.log("\n🔎 Checagens rápidas");
  const inUse = await portInUse("127.0.0.1", port);
  if (inUse) console.log(`ℹ Porta ${port} respondeu em 127.0.0.1 (ok se OpenClaw está rodando).`);
  else console.log(`ℹ Porta ${port} não respondeu em 127.0.0.1 (ok se ainda não iniciou).`);

  if (env === "linux-vps-root") {
    console.log("\n🛡 Hardening (recomendado)");
    console.log("- Crie um usuário não-root (ex: clawuser) e desative login por senha no SSH.");
    console.log("- Ative firewall (UFW) e fail2ban.");
    console.log("- Exponha publicamente apenas WireGuard (UDP) se usar VPN.");
  }

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
