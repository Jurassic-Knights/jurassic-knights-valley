/**
 * Entity: enemy_dinosaur_t3_03
 * Auto-generated from JSON.
 */

export default {
  "id": "enemy_dinosaur_t3_03",
  "name": "Ankylosaurus",
  "sourceCategory": "enemies",
  "sourceFile": "dinosaur",
  "sprite": "dinosaur_t3_03",
  "status": "approved",
  "files": {
    "original": "assets/images/enemies/dinosaur_t3_03_original.png"
  },
  "tier": 3,
  "biome": "desert",
  "stats": {
    "health": 200,
    "damage": 20,
    "speed": 35,
    "defense": 0
  },
  "combat": {
    "attackRange": 130,
    "attackRate": 0.5,
    "aggroRange": 180,
    "packAggro": false,
    "attackType": "melee"
  },
  "sfx": {
    "spawn": "sfx_spawn_dinosaur_t3_03",
    "death": "sfx_death_dinosaur_t3_03",
    "hurt": "sfx_hurt_dinosaur_t3_03",
    "aggro": "sfx_aggro_dinosaur_t3_03"
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
      "item": "food_t3_01",
      "chance": 1.0,
      "amount": [
        1,
        2
      ]
    },
    {
      "item": "bone_t2_01",
      "chance": 0.4,
      "amount": [
        1,
        1
      ]
    }
  ],
  "xpReward": 45,
  "species": "Ankylosaurus",
  "weaponType": "tail"
};
