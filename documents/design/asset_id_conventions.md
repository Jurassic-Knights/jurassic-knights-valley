# Asset ID Naming Conventions

**Single source of truth for asset and entity IDs.** Add any new naming conventions to this document.

---

## Universal principle: IDs are decoupled from display names

**CRITICAL:** All IDs follow a **stable, generic pattern** that never references display names. This allows renaming assets/items/entities at any time without breaking references.

**Pattern:** `{category}_{qualifier}_{index}` (or tier where applicable)

---

## ID patterns by type

| ID Type | Pattern | Good Example | Bad Example |
|---------|---------|--------------|-------------|
| UI | `ui_{type}_{index}` | `ui_btn_01` | `ui_btn_attack` |
| Enemies | `{type}_t{tier}_{index}` | `dinosaur_t2_01` | `velociraptor` |
| Herbivores | `herbivore_t{tier}_{index}` | `herbivore_t1_01` | `iguanodon` |
| Saurians | `saurian_t{tier}_{index}` | `saurian_t2_01` | `raptor_rider` |
| Humans | `human_t{tier}_{index}` | `human_t3_01` | `machine_gunner` |
| Resources | `{type}_t{tier}_{index}` | `mineral_t1_01` | `iron_ore` |
| Items | `{category}_t{tier}_{index}` | `metal_t2_01` | `iron_ingot` |
| Equipment | `{slot}_t{tier}_{index}` | `weapon_t3_01` | `cavalry_sabre` |
| NPCs | `npc_{role}_{index}` | `npc_merchant_01` | `quarry_trader` |
| Nodes | `node_{type}_{index}` | `node_tree_01` | `dead_tree` |
| Props | `prop_{type}_{index}` | `prop_crate_01` | `supply_box` |
| SFX | `sfx_{category}_{context}` or `sfx_{category}_{index}` | `sfx_combat_01`, `sfx_ui_click`, `sfx_hero_shoot` | `sfx_sword_swing` |
| BGM | `bgm_{context}_{index}` | `bgm_zone_01` | `bgm_main_theme` |

---

## Rules

- **IDs are permanent** — never change once assigned.
- **Display names are flexible** — change freely via `name` field in data.
- **Index is zero-padded** — 2 digits (01–99) where applicable.
- **Tier is single digit** — 1–4 where applicable.
- **Use snake_case** — never camelCase or spaces.
- **Prefix by category** — `ui_`, `npc_`, `dino_`/entity type, `drop_`, `item_`, `world_`, `sfx_`, `bgm_` so IDs are self-describing.

**Why generic IDs?**  
"Velociraptor" could become "Utahraptor" in a lore update; "Iron Ore" could become "Ferrite". `dinosaur_t2_01` and `mineral_t1_01` stay valid regardless of name changes.

---

## Asset file naming

- **Assets:** `snake_case` (e.g. `dino_run.png`).
- **Suffixes:** `_original` (raw), `_approved_original` (reviewed), `_clean` (processed, e.g. transparent bg).
- File paths can include display names; code references use the stable ID.

---

## Config and code references

- **Boss/entity config:** Use stable entity IDs in code; `species` or display keys in config are for lore/UI only.
- **Equipment drops (e.g. boss loot):** Use stable equipment IDs (e.g. `weapon_t3_01`) in data; display names live in the `name` field.

## Adding new conventions

When introducing a new category of asset or entity (e.g. new UI widget type, new creature class, new audio family):

1. Add a row to the **ID patterns by type** table with pattern and good/bad examples.
2. If new rules apply (e.g. new tier range, new prefix), add them under **Rules**.
3. Keep this document as the only place that defines ID patterns so rules and skills can point here.
