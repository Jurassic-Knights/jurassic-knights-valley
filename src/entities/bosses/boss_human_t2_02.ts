/**
 * Entity: boss_human_t2_02
 * Auto-generated from JSON.
 */

export default {
  "id": "boss_human_t2_02",
  "name": "Frost Sergeant",
  "sourceCategory": "bosses",
  "sourceFile": "human",
  "sprite": "human_t2_02",
  "status": "pending",
  "tier": 2,
  "biome": "tundra",
  "stats": {
    "health": 130,
    "damage": 14,
    "speed": 75,
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
    "spawn": "sfx_spawn_human_t2_02",
    "death": "sfx_death_human_t2_02",
    "hurt": "sfx_hurt_human_t2_02",
    "aggro": "sfx_aggro_human_t2_02"
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
  "gender": "female",
  "bodyType": "medium",
  "sourceDescription": "female commander, medium build, grey fur-trimmed coat, iron mask with rivets, rifle",
  "weaponType": "rifle",
  "role": "special",
  "description": "The Frost Sergeant's helmet shows the dents and scratches of frontline leadership, the welded face guard frost-rimed from eternal tundra exposure. Those unseen eyes have led squads through conditions that killed the unprepared, earning command through frozen hell. The metal mask reflects the cold within.\n\nCommander armor modified for tundra conditions covers a sturdy frame - silver-trimmed plates over white-grey fur-lined padding. Pale leather straps secure the layered protection against a body kept warm through constant movement. A decorated cape bears kill markers rather than campaign ribbons.\n\nHeavy insulated boots are designed for leading charges across frozen ground. A mechanical rifle hangs from a specially designed harness, the weapon ready for immediate deployment. This Frost Sergeant earned rank through demonstrated lethality, not political connection.",
  "files": {
    "original": "images/bosses/boss_human_t2_02_original.png"
  }
};
