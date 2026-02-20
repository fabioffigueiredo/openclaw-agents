// lib/setup/config_wizard.js
const fs = require("fs");
const os = require("os");
const path = require("path");
const crypto = require("crypto");

// Módulos extraídos para lib/
const { detectEnvironment } = require("../detect");
const { readJsonSafe, writeJsonSafe, initConfigDefaults } = require("../config");
const { mask, generateToken, portInUse } = require("../security");
const { supportedChannels, configureChannel } = require("../channels");

// util simples
function exists(p) { try { return fs.existsSync(p); } catch { return false; } }

async function ask(prompt) {
  const readline = require("readline");
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((res) => rl.question(prompt, (ans) => { rl.close(); res(ans.trim()); }));
}

// CONSENT-FIRST: cria arquivo somente com apply + confirmação
async function ensureFileWithConsent({ filePath, content, flags }) {
  if (exists(filePath)) {
    console.log(`✅ KEEP   ${path.basename(filePath)} (já existe)`);
    return { changed: false };
  }

  console.log(`📝 PLAN   criar ${path.basename(filePath)} (não existe)`);

  if (!flags.apply) {
    return { changed: false, planned: true };
  }

  if (!flags.yes) {
    const ok = (await ask(`Criar ${path.basename(filePath)}? (y/N): `)).toLowerCase() === "y";
    if (!ok) {
      console.log(`⏹️  SKIP  ${path.basename(filePath)}`);
      return { changed: false };
    }
  }

  fs.writeFileSync(filePath, content, "utf8");
  console.log(`✅ DONE  ${path.basename(filePath)}`);
  return { changed: true };
}

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function diffKeys(before, after) {
  // diff simples: mostra chaves alteradas
  const changes = [];
  const walk = (a, b, prefix = "") => {
    const keys = new Set([...Object.keys(a || {}), ...Object.keys(b || {})]);
    for (const k of keys) {
      const p = prefix ? `${prefix}.${k}` : k;
      const va = a ? a[k] : undefined;
      const vb = b ? b[k] : undefined;
      const oba = va && typeof va === "object" && !Array.isArray(va);
      const obb = vb && typeof vb === "object" && !Array.isArray(vb);
      if (oba && obb) walk(va, vb, p);
      else if (JSON.stringify(va) !== JSON.stringify(vb)) changes.push(p);
    }
  };
  walk(before, after, "");
  return changes;
}

