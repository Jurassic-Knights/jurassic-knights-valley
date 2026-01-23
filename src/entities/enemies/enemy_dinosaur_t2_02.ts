/**
 * Entity: enemy_dinosaur_t2_02
 * Auto-generated from JSON.
 */

export default {
  "id": "enemy_dinosaur_t2_02",
  "name": "Stalker",
  "sourceCategory": "enemies",
  "sourceFile": "dinosaur",
  "sprite": "dinosaur_t2_02",
  "status": "pending",
  "tier": 2,
  "biome": "tundra",
  "stats": {
    "health": 60,
    "damage": 8,
    "speed": 90,
    "defense": 0
  },
  "combat": {
    "attackRange": 100,
    "attackRate": 1.5,
    "aggroRange": 250,
    "packAggro": true,
    "attackType": "melee"
  },
  "sfx": {
    "spawn": "sfx_spawn_dinosaur_t2_02",
    "death": "sfx_death_dinosaur_t2_02",
    "hurt": "sfx_hurt_dinosaur_t2_02",
    "aggro": "sfx_aggro_dinosaur_t2_02"
  },
  "spawning": {
    "biomes": [
      "tundra"
    ],
    "groupSize": [
      2,
      4
    ],
    "weight": 50,
    "respawnTime": 30
  },
  "loot": [
    {
      "item": "minerals_t2_01",
      "chance": 0.7,
      "amount": [
        1,
        2
      ]
    },
    {
      "item": "salvage_t2_01",
      "chance": 0.3,
      "amount": [
        1,
        1
      ]
    }
  ],
  "xpReward": 30,
  "species": "Baryonyx",
  "sourceDescription": "Baryonyx, white and grey hide, bronze barding with leather straps, crocodilian snout with exposed fangs",
  "description": "Stalker earned its name through whispered stories of soldiers who vanished from their posts without a sound. The Baryonyx's elongated crocodilian snout is filled with conical teeth designed for gripping rather than tearing. Its eyes hold the patient gaze of an ambush predator accustomed to waiting hours for the perfect strike.\n\nBronze armor plates cover the beast's back and flanks, silver clasps securing the barding against its grey-white hide. A pale leather muzzle keeps its jaws closed until handlers release it for combat. The creature's clawed forearms are unusually large and powerful, capable of swiping through tent canvas or flesh with equal ease.\n\nIt moves with eerie silence for a creature its size, each footfall placed with predatory precision. The heavy tail drags low, steadying its movements through frozen marshlands where it prefers to hunt. Ice and snow cling to its hide as it emerges from ambush positions, a living nightmare from the tundra mist.",
  "files": {
    "original": "images/enemies/dinosaur_t2_02_original.png"
  },
  "weaponType": "bite"
};
