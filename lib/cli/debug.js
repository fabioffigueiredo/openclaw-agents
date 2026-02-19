const { runDebug } = require("../../templates/.agent/skills/openclaw-installation-debugger/scripts/debug.js");

module.exports = {
    run: async function ({ targetPath, flags }) {
        try {
            await runDebug();
        } catch (err) {
            console.error("Erro fatal ao executar debug:", err);
            process.exit(1);
        }
    }
};
