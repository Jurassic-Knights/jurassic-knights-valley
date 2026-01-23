/**
 * Entity: enemy_dinosaur_t2_05
 * Auto-generated from JSON.
 */

export default {
  "id": "enemy_dinosaur_t2_05",
  "name": "Oviraptor",
  "sourceCategory": "enemies",
  "sourceFile": "dinosaur",
  "sprite": "dinosaur_t2_05",
  "status": "pending",
  "files": {
    "original": "assets/images/enemies/dinosaur_t2_05_original.png"
  },
  "tier": 2,
  "biome": "grasslands",
  "stats": {
    "health": 40,
    "damage": 5,
    "speed": 110,
    "defense": 0
  },
  "combat": {
    "attackRange": 80,
    "attackRate": 1.5,
    "aggroRange": 150,
    "packAggro": true,
    "attackType": "melee"
  },
  "sfx": {
    "spawn": "sfx_spawn_dinosaur_t2_05",
    "death": "sfx_death_dinosaur_t2_05",
    "hurt": "sfx_hurt_dinosaur_t2_05",
    "aggro": "sfx_aggro_dinosaur_t2_05"
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
      "chance": 1.0,
      "amount": [
        1,
        1
      ]
    },
    {
      "item": "scraps_t1_02",
      "chance": 0.5,
      "amount": [
        1,
        2
      ]
    }
  ],
  "xpReward": 12,
  "species": "Oviraptor",
  "weaponType": "bite"
};
