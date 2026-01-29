
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = path.resolve(__dirname, '../../src/entities');
const LOG_PREFIX = '[EntitySizeUpdater]';

const CONFIG = {
    nodes: { width: 64, height: 64 },
    resources: { width: 48, height: 48 },
    environment: { width: 64, height: 64 }
};

function updateDirectory(category, sizeConfig) {
    const dir = path.join(ROOT_DIR, category);
    if (!fs.existsSync(dir)) {
        console.warn(`${LOG_PREFIX} Directory not found: ${dir}`);
        return;
    }

    const files = fs.readdirSync(dir);
    let count = 0;

    files.forEach(file => {
        if (!file.endsWith('.ts')) return;

        const filePath = path.join(dir, file);
        let content = fs.readFileSync(filePath, 'utf8');

        // Check if display or size already exists
        if (content.includes('display:') || content.includes('size:')) {
            // console.log(`${LOG_PREFIX} Skipping ${category}/${file} (already has size)`);
            return;
        }

        // Prepare injection
        const injection = `
    display: {
        sizeScale: 1,
        width: ${sizeConfig.width},
        height: ${sizeConfig.height}
    },`;

        // Inject before the last closing brace and export
        // Most end with:
        // };
        // or
        // } satisfies ...;

        const lastBraceIndex = content.lastIndexOf('}');
        if (lastBraceIndex === -1) {
            console.error(`${LOG_PREFIX} Could not find closing brace in ${file}`);
            return;
        }

        // Insert before last brace
        let newContent = content.slice(0, lastBraceIndex) + injection + content.slice(lastBraceIndex);

        fs.writeFileSync(filePath, newContent, 'utf8');
        count++;
    });

    console.log(`${LOG_PREFIX} Updated ${count} files in ${category}`);
}

// Run updates
console.log(`${LOG_PREFIX} Starting bulk update...`);
updateDirectory('nodes', CONFIG.nodes);
updateDirectory('resources', CONFIG.resources);
updateDirectory('environment', CONFIG.environment);
console.log(`${LOG_PREFIX} Done.`);
