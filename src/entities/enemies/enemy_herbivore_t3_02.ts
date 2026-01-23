/**
 * Entity: enemy_herbivore_t3_02
 * Auto-generated from JSON.
 */

export default {
  "id": "enemy_herbivore_t3_02",
  "name": "Brachiosaurus",
  "sourceCategory": "enemies",
  "sourceFile": "herbivore",
  "sprite": "herbivore_t3_02",
  "status": "pending",
  "files": {
    "original": "assets/images/enemies/herbivore_t3_02_original.png"
  },
  "tier": 3,
  "biome": "desert",
  "stats": {
    "health": 300,
    "damage": 20,
    "speed": 30,
    "defense": 0
  },
  "combat": {
    "attackRange": 180,
    "attackRate": 0.3,
    "aggroRange": 150,
    "packAggro": false,
    "attackType": "melee"
  },
  "sfx": {
    "spawn": "sfx_spawn_herbivore_t3_02",
    "death": "sfx_death_herbivore_t3_02",
    "hurt": "sfx_hurt_herbivore_t3_02",
    "aggro": "sfx_aggro_herbivore_t3_02"
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
      "item": "food_t2_01",
      "chance": 1.0,
      "amount": [
        3,
        5
      ]
    },
    {
      "item": "leather_t2_01",
      "chance": 0.6,
      "amount": [
        1,
        2
      ]
    }
  ],
  "xpReward": 70,
  "species": "Brachiosaurus",
  "weaponType": "tail"
};
