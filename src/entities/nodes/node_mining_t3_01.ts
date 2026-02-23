/**
 * Entity: node_mining_t3_01
 * Auto-generated. Edit in dashboard.
 */
import type { EntityConfig } from '@app-types/core';

export default {
    "id": "node_mining_t3_01",
    "name": "Tar Pit",
    "sourceCategory": "nodes",
    "sourceFile": "nodes",
    "sprite": "node_mining_t3_01",
    "status": "declined",
    "files": {
        "original": "assets/images/nodes/node_mining_t3_01_original.png",
        "clean": "assets/images/nodes/node_mining_t3_01_clean.png",
        "consumed_original": "assets/images/nodes/node_mining_t3_01_consumed_original.png",
        "consumed_clean": "assets/images/nodes/node_mining_t3_01_consumed_clean.png"
    },
    "type": "ore",
    "biome": "badlands",
    "nodeSubtype": "mining",
    "tier": 3,
    "display": {
        "sizeScale": 1,
        "width": 64,
        "height": 64
    },
    "declineNote": ""
} satisfies EntityConfig;
