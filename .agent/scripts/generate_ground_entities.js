import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// .agent/scripts is where this file is. project root is two levels up.
const PROJECT_ROOT = path.resolve(__dirname, '../../');

const BIOME = 'grasslands';
const CATEGORIES = {
    base: {
        grass: 4, dirt: 3, rock: 3, gravel: 2, sand: 2
    },
    overgrown: {
        leaves: 3, forest_floor: 3, moss: 2, roots: 2, flowers: 2
    },
    interior: {
        planks: 3, cobblestone: 2, flagstone: 2, concrete: 2, metal_plate: 2
    },
    vertical: {
        cliff_rock: 3, earth_bank: 3
    },
    damage: {
        scorched: 2, churned: 2, cratered: 1
    }
};

const TEMPLATE = (id, name, cleanPath, type) => `/**
 * Entity: ${id}
 * Auto-generated.
 */
import type { EnvironmentEntity } from '@types/entities';

const entity: EnvironmentEntity = {
    id: '${id}',
    name: '${name}',
    sourceCategory: 'ground',
    sourceFile: 'ground', // Legacy field
    status: 'pending',
    files: {
        original: '${cleanPath}',
        clean: '${cleanPath}'
    },
    type: 'ground_texture',
    biome: '${BIOME}',
    display: {
        sizeScale: 1,
        width: 128,
        height: 128
    },
    tags: ['ground', '${BIOME}', '${type}']
};

export default entity;
`;

// Helper to capitalize
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

async function generate() {
    console.log(`Generating ${BIOME} entities...`);

    for (const [cat, materials] of Object.entries(CATEGORIES)) {
        const catDir = path.join(PROJECT_ROOT, 'src', 'entities', 'ground', BIOME, cat);
        if (!fs.existsSync(catDir)) {
            console.log(`Creating dir: ${catDir}`);
            fs.mkdirSync(catDir, { recursive: true });
        }

        for (const [mat, count] of Object.entries(materials)) {
            for (let i = 1; i <= count; i++) {
                const num = i.toString().padStart(2, '0');
                const id = `ground_${cat}_${mat}_${BIOME}_${num}`;
                const name = `${cap(BIOME)} ${cap(mat.replace('_', ' '))} ${num}`;
                const filePath = path.join(catDir, `${id}.ts`);

                const cleanPath = `assets/images/ground/${id}_clean.png`;

                fs.writeFileSync(filePath, TEMPLATE(id, name, cleanPath, mat));
                console.log(`Generated: ${id}`);
            }
        }
    }
    console.log('Done.');
}

generate();
