/**
 * BiomeConfig - Biome Type Definitions
 *
 * Contains open world biome definitions, difficulty multipliers,
 * and enemy spawning rules.
 *
 * @see PropConfig.js for prop spawning and decoration config
 */

const BiomeConfig = {
    // ============================================
    // OPEN WORLD BIOMES (Enemy Territory)
    // ============================================

    types: {
        grasslands: {
            id: 'grasslands',
            name: 'The Grasslands',
            description: 'Rolling plains teeming with feral beasts.',
            difficulty: 1,
            levelRange: { min: 1, max: 10 },
            visualTheme: {
                groundColor: '#4A7C3F',
                ambientColor: '#E8F5E9',
                fogDensity: 0.1
            },
            enemySpawnTable: [
                { enemyId: 'enemy_herbivore_t1_01', weight: 40, groupSize: { min: 2, max: 4 } },
                { enemyId: 'enemy_herbivore_t1_02', weight: 30, groupSize: { min: 2, max: 3 } },
                { enemyId: 'enemy_dinosaur_t1_01', weight: 20, groupSize: { min: 1, max: 2 } },
                { enemyId: 'enemy_human_t1_01', weight: 10, groupSize: { min: 1, max: 2 } }
            ],
            bossId: 'boss_herbivore_t4_01',
            bossRespawnTime: 300
        },
        tundra: {
            id: 'tundra',
            name: 'The Frozen Wastes',
            description: 'Bitter cold and hardened survivors.',
            difficulty: 2,
            levelRange: { min: 10, max: 20 },
            visualTheme: {
                groundColor: '#B0C4DE',
                ambientColor: '#E0FFFF',
                fogDensity: 0.25
            },
            enemySpawnTable: [
                { enemyId: 'enemy_dinosaur_t2_01', weight: 35, groupSize: { min: 2, max: 3 } },
                { enemyId: 'enemy_human_t2_01', weight: 30, groupSize: { min: 2, max: 4 } },
                { enemyId: 'enemy_saurian_t2_01', weight: 20, groupSize: { min: 1, max: 2 } },
                { enemyId: 'enemy_herbivore_t2_01', weight: 15, groupSize: { min: 2, max: 3 } }
            ],
            bossId: 'boss_dinosaur_t4_01',
            bossRespawnTime: 360
        },
        desert: {
            id: 'desert',
            name: 'The Scorched Sands',
            description: 'Where only the strongest survive the heat.',
            difficulty: 3,
            levelRange: { min: 20, max: 30 },
            visualTheme: {
                groundColor: '#D2B48C',
                ambientColor: '#FFF8DC',
                fogDensity: 0.05
            },
            enemySpawnTable: [
                { enemyId: 'enemy_saurian_t3_01', weight: 30, groupSize: { min: 1, max: 3 } },
                { enemyId: 'enemy_dinosaur_t3_01', weight: 25, groupSize: { min: 2, max: 4 } },
                { enemyId: 'enemy_human_t3_01', weight: 25, groupSize: { min: 2, max: 3 } },
                { enemyId: 'enemy_herbivore_t3_01', weight: 20, groupSize: { min: 1, max: 2 } }
            ],
            bossId: 'boss_saurian_t4_01',
            bossRespawnTime: 420
        },
        lava_crags: {
            id: 'lava_crags',
            name: 'The Burning Crags',
            description: 'Volcanic hellscape of ash and flame.',
            difficulty: 4,
            levelRange: { min: 30, max: 40 },
            visualTheme: {
                groundColor: '#2F2F2F',
                ambientColor: '#FF4500',
                fogDensity: 0.3
            },
            enemySpawnTable: [
                { enemyId: 'enemy_saurian_t3_04', weight: 25, groupSize: { min: 2, max: 4 } },
                { enemyId: 'enemy_human_t3_03', weight: 20, groupSize: { min: 1, max: 3 } },
                { enemyId: 'enemy_dinosaur_t3_04', weight: 30, groupSize: { min: 1, max: 2 } },
                { enemyId: 'enemy_herbivore_t3_02', weight: 15, groupSize: { min: 2, max: 3 } },
                { enemyId: 'enemy_saurian_t3_03', weight: 10, groupSize: { min: 1, max: 2 } }
            ],
            bossId: 'boss_human_t4_03',
            bossRespawnTime: 480
        }
    },

    difficultyMultipliers: {
        1: { health: 1.0, damage: 1.0, xp: 1.0, loot: 1.0 },
        2: { health: 1.5, damage: 1.3, xp: 1.5, loot: 1.25 },
        3: { health: 2.0, damage: 1.6, xp: 2.0, loot: 1.5 },
        4: { health: 3.0, damage: 2.0, xp: 3.0, loot: 2.0 }
    },

    eliteMultipliers: {
        stats: 2.0,
        loot: 3.0,
        xp: 2.5
    },

    patrolDefaults: {
        areaRadius: 300,
        leashDistance: 500,
        aggroRange: 200,
        packAggroRadius: 150
    },

    transitionZones: {
        blendWidth: 200,
        mixedSpawnChance: 0.3
    },

    // ============================================
    // BACKWARD COMPATIBILITY (legacy uppercase property names)
    // ============================================
    Biome: {
        PATROL_AREA_RADIUS: 300,
        LEASH_DISTANCE: 500,
        AGGRO_RANGE: 200,
        GROUP_SPACING: 50,
        ELITE_SPAWN_CHANCE: 0.05,
        BOSS_RESPAWN_DEFAULT: 300
    }
};


// ES6 Module Export
export { BiomeConfig };
