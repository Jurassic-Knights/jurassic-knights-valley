# Jurassic Knights: Valley - Technical Guidelines

## 1. Naming Conventions

**Asset and entity ID patterns:** **[asset_id_conventions.md](asset_id_conventions.md)** is the single source of truth for all ID types, patterns, and rules; add new naming conventions there. This section is a brief summary.

### File Naming (summary)
- Use `snake_case` for asset files
- Suffixes: `_clean` (processed), `_original` (raw), `_approved_original` (reviewed), `_declined` (rejected)
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

All asset registries are **embedded** in `src/core/AssetLoader.ts` for performance and to avoid CORS issues when running locally.

| Asset Type | Registry Location | Format |
|------------|-------------------|--------|
| Images | `AssetLoader.registries.images` | Embedded JS object |
| Audio | `AssetLoader.registries.audio` | Embedded JS object |
| VFX | `AssetLoader.registries.vfx` | Embedded JS object |

> **Note**: External JSON registries (`assets/registry/*.json`) were removed. All registries are now embedded for faster loading and simpler deployment.

---

## 7. File Size Limits

**Max 300 lines per source file.** No source file may exceed 300 lines. Split by module and concern; the project is TypeScript/Vite only.

### Rules
- **Source files** (`.ts`, `.tsx`, `.css`) must not exceed 300 lines.
- **Data files** (`.json`) are exempt from this limit.
- **Generated files** (e.g. `asset_manifest.ts`) are exempt.
- **Vendor/library files** are exempt.

### Splitting Patterns

| Pattern | Use Case | Example |
|---------|----------|---------|
| **Species/Type** | Entity-specific logic | `SFX_Dino_Tyrannosaur.ts`, `SFX_Dino_Carnotaurus.ts` |
| **Concern** | Separate responsibilities | `EnemyMovement.ts`, `EnemyCombat.ts`, `EnemyRender.ts` |
| **Component** | CSS modules | `ui-hud-core.css`, `ui-hud-panels.css` |
| **Tier** | Grouped by progression | `Enemies_T1.ts`, `Enemies_T2.ts` |

Use TypeScript modules (`import`/`export`); Vite handles bundling and order.

---

## 8. Entity JSON Schema Reference

> **CRITICAL**: This is the definitive reference for entity JSON field names.
> AI agents MUST consult this before adding/modifying entity fields.

### Enemies (`src/entities/enemies/*.json`)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | ✅ | Unique ID (e.g., `enemy_dinosaur_t1_01`) |
| `name` | string | ✅ | Display name |
| `tier` | number | ✅ | 1-4, determines difficulty |
| `stats` | object | ✅ | `{health, damage, speed, defense}` |
| `combat` | object | ✅ | `{attackRange, attackRate, aggroRange}` |
| `spawning` | object | ✅ | `{biomes, groupSize, weight}` |
| `loot` | array | ✅ | Loot table (NOT `drops`) - see format below |
| `xpReward` | number | ✅ | XP granted on kill |
| `description` | string | ❌ | Flavor text |

### Loot Array Format (used by enemies, bosses, resources)

```json
"loot": [
    { "item": "food_t1_02", "chance": 0.6, "amount": [1, 2] },
    { "item": "bone_t1_01", "chance": 0.15, "amount": [1, 1] }
]
```

| Field | Description |
|-------|-------------|
| `item` | Item ID from `src/entities/items/` or `src/entities/resources/` |
| `chance` | Drop probability (0.0-1.0) |
| `amount` | `[min, max]` quantity range |

### Equipment (`src/entities/equipment/*.json`)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | ✅ | Unique ID (e.g., `weapon_t2_01`) |
| `name` | string | ✅ | Display name |
| `tier` | number | ✅ | 1-4, determines power level |
| `slot` | string | ✅ | `head`, `chest`, `legs`, `feet`, `hands`, `weapon`, `tool` |
| `stats` | object | ✅ | Stat bonuses `{damage, defense, speed, etc.}` |

### Bosses (`src/entities/bosses/*.json`)

Same as Enemies, plus:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `phases` | array | ❌ | Multi-phase boss behavior |
| `specialAttacks` | array | ❌ | Unique attack patterns |

### ⚠️ Common Mistakes

- Use `loot` field for entity drop tables
- Game code internally uses `lootTable` (assigned from JSON's `loot` field)
