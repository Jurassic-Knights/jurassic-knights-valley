/**
 * EntityLoaderLookup - Lookup helpers for EntityRegistry
 */
import { EntityConfig, IEntity } from '../types/core';

export interface EntityRegistryStrict {
    enemies: Record<string, EntityConfig>;
    bosses: Record<string, EntityConfig>;
    equipment: Record<string, EntityConfig>;
    resources?: Record<string, EntityConfig>;
    nodes?: Record<string, EntityConfig>;
    items?: Record<string, EntityConfig>;
    npcs?: Record<string, EntityConfig>;
    environment?: Record<string, EntityConfig>;
    hero?: Record<string, EntityConfig>;
    [key: string]: Record<string, EntityConfig> | undefined;
}

export function getEnemy(registry: EntityRegistryStrict, id: string) {
    return registry?.enemies?.[id] || null;
}

export function getBoss(registry: EntityRegistryStrict, id: string) {
    return registry?.bosses?.[id] || null;
}

export function getHero(registry: EntityRegistryStrict) {
    return registry?.hero || null;
}

export function getEnemiesForBiome(registry: EntityRegistryStrict, biomeId: string) {
    const enemies = registry.enemies || {};
    return Object.values(enemies).filter(
        (e: EntityConfig) => e.spawning?.biomes?.includes(biomeId) && e.entityType !== 'Boss'
    );
}

export function getEnemiesByTier(registry: EntityRegistryStrict, tier: number) {
    const enemies = registry.enemies || {};
    return Object.values(enemies).filter((e: IEntity & { tier?: string }) => e.tier === tier);
}

export function getEnemiesByCategory(registry: EntityRegistryStrict, category: string) {
    const enemies = registry.enemies || {};
    return Object.values(enemies).filter(
        (e: IEntity & { category?: string }) => e.category === category
    );
}

export function getAllEquipment(registry: EntityRegistryStrict) {
    const equipment = registry?.equipment || {};
    const allEquipment: Array<{ id: string; [key: string]: unknown }> = [];

    for (const [id, item] of Object.entries(equipment)) {
        let sourceFile = 'equipment';
        if (id.startsWith('chest_')) sourceFile = 'chest';
        else if (id.startsWith('head_')) sourceFile = 'head';
        else if (id.startsWith('hands_')) sourceFile = 'hands';
        else if (id.startsWith('feet_')) sourceFile = 'feet';
        else if (id.startsWith('legs_')) sourceFile = 'legs';
        else if (id.startsWith('tool_')) sourceFile = 'tool';
        else if (id.startsWith('weapon_')) sourceFile = 'weapon';
        else if (id.startsWith('signature_')) sourceFile = 'signature';
        else if (id.startsWith('accessory_')) sourceFile = 'accessory';

        const itemData = item as Record<string, unknown>;
        allEquipment.push({ ...itemData, id: itemData.id || id, sourceFile });
    }
    return allEquipment;
}

export function getConfig(registry: EntityRegistryStrict, id: string): EntityConfig | null {
    if (!registry) return null;
    if (registry.enemies?.[id]) return registry.enemies[id];
    if (registry.bosses?.[id]) return registry.bosses[id];
    if (registry.resources?.[id]) return registry.resources[id];
    if (registry.nodes?.[id]) return registry.nodes[id];
    if (registry.items?.[id]) return registry.items[id];
    if (registry.equipment?.[id]) return registry.equipment[id];
    if (registry.npcs?.[id]) return registry.npcs[id];
    if (registry.environment?.[id]) return registry.environment[id];
    if (registry.hero?.[id]) return registry.hero[id];
    return null;
}
