/**
 * Set Bonuses Configuration
 * Defines armor sets and their bonuses for wearing multiple pieces.
 * 
 * Format:
 * - pieces: Array of equipment IDs that belong to this set
 * - bonuses: Object mapping piece count to stat bonuses
 */
const SetBonusesConfig = {
    sets: {
        // Example set - will be populated as armor sets are designed
        raptor_hunter: {
            name: 'Raptor Hunter',
            pieces: ['chest_t2_01', 'legs_t2_01', 'hands_t2_01', 'head_t2_01'],
            bonuses: {
                2: { speed: 5 },
                3: { critChance: 3 },
                4: { damage: 10, speed: 10 }
            }
        },

        cold_weather: {
            name: 'Cold Weather Gear',
            pieces: ['chest_t2_03', 'legs_t2_02', 'hands_t2_02'],
            bonuses: {
                2: { coldResist: 15 },
                3: { coldResist: 30, armor: 5 }
            }
        }
    },

    /**
     * Find which set an equipment piece belongs to
     * @param {string} equipmentId
     * @returns {string|null} Set ID or null
     */
    findSetForPiece(equipmentId) {
        for (const [setId, set] of Object.entries(this.sets)) {
            if (set.pieces.includes(equipmentId)) {
                return setId;
            }
        }
        return null;
    },

    /**
     * Calculate set bonuses for equipped items
     * @param {string[]} equippedIds - Array of equipped equipment IDs
     * @returns {Object} Aggregated stat bonuses from sets
     */
    calculateSetBonuses(equippedIds) {
        const bonuses = {};
        const setCounts = {};

        // Count pieces per set
        for (const id of equippedIds) {
            const setId = this.findSetForPiece(id);
            if (setId) {
                setCounts[setId] = (setCounts[setId] || 0) + 1;
            }
        }

        // Apply bonuses based on piece counts
        for (const [setId, count] of Object.entries(setCounts)) {
            const set = this.sets[setId];
            for (const [threshold, stats] of Object.entries(set.bonuses)) {
                if (count >= parseInt(threshold)) {
                    for (const [stat, value] of Object.entries(stats)) {
                        bonuses[stat] = (bonuses[stat] || 0) + value;
                    }
                }
            }
        }

        return bonuses;
    }
};

// Export for browser
if (typeof window !== 'undefined') {
    window.SetBonusesConfig = SetBonusesConfig;
}

// Export for Node.js
if (typeof module !== 'undefined') {
    module.exports = SetBonusesConfig;
}

// ES6 Module Export
export { SetBonusesConfig };
