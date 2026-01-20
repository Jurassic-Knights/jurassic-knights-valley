/**
 * Equipment Stats Configuration
 * Central registry of all possible equipment stats.
 * All equipment items can access any stat - values can be 0 if not used.
 */
const EquipmentStatsConfig = {
    // All possible stats with metadata
    stats: {
        // === Combat Stats ===
        damage: { default: 0, icon: '⚔️', label: 'Damage', type: 'number', category: 'combat' },
        attackRate: { default: 1.0, icon: '⏱️', label: 'Attack Rate', type: 'number', category: 'combat' },
        critChance: { default: 0, icon: '🎯', label: 'Crit %', type: 'number', category: 'combat' },
        range: { default: 80, icon: '📏', label: 'Range (px)', type: 'number', category: 'combat' },
        attackSpeed: { default: 0, icon: '⚡', label: 'Attack Speed %', type: 'number', category: 'combat' },
        reloadSpeed: { default: 0, icon: '🔄', label: 'Reload Speed %', type: 'number', category: 'combat' },

        // === Defense Stats ===
        armor: { default: 0, icon: '🛡️', label: 'Armor', type: 'number', category: 'defense' },
        block: { default: 0, icon: '🔰', label: 'Block', type: 'number', category: 'defense' },

        // === Utility Stats ===
        speed: { default: 0, icon: '💨', label: 'Speed', type: 'number', category: 'utility' },
        miningPower: { default: 0, icon: '⛏️', label: 'Mining Power', type: 'number', category: 'utility' },

        // === Resistances ===
        coldResist: { default: 0, icon: '❄️', label: 'Cold Resist', type: 'number', category: 'resistance' },
        heatResist: { default: 0, icon: '🔥', label: 'Heat Resist', type: 'number', category: 'resistance' },
        poisonResist: { default: 0, icon: '☠️', label: 'Poison Resist', type: 'number', category: 'resistance' },

        // === Special Effects (toggleable) ===
        stagger: { default: false, icon: '💫', label: 'Stagger', type: 'boolean', category: 'effect' },
        bleed: { default: false, icon: '🩸', label: 'Bleed', type: 'boolean', category: 'effect' },
        armorPierce: { default: false, icon: '📱', label: 'Armor Pierce', type: 'boolean', category: 'effect' },
        spread: { default: false, icon: '💥', label: 'Spread', type: 'boolean', category: 'effect' },
        thorns: { default: false, icon: '🌵', label: 'Thorns', type: 'boolean', category: 'effect' },
        doubleStrike: { default: false, icon: '⚔️⚔️', label: 'Double Strike', type: 'boolean', category: 'effect' },
        executeBonus: { default: false, icon: '💀', label: 'Execute Bonus', type: 'boolean', category: 'effect' },
        authority: { default: false, icon: '👑', label: 'Authority', type: 'boolean', category: 'effect' },
    },

    // Categories for UI grouping
    categories: ['combat', 'defense', 'utility', 'resistance', 'effect'],

    // Get all stat keys
    getAllStatKeys() {
        return Object.keys(this.stats);
    },

    // Get stats by category
    getStatsByCategory(category) {
        return Object.entries(this.stats)
            .filter(([_, config]) => config.category === category)
            .map(([key, config]) => ({ key, ...config }));
    },

    // Get full stats object with defaults for any equipment
    getFullStats(partialStats = {}) {
        const full = {};
        for (const [key, config] of Object.entries(this.stats)) {
            full[key] = partialStats[key] ?? config.default;
        }
        return full;
    }
};

// Export for dashboard (browser)
if (typeof window !== 'undefined') {
    window.EquipmentStatsConfig = EquipmentStatsConfig;
}

// Export for Node.js
if (typeof module !== 'undefined') {
    module.exports = EquipmentStatsConfig;
}

// ES6 Module Export
export { EquipmentStatsConfig };
