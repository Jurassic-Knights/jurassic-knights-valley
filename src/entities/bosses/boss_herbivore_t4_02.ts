/**
 * Entity: boss_herbivore_t4_02
 * Auto-generated from JSON.
 */

export default {
  "id": "boss_herbivore_t4_02",
  "name": "Argentinosaurus",
  "sourceCategory": "bosses",
  "sourceFile": "herbivore",
  "sprite": "herbivore_t4_02",
  "status": "pending",
  "files": {
    "original": "images/bosses/boss_herbivore_t4_02_original.png"
  },
  "tier": 4,
  "biome": "badlands",
  "stats": {
    "health": 600,
    "damage": 50,
    "speed": 20,
    "defense": 0
  },
  "combat": {
    "attackRange": 280,
    "attackRate": 0.3,
    "aggroRange": 350,
    "packAggro": false,
    "attackType": "melee"
  },
  "sfx": {
    "spawn": "sfx_spawn_herbivore_t4_02",
    "death": "sfx_death_herbivore_t4_02",
    "hurt": "sfx_hurt_herbivore_t4_02",
    "aggro": "sfx_aggro_herbivore_t4_02"
  },
  "spawning": {
    "biomes": [
      "badlands"
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
      "item": "food_t2_02",
      "chance": 1.0,
      "amount": [
        5,
        8
      ]
    },
    {
      "item": "leather_t4_01",
      "chance": 0.25,
      "amount": [
        1,
        1
      ]
    }
  ],
  "xpReward": 200,
  "isBoss": true,
  "sourceDescription": "Argentinosaurus, dark grey and black hide, massive towering build",
  "species": "Argentinosaurus",
  "description": "The Argentinosaurus dominates the skyline even among badlands volcanos, a creature of such scale that its movements alter local weather patterns. Its small head rises and falls with each thunderous breath, each exhalation a cloud visible for miles. The ancient eyes have witnessed more than human history records.\n\nPure wild nature defines this creature - no armor, no barding, just millions of years of evolution reaching peak form. Deep grey hide is mottled with volcanic ash that has become part of its permanent coloring. Black patches trace ancestral patterns unique to this individual.\n\nFour legs like living pillars support incalculable tonnage, each footfall registering on seismic equipment miles distant. The massive tail sweeps slowly but with unstoppable force, clearing everything in its arc. To encounter this creature is to face a natural disaster with eyes."
};
