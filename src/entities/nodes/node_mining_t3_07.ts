/**
 * Entity: node_mining_t3_07
 * Auto-generated from JSON.
 */

export default {
    id: 'node_mining_t3_07',
    name: 'Salt Formation',
    sourceCategory: 'nodes',
    sourceFile: 'nodes',
    sprite: 'node_mining_t3_07',
    status: 'pending',
    files: {
        original: 'assets/images/nodes/node_mining_t3_07_original.png'
    },
    type: 'ore',
    biome: 'tundra',
    sfx: {
        hit: 'sfx_node_hit_stone',
        break: 'sfx_node_break_stone',
        respawn: 'sfx_node_respawn'
    },
    drops: [
        {
            amount: [1, 3],
            chance: 1,
            item: 'minerals_t3_01'
        }
    ],
    nodeSubtype: 'mining',
    tier: 3,

    display: {
        sizeScale: 1,
        width: 64,
        height: 64
    },};
