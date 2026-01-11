/**
 * EntityConfig - Central Configuration for Game Entities
 * 
 * Supports cascading updates:
 * - Base configurations define defaults
 * - Variants override specific properties
 * - "Cascading" comes from the fact that all entities read from here live.
 */

const EntityConfig = {
    // Player Character
    hero: {
        base: {
            gridSize: 1.5,  // Size in grid units
            width: 192,     // 1.5 * 128
            height: 192,
            color: '#D4AF37', // Gold
            health: 100,
            maxHealth: 100,
            stamina: 100,
            maxStamina: 100,
            speed: 700, // Pixels per second
            attack: {
                damage: 10,
                rate: 2, // Attacks per second
                staminaCost: 1,
                range: {
                    default: 125,
                    gun: 450
                }
            },

            // Combat Stats (03-hero-stats)
            level: 1,
            xp: 0,
            defense: 0,              // Damage reduction
            critChance: 0.05,        // 5% base crit
            critMultiplier: 1.5,     // 150% crit damage

            // Leveling Curve (03-hero-stats)
            xpToNextLevel: 100,      // Base XP for level 2
            xpScaling: 1.5           // Each level requires 1.5x more XP
        }
    },

    // Dinosaurs (AI Entities)
    dinosaur: {
        defaults: {
            gridSize: 1.5,  // Default dino size
            width: 192,     // 1.5 * 128
            height: 192,
            health: 60,
            maxHealth: 60,
            speed: 30, // Wander speed
            respawnTime: 20, // Base seconds
            frameInterval: 200,
            amount: 1, // Drops exactly 1 resource when killed
            interactionRange: 120, // Range for hero interaction check
            boundsPadding: 30 // Padding from island bounds during wander
        },
        variants: {
            // Velociraptor (Meat)
            'velociraptor': {
                gridSize: 1.5,
                health: 40,
                speed: 45, // Faster
                respawnTime: 15
            },
            // T-Rex (Iron)
            'tyrannosaurus': {
                gridSize: 2.5,
                width: 320,
                height: 320,
                health: 300,
                maxHealth: 300,
                speed: 25, // Slower
                respawnTime: 60
            },
            // Triceratops (Fuel)
            'triceratops': {
                gridSize: 2,
                width: 256,
                height: 256,
                health: 150,
                speed: 20
            },
            // Ankylosaurus (Scrap)
            'ankylosaurus': {
                gridSize: 1.5,
                health: 200,
                speed: 15
            }
        },
        speciesMap: {
            'primal_meat': 'velociraptor',
            'iron_ore': 'tyrannosaurus',
            'scrap_metal': 'ankylosaurus',
            'fossil_fuel': 'triceratops',
            'default': 'velociraptor'
        },
        spriteKeys: [
            'dino_base',
            'dino_velociraptor_base',
            'dino_tyrannosaurus_base',
            'dino_triceratops_base',
            'dino_ankylosaurus_base',
            'dino_parasaurolophus_base',
            'dino_stegosaurus_base',
            'dino_spinosaurus_base',
        ]
    },

    // Resources (Static Collectibles)
    resource: {
        defaults: {
            gridSize: 1,    // Default 1 cell
            width: 128,     // 1 * 128
            height: 128,
            interactRadius: 130,
            health: 30,
            respawnTime: 30,
            amount: 1 // Drops exactly 1 resource when destroyed
        },
        types: {
            'scrap_metal': {
                name: 'Salvaged Scrap',
                description: 'Recovered metal from the ruined front.',
                maxHealth: 20,
                respawnTime: 15,
                rarity: 'common',
                color: '#7A7A7A',
                sfxSuffix: 'metal',
                vfxType: 'sparks'
            },
            'iron_ore': {
                name: 'Iron Deposit',
                description: 'Raw ore pulled from muddy trenches.',
                maxHealth: 60,
                respawnTime: 45,
                rarity: 'uncommon',
                color: '#8B4513',
                sfxSuffix: 'metal',
                vfxType: 'sparks'
            },
            'fossil_fuel': {
                name: 'Black Tar',
                description: 'Combustible fuel for the war machines.',
                maxHealth: 100,
                respawnTime: 90,
                rarity: 'rare',
                color: '#2F2F2F',
                sfxSuffix: 'stone',
                vfxType: 'dust'
            },
            'wood': {
                name: 'Petrified Wood',
                description: 'Hardened ancient timber.',
                gridSize: 1,
                snapToGrid: false, // Trees can be placed organically
                skipDefaultRender: true, // Trees handled by HomeBase/WorldRenderer
                maxHealth: 15,
                respawnTime: 10,
                rarity: 'common',
                color: '#5D4037',
                sfxSuffix: 'wood',
                vfxType: 'wood_chips'
            },
            'gold': {
                name: 'Gold Cache',
                description: 'Currency of the old empire.',
                gridSize: 0.75,
                width: 96,
                height: 96,
                maxHealth: 10,
                respawnTime: 60,
                rarity: 'legendary',
                color: '#FFD700',
                sfxSuffix: 'metal',
                vfxType: 'sparks'
            },
            'primal_meat': {
                name: 'Primal Meat',
                description: 'Raw flesh from a prehistoric beast.',
                gridSize: 0.75,
                maxHealth: 0,
                respawnTime: 0,
                rarity: 'uncommon',
                color: '#8B0000',
                sfxSuffix: 'meat',
                vfxType: 'blood'
            }
        }
    },

    // Dropped Items
    droppedItem: {
        defaults: {
            gridSize: 0.75,
            width: 96,      // 0.75 * 128
            height: 96,
            pickupRadius: 120
        }
    },

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

    // Hostile Enemies (Biome)
    enemy: {
        defaults: {
            gridSize: 1.5,
            width: 192,
            height: 192,
            health: 50,
            maxHealth: 50,
            damage: 5,
            attackRate: 1,         // Attacks per second
            attackRange: 100,      // Melee range
            speed: 80,             // Faster than passive dinos
            aggroRange: 200,       // Detection radius
            leashDistance: 500,    // Max chase distance from spawn
            xpReward: 10,
            lootTableId: 'common_enemy',
            packAggro: true,       // Group aggro behavior
            isElite: false,        // Elite variant flag
            threatLevel: 1         // 1-5 for UI indicators
        },

        // Elite Multipliers
        eliteMultipliers: {
            health: 2.0,
            damage: 2.0,
            xpReward: 3.0,
            lootDrops: 3.0
        },
        eliteSpawnChance: 0.05, // 5% chance to spawn as elite

        // Enemy Dinosaurs
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
                packAggro: true,    // Raptors hunt in packs
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
                packAggro: false,   // Rex is a solo hunter
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

        // Hostile Soldiers
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
                packAggro: false,   // Brutes fight alone
                threatLevel: 3
            }
        },

        // Transition Zone Mixing
        transitionZones: {
            'grasslands_tundra': ['enemy_raptor', 'enemy_soldier'],
            'tundra_desert': ['enemy_soldier', 'enemy_brute'],
            'desert_lava': ['enemy_rex', 'enemy_spitter']
        },

        // Attack Type Configs
        attackTypes: {
            melee: {
                range: 100,
                windupTime: 200,
                recoveryTime: 500
            },
            ranged: {
                range: 350,
                projectileSpeed: 400,
                windupTime: 300,
                recoveryTime: 800
            }
        }
    },

    // ============================================
    // LOOT TABLES (07-loot-system)
    // ============================================

    /**
     * Loot tables define what enemies drop when killed.
     * - guaranteedDrops: Always drop these items
     * - randomDrops: Weighted random selection
     * - dropCount: Number of random drops to generate
     */
    lootTables: {
        // Common feral enemy drops
        'common_feral': {
            guaranteedDrops: [],
            randomDrops: [
                { itemId: 'primal_meat', weight: 50, amount: { min: 1, max: 2 } },
                { itemId: 'scrap_metal', weight: 30, amount: { min: 1, max: 1 } },
                { itemId: 'gold', weight: 20, amount: { min: 5, max: 15 } }
            ],
            dropCount: { min: 1, max: 2 }
        },

        // Raptor enemy drops
        'raptor_enemy': {
            guaranteedDrops: [
                { itemId: 'primal_meat', amount: 1 }
            ],
            randomDrops: [
                { itemId: 'raptor_claw', weight: 25, amount: { min: 1, max: 1 } },
                { itemId: 'primal_meat', weight: 45, amount: { min: 1, max: 2 } },
                { itemId: 'gold', weight: 30, amount: { min: 10, max: 25 } }
            ],
            dropCount: { min: 1, max: 2 }
        },

        // T-Rex enemy drops
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

        // Spitter enemy drops
        'spitter_enemy': {
            guaranteedDrops: [
                { itemId: 'primal_meat', amount: 1 }
            ],
            randomDrops: [
                { itemId: 'acid_gland', weight: 30, amount: { min: 1, max: 1 } },
                { itemId: 'scrap_metal', weight: 40, amount: { min: 1, max: 2 } },
                { itemId: 'gold', weight: 30, amount: { min: 15, max: 35 } }
            ],
            dropCount: { min: 1, max: 2 }
        },

        // Common soldier drops
        'soldier_common': {
            guaranteedDrops: [],
            randomDrops: [
                { itemId: 'scrap_metal', weight: 40, amount: { min: 1, max: 3 } },
                { itemId: 'iron_ore', weight: 30, amount: { min: 1, max: 2 } },
                { itemId: 'gold', weight: 30, amount: { min: 20, max: 40 } }
            ],
            dropCount: { min: 1, max: 2 }
        },

        // Brute soldier drops
        'soldier_brute': {
            guaranteedDrops: [
                { itemId: 'iron_ore', amount: 2 }
            ],
            randomDrops: [
                { itemId: 'scrap_metal', weight: 35, amount: { min: 2, max: 4 } },
                { itemId: 'fossil_fuel', weight: 25, amount: { min: 1, max: 2 } },
                { itemId: 'gold', weight: 40, amount: { min: 40, max: 80 } }
            ],
            dropCount: { min: 2, max: 3 }
        },

        // Boss loot tables (09-boss-system will use these)
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
        },

        'boss_tundra': {
            guaranteedDrops: [
                { itemId: 'frost_core', amount: 1 },
                { itemId: 'gold', amount: 750 }
            ],
            randomDrops: [
                { itemId: 'frozen_hide', weight: 45, amount: { min: 1, max: 3 } },
                { itemId: 'primal_essence', weight: 35, amount: { min: 1, max: 2 } },
                { itemId: 'equipment_crate', weight: 20, amount: { min: 1, max: 1 } }
            ],
            dropCount: { min: 2, max: 4 }
        },

        'boss_desert': {
            guaranteedDrops: [
                { itemId: 'scorched_heart', amount: 1 },
                { itemId: 'gold', amount: 1000 }
            ],
            randomDrops: [
                { itemId: 'sand_crystal', weight: 40, amount: { min: 1, max: 3 } },
                { itemId: 'primal_essence', weight: 40, amount: { min: 1, max: 2 } },
                { itemId: 'equipment_crate', weight: 20, amount: { min: 1, max: 2 } }
            ],
            dropCount: { min: 3, max: 4 }
        },

        'boss_lava': {
            guaranteedDrops: [
                { itemId: 'molten_core', amount: 1 },
                { itemId: 'gold', amount: 1500 }
            ],
            randomDrops: [
                { itemId: 'volcanic_shard', weight: 35, amount: { min: 2, max: 4 } },
                { itemId: 'primal_essence', weight: 40, amount: { min: 2, max: 3 } },
                { itemId: 'equipment_crate', weight: 25, amount: { min: 1, max: 2 } }
            ],
            dropCount: { min: 3, max: 5 }
        }
    },

    // Biome Bosses (09-boss-system)
    boss: {
        defaults: {
            gridSize: 3,
            width: 384,
            height: 384,
            health: 1000,
            maxHealth: 1000,
            damage: 50,
            attackRate: 0.5,      // Slower but harder hitting
            attackRange: 150,
            speed: 40,            // Slow but menacing
            aggroRange: 400,      // Large aggro range
            leashDistance: 800,   // Larger leash
            xpReward: 500,
            respawnTime: 300,     // 5 minutes
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
                speed: 100,           // Fast boss
                attackType: 'melee',
                xpReward: 300,
                lootTableId: 'boss_grasslands',
                abilities: ['pounce', 'call_pack'],
                glowColor: '#32CD32'  // Green glow
            },
            'tundra_warlord': {
                name: 'Frost Warlord',
                species: 'mammoth',
                biomeId: 'tundra',
                gridSize: 4,
                width: 512,
                height: 512,
                health: 2000,
                damage: 80,
                speed: 30,
                attackType: 'melee',
                xpReward: 600,
                lootTableId: 'boss_tundra',
                abilities: ['stomp', 'charge'],
                glowColor: '#87CEEB'  // Ice blue glow
            },
            'desert_overlord': {
                name: 'Sand Overlord',
                species: 'scorpion',
                biomeId: 'desert',
                health: 1500,
                damage: 60,
                speed: 50,
                attackType: 'melee',
                xpReward: 500,
                lootTableId: 'boss_desert',
                abilities: ['burrow', 'poison_sting'],
                glowColor: '#DAA520'  // Sand gold glow
            },
            'lava_tyrant': {
                name: 'Lava Tyrant',
                species: 'tyrannosaurus',
                biomeId: 'lava_crags',
                gridSize: 4,
                width: 512,
                height: 512,
                health: 3000,
                damage: 100,
                speed: 35,
                attackType: 'melee',
                xpReward: 1000,
                lootTableId: 'boss_lava',
                abilities: ['fire_breath', 'roar'],
                glowColor: '#FF4500'  // Lava orange glow
            }
        }
    }
};

// Global Access
window.EntityConfig = EntityConfig;

// Auto-Register
if (window.Registry) {
    Registry.register('EntityConfig', EntityConfig);
} else {
    window.addEventListener('load', () => {
        if (window.Registry) Registry.register('EntityConfig', EntityConfig);
    });
}
