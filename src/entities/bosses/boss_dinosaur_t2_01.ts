/**
 * Entity: boss_dinosaur_t2_01
 * Auto-generated from JSON.
 */

export default {
  "id": "boss_dinosaur_t2_01",
  "name": "Territorial Alpha",
  "sourceCategory": "bosses",
  "sourceFile": "dinosaur",
  "sprite": "dinosaur_t2_01",
  "status": "pending",
  "tier": 2,
  "biome": "tundra",
  "stats": {
    "health": 120,
    "damage": 15,
    "speed": 85,
    "defense": 0
  },
  "combat": {
    "attackRange": 100,
    "attackRate": 1.5,
    "aggroRange": 280,
    "packAggro": true,
    "attackType": "melee"
  },
  "sfx": {
    "spawn": "sfx_spawn_dinosaur_t2_01",
    "death": "sfx_death_dinosaur_t2_01",
    "hurt": "sfx_hurt_dinosaur_t2_01",
    "aggro": "sfx_aggro_dinosaur_t2_01"
  },
  "spawning": {
    "biomes": [
      "tundra"
    ],
    "groupSize": [
      1,
      1
    ],
    "weight": 25,
    "respawnTime": 60
  },
  "loot": [
    {
      "item": "minerals_t2_01",
      "chance": 1.0,
      "amount": [
        2,
        4
      ]
    },
    {
      "item": "leather_t2_01",
      "chance": 0.8,
      "amount": [
        1,
        2
      ]
    }
  ],
  "xpReward": 60,
  "isBoss": true,
  "species": "Carnotaurus",
  "sourceDescription": "Carnotaurus, white and grey hide with fur trim, reinforced steel barding with rank badges, twin horns, dominant build",
  "description": "The Territorial Alpha has claimed miles of frozen tundra as its personal hunting ground. This massive Carnotaurus has grown fat on military supply convoys and their defenders, learning that human settlements mean easy prey. Those horned brows lower over eyes that radiate predatory confidence born from years of unchallenged dominance.\n\nBronze-plated barding covers its muscular frame, the armor appearing to have been scavenged from defeated military expeditions and fitted by some unknown process. White-grey scales show through gaps in the armor, camouflage developed for ambush strikes from snowdrifts. Frost crystals cling to the metal plates, adding to its fearsome appearance.\n\nThose powerful legs have charged through blizzards to catch fleeing prey, each three-toed foot spreading wide on ice and snow. The short arms are vestigial but the tail provides devastating counterbalance for the ramming attacks this creature favors. The Territorial Alpha has never lost a confrontation in its domain.",
  "files": {
    "original": "images/bosses/boss_dinosaur_t2_01_original.png"
  }
};
