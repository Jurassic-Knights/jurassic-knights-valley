/**
 * Entity: boss_dinosaur_t4_01
 * Auto-generated from JSON.
 */

export default {
  "id": "boss_dinosaur_t4_01",
  "name": "Frost Raptor",
  "sourceCategory": "bosses",
  "sourceFile": "dinosaur",
  "sprite": "dinosaur_t4_01",
  "status": "pending",
  "files": {
    "original": "images/bosses/boss_dinosaur_t4_01_original.png"
  },
  "tier": 4,
  "biome": "badlands",
  "stats": {
    "health": 180,
    "damage": 25,
    "speed": 95,
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
    "spawn": "sfx_spawn_dinosaur_t4_01",
    "death": "sfx_death_dinosaur_t4_01",
    "hurt": "sfx_hurt_dinosaur_t4_01",
    "aggro": "sfx_aggro_dinosaur_t4_01"
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
      "item": "minerals_t1_01",
      "chance": 1.0,
      "amount": [
        3,
        5
      ]
    },
    {
      "item": "leather_t2_01",
      "chance": 1.0,
      "amount": [
        3,
        4
      ]
    },
    {
      "item": "falchion",
      "chance": 0.5,
      "amount": [
        1,
        1
      ]
    }
  ],
  "xpReward": 60,
  "isBoss": true,
  "sourceDescription": "Velociraptor, charred black and rust coloring, decorated bronze barding with gold trim, towering predator, scarred hide",
  "species": "Velociraptor",
  "description": "Frost Raptor earned its name through winter campaigns that left regiments frozen in their tents, silent kills discovered only when reinforcements arrived. This unprecedented Velociraptor has grown beyond any normal specimen's size, fed on rich military rations and the soldiers who carried them. Its intelligence seems almost human.\n\nOrnate steel plate barding covers its massive frame, the armor engraved with patterns that suggest cultural significance beyond simple military marking. Despite the badlands deployment, frost clings to its pale grey feathers - whether natural or affected, soldiers debate endlessly. Iron clasps secure armor that has deflected close-range fire.\n\nThose killing claws have learned to exploit gaps in plate armor, targeting joints and seams with surgical precision. The creature coordinates with lesser raptors through calls and signals that military analysts have failed to decode. Frost Raptor doesn't just lead a pack - it commands an army."
};
