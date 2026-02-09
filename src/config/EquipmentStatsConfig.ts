/**
 * Equipment Stats Configuration
 * Central registry of all possible equipment stats.
 * All equipment items can access any stat - values can be 0 if not used.
 */
const EquipmentStatsConfig = {
    // All possible stats with metadata
    stats: {
        // === Combat Stats ===
        damage: { default: 0, icon: '??', label: 'Damage', type: 'number', category: 'combat' },
        attackRate: {
            default: 1.0,
            icon: '??',
            label: 'Attack Rate',
            type: 'number',
            category: 'combat'
        },
        critChance: { default: 0, icon: '??', label: 'Crit %', type: 'number', category: 'combat' },
        range: { default: 80, icon: '??', label: 'Range (px)', type: 'number', category: 'combat' },
        attackSpeed: {
            default: 0,
            icon: '?',
            label: 'Attack Speed %',
            type: 'number',
            category: 'combat'
        },
        reloadSpeed: {
            default: 0,
            icon: '??',
            label: 'Reload Speed %',
            type: 'number',
            category: 'combat'
        },

        // === Defense Stats ===
        armor: { default: 0, icon: '???', label: 'Armor', type: 'number', category: 'defense' },
        block: { default: 0, icon: '??', label: 'Block', type: 'number', category: 'defense' },

        // === Utility Stats ===
        speed: { default: 0, icon: '??', label: 'Speed', type: 'number', category: 'utility' },
        miningPower: {
            default: 0,
            icon: '??',
            label: 'Mining Power',
            type: 'number',
            category: 'utility'
        },

        // === Resistances ===
        coldResist: {
            default: 0,
            icon: '??',
            label: 'Cold Resist',
            type: 'number',
            category: 'resistance'
        },
        heatResist: {
            default: 0,
            icon: '??',
            label: 'Heat Resist',
            type: 'number',
            category: 'resistance'
        },
        poisonResist: {
            default: 0,
            icon: '??',
            label: 'Poison Resist',
            type: 'number',
            category: 'resistance'
        },

        // === Special Effects (toggleable) ===
        stagger: {
            default: false,
            icon: '??',
            label: 'Stagger',
            type: 'boolean',
            category: 'effect'
        },
        bleed: { default: false, icon: '??', label: 'Bleed', type: 'boolean', category: 'effect' },
        armorPierce: {
            default: false,
            icon: '??',
            label: 'Armor Pierce',
            type: 'boolean',
            category: 'effect'
        },
        spread: {
            default: false,
            icon: '??',
            label: 'Spread',
            type: 'boolean',
            category: 'effect'
        },
        thorns: {
            default: false,
            icon: '??',
            label: 'Thorns',
            type: 'boolean',
            category: 'effect'
        },
        doubleStrike: {
            default: false,
            icon: '????',
            label: 'Double Strike',
            type: 'boolean',
            category: 'effect'
        },
        executeBonus: {
            default: false,
            icon: '??',
            label: 'Execute Bonus',
            type: 'boolean',
            category: 'effect'
        },
        authority: {
            default: false,
            icon: '??',
            label: 'Authority',
            type: 'boolean',
            category: 'effect'
        }
    },

    // Categories for UI grouping
    categories: ['combat', 'defense', 'utility', 'resistance', 'effect'],

    // Get all stat keys
    getAllStatKeys() {
        return Object.keys(this.stats);
    },

    // Get stats by category
    getStatsByCategory(category: string) {
        return Object.entries(this.stats)
            .filter(([_, config]: [string, unknown]) => (config as { category?: string }).category === category)
            .map(([key, config]: [string, unknown]) => ({ key, ...(config as object) }));
    },

    // Get full stats object with defaults for any equipment
    getFullStats(partialStats: Record<string, number> = {}) {
        const full: Record<string, number> = {};
        for (const [key, config] of Object.entries(this.stats) as [string, { default: number }][]) {
            full[key] = partialStats[key] ?? config.default;
        }
        return full;
    }
};

export { EquipmentStatsConfig };
