# Project Audit Report: Section B — Codebase & Practices

**Date:** 2026-02-09  
**Scope:** Architecture adherence (B2 summary), performance (B3), magic numbers/config (B4), entity definitions vs README (B5), duplicate logic (B6), error handling (B7)  
**Note:** B1 (TypeScript configuration) and B2 (full architecture audit) are assigned to separate agents. This report includes a B2 summary and the full B2 audit plan reference.

---

## Executive Summary

Section B covers codebase quality and practices. **B2** is scoped as a separate full audit (see `docs/audit_b2_architecture_full_audit_plan.md`); below is a high-level summary. **B3** (performance): PathfindingSystem reuses A* structures; CollisionSystem and PathfindingSystem have targeted allocations worth reducing. **B4** (magic numbers): Numerous literals in systems and gameplay should be moved to GameConstants or config. **B5** (README vs entities): README claims "JSON entity definitions"; entities are TypeScript modules—draft README update included. **B6** (duplication): Main game is Canvas 2D; Pixi is confined to map-editor tooling; one duplicate constant (cell size 128) noted. **B7** (error handling): main.ts has user-visible error UI; Game.init() does not return false when a system fails to initialize.

---

## B2. Architecture Adherence (ECS / EventBus / Data-Driven) — Summary

**Full audit:** A dedicated agent task is defined in **`docs/audit_b2_architecture_full_audit_plan.md`**. That plan covers:

- **EventBus vs direct calls:** Full inventory of `getSystem()` / `Registry.get()` usage and recommendations to replace with events where appropriate.
- **Data-driven design:** System- and spawner-level scan for magic numbers and mapping to config.
- **Components data-only:** Per-component method review and classification (data vs logic).

**High-level observations (from this pass):**

- **EventBus** is used in many places (EventBus.emit/on across systems, UI, gameplay, components). Direct system access is also common: e.g. `EnemySystem`, `HeroSystem` call `getSystem('CollisionSystem')`; spawners call `getSystem('IslandManager')`; `HeroCombatService` calls `getSystem('VFXController')`; `SpawnManager` uses `Registry.get('GameRenderer')`; `ProgressionSystem` uses `Registry.get('VFXController')`, `Registry.get('AudioManager')`; UI uses `Registry.get('UIManager')`; `QuestManager` calls `UIManager.hideQuestPanel()` and `UIManager.updateQuest()`. These are candidates for event-driven refactors (see B2 plan).
- **Data-driven:** Many systems already use `GameConstants` or `getConfig()`; spawners and gameplay modules still contain numeric literals that could be centralized (see B4).
- **Components:** `HealthComponent` and `CombatComponent` contain logic (e.g. `takeDamage`, `die`, `attack()`, `update()`, EventBus.emit). Per coding-guide, components should be data-only; the B2 full audit will classify all component methods and recommend moving logic to systems.

**Recommendation:** Execute the B2 full audit per `docs/audit_b2_architecture_full_audit_plan.md` and merge findings into the main audit or a dedicated B2 report.

---

## B3. Performance and Object Pooling

### B3.1 PathfindingSystem

**Finding:** A* working sets are reused; path result and open-set nodes still allocate.

**Details:**

- `_closedSet`, `_cameFrom`, `_gScore`, `_fScore` are instance fields cleared and reused in `findPath()` (lines 97–102). `_openSet` is an array reused with `openSet.length = 0`. No per-call allocation of these structures.
- In `reconstructPath()`, the returned path is a new array each time (expected for API). Inside the A* loop, `openSet.push({ ...neighbor, key: neighborKey })` allocates a new object per neighbor considered.

**Recommendation:**

- Keep current design for path result array.
- Consider a small object pool for open-set nodes (e.g. reuse `PathNode`-like objects) if pathfinding is invoked very frequently; otherwise treat as low priority.

**Severity:** Low

---

### B3.2 CollisionSystem

**Finding:** Allocations in the update/trigger path: spatial hash buckets and per-entity trigger set.

**Details:**

