/**
 * Entity: enemy_saurian_t3_02
 * Auto-generated from JSON.
 */

export default {
  "id": "enemy_saurian_t3_02",
  "name": "Stegosaurus Heavy",
  "sourceCategory": "enemies",
  "sourceFile": "saurian",
  "sprite": "saurian_t3_02",
  "status": "pending",
  "files": {
    "original": "assets/images/enemies/saurian_t3_02_original.png"
  },
  "tier": 3,
  "biome": "desert",
  "stats": {
    "health": 180,
    "damage": 20,
    "speed": 45,
    "defense": 0
  },
  "combat": {
    "attackRange": 120,
    "attackRate": 0.7,
    "aggroRange": 200,
    "packAggro": false,
    "attackType": "melee"
  },
  "sfx": {
    "spawn": "sfx_spawn_saurian_t3_02",
    "death": "sfx_death_saurian_t3_02",
    "hurt": "sfx_hurt_saurian_t3_02",
    "aggro": "sfx_aggro_saurian_t3_02"
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
      "item": "bone_t3_01",
      "chance": 0.7,
      "amount": [
        2,
        3
      ]
    },
    {
      "item": "salvage_t2_01",
      "chance": 0.5,
      "amount": [
        1,
        2
      ]
    }
  ],
  "xpReward": 55,
  "species": "Stegosaurus",
  "weaponType": "spear",
  "role": "heavy"
};
