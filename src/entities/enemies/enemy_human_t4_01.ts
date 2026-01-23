/**
 * Entity: enemy_human_t4_01
 * Auto-generated from JSON.
 */

export default {
  "id": "enemy_human_t4_01",
  "name": "Assault Trooper",
  "sourceCategory": "enemies",
  "sourceFile": "human",
  "sprite": "human_t4_01",
  "status": "pending",
  "tier": 4,
  "biome": "badlands",
  "stats": {
    "health": 140,
    "damage": 18,
    "speed": 70,
    "defense": 0
  },
  "combat": {
    "attackRange": 400,
    "attackRate": 1.5,
    "aggroRange": 250,
    "packAggro": false,
    "attackType": "ranged"
  },
  "sfx": {
    "spawn": "sfx_spawn_human_t4_01",
    "death": "sfx_death_human_t4_01",
    "hurt": "sfx_hurt_human_t4_01",
    "aggro": "sfx_aggro_human_t4_01"
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
      "item": "minerals_t4_01",
      "chance": 0.7,
      "amount": [
        1,
        2
      ]
    },
    {
      "item": "salvage_t4_01",
      "chance": 0.3,
      "amount": [
        1,
        1
      ]
    }
  ],
  "xpReward": 60,
  "gender": "male",
  "bodyType": "muscle",
  "sourceDescription": "male soldier, muscle build, charred brown uniform, steel breastplate, stahlhelm with face guard, rifle",
  "weaponType": "rifle",
  "role": "special",
  "description": "The Assault Trooper's gilded helmet rises to a ceremonial point, the iron mask beneath engraved with rank insignia reserved for elite specialists. A respirator system filters volcanic ash while allowing commanding voice projection. Whatever face lies beneath has seen the worst of the badlands and emerged victorious.\n\nOrnate commander armor covers this male soldier's muscular build - gilded iron plates with a charcoal grey tabard bearing unit honors. Blackened leather straps secure the overlapping plates, each buckle stamped with campaign medals. The cape that flows from his shoulders is singed at the edges from close encounters with volcanic vents.\n\nSteel-reinforced boots leave commanding impressions in ash and basite alike. A bolt-action rifle with custom engravings serves as primary weapon, its stock carved with personal kill tallies. This elite specialist leads from the front, armor designed to inspire as much as protect.",
  "files": {
    "original": "images/enemies/human_t4_01_original.png"
  },
  "species": "Colonel"
};
