/**
 * EntityConfig - Central Configuration for Game Entities
 *
 * DEPRECATION NOTICE: Most configs have been migrated:
 * - hero, dinosaur, resource → src/entities/
 * - enemy → EnemyConfig.js
 * - lootTables → LootTableConfig.js
 * - boss → BossConfig.js
 *
 * REMAINING SECTIONS:
 * - droppedItem: Dropped item defaults
 * - npc: NPC defaults
 */

// Ambient declarations
declare const Registry: any;

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
    }
};

if (Registry) Registry.register('EntityConfig', EntityConfig);

export { EntityConfig };
