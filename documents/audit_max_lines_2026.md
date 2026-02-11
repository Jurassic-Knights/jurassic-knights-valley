# Audit: Max Lines of Code (300-Line Rule)

**Date:** 2026-02-11  
**Rule source:** `documents/design/technical_guidelines.md` §7 — **Max 300 lines per source file** for `.ts`, `.tsx`, `.css`.  
**Exempt:** Data (`.json`), generated files (e.g. `asset_manifest.ts`), vendor/library files.

---

## Summary

| Area      | Files over 300 lines | Worst offender         |
| --------- | -------------------- | ---------------------- |
| `src/`    | 42                   | GameConstants.ts (723) |
| `tools/`  | 11                   | style.css (1141)       |
| **Total** | **53**               | —                      |

The codebase has **53 source files** that exceed the 300-line limit. Below they are grouped by directory with line counts and suggested splitting approaches aligned to the technical guidelines.

---

## 1. `src/` — Game and core

### 1.1 Data / config (consider exemptions)

| File                         | Lines   | Note                                                                                                                                                                    |
| ---------------------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/data/GameConstants.ts`  | **723** | Config/constants; split by domain (Grid, Combat, Spawn, UI, etc.) into `GameConstants.Grid.ts`, `GameConstants.Combat.ts`, etc., and re-export from `GameConstants.ts`. |
| `src/data/VFX_Categories.ts` | 369     | Data table; split by category or tier if possible, or document as data-only exemption.                                                                                  |

### 1.2 Core

| File                       | Lines   | Suggested split                                                                                                                                                                                        |
| -------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/core/AssetLoader.ts`  | 432     | Already flagged in audit_report_clean_code.md (140-line `_constructPathFromId`). Split: path construction → config/map or strategy; image/audio/vfx registry loading → separate modules or data files. |
| `src/core/Game.ts`         | 359     | Split by concern: bootstrap vs. loop vs. system wiring (e.g. `GameLoop.ts`, `GameBootstrap.ts`).                                                                                                       |
| `src/core/GameRenderer.ts` | **534** | Split by render pass or layer: e.g. `GameRendererCore.ts` + `GameRendererLayers.ts` or by system (world, entities, UI overlay).                                                                        |

### 1.3 Entities (loaders / manifest)

| File                           | Lines   | Note                                                                                                                                   |
| ------------------------------ | ------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `src/entities/EntityLoader.ts` | **737** | If generated, exempt; otherwise split by entity kind (hero, enemy, resource, prop, etc.) with a thin `EntityLoader.ts` that delegates. |
| `src/entities/manifest.ts`     | 535     | Exempt if this file is generated; otherwise split by category (e.g. manifest_equipment.ts, manifest_enemies.ts) and re-export.         |

### 1.4 Audio (registry-style)

| File                          | Lines | Suggested split                                                                                          |
| ----------------------------- | ----- | -------------------------------------------------------------------------------------------------------- |
| `src/audio/SFX_Herbivores.ts` | 368   | Per guidelines: split by species/type (e.g. SFX_Herbivores_Triceratops.ts, SFX_Herbivores_Hadrosaur.ts). |
| `src/audio/SFX_Shared.ts`     | 357   | Split by category (UI, environment, combat, etc.).                                                       |

### 1.5 Gameplay

| File                            | Lines | Suggested split                                                                                     |
| ------------------------------- | ----- | --------------------------------------------------------------------------------------------------- |
| `src/gameplay/DroppedItem.ts`   | 306   | Extract render vs. logic or item-type handlers.                                                     |
| `src/gameplay/EnemyBehavior.ts` | 417   | Split by concern: e.g. `EnemyBehaviorPatrol.ts`, `EnemyBehaviorCombat.ts`, `EnemyBehaviorAggro.ts`. |
| `src/gameplay/EnemyCore.ts`     | 405   | Same pattern: movement, combat, state.                                                              |
| `src/gameplay/Resource.ts`      | 359   | Harvest logic vs. state vs. render.                                                                 |

### 1.6 Rendering

