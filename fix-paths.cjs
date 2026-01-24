/**
 * Fix remaining import path issues
 */

const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, 'src');
let filesModified = 0;

// Path replacements
const FIXES = [
    // Tween is in animation/, not vfx/
    { from: /from '([^']+)\/vfx\/Tween'/g, to: "from '$1/animation/Tween'" },

    // SystemConfig is in config/, not data/
    { from: /from '([^']+)\/data\/SystemConfig'/g, to: "from '$1/config/SystemConfig'" },

    // CraftingUI doesn't exist - remove import and add declare
    // We'll handle this one manually
];

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;

    for (const fix of FIXES) {
        content = content.replace(fix.from, fix.to);
    }

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

console.log('Fixing remaining path issues...');
walkDir(SRC_DIR);
console.log(`\nComplete! Fixed ${filesModified} files.`);
