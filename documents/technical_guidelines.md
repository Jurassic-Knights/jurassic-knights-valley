# Jurassic Knights: Valley - Technical Guidelines

## 1. Naming Conventions

### ⚠️ UNIVERSAL PRINCIPLE: IDs are Decoupled from Display Names

> **CRITICAL**: All IDs follow a **stable, generic pattern** that never references display names.
> This allows renaming assets/items/entities at any time without breaking references.

**Pattern:** `{category}_{qualifier}_{index}`

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
| Audio | `{type}_{category}_{index}` | `sfx_combat_01` | `sfx_sword_swing` |

**Rules:**
- **IDs are permanent** - never change once assigned
- **Display names are flexible** - change freely via `name` field
- **Index is zero-padded** - 2 digits (01-99)
- **Tier is single digit** - 1-4 where applicable
- **Use snake_case** - never camelCase or spaces

**Why?**
- "Velociraptor" could become "Utahraptor" in a lore update
- "Iron Ore" could become "Ferrite" for thematic reasons
- `dinosaur_t2_01` stays valid regardless of name changes

### File Naming
- Use `snake_case`
- Suffixes: `_clean` (processed), `_original` (raw), `_approved` (reviewed), `_declined` (rejected)
- Files can include display names since filenames are easier to update than code references

---

## 2. Asset Categories (tools/ folder structure)

| Category | Path | Contains |
|----------|------|----------|
| `enemies` | `tools/enemies/` | dinosaur.json, herbivore.json, saurian.json, human.json |
| `items` | `tools/items/` | bone.json, leather.json, metal.json, wood.json, mechanical.json |
| `resources` | `tools/resources/` | food.json, minerals.json, salvage.json, scraps.json |
| `equipment` | `tools/equipment/` | weapon.json, chest.json, head.json, legs.json, etc. |
| `nodes` | `tools/nodes/` | nodes.json (harvestable world objects) |
| `npcs` | `tools/npcs/` | merchants.json |
| `props` | `tools/props/` | flora.json (world objects) |
| `environment` | `tools/environment/` | backgrounds.json, buildings.json, flora.json |
| `ui` | `tools/ui/` | icons.json |
| `loot` | `tools/loot/` | Loot table definitions (enemies_*.json, equipment_*.json) |

---

## 3. sourceDescription Format

The `sourceDescription` field contains **ONLY unique, contextual details** for image generation.

### Should Include:
- Physical traits (body shape, size, features)
- Coloring (hide/skin/fur color, patterns)
- Species details (horns, plates, frills)
- Equipment/gear (armor pieces, weapons)
- Biome adaptations (thick fur, desert skin)

### Should NOT Include:
- Template boilerplate (stoneshard style, high fidelity pixel art)
- Style keywords (isolated on white background, no text)
- Poses (neutral pose is in template)
- Scene elements (see forbidden words below)

### Forbidden Scene-Implying Words:
- emplacement, defensive position, fortification, turret
- trench, bunker, sandbags, barricade, platform
- battlefield, environment, background, ground
- explosion, smoke, fire, debris
- camp, outpost, deployment, formation

---

## 4. Grid System

The game uses a 128px grid system for entity placement and level design.

### Constants (`GameConstants.Grid`)
| Constant | Value | Description |
|----------|-------|-------------|
| `CELL_SIZE` | 128px | Main gameplay grid unit |
| `SUB_TILE_SIZE` | 32px | Visual detail (4×4 per cell) |
| `ISLAND_CELLS` | 8 | Cells per island (1024÷128) |

### Entity Grid Sizes (`EntityConfig.*.gridSize`)
| Entity Type | Grid Size | Pixels |
|-------------|-----------|--------|
| Hero | 1.5 | 192px |
| Velociraptor | 1.5 | 192px |
| T-Rex | 2.5 | 320px |
| Triceratops | 2.0 | 256px |
| Resources | 1.0 | 128px |
| Dropped Items | 0.75 | 96px |
| Merchants | 1.5 | 192px |

### Grid Utilities (`IslandManager`)
- `worldToGrid(x, y)` → `{gx, gy}` - Convert world to grid coords
- `gridToWorld(gx, gy)` → `{x, y}` - Convert grid to world center
- `snapToGrid(x, y)` → `{x, y}` - Snap position to nearest grid center

### Debug Overlay
Toggle via "Toggle Grid" button in the debug bar. Shows X/Y labels in each 128px cell.

---

## 5. Text Constraints
- **Buttons**: 2-3 words.
- **Tooltips**: 1 sentence.
- **Lore**: 1-2 paragraphs.

---

## 6. Registry Systems

All asset registries are **embedded** in `src/core/AssetLoader.js` for performance and to avoid CORS issues when running locally.

| Asset Type | Registry Location | Format |
|------------|-------------------|--------|
| Images | `AssetLoader.registries.images` | Embedded JS object |
| Audio | `AssetLoader.registries.audio` | Embedded JS object |
| VFX | `AssetLoader.registries.vfx` | Embedded JS object |

> **Note**: External JSON registries (`assets/registry/*.json`) were removed. All registries are now embedded for faster loading and simpler deployment.
