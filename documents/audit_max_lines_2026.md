# Audit: Max Lines of Code (300-Line Rule)

**Date:** 2026-02-11  
**Rule source:** `documents/design/technical_guidelines.md` §7 — **Max 300 lines per source file** for `.ts`, `.tsx`, `.css`.  
**Exempt:** Data (`.json`), generated files (e.g. `asset_manifest.ts`), vendor/library files.

---

## Refactor Progress (2026-02-11)

| File | Before | After | Approach |
|------|--------|-------|----------|
| `src/data/GameConstants.ts` | 723 | Split into `GameConstants/` (12 files, all &lt;150 lines) | Domain split: Grid, Combat, Equipment, Events, etc. |
| `src/entities/EntityLoader.ts` | 737 | 300 (+ EntityLoaderProcess, Broadcast, Lookup) | Extracted processEntity, handleEntityUpdate, lookup helpers |
| `src/ui/EquipmentUI.ts` | 800 | 222 (+ FilterConfig, Footer, ClickHandler) | Extracted filter hierarchy, footer swap/restore, click delegation |
| `src/core/AssetLoader.ts` | 432 | 296 (+ AssetLoaderPathPatterns) | Extracted ID_PATTERNS and constructPathFromId |
| `src/tools/map-editor/GroundSystem.ts` | 620 | 300 (+ Splat, Palette, Assets, TileTexture) | Extracted splat ops, palette resolution, asset loading, tile texture |
| `src/world/IslandManagerCore.ts` | 554 | 290 (+ Grid, Bridges, Walkable, Collision) | Extracted grid utils, bridge logic, walkable zones, collision building |
| `src/rendering/HeroRenderer.ts` | 548 | 164 (+ StatusBars, RangeCircles, Shadow, Weapon) | Extracted status bars, range circles, shadow, weapon drawing |
| `src/core/GameRenderer.ts` | 534 | 291 (+ WorldSize, Layers, Viewport) | Extracted world size, render layers, viewport logic |
| `src/tools/map-editor/MapEditorCore.ts` | 498 | 298 (+ UIOverlays, BrushCursor, InputHandlers, ToolUse, Registry, Mount, Update) | Extracted zoom/cursor UI, input handlers, tool execution, mount/unmount |
| `src/systems/CollisionSystem.ts` | 454 | 184 (+ Debug, Utils, SpatialHash, Collision) | Extracted debug rendering, getCollisionBounds, spatial hash, checkCollision/checkTriggers |
| `src/ui/InventoryUI.ts` | 527 | 285 (+ InventoryUIFooter) | Extracted footer swap/restore, footer active states |
| `src/vfx/MeleeTrailVFX.ts` | 483 | 94 (+ MeleeTrailConfig, MeleeTrailRenderers) | Extracted configs, style renderers |
| `src/vfx/ProjectileVFX.ts` | 462 | 228 (+ ProjectileVFXConfig, ProjectileMuzzleFlash, ProjectileWeaponType) | Extracted configs, muzzle flash, getWeaponType |
| `src/ui/TextureAligner.ts` | 437 | 299 (+ TextureAlignerTargets, TextureAlignerUI) | Extracted targets, UI template and bindings |
| `src/systems/EnemySystem.ts` | 301 | 292 | Condensed JSDoc, removed verbose logging |
| `src/systems/spawners/EnemySpawner.ts` | 303 | 297 | Condensed JSDoc |
| `src/gameplay/DroppedItem.ts` | 306 | 294 | Condensed JSDoc |
| `src/vfx/VFXController.ts` | 307 | 295 | Condensed JSDoc, removed comment block |
| `src/gameplay/EnemyBehavior.ts` | 417 | 277 (+ EnemyBehaviorPath, EnemyBehaviorUI) | Extracted path/movement, UI rendering |
| `src/entities/manifest.ts` | 535 | 13 (+ manifest_ground, _enemies, _nodes, _resources, _items, _equipment, _environment) | Split by category |
| `src/rendering/EnvironmentRenderer.ts` | 405 | ~226 (+ EnvironmentRendererLighting, EnvironmentRendererStorm) | Extracted lighting, storm |
| `src/rendering/ResourceRenderer.ts` | 405 | 268 (+ ResourceRendererDropped) | Extracted dropped item render |
| `src/gameplay/EnemyCore.ts` | 405 | 314 (+ EnemyCoreConfig) | Extracted config merge |
| `src/rendering/WorldRenderer.ts` | 385 | 140 (+ WorldRendererWater, WorldRendererIslands) | Extracted water, islands |
| `src/ui/MinimapSystem.ts` | 381 | ~235 (+ MinimapRenderer) | Extracted render logic |
| `src/data/VFX_Categories.ts` | 369 | Split into VFX_Categories/ (purchase, unlock, magnet, hero, dino, resource, projectiles) | Domain split |

---

## Summary

