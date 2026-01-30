/**
 * Entity: enemy_dinosaur_t1_01
 * Auto-generated. Edit in dashboard.
 */
import type { EnemyEntity } from '@app-types/entities';

export default {
    "id": "enemy_dinosaur_t1_01",
    "name": "Compsognathus",
    "sourceCategory": "enemies",
    "sourceFile": "dinosaur",
    "sprite": "dinosaur_t1_01",
    "status": "approved",
    "files": {
        "original": "assets/images/enemies/dinosaur_t1_01_original.png"
    },
    "biome": "grasslands",
    "stats": {
        "health": "25",
        "damage": 3,
        "speed": "100",
        "defense": 0
    },
    "combat": {
        "attackRange": 80,
        "attackRate": 2,
        "aggroRange": 180,
        "packAggro": true,
        "attackType": "ranged"
    },
    "sfx": {
        "spawn": "sfx_spawn_dinosaur_t1_01",
        "death": "sfx_death_dinosaur_t1_01",
        "hurt": "sfx_hurt_dinosaur_t1_01",
        "aggro": "sfx_aggro_dinosaur_t1_01"
    },
    "spawning": {
        "biomes": [
            "grasslands"
        ],
        "groupSize": [
            1,
            2
        ],
        "weight": 50,
        "respawnTime": 30
    },
    "loot": [
        {
            "item": "food_t1_02",
            "chance": 0.6,
            "amount": [
                1,
                1
            ]
        },
        {
            "item": "bone_t1_01",
            "chance": 0.15,
            "amount": [
                1,
                1
            ]
        }
    ],
    "xpReward": 8,
    "species": "Compsognathus",
    "weaponType": "claws",
    "display": {
        "sizeScale": 1,
        "width": 128,
        "height": 128
    },
    "declineNote": "",
    "tier": null
} satisfies EnemyEntity;