module.exports = async function configWizard({ base, flags, templatesDir } = {}) {
  const targetBase = base || process.cwd();
  const f = flags || { plan: true, apply: false, yes: false, force: false };

  // Segurança: default é PLAN (se alguém chamar sem flags)
  if (!("apply" in f) && !("plan" in f)) {
    f.plan = true;
    f.apply = false;
  }

  console.log("\n🧙 OpenClaw Setup Wizard — CONSENT-FIRST");
  console.log(`📍 Base: ${targetBase}`);
  console.log(`🧪 Mode: ${f.apply ? "APPLY" : "PLAN (read-only)"}`);

  const env = detectEnvironment();
  console.log(`🌍 Ambiente: ${env}`);

  const configPath = path.join(targetBase, "openclaw.json");
  const hasConfig = exists(configPath);

  // 1) Inspecionar contexto
  console.log("\n1) Contexto:");
  console.log(`- openclaw.json: ${hasConfig ? "encontrado" : "não encontrado"}`);

  // Se não tem config, em PLAN só sugere; em APPLY pergunta se quer criar.
  let config = hasConfig ? readJsonSafe(configPath) : null;
  if (!config) {
    console.log("\n📝 PLAN   criar openclaw.json (não existe ou inválido)");
    if (!f.apply) {
      console.log("ℹ️  Dica: rode `openclaw setup --apply` para criar/configurar.");
    } else {
      if (!f.yes) {
        const ok = (await ask("Criar openclaw.json básico? (y/N): ")).toLowerCase() === "y";
        if (!ok) {
          console.log("❎ Cancelado. Nenhuma alteração feita.");
          return;
        }
      }
      config = {};
    }
  }

  // Se chegou aqui e config ainda é null (por PLAN, por exemplo), vamos simular o defaults para o diff
  if (!config) config = {};

  // 2) Propor ajustes seguros (NÃO aplicar ainda)
  const before = deepClone(config);

  config = initConfigDefaults(config);

  // gateway.bind seguro
  config.gateway = config.gateway || {};
  config.gateway.bind = config.gateway.bind || "127.0.0.1";
  if (config.gateway.bind !== "127.0.0.1") {
    if (f.apply) {
      const ans = f.yes ? "y" : await ask(`gateway.bind está "${config.gateway.bind}". Ajustar para "127.0.0.1"? (y/n): `);
      if (ans.toLowerCase() === "y") config.gateway.bind = "127.0.0.1";
    } else {
      config.gateway.bind = "127.0.0.1"; // Simulando a mudança para o diff no modo PLAN
    }
  }

  // auth mode seguro
  config.auth = config.auth || {};
  config.auth.mode = config.auth.mode || "token";
  if (config.auth.mode !== "token") {
    if (f.apply) {
      const ans = f.yes ? "y" : await ask(`auth.mode está "${config.auth.mode}". Ajustar para "token"? (y/n): `);
      if (ans.toLowerCase() === "y") config.auth.mode = "token";
    } else {
      config.auth.mode = "token"; // Simulação
    }
  }

  if (!config.auth.token) {
    // gera token somente se APPLY e com consentimento
    if (f.apply) {
      if (!f.yes) {
        const ok = (await ask("Gerar token de auth automaticamente? (y/N): ")).toLowerCase() === "y";
        if (ok) config.auth.token = generateToken();
      } else {
        config.auth.token = generateToken();
      }
    } else {
      config.auth.token = "<TOKEN_GERADO_NO_APPLY>"; // Simulação para o diff
    }
  }

  // 3) Canais: apenas PLANO por padrão; em APPLY perguntar
  console.log("\n2) Canais disponíveis:", supportedChannels().join(", "));
  if (!f.apply) {
    console.log("🧭 PLAN   (não vou alterar canais sem --apply)");
  } else {
    const pick = f.yes ? "" : await ask(`Qual canal ativar? (${supportedChannels().join("/")}/nenhum): `);
    const channelChoice = (pick || "").toLowerCase();
    if (supportedChannels().includes(channelChoice)) {
      if (!f.yes) console.log(`ℹ️  Vou configurar '${channelChoice}'.`);
      await configureChannel(config, channelChoice, ask);
    }
  }

  // Filesystem allowlist
  if (f.apply) {
    console.log("\n📁 Acesso a arquivos locais (mínimo necessário)");
    console.log("Adicione apenas pastas que o OpenClaw realmente precisa acessar.");
    const addPath = await ask("Adicionar uma pasta allowlist agora? (caminho ou ENTER para pular): ");
    if (addPath) {
      const resolved = addPath.replace(/^~\//, os.homedir() + path.sep);
      config.filesystem.allowlist.push(resolved);
      console.log(`✔ Allowlist adicionada: ${resolved}`);
    }
  }

  // 4) Mostrar plano de mudanças no JSON
  const changedPaths = diffKeys(before, config);
  console.log("\n3) Plano de mudanças em openclaw.json:");
  if (changedPaths.length === 0) console.log("- (nenhuma mudança necessária)");
  else changedPaths.forEach(p => console.log(`- ${p}`));

  // 5) Aplicar mudanças somente com consentimento
  if (!f.apply) {
    console.log("\n✅ Setup finalizado em PLAN. Nenhuma alteração aplicada.");
  } else {
    let shouldWrite = true;
    if (changedPaths.length > 0) {
      if (!f.yes) {
        const ok = (await ask("\nAplicar alterações em openclaw.json? (y/N): ")).toLowerCase() === "y";
        if (!ok) {
          console.log("❎ Cancelado. openclaw.json não será alterado.");
          shouldWrite = false;
        }
      }
      if (shouldWrite) {
        writeJsonSafe(configPath, config);
        console.log(`✅ DONE  openclaw.json atualizado em ${configPath}`);
      }
    } else {
      if (!hasConfig && shouldWrite) {
        writeJsonSafe(configPath, config);
        console.log(`✅ DONE  openclaw.json criado em ${configPath}`);
      }
    }
  }

  // 6) Persistência por projeto (IDE option B): somente com consentimento
  const agentDir = path.join(targetBase, ".agent");
  const stateDir = path.join(agentDir, "state");

  console.log("\n4) Persistência por projeto (.agent/state):");
  console.log("🧭 PLAN   criar MEMORY.md / SOUL.md / AGENTS.md somente com consentimento");

  // Só criamos state se já existir .agent ou se usuário quiser criar (em apply)
  if (f.apply && !exists(agentDir)) {
    if (!f.yes) {
      const ok = (await ask("Criar pasta .agent/ (para estado por projeto)? (y/N): ")).toLowerCase() === "y";
      if (ok) fs.mkdirSync(stateDir, { recursive: true });
    } else {
      fs.mkdirSync(stateDir, { recursive: true });
    }
  }

  if (exists(agentDir) || exists(stateDir)) {
    if (!exists(stateDir) && f.apply) fs.mkdirSync(stateDir, { recursive: true });

    await ensureFileWithConsent({
      filePath: path.join(stateDir, "MEMORY.md"),
      content: "# MEMORY.md (por projeto)\n\n- Resumos úteis, decisões e preferências persistentes do projeto.\n",
      flags: f
    });

    await ensureFileWithConsent({
      filePath: path.join(stateDir, "SOUL.md"),
      content: "# SOUL.md\n\n- Identidade e regras de comportamento do agente.\n",
      flags: f
    });

    await ensureFileWithConsent({
      filePath: path.join(stateDir, "AGENTS.md"),
      content: "# AGENTS.md\n\n- Agentes e personas disponíveis neste projeto.\n",
      flags: f
    });
  } else {
    console.log("ℹ️  .agent não existe neste projeto. (ok) — nada será criado em PLAN.");
  }

  // Checagens adicionais informativas (Healthcheck da porta)
  if (f.apply) {
    const port = 18789;
    console.log("\n🔎 Checagens rápidas");
    const inUse = await portInUse("127.0.0.1", port);
    if (inUse) console.log(`ℹ Porta ${port} respondeu em 127.0.0.1 (ok se OpenClaw está rodando).`);
    else console.log(`ℹ Porta ${port} não respondeu em 127.0.0.1 (ok se ainda não iniciou).`);
  }

  console.log("\n✅ Wizard concluído.");
};
