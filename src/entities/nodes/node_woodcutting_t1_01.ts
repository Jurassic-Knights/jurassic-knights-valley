/**
 * Entity: node_woodcutting_t1_01
 * Auto-generated. Edit in dashboard.
 */
import type { NodeEntity } from '@app-types/entities';

export default {
    "id": "node_woodcutting_t1_01",
    "name": "Dead Tree",
    "sourceCategory": "nodes",
    "sourceFile": "nodes",
    "sprite": "node_woodcutting_t1_01",
    "status": "approved",
    "files": {
        "original": "assets/images/nodes/node_woodcutting_t1_01_original.png"
    },
    "type": "ore",
    "biome": "grasslands",
    "nodeSubtype": "woodcutting",
    "tier": 1,
    "display": {
        "sizeScale": 4,
        "width": 64,
        "height": 64
    },
    "drops": [
        {
            "item": "scraps_t1_01",
            "chance": 1,
            "amount": [1, 3]
        }
    ]
} satisfies NodeEntity;
