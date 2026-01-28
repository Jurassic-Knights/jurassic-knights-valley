/**
 * EntityConfig - Central Configuration for Game Entities
 *
 * DEPRECATION NOTICE: Most configs have been migrated:
 * - hero, dinosaur, resource ? src/entities/
 * - enemy ? EnemyConfig.js
 * - lootTables ? LootTableConfig.js
 * - boss ? BossConfig.js
 *
 * REMAINING SECTIONS:
 * - droppedItem: Dropped item defaults
 * - npc: NPC defaults
 *
 * BACKWARD COMPATIBILITY STUBS:
 * - resources, resource, boss: Empty objects for legacy code
 */

import { Registry } from '@core/Registry';

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
    // DEPRECATED STUBS (for backward compatibility)
    // Use EntityRegistry.resources, EntityLoader.getBoss() instead
    // ============================================
    resources: {} as Record<string, any>,
    resource: {} as Record<string, any>,
    boss: {} as Record<string, any>,
    enemy: {
        defaults: {
            gridSize: 1,
            width: 128,
            height: 128,
            scale: 1.0
        },
        dinosaurs: {} as Record<string, any>,
        soldiers: {} as Record<string, any>,
        eliteSpawnChance: 0.05
    } as Record<string, any>,
    nodes: {} as Record<string, any>,

    // Top-level defaults (alias for enemy.defaults)
    defaults: {
        gridSize: 1,
        width: 128,
        height: 128,
        scale: 1.0
    },

    // Stub get method for legacy config access
    get(key: string): any {
        return (this as any)[key] || {};
    }
};

if (Registry) Registry.register('EntityConfig', EntityConfig);

export { EntityConfig };
