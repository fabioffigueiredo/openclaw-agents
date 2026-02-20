"use strict";

const fs = require("fs");
const path = require("path");
const readline = require("readline");

/**
 * Utilitário para prompt interativo.
 */
function askQuestion(query) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    return new Promise((resolve) => rl.question(query, (ans) => {
        rl.close();
        resolve(ans.trim());
    }));
}

/**
 * Valida se um caminho pretendido está dentro do diretório seguro.
 * @param {string} targetPath - Caminho do projeto destino.
 * @param {string} fileToMutate - O arquivo/pasta a ser mexido.
 * @returns {boolean} - True se .agent/** ou default safe.
 */
function isPathInSafeScope(targetPath, fileToMutate) {
    // Escopo seguro default: pasta `.agent` na raiz do targetPath
    const safeScope = path.join(targetPath, ".agent");
    const absoluteMutate = path.resolve(targetPath, fileToMutate);

    // Arquivos no diretório pai principal que não deveriam ser bloqueados:
    // Padrão do projeto autoriza explicitamente "openclaw.json", ".env.example" no wizard? 
    // Para simplificar, focamos na "prisão" primária.

    // allow openclaw.json default config
    if (absoluteMutate === path.join(targetPath, "openclaw.json")) return true;

    // permitemos as configs nativas da IDE copiadas no install
    const safeIdioms = [
        path.join(targetPath, ".cursorrules"),
        path.join(targetPath, ".github"),
        path.join(targetPath, ".cursor"),
        path.join(targetPath, ".windsurf"),
        path.join(targetPath, ".qoder"),
        path.join(targetPath, "GEMINI.md"),
        path.join(targetPath, "AGENTS.md"),
        path.join(targetPath, "trae_rule.md"),
        path.join(targetPath, "README_PACK.md")
    ];

    if (safeIdioms.some(idiom => absoluteMutate.startsWith(idiom))) return true;

    // Retorna true se começa com o caminho the escopo.
    if (absoluteMutate.startsWith(safeScope)) return true;

    return false;
}

/**
 * Escudo de Proteção "Scope Guard"
 * Evita que o CLI apague ou modifique arquivos da aplicação nativa (ex: index.js, package.json do usuário).
 * 
 * @param {string} targetPath - Caminho de execução (process.cwd geralmente)
 * @param {object} intents - Objeto contendo listas { writes: [], deletes: [], overwrites: [] } com paths relativos ou absolutos
 * @param {object} flags - As CLI Flags (`force`, `yes`, `apply`)
 */
async function guardPlan(targetPath, intents = { writes: [], deletes: [], overwrites: [] }, flags = {}) {
    const outOfScope = {
        writes: intents.writes.filter(p => !isPathInSafeScope(targetPath, p)),
        deletes: intents.deletes.filter(p => !isPathInSafeScope(targetPath, p)),
        overwrites: intents.overwrites.filter(p => !isPathInSafeScope(targetPath, p)),
    };

    const totalRisks = outOfScope.writes.length + outOfScope.deletes.length + outOfScope.overwrites.length;

    // Se tudo ok (nenhuma fuga da jail), permitimos silenciosamente sem drama
    if (totalRisks === 0) return true;

    console.log("\n🛡️  [SCOPE GUARD ALERTA DE SEGURANÇA]");
    console.log("-----------------------------------------");
    console.log(`Detectado tentativa de alterar dados FORA do sandbox (.agent/**).`);

    if (outOfScope.writes.length > 0) {
        console.log("⚠️ Arquivos a GERAR fora do escopo:", outOfScope.writes);
    }
    if (outOfScope.overwrites.length > 0) {
        console.log("🧨 Arquivos a SOBRESCREVER fora do escopo:", outOfScope.overwrites);
    }
    if (outOfScope.deletes.length > 0) {
        console.log("🔥 DELETE SOLICITADO fora do escopo:", outOfScope.deletes);
    }
    console.log("-----------------------------------------\n");

    // Lógica para modo interativo. Se flag Force vier sem ask, permitimos por conta-risco.
    if (flags.force) {
        console.log("⚠️ Flag --force detectada. Destravando ação destrutiva fora da sandbox.");
        return true;
    }

    if (flags.yes) {
        console.log("❌ Bloqueado! Não permitimos escapes da sandbox via '--yes'. Você deve rodar o processo interativamente ou usar --force.");
        process.exit(1);
    }

    // Interactive confirmation com hard-stop (obriga escrever DESTRUCTIVE para deletes/overwrites)
    if (outOfScope.deletes.length > 0 || outOfScope.overwrites.length > 0) {
        const ans = await askQuestion("Perigo crítico. Para aprovar sobrescritas ou apagamentos fora do .agent, digite 'DESTRUCTIVE': ");
        if (ans !== "DESTRUCTIVE") {
            console.log("⏹️ Cancelado pelo Módulo Scope Guard.");
            process.exit(1);
        }
        return true;
    }

    // Para WRITES brandos: conf simples
    const ans = await askQuestion("Aprovar criação de novas rotas fora do sandbox? [y/N]: ");
    if (ans.toLowerCase() !== "y") {
        console.log("⏹️ Cancelado pelo Módulo Scope Guard.");
        process.exit(1);
    }

    return true;
}

module.exports = {
    guardPlan,
    isPathInSafeScope
};
