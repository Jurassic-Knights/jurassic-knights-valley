/**
 * Entity: boss_human_t1_01
 * Auto-generated from JSON.
 */

export default {
  "id": "boss_human_t1_01",
  "name": "Squad Leader",
  "sourceCategory": "bosses",
  "sourceFile": "human",
  "sprite": "human_t1_01",
  "status": "pending",
  "tier": 1,
  "biome": "grasslands",
  "stats": {
    "health": 100,
    "damage": 10,
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
    "spawn": "sfx_spawn_human_t1_01",
    "death": "sfx_death_human_t1_01",
    "hurt": "sfx_hurt_human_t1_01",
    "aggro": "sfx_aggro_human_t1_01"
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
  "gender": "male",
  "bodyType": "medium",
  "sourceDescription": "male commander, medium build, brown uniform, officer greatcoat, sallet helm, pistol",
  "weaponType": "pistol",
  "role": "special",
  "description": "The Squad Leader's stahlhelm rises above a face completely obscured by a welded combat mask, identity erased in service to command. Those unseen eyes have watched recruits become veterans under fire, learning who survives and who doesn't through harsh experience. The mask's speech grille echoes orders with metallic authority.\n\nOrnate commander armor distinguishes this special-role officer from the grunts - gilded brass epaulettes over an olive drab wool coat, the fabric immaculate despite trench conditions. A decorated tabard bears unit insignia and campaign honors. Tool belts and equipment pouches mark preparation for any tactical situation.\n\nPolished boots splash through the mud that cakes everything and everyone else. A service revolver gleams from a leather holster, its ivory grip carved with rank markings. This officer leads from the front, earning loyalty through shared danger rather than mere authority.",
  "files": {
    "original": "images/bosses/boss_human_t1_01_original.png"
  }
};
