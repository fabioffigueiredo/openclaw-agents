"use strict";

/**
 * Skill Matcher — Escolhe a skill mais adequada para uma solicitação.
 *
 * Faz parse do YAML frontmatter de cada SKILL.md e pontua
 * a relevância com base nos triggers e descrição.
 */

const fs = require("fs");
const path = require("path");

/**
 * Extrai metadados (name, description, triggers) do frontmatter YAML.
 * @param {string} md — conteúdo Markdown com frontmatter
 * @returns {object|null} metadados extraídos ou null
 */
function parseFrontmatter(md) {
    const m = md.match(/^---\s*\n([\s\S]*?)\n---\s*\n/);
    if (!m) return null;

    const yaml = m[1];

    // Extrair listas (ex: triggers)
    const getList = (key) => {
        const r = new RegExp(`^${key}:\\s*\\n([\\s\\S]*?)(\\n\\w|$)`, "m");
        const mm = yaml.match(r);
        if (!mm) return [];
        return mm[1]
            .split("\n")
            .map(l => l.trim())
            .filter(l => l.startsWith("-"))
            .map(l => l.replace(/^-\s*/, "").trim())
            .filter(Boolean);
    };

    // Extrair escalares (ex: name, description)
    const getScalar = (key) => {
        const r = new RegExp(`^${key}:\\s*(.+)$`, "m");
        const mm = yaml.match(r);
        return mm ? mm[1].trim() : "";
    };

    return {
        name: getScalar("name"),
        description: getScalar("description"),
        triggers: getList("triggers"),
    };
}

/**
 * Carrega todas as skills de um diretório de templates.
 * @param {string} skillsDir — diretório com subpastas de skills
 * @returns {Array} lista de skills com metadados
 */
function loadSkills(skillsDir) {
    if (!fs.existsSync(skillsDir)) return [];
    const skills = [];
    for (const folder of fs.readdirSync(skillsDir)) {
        const p = path.join(skillsDir, folder, "SKILL.md");
        if (!fs.existsSync(p)) continue;
        const md = fs.readFileSync(p, "utf8");
        const meta = parseFrontmatter(md);
        if (!meta) continue;
        skills.push({ ...meta, path: p, folder });
    }
    return skills;
}

/**
 * Calcula score de relevância de uma skill para um texto.
 * @param {object} skill — skill com triggers e description
 * @param {string} text — texto do usuário
 * @returns {number} pontuação (maior = mais relevante)
 */
function scoreSkill(skill, text) {
    const t = (text || "").toLowerCase();
    let s = 0;
    for (const trig of (skill.triggers || [])) {
        if (t.includes(String(trig).toLowerCase())) s += 5;
    }
    // Bonus parcial para match de descrição
    if (skill.description && t.includes(skill.description.toLowerCase().slice(0, 12))) s += 1;
    return s;
}

/**
 * Encontra a skill mais relevante para uma solicitação.
 * @param {object} options
 * @param {string} options.skillsDir — diretório de skills (templates/.agent/skills)
 * @param {string} options.userText — texto da solicitação do usuário
 * @returns {object} { chosen, alternatives, ranked }
 */
function matchSkill({ skillsDir, userText }) {
    const skills = loadSkills(skillsDir);
    const ranked = skills
        .map(sk => ({ sk, score: scoreSkill(sk, userText) }))
        .sort((a, b) => b.score - a.score);

    return {
        chosen: ranked[0]?.sk || null,
        alternatives: ranked.slice(1, 4).map(x => x.sk),
        ranked,
    };
}

module.exports = { matchSkill, loadSkills, parseFrontmatter };
