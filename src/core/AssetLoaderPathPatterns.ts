/**
 * AssetLoaderPathPatterns - ID-to-path mapping for AssetLoader
 * Extracted from AssetLoader for maintainability (per technical_guidelines §7).
 */

interface PathPattern {
    matches: (id: string) => boolean;
    build: (id: string) => string;
}

export const ID_PATTERNS: PathPattern[] = [
    {
        matches: (id: string) =>
            id.startsWith('enemy_herbivore_') ||
            id.startsWith('enemy_dinosaur_') ||
            id.startsWith('enemy_human_') ||
            id.startsWith('enemy_mounted_'),
        build: (id: string) => `images/enemies/${id.replace('enemy_', '')}_original.png`
    },
    { matches: (id: string) => id.startsWith('boss_'), build: (id: string) => `images/bosses/${id}_original.png` },
    { matches: (id: string) => id.startsWith('npc_'), build: (id: string) => `images/npcs/${id}_original.png` },

    {
        matches: (id: string) => id.startsWith('weapon_melee_') || id.startsWith('weapon_ranged_'),
        build: (id: string) => {
            const parts = id.split('_');
            const subtype = parts.slice(2, -2).join('_');
            const imageName = `weapon_${subtype}_${parts.slice(-2).join('_')}`;
            return `images/equipment/weapons/${subtype}/${imageName}_original.png`;
        }
    },
    {
        matches: (id: string) => id.startsWith('weapon_shield_'),
        build: (id: string) => `images/equipment/shield/${id}_original.png`
    },

    {
        matches: (id: string) =>
            id.startsWith('signature_melee_') || id.startsWith('signature_ranged_'),
        build: (id: string) => {
            const parts = id.split('_');
            const subtype = parts[2];
            return `images/equipment/signature/${parts[1]}/${subtype}/${id}_original.png`;
        }
    },
    {
        matches: (id: string) => id.startsWith('signature_shield_'),
        build: (id: string) => `images/equipment/signature/shield/${id}_original.png`
    },

    { matches: (id: string) => id.startsWith('head_'), build: (id: string) => `images/equipment/armor/head/${id}_original.png` },
    {
        matches: (id: string) => id.startsWith('chest_') || id.startsWith('torso_'),
        build: (id: string) => `images/equipment/armor/chest/${id}_original.png`
    },
    {
        matches: (id: string) => id.startsWith('body_'),
        build: (id: string) =>
            `images/equipment/armor/chest/${id.replace('body_', 'chest_')}_original.png`
    },
    { matches: (id: string) => id.startsWith('hands_'), build: (id: string) => `images/equipment/armor/hands/${id}_original.png` },
    { matches: (id: string) => id.startsWith('legs_'), build: (id: string) => `images/equipment/armor/legs/${id}_original.png` },
    { matches: (id: string) => id.startsWith('feet_'), build: (id: string) => `images/equipment/armor/feet/${id}_original.png` },
    {
        matches: (id: string) => id.startsWith('accessory_'),
        build: (id: string) => `images/equipment/${id}_original.png`
    },

    {
        matches: (id: string) => id.startsWith('tool_'),
        build: (id: string) => {
            const type = id.split('_')[1];
            return `images/equipment/tools/${type}/${id}_original.png`;
        }
    },

    {
        matches: (id: string) =>
            /^(food|leather|bone|wood|iron|stone|scale|feather|horn)_/.test(id),
        build: (id: string) => `images/items/${id}_original.png`
    },

    { matches: (id: string) => id.startsWith('node_'), build: (id: string) => `images/nodes/${id}_original.png` },

    {
        matches: (id: string) =>
            /^(arch|flora|prop|furniture|building)_/.test(id),
        build: (id: string) => {
            const type = id.split('_')[0];
            return `images/environment/${type}/${id}_original.png`;
        }
    },

    {
        matches: (id: string) => id.startsWith('ground_'),
        build: (id: string) => {
            const parts = id.split('_');
            const biomes = ['badlands', 'desert', 'grasslands', 'tundra'];
            const biomeIndex = parts.findIndex((p) => biomes.includes(p));
            if (biomeIndex === -1) return `images/ground/${id}_original.png`;
            const biome = parts[biomeIndex];
            const category = parts[1];
            return `images/ground/${biome}/${category}/${id}_original.png`;
        }
    },

    {
        matches: (id: string) => id.startsWith('bg_zone_'),
        build: (id: string) => `images/backgrounds/${id.replace('bg_', '')}_clean.png`
    }
];

export function constructPathFromId(id: string): string | null {
    if (!id) return null;
    for (const pattern of ID_PATTERNS) {
        if (pattern.matches(id)) {
            return pattern.build(id);
        }
    }
    return null;
}
