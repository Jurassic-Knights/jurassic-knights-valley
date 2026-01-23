/**
 * Entity: node_harvesting_t3_03
 * Auto-generated from JSON.
 */

export default {
    "id":  "node_harvesting_t3_03",
    "name":  "Desert Remains",
    "sourceCategory":  "nodes",
    "sourceFile":  "nodes",
    "sprite":  "node_harvesting_t3_03",
    "status":  "pending",
    "files":  {
                  "original":  "assets/images/nodes/node_harvesting_t3_03_original.png"
              },
    "type":  "ore",
    "biome":  "desert",
    "sfx":  {
                "hit":  "sfx_node_hit_stone",
                "break":  "sfx_node_break_stone",
                "respawn":  "sfx_node_respawn"
            },
    "drops":  [
                  {
                      "amount":  [
                                     1,
                                     3
                                 ],
                      "chance":  1,
                      "item":  "minerals_t3_01"
                  }
              ],
    "nodeSubtype":  "harvesting",
    "tier":  3
};
