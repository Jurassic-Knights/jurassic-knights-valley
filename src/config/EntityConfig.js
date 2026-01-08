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
            width: 186,
            height: 186,
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
            width: 200,
            height: 200,
            health: 60,
            maxHealth: 60,
            speed: 30, // Wander speed
            respawnTime: 20, // Base seconds
            frameInterval: 200,
            amount: 1 // Drops exactly 1 resource when killed
        },
        variants: {
            // Velociraptor (Meat)
            'velociraptor': {
                health: 40,
                speed: 45, // Faster
                respawnTime: 15
            },
            // T-Rex (Iron)
            'tyrannosaurus': {
                width: 320,
                height: 320,
                health: 300,
                maxHealth: 300,
                speed: 25, // Slower
                respawnTime: 60
            },
            // Triceratops (Fuel)
            'triceratops': {
                width: 240,
                height: 240,
                health: 150,
                speed: 20
            },
            // Ankylosaurus (Scrap)
            'ankylosaurus': {
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
            width: 150,
            height: 150,
            interactRadius: 145,
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
                color: '#7A7A7A'
            },
            'iron_ore': {
                name: 'Iron Deposit',
                description: 'Raw ore pulled from muddy trenches.',
                maxHealth: 60,
                respawnTime: 45,
                rarity: 'uncommon',
                color: '#8B4513'
            },
            'fossil_fuel': {
                name: 'Black Tar',
                description: 'Combustible fuel for the war machines.',
                maxHealth: 100,
                respawnTime: 90,
                rarity: 'rare',
                color: '#2F2F2F'
            },
            'wood': {
                name: 'Petrified Wood',
                description: 'Hardened ancient timber.',
                width: 120,
                height: 120,
                maxHealth: 15,
                respawnTime: 10,
                rarity: 'common',
                color: '#5D4037'
            },
            'gold': {
                name: 'Gold Cache',
                description: 'Currency of the old empire.',
                width: 100,
                height: 100,
                maxHealth: 10,
                respawnTime: 60,
                rarity: 'legendary',
                color: '#FFD700'
            },
            'primal_meat': {
                name: 'Primal Meat',
                description: 'Raw flesh from a prehistoric beast.',
                maxHealth: 0,
                respawnTime: 0,
                rarity: 'uncommon',
                color: '#8B0000'
            }
        }
    },

    // Dropped Items
    droppedItem: {
        defaults: {
            width: 108,
            height: 108,
            pickupRadius: 140
        }
    },

    npc: {
        merchant: {
            defaults: {
                width: 186,
                height: 186,
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
