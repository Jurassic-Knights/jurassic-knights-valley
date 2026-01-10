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
            }
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
