/**
 * EnemyConfig - Enemy Types and Combat Configuration
 *
 * Now pulls from EntityRegistry (entity files are single source of truth).
 * This file provides lookup helpers and combat defaults only.
 */

const EnemyConfig = {
    defaults: {
        gridSize: 1.5,
        width: 192,
        height: 192,
        health: 50,
        maxHealth: 50,
        damage: 5,
        attackRate: 1,
        attackRange: 100,
        speed: 80,
        aggroRange: 200,
        leashDistance: 500,
        xpReward: 10,
        lootTableId: 'common_enemy',
        packAggro: true,
        isElite: false,
        threatLevel: 1
    },

    eliteMultipliers: {
        health: 2.0,
        damage: 2.0,
        xpReward: 3.0,
        lootDrops: 3.0
    },
    eliteSpawnChance: 0.05,

    /**
     * Get enemy definition by ID from EntityRegistry
     * @param {string} id - Entity ID (e.g., 'enemy_human_t1_01')
     * @returns {object|null} Enemy definition
     */
    get(id) {
        return window.EntityRegistry?.enemies?.[id] || null;
    },

    /**
     * Get all enemies of a category
     * @param {string} category - 'human', 'saurian', 'dinosaur', 'herbivore'
     * @returns {object[]} Array of enemy definitions
     */
    getByCategory(category) {
        const enemies = window.EntityRegistry?.enemies || {};
        return Object.values(enemies).filter((e) => e.category === category);
    },

    /**
     * Get all enemies for a biome
     * @param {string} biomeId - Biome ID
     * @returns {object[]} Array of enemy definitions that spawn in this biome
     */
    getByBiome(biomeId) {
        const enemies = window.EntityRegistry?.enemies || {};
        return Object.values(enemies).filter((e) => e.spawnBiomes?.includes(biomeId));
    },

    /**
     * Get all enemies of a tier
     * @param {number} tier - 1, 2, 3, or 4
     * @returns {object[]} Array of enemy definitions
     */
    getByTier(tier) {
        const enemies = window.EntityRegistry?.enemies || {};
        return Object.values(enemies).filter((e) => e.tier === tier);
    },

    attackTypes: {
        melee: { range: 100, windupTime: 200, recoveryTime: 500 },
        ranged: { range: 350, projectileSpeed: 400, windupTime: 300, recoveryTime: 800 }
    }
};

window.EnemyConfig = EnemyConfig;