| Area      | Files over 300 lines | Worst offender          |
| --------- | -------------------- | ----------------------- |
| `src/`    | 40                   | EquipmentUI.ts (800)     |
| `tools/`  | 11                   | style.css (1141)        |
| **Total** | **51**               | — (2 resolved in src/)  |

The codebase has **53 source files** that exceed the 300-line limit. Below they are grouped by directory with line counts and suggested splitting approaches aligned to the technical guidelines.

---

## 1. `src/` — Game and core

### 1.1 Data / config (consider exemptions)

| File                         | Lines   | Note                                                                                                                                                                    |
| ---------------------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/data/GameConstants.ts`  | ~~723~~ DONE | Split into `src/data/GameConstants/` (Grid, Combat, Equipment, Events, etc. + index.ts). |
| `src/data/VFX_Categories.ts` | 369     | Data table; split by category or tier if possible, or document as data-only exemption.                                                                                  |

### 1.2 Core

| File                       | Lines   | Suggested split                                                                                                                                                                                        |
| -------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/core/AssetLoader.ts`  | 432     | Already flagged in audit_report_clean_code.md (140-line `_constructPathFromId`). Split: path construction → config/map or strategy; image/audio/vfx registry loading → separate modules or data files. |
| `src/core/Game.ts`         | 359     | Split by concern: bootstrap vs. loop vs. system wiring (e.g. `GameLoop.ts`, `GameBootstrap.ts`).                                                                                                       |
| `src/core/GameRenderer.ts` | ~~534~~ DONE | Split into GameRendererWorldSize, GameRendererLayers, GameRendererViewport. |

### 1.3 Entities (loaders / manifest)

| File                           | Lines   | Note                                                                                                                                   |
| ------------------------------ | ------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `src/entities/EntityLoader.ts` | ~~737~~ DONE | Split: EntityLoaderProcess.ts, EntityLoaderBroadcast.ts, EntityLoaderLookup.ts. Main file now 300 lines. |
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
| `src/rendering/HeroRenderer.ts`        | ~~548~~ DONE | Split into HeroRendererStatusBars, RangeCircles, Shadow, Weapon. |
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
| `src/world/IslandManagerCore.ts` | ~~554~~ DONE | Split into IslandManagerGrid, Bridges, Walkable, Collision. |
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
| `src/tools/map-editor/GroundSystem.ts`     | ~~620~~ DONE | Split into GroundSystemSplat, GroundSystemPalette, GroundSystemAssets, GroundSystemTileTexture. |
| `src/tools/map-editor/MapEditorCore.ts`    | ~530    | Procedural renderer extracted; mode/tools/save/load remain.                                     |
| `src/tools/map-editor/mapgen4/map.ts`      | 416     | Mapgen4 library code: consider splitting by algorithm step or leave as vendor if from upstream. |
| `src/tools/map-editor/ChunkManager.ts`     | ~502    | Serialization extracted to ChunkManagerSerialization.                                          |
| `src/tools/map-editor/Mapgen4Generator.ts` | ~~322~~ DONE | Split into Mapgen4RegionUtils, ZoneMapping, RiverUtils, SplineUtils, PreviewRenderer, Param. |
| `src/tools/map-editor/ZoneSystem.ts`       | ~~306~~ DONE | Splat regen extracted to ZoneSystemSplatRegen.                                                 |

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

## 6. Inconsistencies & Bad Practices Found During Refactor

| Item | Location | Note |
|------|----------|------|
| **Duplicate `return true`** | EntityLoader.ts (orig) | Dead code: two consecutive `return true` in load(). Fixed. |
| **Duplicate `npcs` in categories** | EntityLoader.ts (orig) | `loadFromManifest` had `'npcs'` twice in categories array. Fixed. |
| **Duplicate JSDoc blocks** | EntityLoader.ts (orig) | getWeaponSubtype, getToolType, loadCategory, processEntity had duplicate comment blocks. Removed. |
| **getConfig() confusion** | Codebase | Two different `getConfig()` functions: `@data/GameConstants` (HMR tunables) vs `@data/GameConfig` (GameConfigType). ResourceSpawner, PropSpawner, WorldRenderer, HomeBase, BaseAI use GameConfig; others use GameConstants. Consider unifying or documenting clearly. |
| **EntityLoader defaults** | EntityLoader.ts | `this.defaults` is a getter that rebuilds object each access. Consider caching if hot path. |
| **Registry.services direct access** | EntityLoader.ts | HMR uses `Registry.services.set()` to bypass `register()` (which throws on overwrite). Works but couples to internal API. |

---

## 7. Reference: technical_guidelines.md §7

- **Max 300 lines** per source file (`.ts`, `.tsx`, `.css`).
- **Exempt:** `.json`, generated files (e.g. `asset_manifest.ts`), vendor/library.
- **Splitting patterns:** Species/Type, Concern, Component (CSS), Tier; use TS modules and Vite bundling.
