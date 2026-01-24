/**
 * Fix incorrect imports from migration
 */

const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, 'src');
let filesModified = 0;

// Fixes to apply
const FIXES = [
    // Fix EntityManager -> entityManager (it's an instance, not a class)
    { from: /import \{ EntityManager \} from '([^']+\/EntityManager)'/g, to: "import { entityManager } from '$1'" },
    { from: /import \{ EntityManager, /g, to: "import { entityManager, " },
    { from: /, EntityManager \}/g, to: ", entityManager }" },
    { from: /, EntityManager,/g, to: ", entityManager," },

    // Fix SpawnManager -> spawnManager  
    { from: /import \{ SpawnManager \} from '([^']+\/SpawnManager)'/g, to: "import { spawnManager } from '$1'" },
    { from: /import \{ SpawnManager, /g, to: "import { spawnManager, " },
    { from: /, SpawnManager \}/g, to: ", spawnManager }" },

    // Fix Events import (it's in config/Events, not data/GameConstants)
    { from: /import \{ Events \} from '[^']+\/GameConstants'/g, to: "" },
    { from: /import \{ ([^}]+), Events \} from '([^']+\/GameConstants)'/g, to: "import { $1 } from '$2'" },
    { from: /import \{ Events, ([^}]+) \} from '([^']+\/GameConstants)'/g, to: "import { $1 } from '$2'" },

    // Fix IslandManager path (should be IslandManagerCore with IslandManagerService)
    { from: /import \{ IslandManager \} from '([^']+)\/IslandManager'/g, to: "import { IslandManagerService as IslandManager } from '$1/IslandManagerCore'" },

    // Fix IslandUpgrades path (it's in gameplay/, not upgrades/)
    { from: /from '([^']+)\/upgrades\/IslandUpgrades'/g, to: "from '$1/gameplay/IslandUpgrades'" },

    // Fix RenderConfig path (it's in config/, not data/)
    { from: /from '([^']+)\/data\/RenderConfig'/g, to: "from '$1/config/RenderConfig'" },
];

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;

    for (const fix of FIXES) {
        content = content.replace(fix.from, fix.to);
    }

    // Clean up empty imports
    content = content.replace(/import \{  \} from '[^']+';?\r?\n?/g, '');
    content = content.replace(/import \{ \} from '[^']+';?\r?\n?/g, '');

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

console.log('Fixing import issues...');
walkDir(SRC_DIR);
console.log(`\nComplete! Fixed ${filesModified} files.`);
