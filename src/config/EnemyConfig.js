/**
 * EnemyConfig - Enemy Types and Combat Configuration
 * 
 * Separated from EntityConfig for single responsibility.
 * Contains enemy defaults, types, and attack configurations.
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

    dinosaurs: {
        'enemy_raptor': {
            name: 'Feral Raptor',
            species: 'velociraptor',
            entityType: 'enemy_dinosaur',
            health: 40,
            damage: 8,
            speed: 120,
            attackType: 'melee',
            xpReward: 15,
            lootTableId: 'raptor_enemy',
            packAggro: true,
            threatLevel: 1
        },
        'enemy_rex': {
            name: 'Feral Rex',
            species: 'tyrannosaurus',
            entityType: 'enemy_dinosaur',
            gridSize: 2.5,
            width: 320,
            height: 320,
            health: 200,
            damage: 25,
            speed: 60,
            attackType: 'melee',
            xpReward: 100,
            lootTableId: 'rex_enemy',
            packAggro: false,
            threatLevel: 4
        },
        'enemy_spitter': {
            name: 'Acid Spitter',
            species: 'dilophosaurus',
            entityType: 'enemy_dinosaur',
            health: 30,
            damage: 12,
            speed: 70,
            attackType: 'ranged',
            attackRange: 300,
            xpReward: 20,
            lootTableId: 'spitter_enemy',
            packAggro: true,
            threatLevel: 2
        }
    },

    soldiers: {
        'enemy_soldier': {
            name: 'Rogue Soldier',
            entityType: 'enemy_soldier',
            health: 60,
            damage: 10,
            speed: 90,
            attackType: 'ranged',
            attackRange: 350,
            weaponType: 'rifle',
            xpReward: 25,
            lootTableId: 'soldier_common',
            packAggro: true,
            threatLevel: 2
        },
        'enemy_brute': {
            name: 'Trench Brute',
            entityType: 'enemy_soldier',
            health: 150,
            damage: 20,
            speed: 50,
            attackType: 'melee',
            weaponType: 'club',
            xpReward: 40,
            lootTableId: 'soldier_brute',
            packAggro: false,
            threatLevel: 3
        }
    },

    transitionZones: {
        'grasslands_tundra': ['enemy_raptor', 'enemy_soldier'],
        'tundra_desert': ['enemy_soldier', 'enemy_brute'],
        'desert_lava': ['enemy_rex', 'enemy_spitter']
    },

    attackTypes: {
        melee: { range: 100, windupTime: 200, recoveryTime: 500 },
        ranged: { range: 350, projectileSpeed: 400, windupTime: 300, recoveryTime: 800 }
    }
};

window.EnemyConfig = EnemyConfig;
