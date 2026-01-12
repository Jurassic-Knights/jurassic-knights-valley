/**
 * EntityConfig - Central Configuration for Game Entities
 * 
 * DEPRECATION NOTICE: hero, dinosaur, and resource configs have been migrated
 * to the Entity-Centric Architecture (src/entities/).
 * 
 * REMAINING SECTIONS (still in use):
 * - droppedItem: Dropped item defaults
 * - npc: NPC defaults  
 * - enemy: Enemy types and multipliers
 * - lootTables: Loot drop definitions
 * - boss: Boss configurations
 * 
 * @see src/entities/ for entity definitions
 */

const EntityConfig = {

    // ============================================
    // DROPPED ITEMS
    // ============================================
    droppedItem: {
        defaults: {
            gridSize: 0.75,
            width: 96,
            height: 96,
            pickupRadius: 120
        }
    },

    // ============================================
    // NPCs
    // ============================================
    npc: {
        merchant: {
            defaults: {
                gridSize: 1.5,
                width: 192,
                height: 192,
                interactRadius: 140,
                color: '#8E44AD'
            }
        }
    },

    // ============================================
    // HOSTILE ENEMIES (Biome)
    // ============================================
    enemy: {
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
    },

    // ============================================
    // LOOT TABLES
    // ============================================
    lootTables: {
        'common_feral': {
            guaranteedDrops: [],
            randomDrops: [
                { itemId: 'primal_meat', weight: 50, amount: { min: 1, max: 2 } },
                { itemId: 'scrap_metal', weight: 30, amount: { min: 1, max: 1 } },
                { itemId: 'gold', weight: 20, amount: { min: 5, max: 15 } }
            ],
            dropCount: { min: 1, max: 2 }
        },
        'raptor_enemy': {
            guaranteedDrops: [{ itemId: 'primal_meat', amount: 1 }],
            randomDrops: [
                { itemId: 'raptor_claw', weight: 25, amount: { min: 1, max: 1 } },
                { itemId: 'primal_meat', weight: 45, amount: { min: 1, max: 2 } },
                { itemId: 'gold', weight: 30, amount: { min: 10, max: 25 } }
            ],
            dropCount: { min: 1, max: 2 }
        },
        'rex_enemy': {
            guaranteedDrops: [
                { itemId: 'primal_meat', amount: 3 },
                { itemId: 'iron_ore', amount: 2 }
            ],
            randomDrops: [
                { itemId: 'rex_tooth', weight: 15, amount: { min: 1, max: 1 } },
                { itemId: 'fossil_fuel', weight: 45, amount: { min: 1, max: 2 } },
                { itemId: 'gold', weight: 40, amount: { min: 50, max: 100 } }
            ],
            dropCount: { min: 2, max: 3 }
        },
        'spitter_enemy': {
            guaranteedDrops: [{ itemId: 'primal_meat', amount: 1 }],
            randomDrops: [
                { itemId: 'acid_gland', weight: 30, amount: { min: 1, max: 1 } },
                { itemId: 'scrap_metal', weight: 40, amount: { min: 1, max: 2 } },
                { itemId: 'gold', weight: 30, amount: { min: 15, max: 35 } }
            ],
            dropCount: { min: 1, max: 2 }
        },
        'soldier_common': {
            guaranteedDrops: [],
            randomDrops: [
                { itemId: 'scrap_metal', weight: 40, amount: { min: 1, max: 3 } },
                { itemId: 'iron_ore', weight: 30, amount: { min: 1, max: 2 } },
                { itemId: 'gold', weight: 30, amount: { min: 20, max: 40 } }
            ],
            dropCount: { min: 1, max: 2 }
        },
        'soldier_brute': {
            guaranteedDrops: [{ itemId: 'iron_ore', amount: 2 }],
            randomDrops: [
                { itemId: 'scrap_metal', weight: 35, amount: { min: 2, max: 4 } },
                { itemId: 'fossil_fuel', weight: 25, amount: { min: 1, max: 2 } },
                { itemId: 'gold', weight: 40, amount: { min: 40, max: 80 } }
            ],
            dropCount: { min: 2, max: 3 }
        },
        'boss_grasslands': {
            guaranteedDrops: [
                { itemId: 'alpha_fang', amount: 1 },
                { itemId: 'gold', amount: 500 }
            ],
            randomDrops: [
                { itemId: 'rare_hide', weight: 45, amount: { min: 1, max: 2 } },
                { itemId: 'primal_essence', weight: 35, amount: { min: 1, max: 1 } },
                { itemId: 'equipment_crate', weight: 20, amount: { min: 1, max: 1 } }
            ],
            dropCount: { min: 2, max: 3 }
        }
    },

    // ============================================
    // BIOME BOSSES
    // ============================================
    boss: {
        defaults: {
            gridSize: 3,
            width: 384,
            height: 384,
            health: 1000,
            maxHealth: 1000,
            damage: 50,
            attackRate: 0.5,
            attackRange: 150,
            speed: 40,
            aggroRange: 400,
            leashDistance: 800,
            xpReward: 500,
            respawnTime: 300,
            isBoss: true,
            threatLevel: 5,
            glowColor: '#FF4500'
        },
        types: {
            'grasslands_alpha': {
                name: 'Alpha Raptor',
                species: 'velociraptor',
                biomeId: 'grasslands',
                health: 800,
                damage: 35,
                speed: 100,
                attackType: 'melee',
                xpReward: 300,
                lootTableId: 'boss_grasslands',
                abilities: ['pounce', 'call_pack'],
                glowColor: '#32CD32'
            }
        }
    }
};

window.EntityConfig = EntityConfig;

if (window.Registry) {
    Registry.register('EntityConfig', EntityConfig);
} else {
    window.addEventListener('load', () => {
        if (window.Registry) Registry.register('EntityConfig', EntityConfig);
    });
}
