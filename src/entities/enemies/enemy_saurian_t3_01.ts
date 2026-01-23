/**
 * Entity: enemy_saurian_t3_01
 * Auto-generated from JSON.
 */

export default {
  "id": "enemy_saurian_t3_01",
  "name": "Allosaurus Gunner",
  "sourceCategory": "enemies",
  "sourceFile": "saurian",
  "sprite": "saurian_t3_01",
  "status": "pending",
  "files": {
    "original": "assets/images/enemies/saurian_t3_01_original.png"
  },
  "tier": 3,
  "biome": "desert",
  "stats": {
    "health": 120,
    "damage": 12,
    "speed": 70,
    "defense": 0
  },
  "combat": {
    "attackRange": 350,
    "attackRate": 2,
    "aggroRange": 300,
    "packAggro": false,
    "attackType": "ranged"
  },
  "sfx": {
    "spawn": "sfx_spawn_saurian_t3_01",
    "death": "sfx_death_saurian_t3_01",
    "hurt": "sfx_hurt_saurian_t3_01",
    "aggro": "sfx_aggro_saurian_t3_01"
  },
  "spawning": {
    "biomes": [
      "desert"
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
      "item": "salvage_t1_02",
      "chance": 0.8,
      "amount": [
        2,
        4
      ]
    },
    {
      "item": "mechanical_t1_01",
      "chance": 0.3,
      "amount": [
        1,
        1
      ]
    },
    {
      "item": "gewehr_98",
      "chance": 0.1,
      "amount": [
        1,
        1
      ]
    }
  ],
  "xpReward": 50,
  "species": "Allosaurus",
  "weaponType": "submachine_gun",
  "role": "heavy"
};
