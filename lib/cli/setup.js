const path = require("path");

module.exports = {
  async run({ targetPath, flags, templatesDir }) {
    // Regras propostas pelo usuario:
    // - default é PLAN (flags.plan true no bin/openclaw.js)
    // - APPLY só com --apply
    // - Não alterar nada fora de --apply
    const wizard = require(path.join(__dirname, "..", "setup", "config_wizard.js"));

    const base = targetPath || process.cwd();

    // Mantendo consistência com os outros comandos que exportam .run() e recebem { targetPath, flags }
    return wizard({
      base,
      flags: {
        plan: flags.plan !== false,   // default true
        apply: !!flags.apply,         // só executa com apply
        yes: !!flags.yes,             // skip prompts (ainda assim não faz nada se não apply)
        force: !!flags.force,         // para ações destrutivas (se você quiser usar)
      },
      templatesDir,
    });
  }
};
