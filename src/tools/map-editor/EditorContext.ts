import { ZoneCategory } from '@data/ZoneConfig';

export interface RegistryDict {
    [id: string]: { width?: number; height?: number } | undefined;
}

export interface EntityRegistry {
    nodes?: RegistryDict;
    enemies?: RegistryDict;
    resources?: RegistryDict;
    items?: RegistryDict;
    environment?: RegistryDict;
}

/**
 * EditorContext
 * 
 * Shared state for Map Editor sub-systems.
 * Replaces legacy 'window' global storage.
 */
export const EditorContext = {
    // Entity Data for rendering sizes
    registry: {} as EntityRegistry,

    // Visibility Filters — tracks HIDDEN zone IDs. Empty = everything visible.
    hiddenZoneIds: new Set<string>()
};
