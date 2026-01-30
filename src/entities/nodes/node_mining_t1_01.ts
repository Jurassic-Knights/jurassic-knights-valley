/**
 * Entity: node_mining_t1_01
 * Auto-generated from JSON.
 */


import type { NodeEntity } from '@app-types/entities';

export default {
    id: 'node_mining_t1_01',
    name: 'Copper Vein',
    sourceCategory: 'nodes',
    sourceFile: 'nodes',
    sprite: 'node_mining_t1_01',
    status: 'pending',
    files: {
        original: 'assets/images/nodes/node_mining_t1_01_original.png'
    },
    type: 'ore',
    biome: 'grasslands',
    nodeSubtype: 'mining',
    tier: 1,

    display: {
        sizeScale: 1,
        width: 64,
        height: 64
    },
    drops: [
        {
            item: "minerals_t1_02",
            chance: 1,
            amount: [1, 3]
        }
    ]
} satisfies NodeEntity;
