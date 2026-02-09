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
    resources: {} as Record<string, unknown>,
    resource: {} as Record<string, unknown>,
    boss: {} as Record<string, unknown>,
    enemy: {
        defaults: {
            gridSize: 1,
            width: 128,
            height: 128,
            scale: 1.0
        },
        dinosaurs: {} as Record<string, unknown>,
        soldiers: {} as Record<string, unknown>,
        eliteSpawnChance: 0.05
    } as Record<string, unknown>,
    nodes: {} as Record<string, unknown>,

    // Top-level defaults (alias for enemy.defaults)
    defaults: {
        gridSize: 1,
        width: 128,
        height: 128,
        scale: 1.0
    },

    // Stub get method for legacy config access
    get(key: string): Record<string, unknown> {
        return ((this as Record<string, unknown>)[key] as Record<string, unknown>) || {};
    }
};

if (Registry) Registry.register('EntityConfig', EntityConfig);

export { EntityConfig };
