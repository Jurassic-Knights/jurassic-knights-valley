/**
 * Entity: boss_saurian_t2_01
 * Auto-generated from JSON.
 */

export default {
  "id": "boss_saurian_t2_01",
  "name": "Frost Raider",
  "sourceCategory": "bosses",
  "sourceFile": "saurian",
  "sprite": "saurian_t2_01",
  "status": "pending",
  "tier": 2,
  "biome": "tundra",
  "stats": {
    "health": 130,
    "damage": 14,
    "speed": 90,
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
    "spawn": "sfx_spawn_saurian_t2_01",
    "death": "sfx_death_saurian_t2_01",
    "hurt": "sfx_hurt_saurian_t2_01",
    "aggro": "sfx_aggro_saurian_t2_01"
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
  "species": "Utahraptor",
  "sourceDescription": "anthropomorphic Utahraptor, white fur-lined uniform, riveted steel plate, combat helmet, spear",
  "weaponType": "spear",
  "role": "medium",
  "description": "The Frost Raider's Utahraptor frame is massive even for the species, the creature having fed well on military supplies and their defenders across tundra campaigns. Intelligent eyes gleam from beneath a fur-lined hood custom-fitted for the elongated skull. The feathered crest is streaked with grey and white winter camouflage.\n\nCommander armor covers a powerfully muscled torso - silver-trimmed plates over white-grey fur that blends with tundra conditions. Pale leather straps secure the armor against movement that would dislodge lesser fittings. The ornate nature of the armor announces special-role status to friend and enemy alike.\n\nThe killing claws on those massive feet have shattered ice and soldiers with equal ease. A reinforced steel pike grants reach against enemies who try to stay beyond those natural weapons. This Frost Raider leads ambushes from blizzard cover, appearing and vanishing like winter itself.",
  "files": {
    "original": "images/bosses/boss_saurian_t2_01_original.png"
  }
};
