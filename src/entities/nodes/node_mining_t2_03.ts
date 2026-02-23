/**
 * Entity: node_mining_t2_03
 * Auto-generated. Edit in dashboard.
 */
import type { EntityConfig } from '@app-types/core';

export default {
    "id": "node_mining_t2_03",
    "name": "Coal Seam",
    "sourceCategory": "nodes",
    "sourceFile": "nodes",
    "sprite": "node_mining_t2_03",
    "status": "declined",
    "files": {
        "original": "assets/images/nodes/node_mining_t2_03_original.png"
    },
    "type": "ore",
    "biome": "tundra",
    "nodeSubtype": "mining",
    "tier": 2,
    "display": {
        "sizeScale": 1,
        "width": 128,
        "height": 128
    },
    "drops": [
        {
            "item": "minerals_t2_02",
            "chance": 1,
            "amount": [
                1,
                3
            ]
        }
    ],
    "declineNote": ""
} satisfies EntityConfig;
