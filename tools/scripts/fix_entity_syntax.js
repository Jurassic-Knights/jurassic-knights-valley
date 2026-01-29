
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = path.resolve(__dirname, '../../src/entities');
const LOG_PREFIX = '[EntitySyntaxFixer]';

const CATEGORIES = ['nodes', 'resources', 'environment'];

function fixDirectory(category) {
    const dir = path.join(ROOT_DIR, category);
    if (!fs.existsSync(dir)) return;

    const files = fs.readdirSync(dir);
    let count = 0;

    files.forEach(file => {
        if (!file.endsWith('.ts')) return;

        const filePath = path.join(dir, file);
        let content = fs.readFileSync(filePath, 'utf8');

        // Logic: Find "display:"
        // Check character before it (ignoring whitespace).
        // If not comma or opening brace, add comma.

        const displayIdx = content.indexOf('display:');
        if (displayIdx === -1) return;

        // Look backward from displayIdx
        let ptr = displayIdx - 1;
        let needsComma = false;

        while (ptr >= 0) {
            const char = content[ptr];
            if (/\s/.test(char)) {
                ptr--;
                continue;
            }
            // Found non-whitespace
            if (char !== ',' && char !== '{') {
                needsComma = true;
            }
            break;
        }

        if (needsComma) {
            // Insert comma after the char at ptr
            // content = ... char , ... display
            // We can just replace "display:" with ", display:"? No, spacing.
            // We can insert at ptr + 1
            const insertPos = ptr + 1;
            content = content.slice(0, insertPos) + ',' + content.slice(insertPos);
            fs.writeFileSync(filePath, content, 'utf8');
            count++;
        }
    });

    console.log(`${LOG_PREFIX} Fixed ${count} files in ${category}`);
}

console.log(`${LOG_PREFIX} Starting syntax repair...`);
CATEGORIES.forEach(fixDirectory);
console.log(`${LOG_PREFIX} Done.`);
