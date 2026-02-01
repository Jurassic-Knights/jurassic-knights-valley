const fs = require('fs');
const path = require('path');

const biome = process.argv[2];
if (!biome) {
    console.error('Please provide a biome argument (e.g., tundra, desert, badlands)');
    process.exit(1);
}

const baseDir = path.join(__dirname, '../src/entities/ground', biome);

const materials = {
    base: {
        grass: 4,
        dirt: 3,
        rock: 3,
        gravel: 2,
        // Biome specific overrides handled below
    },
    overgrown: {
        leaves: 3,
        forest_floor: 3,
        moss: 2,
        roots: 2,
        flowers: 2
    },
    interior: {
        planks: 3,
        cobblestone: 2,
        flagstone: 2,
        concrete: 2,
        metal_plate: 2
    },
    vertical: {
        cliff_rock: 3,
        earth_bank: 3
    },
    damage: {
        scorched: 2,
        churned: 2,
        cratered: 1
    }
};

// Biome specific adjustments
if (biome === 'tundra') {
    materials.base.snow = 3;
    delete materials.base.sand;
} else if (biome === 'desert') {
    materials.base.sand = 3;
    materials.base.dunes = 2;
    delete materials.base.moss; // Maybe dry moss? 
} else if (biome === 'badlands') {
    materials.base.sand = 2; // Red sand
    materials.base.cracked_earth = 3;
}

function toTitleCase(str) {
    return str.replace(/_/g, ' ').replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
}

function generate() {
    console.log(`Generating entities for biome: ${biome}`);

    for (const [category, items] of Object.entries(materials)) {
        const catDir = path.join(baseDir, category);
        if (!fs.existsSync(catDir)) {
            console.log(`Creating directory: ${catDir}`);
            fs.mkdirSync(catDir, { recursive: true });
        }

        for (const [material, count] of Object.entries(items)) {
            for (let i = 1; i <= count; i++) {
                const num = String(i).padStart(2, '0');
                const id = `ground_${category}_${material}_${biome}_${num}`;
                const fileName = `${id}.ts`;
                const filePath = path.join(catDir, fileName);

                // Name: Material Index (e.g. Dirt 01)
                const displayName = `${toTitleCase(material)} ${num}`;

                const content = `/**
 * Entity: ${id}
 * Auto-generated.
 */
import type { BaseEntity } from '@types/entities';

export default {
    "id": "${id}",
    "name": "${displayName}",
    "sourceCategory": "ground",
    "sourceFile": "ground",
    "status": "pending",
    "files": {
        "original": "assets/images/ground/${id}_original.png",
        "clean": "assets/images/ground/${id}_original.png"
    },
    "type": "ground_texture",
    "biome": "${biome}",
    "display": {
        "sizeScale": 1,
        "width": 128,
        "height": 128
    },
    "tags": [
        "ground",
        "${biome}",
        "${category}",
        "${material}"
    ]
} satisfies BaseEntity;
`;

                if (!fs.existsSync(filePath)) {
                    fs.writeFileSync(filePath, content);
                    console.log(`Created ${fileName}`);
                } else {
                    console.log(`Skipped ${fileName} (exists)`);
                }
            }
        }
    }
}

generate();