| File                                   | Lines   | Suggested split                                                                                       |
| -------------------------------------- | ------- | ----------------------------------------------------------------------------------------------------- |
| `src/rendering/EnvironmentRenderer.ts` | 405     | By layer or type: terrain, props, buildings, etc.                                                     |
| `src/rendering/HeroRenderer.ts`        | **548** | Split by concern: body, equipment, VFX, shadows (e.g. HeroRendererBody.ts, HeroRendererEquipment.ts). |
| `src/rendering/ResourceRenderer.ts`    | 405     | By resource type or draw pass.                                                                        |
| `src/rendering/WorldRenderer.ts`       | 385     | Orchestration vs. layer renderers (delegate to smaller modules).                                      |

### 1.7 Systems

| File                                   | Lines | Suggested split                                                                 |
| -------------------------------------- | ----- | ------------------------------------------------------------------------------- |
| `src/systems/CollisionSystem.ts`       | 454   | Collision detection vs. resolution vs. trigger handling (or grid vs. entities). |
| `src/systems/EnemySystem.ts`           | 301   | Thin coordinator; move logic to EnemyCore/EnemyBehavior or spawners.            |
| `src/systems/HeroCombatService.ts`     | 321   | Melee vs. ranged vs. damage application.                                        |
| `src/systems/SpawnManager.ts`          | 358   | By spawn type or by zone.                                                       |
| `src/systems/spawners/EnemySpawner.ts` | 303   | Spawn logic vs. config vs. pooling.                                             |

### 1.8 UI

| File                            | Lines   | Suggested split                                                                                  |
| ------------------------------- | ------- | ------------------------------------------------------------------------------------------------ |
| `src/ui/EquipmentUI.ts`         | **800** | Largest UI file. Split by component/panel: slots, stats, tooltips, drag-drop, or by screen area. |
| `src/ui/InventoryUI.ts`         | 527     | List vs. detail vs. actions; or by tab/panel.                                                    |
| `src/ui/TextureAligner.ts`      | 437     | By asset type or alignment algorithm.                                                            |
| `src/ui/MinimapSystem.ts`       | 381     | Data vs. render vs. interaction.                                                                 |
| `src/ui/UIManager.ts`           | 353     | Screen registry vs. transitions vs. overlay.                                                     |
| `src/ui/WeaponWheel.ts`         | 357     | Layout vs. input vs. selection logic.                                                            |
| `src/ui/EquipmentUIRenderer.ts` | 362     | Draw passes or slot types.                                                                       |
| `src/ui/DebugUI.ts`             | 316     | By panel or debug domain (physics, AI, render).                                                  |

### 1.9 VFX

| File                       | Lines | Suggested split                                         |
| -------------------------- | ----- | ------------------------------------------------------- |
| `src/vfx/MeleeTrailVFX.ts` | 483   | Trail logic vs. segment rendering vs. config.           |
| `src/vfx/ProjectileVFX.ts` | 462   | By projectile type or by stage (spawn, travel, impact). |
| `src/vfx/VFXController.ts` | 307   | By effect category or by lifecycle.                     |

### 1.10 World

| File                             | Lines   | Suggested split                                                 |
| -------------------------------- | ------- | --------------------------------------------------------------- |
| `src/world/IslandManagerCore.ts` | **554** | Island state vs. grid vs. unlock/progression vs. serialization. |
| `src/world/BiomeManager.ts`      | 329     | Biome resolution vs. blending vs. config.                       |
| `src/world/HomeBase.ts`          | 316     | Structure vs. upgrades vs. UI.                                  |

### 1.11 Types

| File                  | Lines | Note                                                                                                                            |
| --------------------- | ----- | ------------------------------------------------------------------------------------------------------------------------------- |
| `src/types/core.d.ts` | 370   | Declaration file; consider splitting by domain (entities.d.ts, rendering.d.ts) or exempting .d.ts in guidelines if appropriate. |

---

## 2. `src/tools/` — Map editor and mapgen4

