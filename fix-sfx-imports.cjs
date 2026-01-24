/**
 * Add SFX import to all SFX_*.ts files
 */

const fs = require('fs');
const path = require('path');

const AUDIO_DIR = path.join(__dirname, 'src', 'audio');

// Get all SFX_*.ts files except SFX_Core.ts
const files = fs.readdirSync(AUDIO_DIR)
    .filter(f => f.startsWith('SFX_') && f.endsWith('.ts') && f !== 'SFX_Core.ts');

let modified = 0;

for (const file of files) {
    const filePath = path.join(AUDIO_DIR, file);
    let content = fs.readFileSync(filePath, 'utf8');

    // Check if already has import
    if (content.includes("import { SFX }")) {
        console.log(`Skipping ${file} - already has import`);
        continue;
    }

    // Add import at the top (after any comments)
    const importLine = "import { SFX } from './SFX_Core';\n\n";

    // Find first non-comment, non-empty line
    const lines = content.split('\n');
    let insertIndex = 0;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        // Skip empty lines and comment blocks
        if (line === '' || line.startsWith('//') || line.startsWith('/*') || line.startsWith('*')) {
            insertIndex = i + 1;
            continue;
        }
        // Found first code line
        break;
    }

    // Insert import
    lines.splice(insertIndex, 0, importLine);
    content = lines.join('\n');

    fs.writeFileSync(filePath, content, 'utf8');
    modified++;
    console.log(`Fixed: ${file}`);
}

console.log(`\nModified ${modified} files.`);
