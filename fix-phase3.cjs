/**
 * Phase 3 - Fix remaining modules with corrected paths
 */

const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, 'src');
let filesModified = 0;
let replacementsMade = 0;

// Corrected module mappings
const MODULE_MAP = {
    'EntityTypes': 'config/EntityTypes',
    'BiomeConfig': 'data/BiomeConfig',
    'PropConfig': 'data/PropConfig',
};

function getRelativePath(fromFile, toModule) {
    const fromDir = path.dirname(fromFile);
    let relativePath = path.relative(fromDir, path.join(SRC_DIR, toModule)).replace(/\\/g, '/');
    if (!relativePath.startsWith('.')) {
        relativePath = './' + relativePath;
    }
    return relativePath;
}

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;

    const declareRegex = /declare const (\w+): any;.*(?:\/\/ TODO.*)?/g;
    const declares = [];
    let match;

    while ((match = declareRegex.exec(content)) !== null) {
        const name = match[1];
        if (MODULE_MAP[name]) {
            declares.push({ name, fullMatch: match[0] });
        }
    }

    if (declares.length === 0) return false;

    const importsByModule = {};

    for (const { name, fullMatch } of declares) {
        const modulePath = MODULE_MAP[name];
        if (!importsByModule[modulePath]) {
            importsByModule[modulePath] = { names: [], matches: [] };
        }
        if (!importsByModule[modulePath].names.includes(name)) {
            importsByModule[modulePath].names.push(name);
            importsByModule[modulePath].matches.push(fullMatch);
        }
    }

    for (const [modulePath, data] of Object.entries(importsByModule)) {
        const relativePath = getRelativePath(filePath, modulePath);
        const importStatement = `import { ${data.names.join(', ')} } from '${relativePath}';`;

        for (const matchStr of data.matches) {
            content = content.replace(matchStr + '\n', '');
            content = content.replace(matchStr, '');
            replacementsMade++;
        }

        const lastImportMatch = content.match(/import .+;\r?\n(?!import)/);
        if (lastImportMatch) {
            const insertPos = content.indexOf(lastImportMatch[0]) + lastImportMatch[0].length;
            content = content.slice(0, insertPos) + importStatement + '\n' + content.slice(insertPos);
        }
    }

    content = content.replace(/\n\n\n+/g, '\n\n');

    if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf8');
        return true;
    }
    return false;
}

function walkDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
            walkDir(filePath);
        } else if (file.endsWith('.ts') && !file.endsWith('.d.ts')) {
            if (processFile(filePath)) {
                filesModified++;
                console.log(`Fixed: ${path.relative(SRC_DIR, filePath)}`);
            }
        }
    }
}

console.log('Phase 3 - Fixing remaining modules...');
walkDir(SRC_DIR);
console.log(`\nComplete! Modified ${filesModified} files, made ${replacementsMade} replacements.`);
