/**
 * Entity: node_mining_t2_01
 * Auto-generated. Edit in dashboard.
 */
import type { EntityConfig } from '@app-types/core';

export default {
    "id": "node_mining_t2_01",
    "name": "Dark Iron Vein",
    "sourceCategory": "nodes",
    "sourceFile": "nodes",
    "sprite": "node_mining_t2_01",
    "status": "declined",
    "files": {
        "original": "assets/images/nodes/node_mining_t2_01_original.png",
        "consumed_original": "assets/images/nodes/node_mining_t2_01_consumed_original.png"
    },
    "type": "ore",
    "biome": "badlands",
    "nodeSubtype": "mining",
    "tier": 2,
    "display": {
        "sizeScale": 1,
        "width": 64,
        "height": 64
    },
    "drops": [
        {
            "item": "minerals_t2_01",
            "chance": 1,
            "amount": [
                1,
                3
            ]
        }
    ],
    "declineNote": ""
} satisfies EntityConfig;
