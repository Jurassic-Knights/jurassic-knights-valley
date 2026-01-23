/**
 * Entity: boss_human_t1_02
 * Auto-generated from JSON.
 */

export default {
  "id": "boss_human_t1_02",
  "name": "Frontline Captain",
  "sourceCategory": "bosses",
  "sourceFile": "human",
  "sprite": "human_t1_02",
  "status": "pending",
  "tier": 1,
  "biome": "grasslands",
  "stats": {
    "health": 110,
    "damage": 12,
    "speed": 70,
    "defense": 0
  },
  "combat": {
    "attackRange": 400,
    "attackRate": 1.5,
    "aggroRange": 280,
    "packAggro": true,
    "attackType": "ranged"
  },
  "sfx": {
    "spawn": "sfx_spawn_human_t1_02",
    "death": "sfx_death_human_t1_02",
    "hurt": "sfx_hurt_human_t1_02",
    "aggro": "sfx_aggro_human_t1_02"
  },
  "spawning": {
    "biomes": [
      "grasslands"
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
      "item": "minerals_t1_01",
      "chance": 1.0,
      "amount": [
        2,
        4
      ]
    },
    {
      "item": "leather_t1_01",
      "chance": 0.8,
      "amount": [
        1,
        2
      ]
    }
  ],
  "xpReward": 30,
  "isBoss": true,
  "gender": "female",
  "bodyType": "muscle",
  "sourceDescription": "female commander, muscle build, tan field jacket, heavy pauldrons, barbuta helmet, pistol",
  "weaponType": "pistol",
  "role": "special",
  "description": "The Frontline Captain's helmet has been reinforced with additional iron plating, the face guard welded into an expressionless mask that reveals nothing. The additional armor weight speaks to this officer's preference for direct confrontation over strategic distance. Heat from the forge that modified this helmet left permanent scorch marks.\n\nFull plate armor covers a powerful frame beneath an olive drab tabard stained with the evidence of close combat. Iron plates overlap at shoulders and chest, secured by brown leather straps reinforced for the stresses of hand-to-hand fighting. The heavy-role designation shows in every pound of protection.\n\nIron-shod boots are designed for stability in the chaos of melee combat. A pistol provides ranged option, but the scratched and dented state of the armor plates tells the true story - this Captain prefers to meet enemies face to face, or rather mask to face.",
  "files": {
    "original": "images/bosses/boss_human_t1_02_original.png"
  },
  "declineNote": ""
};
