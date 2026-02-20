"use strict";

/**
 * Context Engine do OpenClaw AI OS
 * 
 * Responsável por gerenciar, carregar e persistir o conhecimento e estado de operação:
 * 1. system.json - Variáveis de ambiente, config, OS, Docker
 * 2. workspace.json - Mapeamento de linguagens, dependências, arquivos principais, histórico de testes
 * 3. user.json - Preferências, IDE, token settings, perfil de agressividade do AI
 */

const fs = require("fs");
const path = require("path");

class ContextEngine {
    /**
     * @param {string} projectRoot - Raiz do projeto (onde fica .agent/)
     */
    constructor(projectRoot) {
        this.projectRoot = projectRoot;
        this.contextDir = path.join(projectRoot, ".agent", "context");

        // Cria o diretório de contexto caso não exista (independente do init)
        if (!fs.existsSync(this.contextDir)) {
            try {
                fs.mkdirSync(this.contextDir, { recursive: true });
            } catch (err) {
                // Ignorar em diretórios hostis onde openclaw não está armado
            }
        }
    }

    _getFilePath(type) {
        return path.join(this.contextDir, `${type}.json`);
    }

    /**
     * Carrega um fragmento do contexto ou retorna defaults
     * @param {string} type - "system", "workspace" ou "user"
     */
    load(type) {
        const file = this._getFilePath(type);
        if (fs.existsSync(file)) {
            try {
                return JSON.parse(fs.readFileSync(file, "utf-8"));
            } catch (err) {
                // Falha de parse, retorna default seguro
                return {};
            }
        }
        return {};
    }

    /**
     * Salva ou sobrepõe as flags no contexto
     * @param {string} type - "system", "workspace" ou "user"
     * @param {Object} data - Objeto de dados (será feito um object merge shallow com key overwrites)
     */
    save(type, data) {
        // Se .agent não existe ou não foi inicializado, silenciosamente bypass (para CLI cmds sujos antes do IDE_INSTALL)
        if (!fs.existsSync(this.contextDir)) return false;

        const current = this.load(type);
        const merged = { ...current, ...data };

        try {
            fs.writeFileSync(this._getFilePath(type), JSON.stringify(merged, null, 2), "utf-8");
            return true;
        } catch (err) {
            return false;
        }
    }

    /**
     * Agrega todos os arquivos de contexto para compor a mentalidade da query.
     */
    getFullContext() {
        return {
            system: this.load("system"),
            workspace: this.load("workspace"),
            user: this.load("user"),
            meta: {
                timestamp: new Date().toISOString()
            }
        };
    }
}

module.exports = ContextEngine;
