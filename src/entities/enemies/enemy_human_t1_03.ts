/**
 * Entity: enemy_human_t1_03
 * Auto-generated from JSON.
 */

export default {
  "id": "enemy_human_t1_03",
  "name": "Trench Knight",
  "sourceCategory": "enemies",
  "sourceFile": "human",
  "sprite": "human_t1_03",
  "status": "pending",
  "files": {
    "original": "assets/images/enemies/human_t1_03_original.png"
  },
  "tier": 1,
  "biome": "grasslands",
  "stats": {
    "health": 60,
    "damage": 12,
    "speed": 65,
    "defense": 0
  },
  "combat": {
    "attackRange": 100,
    "attackRate": 0.9,
    "aggroRange": 180,
    "packAggro": true,
    "attackType": "melee"
  },
  "sfx": {
    "spawn": "sfx_spawn_human_t1_03",
    "death": "sfx_death_human_t1_03",
    "hurt": "sfx_hurt_human_t1_03",
    "aggro": "sfx_aggro_human_t1_03"
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
        2
      ]
    },
    {
      "item": "leather_t1_01",
      "chance": 0.4,
      "amount": [
        1,
        1
      ]
    }
  ],
  "xpReward": 15,
  "species": "Militia",
  "weaponType": "sword",
  "role": "light"
};
