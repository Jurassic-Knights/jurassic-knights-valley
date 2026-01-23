/**
 * Entity: boss_human_t3_02
 * Auto-generated from JSON.
 */

export default {
  "id": "boss_human_t3_02",
  "name": "Sand Viper",
  "sourceCategory": "bosses",
  "sourceFile": "human",
  "sprite": "human_t3_02",
  "status": "pending",
  "tier": 3,
  "biome": "desert",
  "stats": {
    "health": 140,
    "damage": 20,
    "speed": 85,
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
    "spawn": "sfx_spawn_human_t3_02",
    "death": "sfx_death_human_t3_02",
    "hurt": "sfx_hurt_human_t3_02",
    "aggro": "sfx_aggro_human_t3_02"
  },
  "spawning": {
    "biomes": [
      "desert"
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
      "item": "minerals_t3_01",
      "chance": 1.0,
      "amount": [
        2,
        4
      ]
    },
    {
      "item": "leather_t3_01",
      "chance": 0.8,
      "amount": [
        1,
        2
      ]
    }
  ],
  "xpReward": 90,
  "isBoss": true,
  "gender": "female",
  "bodyType": "skinny",
  "sourceDescription": "female commander, skinny build, bronze field jacket, polished steel plate, hooded mask with goggles, machine gun",
  "weaponType": "machine_gun",
  "role": "special",
  "description": "The Sand Viper's helmet is configured for maximum anonymity - a cloth-wrapped exterior over welded face guard, revealing nothing of the identity within. This assassin-turned-officer earned command through demonstrated lethality against impossible targets. The mask's narrow eye slits give nothing away.\n\nCommander armor designed for mobility rather than protection covers a lean frame - sand-tan plates strategically positioned over a lightweight coat. Bronze clasps secure the minimal armor precisely, each piece placed to maximize the machine gun's effectiveness. The special-role designation marks unconventional warfare specialty.\n\nDesert-adapted boots leave whisper-soft tracks in sand, a lifetime of stalking habits unchanged by rank. That machine gun provides overwhelming firepower for a single operator, the weapon responsible for ambushes that devastated enemy command structures. The Sand Viper strikes and vanishes.",
  "files": {
    "original": "images/bosses/boss_human_t3_02_original.png"
  },
  "declineNote": ""
};