- In `update()`, `this.spatialHash.clear()` is called each frame; then for each entity, `updateSpatialHash()` does `this.spatialHash.set(key, [])` when a bucket is missing, and pushes the entity. So each frame allocates new arrays for every occupied cell. Bucket count is bounded by entity spread and cell size.
- In `checkTriggers()`, `const currentOverlaps = new Set<string>()` is created per entity that has collision (line 284). When a new trigger overlap is first recorded, `this.activeCollisions.set(entity.id, new Set())` allocates a new Set (line 320).

**Recommendation:**

- **Spatial hash:** Reuse bucket arrays: e.g. maintain a pool of arrays, or clear and reuse arrays from the previous frame instead of creating new ones each frame.
- **Trigger sets:** Reuse a single Set per entity (e.g. clear at the start of `checkTriggers()` for that entity) or pool Set instances.

**Severity:** Medium (hot path; entity count scales impact).

---

### B3.3 Other systems

**Finding:** BossSystem, CollisionSystem, PathfindingSystem use instance-level `Map`/`Set`/array fields. No `new Map()`/`new Set()`/`new Array()` found inside `update()`/`tick()`/`render()` in `src/gameplay/`.

**Recommendation:** No change required for BossSystem/PathfindingSystem instance maps; focus optimization on CollisionSystem as above.

---

### B3.4 Spatial partitioning

**Finding:** CollisionSystem uses a spatial hash (cell size 128). Pathfinding uses the IslandManager grid. No O(n²) entity-vs-entity proximity loops were identified in the scanned code.

**Severity:** N/A (positive finding).

---

## B4. Magic Numbers and Config

**Finding:** Many numeric (and a few string) literals in `src/systems/` and `src/gameplay/` represent tunable values and should live in GameConstants or config.

**High-level observations:**

- **Systems:** BossSystem (e.g. 1000 ms delay, 5500/3000 offsets, 1000 for respawn display), EnemySystem (150 patrol radius, 300 aggro, 10 distance threshold, speed factors), CollisionSystem (128 cell size, 1000 for movement, 0.05 debug draw, 20 debug vector scale, rgba literals), DamageSystem (20 y-offset, 10 damage threshold, 10 xp fallback), ResourceSpawner (15, 70, 140, 10, 900, 50, 25, 100, 248–250, 25, 300, 500), PropSpawner (100, 50, 15, 120, 160), EnemySpawner (200, 0.15, 0.25, 0.35, 50, 100, 20, 300), DropSpawner (40, 40, 150, 100), VFXTriggerService (80, 3000, 150), TimeSystem (0.22, 0.77, 0.05, 1000), WeatherSystem (5000).
- **Gameplay:** Boss, Dinosaur, Merchant, Resource, Hero, IslandUpgrades, EnemyBehavior, EnemyCore (patrol/leash/aggro/attack ranges, frame intervals, 50/100/200/300/500, etc.), CraftingManager (1000 gold, 1000 ms), QuestManager (2000), ProgressionSystem (100, 1.5, 1000), EnemyRender (200, 50), DroppedItem (100, 500).

**Recommendation:**

- Add or reuse keys in `GameConstants` / `getConfig()` for:
  - Collision: cell size (already `GameConstants.Grid.CELL_SIZE`; CollisionSystem uses literal 128 — see B6).
  - Spawners: padding, spacing, radii, counts, timeouts, drop distances/chances.
  - Combat/AI: patrol radius, aggro range, leash, attack range, frame intervals, wander timers.
  - UI/VFX: y-offsets, lifetimes, durations.
- Replace literals with `GameConstants.*` or `getConfig().*` in the listed files. Prioritize values that affect balance or are repeated across files.

**Severity:** Medium (maintainability and single source of truth); Low per occurrence.

---

## B5. Entity Definitions and README

**Finding:** README states "JSON entity definitions" and "~650 entities" under `src/entities/`. Entities are implemented as TypeScript modules (e.g. `src/entities/hero/`, `src/entities/ground/`, etc.), not raw JSON files.

