/**
 * Entity: enemy_human_t1_01
 * Auto-generated from JSON.
 */

export default {
  "id": "enemy_human_t1_01",
  "name": "Conscript",
  "sourceCategory": "enemies",
  "sourceFile": "human",
  "sprite": "human_t1_01",
  "status": "pending",
  "files": {
    "original": "assets/images/enemies/human_t1_01_original.png"
  },
  "tier": 1,
  "biome": "grasslands",
  "stats": {
    "health": 35,
    "damage": 6,
    "speed": 70,
    "defense": 0
  },
  "combat": {
    "attackRange": 250,
    "attackRate": 1,
    "aggroRange": 200,
    "packAggro": true,
    "attackType": "ranged"
  },
  "sfx": {
    "spawn": "sfx_spawn_human_t1_01",
    "death": "sfx_death_human_t1_01",
    "hurt": "sfx_hurt_human_t1_01",
    "aggro": "sfx_aggro_human_t1_01"
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
      "item": "salvage_t1_01",
      "chance": 0.6,
      "amount": [
        1,
        1
      ]
    },
    {
      "item": "food_t1_03",
      "chance": 0.4,
      "amount": [
        1,
        1
      ]
    },
    {
      "item": "salvage_t1_02",
      "chance": 0.3,
      "amount": [
        1,
        2
      ]
    }
  ],
  "xpReward": 12,
  "species": "Conscript",
  "weaponType": "rifle",
  "role": "light"
};
