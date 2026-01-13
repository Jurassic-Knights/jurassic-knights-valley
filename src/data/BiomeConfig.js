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
                { enemyId: 'feral_raptor', weight: 60, groupSize: { min: 2, max: 4 } },
                { enemyId: 'feral_soldier', weight: 40, groupSize: { min: 1, max: 2 } }
            ],
            bossId: 'grasslands_alpha',
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
                { enemyId: 'frost_raptor', weight: 40, groupSize: { min: 2, max: 3 } },
                { enemyId: 'frost_trooper', weight: 35, groupSize: { min: 2, max: 4 } },
                { enemyId: 'mammoth_rider', weight: 25, groupSize: { min: 1, max: 1 } }
            ],
            bossId: 'tundra_warlord',
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
                { enemyId: 'sand_stalker', weight: 35, groupSize: { min: 1, max: 3 } },
                { enemyId: 'dune_marauder', weight: 40, groupSize: { min: 2, max: 5 } },
                { enemyId: 'sand_wyrm', weight: 25, groupSize: { min: 1, max: 1 } }
            ],
            bossId: 'desert_overlord',
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
                { enemyId: 'fire_raptor', weight: 30, groupSize: { min: 2, max: 4 } },
                { enemyId: 'magma_knight', weight: 35, groupSize: { min: 1, max: 3 } },
                { enemyId: 'volcanic_titan', weight: 20, groupSize: { min: 1, max: 1 } },
                { enemyId: 'ember_hound', weight: 15, groupSize: { min: 3, max: 6 } }
            ],
            bossId: 'lava_tyrant',
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
    }
};

window.BiomeConfig = BiomeConfig;