**Recommendation:** Clarify README so new contributors and agents do not expect JSON-only definitions.

**Draft README update (Key Directories table and Adding New Entity runbook):**

- In the **Key Directories** table, change the `src/entities/` row from:
  - `src/entities/ | JSON entity definitions (~650 entities)`
  - to: `src/entities/ | Data-driven entity definitions (TypeScript modules, ~650 entities)`

- In **Adding a New Entity**, change:
  - "1. Add JSON definition to `src/entities/[category]/`"
  - to: "1. Add entity definition (TypeScript module or JSON as applicable) under `src/entities/[category]/`"

- Optionally add one sentence in Overview or Architecture: "Entity definitions are TypeScript modules (and related data) under `src/entities/`; see runbook for adding new entities."

**Severity:** Low

---

## B6. Duplicate or Redundant Logic

### B6.1 Rendering: Canvas 2D vs Pixi.js

**Finding:** No conflicting or duplicated rendering backends in the main game. Canvas 2D is used for the main game (GameRenderer, WorldRenderer, entities, VFX, UI canvas). Pixi.js is used only in the map editor (`src/tools/map-editor/`: ChunkManager, MapEditorCore, GroundSystem, ZoneSystem, ObjectSystem).

**Recommendation:** Document this split in README (as in Section A) so the stack is clear. No code deduplication required.

**Severity:** N/A (informational).

---

### B6.2 Duplicate constants

**Finding:** CollisionSystem uses `private cellSize: number = 128` (line 15). `GameConstants.Grid.CELL_SIZE` is 128. The same value is duplicated; if grid cell size ever changes, CollisionSystem could get out of sync.

**Recommendation:** In CollisionSystem, set `cellSize` from config, e.g. `GameConstants.Grid.CELL_SIZE` or `getConfig().Grid.CELL_SIZE`, and remove the literal 128.

**Severity:** Low

---

## B7. Error Handling and Boundaries

### B7.1 main.ts

**Finding:** Entry point has try/catch, logs the error, and shows a user-visible error screen (innerHTML with message and stack trace) when init or start fails. No uncaught rejection handler for the async IIFE.

**Recommendation:** Consider `main().catch((err) => { ... })` so that if `GameInstance.init()` or `start()` throws after the initial try block or from a microtask, it is still logged and shown. Optional: add a simple `window.onerror` / `window.onunhandledrejection` for last-resort logging.

**Severity:** Low

---

### B7.2 Game.ts init

**Finding:** If a system’s `init()` throws, the catch block (lines 140–144) logs and updates debug status but does not set a failure flag or return false. The loop continues, and `init()` eventually returns `true`. So a critical system init failure does not prevent the game from “succeeding” and starting.

**Recommendation:** Decide which systems are critical. On init failure of a critical system, set a flag and return `false` from `init()` so that main.ts can show the error screen and not call `start()`. Optionally, allow config to mark systems as optional so only critical ones cause init to fail.

**Severity:** Medium

---

## Summary Table

| Section | Finding | Severity | Location |
|--------|---------|----------|----------|
| B2 | Full architecture audit delegated; direct system calls and component logic present | — | See `docs/audit_b2_architecture_full_audit_plan.md` |
| B3 | PathfindingSystem: open-set node allocation in A* loop | Low | PathfindingSystem.ts |
| B3 | CollisionSystem: new arrays per bucket per frame; new Set per entity in checkTriggers | Medium | CollisionSystem.ts |
| B4 | Magic numbers in systems and gameplay; move to GameConstants/config | Medium | systems/*, gameplay/* |
| B5 | README says "JSON entity definitions"; entities are TS modules | Low | README.md |
| B6 | Canvas 2D vs Pixi split clear; no duplication | N/A | — |
| B6 | cellSize 128 duplicated in CollisionSystem | Low | CollisionSystem.ts |
| B7 | main.ts: no .catch on main() or unhandled-rejection | Low | main.ts |
| B7 | Game.init() returns true even when a system init throws | Medium | Game.ts |

---

**End of Section B.** No code or config changes were made in this phase; audit only.
