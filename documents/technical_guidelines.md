# Jurassic Knights: Valley - Technical Guidelines

## 1. Naming Conventions

### Asset IDs (Snake Case)
| Category | Prefix | Example |
|----------|--------|---------|
| UI Elements | `ui_` | `ui_btn_primary`, `ui_icon_shop` |
| Dinosaurs | `dino_` | `dino_velociraptor_base`, `dino_trex_attack` |
| NPCs | `npc_` | `npc_merchant_home`, `npc_merchant_cross` |
| Characters | `char_` | `char_merchant_quarry`, `char_hero` |
| World Assets | `world_` | `world_bridge_planks`, `world_hero` |
| Drops | `drop_` | `drop_wood`, `drop_iron_ore` |
| Items | `item_` | `item_scrap_plate`, `item_iron_ingot` |
| Resources | (no prefix) | `wood`, `iron_ore`, `fossil_fuel` |
| Props | `prop_` | `prop_dead_stump` |
| Effects | `fx_` | `fx_spark_gold` |
| Sound Effects | `sfx_` | `sfx_click` |
| Music | `bgm_` | `bgm_main_theme` |

### File Naming
- Use `snake_case`.
- Match Asset ID where possible.
- Suffixes: `_clean` (processed), `_original` (raw), `_approved` (reviewed).

### Entity Logic IDs
- Permanent, `snake_case`, descriptive.
- Example: `velociraptor`, `tyrannosaurus`, `knight_captain`.

---

## 2. Grid System

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

## 3. Text Constraints
- **Buttons**: 2-3 words.
- **Tooltips**: 1 sentence.
- **Lore**: 1-2 paragraphs.

---

## 4. Registry Systems

All asset registries are **embedded** in `src/core/AssetLoader.js` for performance and to avoid CORS issues when running locally.

| Asset Type | Registry Location | Format |
|------------|-------------------|--------|
| Images | `AssetLoader.registries.images` | Embedded JS object |
| Audio | `AssetLoader.registries.audio` | Embedded JS object |
| VFX | `AssetLoader.registries.vfx` | Embedded JS object |

> **Note**: External JSON registries (`assets/registry/*.json`) were removed. All registries are now embedded for faster loading and simpler deployment.
