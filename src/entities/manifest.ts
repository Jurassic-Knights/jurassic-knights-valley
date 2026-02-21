/**
 * Entity manifest - Aggregates split manifest categories.
 * Data split from original for 300-line rule.
 */
import { ground } from './manifest/manifest_ground';
import { enemies, bosses } from './manifest/manifest_enemies';
import { nodes } from './manifest/manifest_nodes';
import { resources } from './manifest/manifest_resources';
import { items } from './manifest/manifest_items';
import { equipment } from './manifest/manifest_equipment';
import { npcs, environment, hero } from './manifest/manifest_environment';

export default { ground, enemies, bosses, nodes, resources, items, equipment, npcs, environment, hero };