| File                                       | Lines   | Suggested split                                                                                 |
| ------------------------------------------ | ------- | ----------------------------------------------------------------------------------------------- |
| `src/tools/map-editor/GroundSystem.ts`     | **620** | Chunk/height vs. blending vs. paint tools; align with ChunkManager/ZoneSystem.                  |
| `src/tools/map-editor/MapEditorCore.ts`    | 498     | Mode handling vs. tools vs. save/load vs. canvas.                                               |
| `src/tools/map-editor/mapgen4/map.ts`      | 416     | Mapgen4 library code: consider splitting by algorithm step or leave as vendor if from upstream. |
| `src/tools/map-editor/ChunkManager.ts`     | 328     | Chunk lifecycle vs. serialization vs. LOD.                                                      |
| `src/tools/map-editor/Mapgen4Generator.ts` | 322     | Integration vs. conversion vs. config.                                                          |
| `src/tools/map-editor/ZoneSystem.ts`       | 306     | Zone logic vs. palette vs. rendering.                                                           |

---

## 3. `tools/dashboard/` — Dashboard app

| File                                          | Lines    | Suggested split                                                                                          |
| --------------------------------------------- | -------- | -------------------------------------------------------------------------------------------------------- |
| `tools/dashboard/css/style.css`               | **1141** | Per guidelines: split by component (e.g. base.css, layout.css, map-editor.css, panels.css, buttons.css). |
| `tools/dashboard/src/api-server.ts`           | 799      | Routes vs. middleware vs. handlers; split by resource (maps, assets, config).                            |
| `tools/dashboard/src/categoryRenderer.ts`     | 714      | By category or by view (list vs. detail vs. form).                                                       |
| `tools/dashboard/src/api.ts`                  | 615      | By domain (maps, assets, config) or by HTTP method group.                                                |
| `tools/dashboard/src/mapEditorView.ts`        | 571      | Canvas vs. controls vs. state sync.                                                                      |
| `tools/dashboard/src/configRenderer.ts`       | 554      | By config section or by form group.                                                                      |
| `tools/dashboard/src/ActionDelegator.ts`      | 449      | By action category or by target (map, asset, config).                                                    |
| `tools/dashboard/src/InfoBuilder.ts`          | 347      | By info section or output format.                                                                        |
| `tools/dashboard/src/state.ts`                | 394      | By slice (editor state, selection state, UI state).                                                      |
| `tools/dashboard/src/categoryRenderer (1).ts` | 340      | Appears to be a duplicate; remove or consolidate.                                                        |

---

## 4. Recommendations

1. **Enforce the rule in CI**  
   Add an ESLint rule (e.g. `max-lines-per-function` and a custom script or `max-lines` for files) or a small script in `npm run lint` that fails when any `.ts`/`.tsx`/`.css` (excluding exempt list) exceeds 300 lines.

2. **Exemptions**
    - Confirm whether `src/entities/manifest.ts` and `src/entities/EntityLoader.ts` are generated; if so, add them to the exempt list in technical_guidelines.md.
    - Consider explicitly exempting `.d.ts` files or imposing a higher limit (e.g. 500) if splitting is impractical.

3. **Prioritize by impact**
    - **High:** `EquipmentUI.ts` (800), `GameConstants.ts` (723), `EntityLoader.ts` (737), `GameRenderer.ts` (534), `HeroRenderer.ts` (548), `IslandManagerCore.ts` (554), and `tools/dashboard/css/style.css` (1141).
    - **Medium:** Core and systems (AssetLoader, Game, CollisionSystem, spawners, EnemyBehavior, EnemyCore).
    - **Low:** Files just over 300 (e.g. DroppedItem 306, EnemySpawner 303, ZoneSystem 306, VFXController 307).

4. **Refactoring skill**  
   The refactoring skill (`.cursor/skills/refactoring/SKILL.md`) also calls out **long methods (>20 lines)**. When splitting files, extract long methods into smaller functions to stay under that guideline.

5. **Duplicate file**  
   Remove or merge `tools/dashboard/src/categoryRenderer (1).ts` and use a single `categoryRenderer.ts`.

---

## 5. Reference: technical_guidelines.md §7

- **Max 300 lines** per source file (`.ts`, `.tsx`, `.css`).
- **Exempt:** `.json`, generated files (e.g. `asset_manifest.ts`), vendor/library.
- **Splitting patterns:** Species/Type, Concern, Component (CSS), Tier; use TS modules and Vite bundling.
