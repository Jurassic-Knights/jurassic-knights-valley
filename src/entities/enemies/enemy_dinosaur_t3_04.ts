/**
 * Entity: enemy_dinosaur_t3_04
 * Auto-generated from JSON.
 */

export default {
  "id": "enemy_dinosaur_t3_04",
  "name": "Bull Triceratops",
  "sourceCategory": "enemies",
  "sourceFile": "dinosaur",
  "sprite": "dinosaur_t3_04",
  "status": "approved",
  "files": {
    "original": "assets/images/enemies/dinosaur_t3_04_original.png"
  },
  "tier": 3,
  "biome": "desert",
  "stats": {
    "health": 250,
    "damage": 30,
    "speed": 55,
    "defense": 0
  },
  "combat": {
    "attackRange": 140,
    "attackRate": 0.6,
    "aggroRange": 220,
    "packAggro": false,
    "attackType": "melee"
  },
  "sfx": {
    "spawn": "sfx_spawn_dinosaur_t3_04",
    "death": "sfx_death_dinosaur_t3_04",
    "hurt": "sfx_hurt_dinosaur_t3_04",
    "aggro": "sfx_aggro_dinosaur_t3_04"
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
      "item": "food_t1_01",
      "chance": 0.6,
      "amount": [
        1,
        2
      ]
    },
    {
      "item": "bone_t2_01",
      "chance": 0.3,
      "amount": [
        1,
        1
      ]
    }
  ],
  "xpReward": 60,
  "species": "Triceratops",
  "weaponType": "claws"
};
