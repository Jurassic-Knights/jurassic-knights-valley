#!/usr/bin/env node
/**
 * Sync .cursor rules, skills, and agents to .agent with format conversion.
 * - Rules: .mdc -> .md with Antigravity frontmatter (trigger, glob)
 * - Skills: Copy with .cursor -> .agent path updates
 * - Agents: Direct copy
 * - Workflows: NOT touched
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const CURSOR = path.join(ROOT, ".cursor");
const AGENT = path.join(ROOT, ".agent");

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function* walkDir(dir, base = dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    const rel = path.relative(base, full);
    if (e.isDirectory()) {
      yield* walkDir(full, base);
    } else {
      yield { full, rel };
    }
  }
}

/** Parse Cursor .mdc frontmatter and body */
function parseMdc(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) return { frontmatter: {}, body: content };
  const [, fm, body] = match;
  const frontmatter = {};
  let inGlobs = false;
  const globs = [];
  for (const line of fm.split(/\r?\n/)) {
    if (inGlobs) {
      const m = line.match(/^\s*-\s*["']?([^"']+)["']?/);
      if (m) globs.push(m[1]);
      else if (!line.match(/^\s/)) inGlobs = false;
    }
    if (!inGlobs) {
      const kv = line.match(/^(\w+):\s*(.*)$/);
      if (kv) {
        const [, k, v] = kv;
        if (k === "globs") inGlobs = true;
        else if (k === "alwaysApply") frontmatter.alwaysApply = v.trim() === "true";
        else frontmatter[k] = v.replace(/^["']|["']$/g, "").trim();
      }
    }
  }
  if (globs.length) frontmatter.globs = globs;
  return { frontmatter, body };
}

/** Convert Cursor rule frontmatter to Antigravity format */
function toAntigravityFrontmatter(fm) {
  const parts = [];
  if (fm.description != null) parts.push(`description: ${fm.description}`);
  if (fm.alwaysApply === true) parts.push("trigger: always_on");
  if (Array.isArray(fm.globs) && fm.globs.length) parts.push(`glob: ${fm.globs.join(", ")}`);
  return parts.length ? "---\n" + parts.join("\n") + "\n---\n" : "";
}

/** Sync rules: .cursor/rules/*.mdc -> .agent/rules/*.md */
function syncRules() {
  const rulesDir = path.join(CURSOR, "rules");
  const outDir = path.join(AGENT, "rules");
  ensureDir(outDir);
  const files = fs.readdirSync(rulesDir).filter((f) => f.endsWith(".mdc"));
  for (const f of files) {
    const src = path.join(rulesDir, f);
    const content = fs.readFileSync(src, "utf8");
    const { frontmatter, body } = parseMdc(content);
    const converted = toAntigravityFrontmatter(frontmatter) + rewritePaths(body);
    const outName = f.replace(/\.mdc$/, ".md");
    const dest = path.join(outDir, outName);
    fs.writeFileSync(dest, converted, "utf8");
    console.log(`  rules/${outName}`);
  }
  return files.length;
}

/** Rewrite .cursor paths to .agent and .mdc to .md in content */
function rewritePaths(content) {
  return content
    .replace(/\.cursor\/skills\//g, ".agent/skills/")
    .replace(/\.cursor\/rules\//g, ".agent/rules/")
    .replace(/\.mdc\b/g, ".md");
}

/** Sync skills: copy .cursor/skills/** to .agent/skills/** with path updates */
function syncSkills() {
  const skillsSrc = path.join(CURSOR, "skills");
  const skillsDest = path.join(AGENT, "skills");
  if (!fs.existsSync(skillsSrc)) return 0;
  let count = 0;
  for (const { full, rel } of walkDir(skillsSrc, skillsSrc)) {
    const dest = path.join(skillsDest, rel);
    ensureDir(path.dirname(dest));
    let content = fs.readFileSync(full, "utf8");
    content = rewritePaths(content);
    fs.writeFileSync(dest, content, "utf8");
    console.log(`  skills/${rel}`);
    count++;
  }
  return count;
}

/** Sync agents: copy .cursor/agents/** to .agent/agents/** */
function syncAgents() {
  const agentsSrc = path.join(CURSOR, "agents");
  const agentsDest = path.join(AGENT, "agents");
  if (!fs.existsSync(agentsSrc)) return 0;
  ensureDir(agentsDest);
  const files = fs.readdirSync(agentsSrc).filter((f) => f.endsWith(".md"));
  for (const f of files) {
    const src = path.join(agentsSrc, f);
    const content = fs.readFileSync(src, "utf8");
    const dest = path.join(agentsDest, f);
    fs.writeFileSync(dest, content, "utf8");
    console.log(`  agents/${f}`);
  }
  return files.length;
}

function main() {
  console.log("Syncing .cursor -> .agent (format conversion for Antigravity)...\n");
  const r = syncRules();
  const s = syncSkills();
  const a = syncAgents();
  console.log(`\nDone: ${r} rules, ${s} skills, ${a} agents. workflows/ unchanged.`);
}

main();
