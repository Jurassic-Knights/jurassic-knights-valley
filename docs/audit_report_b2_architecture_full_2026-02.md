# Section B2: Architecture Adherence — Full Audit Report

**Date:** 2026-02-09  
**Scope:** ECS / EventBus / data-driven adherence across systems and components.  
**Reference:** `docs/audit_b2_architecture_full_audit_plan.md`, `.cursor/skills/coding-guide/SKILL.md`, `.cursor/rules/00-core.mdc`.

---

## 1. Summary

| Category | Count | Critical | High | Medium | Low |
|----------|--------|----------|------|--------|-----|
| **2.1 EventBus vs direct calls** | 18 call sites | 0 | 2 | 8 | 8 |
| **2.2 Data-driven (magic numbers)** | 25+ findings | 0 | 1 | 6 | 18+ |
| **2.3 Component logic** | 6 components, 25+ methods | 0 | 3 | 4 | 2 |

**High-level observations:**

- **EventBus / coupling:** Several systems call other systems directly in per-frame or per-action paths (e.g. `EnemySystem` → `CollisionSystem.move`, `HeroSystem` → `CollisionSystem.move`, `HeroCombatService` → `VFXController`). Spawners and renderers repeatedly call `getSystem('IslandManager')` or `Registry.get()` in hot paths instead of cached refs or events. Bootstrap/init use of `Registry.get()` or `game.getSystem()` is acceptable and already used in many places; the main debt is **per-action/per-frame** cross-system calls.
- **Data-driven:** Many timings, radii, and counts are already in `GameConstants` or `getConfig()`. Remaining issues: literals in spawners (padding 100, gap 50, spacing 50/100, attempts 300/500), in `CollisionSystem` (cellSize 128), in `PathfindingSystem` (gridSize 64), and in UI/VFX code (50, 150, 2000). `GameConstants.Grid.CELL_SIZE` (128) and `AI` / `Spawning` keys exist but are not always used.
- **Components:** Several components hold logic beyond pure data: `HealthComponent` (takeDamage/heal/die/respawn + EventBus), `CombatComponent` (update cooldown, attack + EventBus), `InventoryComponent` (add/remove + EventBus), `AIComponent` (canAggro, shouldLeash, inAttackRange, randomizeWander). `StatsComponent` is mostly derived getters from config/state (borderline; some `getConfig()` calls could live in a system). Recommendation: move damage/heal/death and combat cooldown/attack logic into systems; keep components as data + minimal accessors.

---

## 2. Findings

### 2.1 EventBus vs Direct System Calls

**Rule:** Systems must not call other systems’ methods directly; use `EventBus.emit` / `EventBus.on`.

| Location | Caller → Callee | Method / usage | Init vs hot path | Suggested event or note | Severity |
|----------|------------------|----------------|-------------------|-------------------------|----------|
| `EnemySystem.ts:210` | EnemySystem → CollisionSystem | `collisionSystem.move(enemy, dx, dy)` | Per-frame (applyMovement) | Emit `ENTITY_MOVE_REQUEST` { entity, dx, dy }; CollisionSystem subscribes and applies | **High** |
| `HeroSystem.ts:206` | HeroSystem → CollisionSystem | `(collisionSystem as CollisionSystem).move(hero, dx, dy)` | Per-frame (hero movement) | Same: `HERO_MOVE_REQUEST` or `ENTITY_MOVE_REQUEST` | **High** |
| `HeroCombatService.ts:337` | HeroCombatService → VFXController | `vfxController.playForeground(...)` | Per attack (muzzle flash) | Emit `VFX_PLAY_FOREGROUND` { x, y, template }; VFXController subscribes | **Medium** |
| `PropSpawner.ts:37,63,92,141` | PropSpawner → IslandManager | `getSystem('IslandManager')` then getIslandByGrid, waterGap, etc. | Per spawn / placement | Cache ref in SpawnManager init and pass to spawner; or emit spawn request with bounds from IslandManager | **Medium** |
| `ResourceSpawner.ts:39,102,144,191` | ResourceSpawner → IslandManager | same | Per spawn | Same as PropSpawner | **Medium** |
| `EnemySpawner.ts:45` | EnemySpawner → IslandManager | same | Per spawn | Same | **Medium** |
| `WorldRenderer.ts:136,180-181` | WorldRenderer → AssetLoader, IslandManager | getSystem (fallback when cache missing) | Per draw (drawWater, drawWorld) | OK if refs cached at init; ensure `_assetLoader` / `_islandManager` always set at init to avoid per-frame getSystem | **Low** |
| `GridRenderer.ts:23-24` | GridRenderer → IslandManager, AssetLoader | getSystem | Per render | Same: cache at init | **Low** |
| `HomeOutpostRenderer.ts:26` | HomeOutpostRenderer → IslandManager | getSystem | Per draw | Same | **Low** |
| `DebugOverlays.ts:27` | DebugOverlays → IslandManager | getSystem | Debug render | OK init-only or cache | **Low** |
| `GameRenderer.ts:501` | GameRenderer → CollisionSystem | `collisionSystem.renderDebug()` | Debug only | OK; could cache ref at init | **Low** |
| `EnvironmentRenderer.ts:172,237` | EnvironmentRenderer → GameRenderer | getSystem('GameRenderer') | Per render | Cache at init | **Low** |
| `ProgressionSystem.ts:116-117,132` | ProgressionSystem → VFXController, VFXConfig, AudioManager | Registry.get then playForeground / playSFX | On level-up (one-shot) | Emit `HERO_LEVEL_UP` (already exists); VFX/Audio subscribe and react. Avoid Registry.get in handler. | **Medium** |
| `EnemyBehavior.ts:443` | EnemyBehavior → ProgressBarRenderer | Registry.get('ProgressBarRenderer') | When drawing health bar | Cache ref at behavior init or inject; or event-driven “request health bar draw” | **Medium** |
| `Hero.ts:285` | Hero → HeroSystem | Registry.get('HeroSystem'); heroSystem.restoreStamina(this, …) | On rest (restStamina) | Emit `REQUEST_STAMINA_RESTORE` { hero, amount }; HeroSystem subscribes | **Medium** |
| `EquipmentUI.ts:149,344` | EquipmentUI → UIManager | Registry.get('UIManager'); registerFullscreenUI / closeOtherFullscreenUIs | On open/close UI | Acceptable for UI coordination; prefer event REQUEST_FULLSCREEN_UI / CLOSE_OTHER_FULLSCREEN_UIS | **Low** |
| `SpawnManager.ts:116,124,140,166,222` | SpawnManager → IslandManager, GameRenderer | Registry.get for spawn position, setHero, getIslandByGrid | Spawn / init | Cache IslandManager and GameRenderer refs at SpawnManager init; avoid repeated Registry.get in spawn loop | **Medium** |
| `CollisionSystem.ts:40` | CollisionSystem → EntityManager | Registry.get('EntityManager') | Init only (initial sync) | OK if init-only | **OK** |
| `HeroSystem.ts:52-54` | HeroSystem → IslandManager, HomeBase, GameRenderer | Registry.get at constructor | Init only | OK | **OK** |
| `HeroVisualsSystem.ts:44` | HeroVisualsSystem → VFXController | Registry.get at init | Init only | OK | **OK** |
| `GameRenderer.ts:121-152` | GameRenderer → PlatformManager, WorldRenderer, … | getSystem at init | Init only | OK | **OK** |
| `DamageSystem.ts:220` | DamageSystem | Registry.get('DamageSystem') for HMR/destroy | Module load | OK | **OK** |
| `Entity.ts:85` | Entity → EntityLoader | Registry.get('EntityLoader') for getConfig | When resolving config | OK for data lookup | **OK** |
| `EntityLoader.ts:637` | EntityLoader | Registry.get('EntityLoader') for HMR | Module load | OK | **OK** |
| `Game.ts:57,109,170` | Game | Registry.get / getSystem for system resolution | Bootstrap | OK | **OK** |

---

### 2.2 Data-Driven Design (Magic Numbers / Config)

**Rule:** Tunable values must live in `GameConstants`, `getConfig()`, or entity/config modules.

| File | Line(s) | Literal / meaning | In config? | Recommendation | Severity |
|------|---------|-------------------|------------|-----------------|----------|
| `CollisionSystem.ts` | 15 | `cellSize: number = 128` | Yes: `GameConstants.Grid.CELL_SIZE` (128) | Use `GameConstants.Grid.CELL_SIZE` or getConfig() | **Low** |
| `PathfindingSystem.ts` | 29 | `gridSize: number = 64` | No | Add e.g. `GameConstants.AI.PATHFINDING_GRID_SIZE` or use `Grid.SUB_TILE_SIZE` (32) and document; or `PATHFINDING_GRID_SIZE: 64` | **Medium** |
| `PathfindingSystem.ts` | 39, 112 | `2000`, `500` (cache timeout, max iterations) | Yes: `AI.PATHFINDING_CACHE_TIMEOUT`, `AI.PATHFINDING_MAX_ITERATIONS` | Already use GameConstants with fallback; OK | **OK** |
| `EnemySystem.ts` | 137 | `patrolRadius \|\| 150` | Yes: `Combat.DEFAULT_PATROL_RADIUS` 150, `Biome.PATROL_AREA_RADIUS` 300 | Use getConfig().Combat or Biome | **Low** |
| `EnemySystem.ts` | 158 | `GameConstants?.Biome?.PACK_AGGRO_RADIUS \|\| 300` | Yes | OK | **OK** |
| `BossSystem.ts` | 40 | `1000` (setTimeout ms) | Yes: `Timing.UI_FEEDBACK_DELAY` etc. | Use `GameConstants.Timing.ELEMENT_REMOVE_DELAY` or add BOSS_* timing | **Low** |
| `BossSystem.ts` | 163, 226 | respawnTime * 1000, timer/1000 | Conversion | OK (1000 is conversion constant; could use Timing.MS_PER_SECOND) | **Low** |
| `ResourceSpawner.ts` | 222 | `restAreaRadius + 50` | Partial | Use constant e.g. `getConfig().Spawning?.REST_AREA_BUFFER ?? 50` if desired | **Low** |
| `ResourceSpawner.ts` | 225, 249 | `50`, `100` (MIN_SPAWN_DISTANCE, EDGE_SPACING fallbacks) | Yes in getConfig().Spawning | OK | **OK** |
| `ResourceSpawner.ts` | 281, 292 | `300`, `500` (attempts, forceAttempts) | No | Add e.g. `Spawning.TREE_PLACEMENT_MAX_ATTEMPTS`, `TREE_PLACEMENT_FORCE_ATTEMPTS` | **Medium** |
| `PropSpawner.ts` | 36 | `padding: number = 100` | Yes: `GameConstants.UI.BRIDGE_VISUAL_PADDING` 100 | Use constant | **Low** |
| `PropSpawner.ts` | 93, 142 | `islandManager?.waterGap \|\| 50` | World config (WATER_GAP 256); 50 is fallback | Document or add World.WATER_GAP_FALLBACK | **Low** |
| `EnemySpawner.ts` | 52 | `home.worldY - 200` | No | Add e.g. `Spawning.ENEMY_SPAWN_OFFSET_ABOVE_HOME` or use constant | **Low** |
| `EnemySpawner.ts` | 197 | `BiomeConfig.Biome?.GROUP_SPACING \|\| 50` | Yes: Biome.GROUP_SPACING 50 | OK | **OK** |
| `EnemySpawner.ts` | 256 | `padding = 100` | Yes: UI.BRIDGE_VISUAL_PADDING | Use constant | **Low** |
| `EnemySpawner.ts` | 302 | `300` (boss respawn default) | Yes: Biome.BOSS_RESPAWN_DEFAULT | OK with fallback | **OK** |
| `DropSpawner.ts` | 83 | `150 + Math.random() * 100` | Yes: AI.DROP_SPAWN_DISTANCE, DROP_SPAWN_VARIANCE | Use getConfig().AI | **Medium** |
| `SpawnManager.ts` | 125-126 | `2000`, `2000` (world fallback width/height) | Partial: World.TOTAL_* is 30k | Add World.FALLBACK_WIDTH/HEIGHT or use MAP_PADDING | **Low** |
| `SpawnManager.ts` | 388 | `padding: number = 100` | Yes: UI.BRIDGE_VISUAL_PADDING | Use constant | **Low** |
| `RestSystem.ts` | 91, 93, 103 | `hero.y - 50`, `2000`, `hero.y - 50` | Partial: Timing.FLOATING_TEXT_DURATION 2000 | Use getConfig().Timing; 50 → constant for float text offset | **Low** |
| `HeroCombatService.ts` | 98 | `125` (mining range fallback) | Yes: Combat.DEFAULT_MINING_RANGE | OK | **OK** |
| `VFXTriggerService.ts` | 35, 102 | `50`, `150` (comment and timeout) | Partial | Use Timing / VFX constants if used | **Low** |
| `HomeOutpostRenderer.ts` | 35 | `400` (radius) | Yes: Interaction.REST_AREA_RADIUS | getConfig().Interaction?.REST_AREA_RADIUS (already used in plan) | **OK** |
| `ProgressionSystem.ts` | 121-126 | `30`, `1000` (count, lifetime in level-up FX) | Partial | Use VFXConfig or GameConstants.Timing | **Low** |
| `ProgressionSystem.ts` | 144 | `100`, `1.5` (base XP, scaling) | EntityRegistry / config | OK if from data | **OK** |
| `AIComponent.ts` | 20-21, 49-51 | 2000, 5000, 200, 500, 100 (wander/aggro/leash/attack) | Yes: AI + Biome | Use getConfig().AI / Biome in constructor defaults | **Medium** |
| `CombatComponent.ts` | 31-33 | damage 10, rate 1, range 100 | Yes: Combat defaults | Use getConfig().Combat | **Low** |
| `HealthComponent.ts` | 24 | 100 (default max health non-hero) | Yes: Hero.MAX_HEALTH; no generic default in config | Add e.g. GameConstants.Combat.DEFAULT_MAX_HEALTH or entity config | **Low** |
| `StatsComponent.ts` | 125 | `80` (getWeaponRange fallback) | Combat.DEFAULT_MINING_RANGE exists (125/150) | Use getConfig().Combat.DEFAULT_MINING_RANGE | **Low** |

---

### 2.3 Components: Data-Only vs Logic

**Rule:** Components are data containers; no business logic (only simple accessors). No events or system calls from components.

| Component | Method | Classification | Recommendation | Severity |
|-----------|--------|----------------|----------------|----------|
| **HealthComponent** | getMaxHealth() | Data-only (reads config/state) | OK | — |
| **HealthComponent** | takeDamage(amount) | **Logic:** mutates health, clamps, emits HERO_HEALTH_CHANGE / ENTITY_HEALTH_CHANGE, calls die() | Move to DamageSystem or HealthSystem: system applies damage, updates component, emits events | **High** |
| **HealthComponent** | damage(amount) | Thin wrapper over takeDamage | Move with takeDamage | **High** |
| **HealthComponent** | heal(amount) | **Logic:** mutates, clamps, emits | Move to RestSystem or HealthSystem | **High** |
| **HealthComponent** | die() | **Logic:** sets isDead, health = 0 | Keep as minimal state setter or move to system; system should emit ENTITY_DIED | **Medium** |
| **HealthComponent** | respawn() | **Logic:** resets state, emits HERO_HEALTH_CHANGE | Move to HeroSystem/RespawnSystem | **Medium** |
| **CombatComponent** | update(dt) | **Logic:** cooldown timer decrement, canAttack flip | Move to CombatSystem or HeroCombatService update loop | **Medium** |
| **CombatComponent** | attack() | **Logic:** stamina deduct, EventBus HERO_STAMINA_CHANGE, cooldown set | Move to CombatSystem; component holds only data (damage, rate, range, cooldownTimer, canAttack) | **Medium** |
| **InventoryComponent** | add/remove | **Logic:** mutates items, emits INVENTORY_UPDATED / ITEM_COLLECTED | Prefer InventorySystem performing add/remove and emitting; component holds items only | **Medium** |
| **InventoryComponent** | has() | Data-only (read) | OK | — |
| **AIComponent** | setState() | Data-only (state mutator) | OK | — |
| **AIComponent** | randomizeWander() | **Logic:** computes angle, sets direction and timer | Could move to AISystem; component holds data only | **Low** |
| **AIComponent** | canAggro(target) | **Logic:** distance check vs aggroRange | Pure predicate on component + target; acceptable as accessor or move to EnemySystem | **Low** |
| **AIComponent** | shouldLeash() | Same | Same | **Low** |
| **AIComponent** | inAttackRange(target) | Same | Same | **Low** |
| **StatsComponent** | getSpeed, getXPForLevel, getTotalXPForLevel, getAttack, getDefense, getCritChance, getAttackRange, getWeaponRange, getAttackRate, getDamageReduction, getXPProgress, getStat | Derived getters (read config + component state) | Borderline; prefer system or service for complex formulas; keep simple getters | **Low** |
| **CollisionComponent** | (constructor only) | Data | OK | — |

**Note (gray area):** Emitting events from components (e.g. HealthComponent.takeDamage emitting ENTITY_HEALTH_CHANGE) is classified as “component holds logic” for this audit. Preferred: system applies damage, updates component, then emits event.

---

## 3. Severity Summary (Coding Guide Rubric)

- **CRITICAL:** Breaks game or fundamental architecture. (None in this B2 pass.)
- **HIGH:** Significant debt, limits features. Applied to: direct Hero/Enemy movement through CollisionSystem in hot path; HealthComponent/CombatComponent containing core combat/health logic.
- **MEDIUM:** Modularity violation (coupled systems). Applied to: HeroCombatService→VFXController; spawners→IslandManager; ProgressionSystem/EnemyBehavior/Hero/SpawnManager Registry.get or getSystem in action paths; component logic (CombatComponent.update/attack, InventoryComponent add/remove); PathfindingSystem gridSize and ResourceSpawner/DropSpawner literals.
- **LOW:** Polish / naming / literal cleanup. Applied to: renderer/spawner getSystem caching; remaining magic numbers; AIComponent helpers; StatsComponent getters.

---

## 4. Recommended Next Steps

1. **EventBus migration (High):** Introduce `ENTITY_MOVE_REQUEST` (or `HERO_MOVE_REQUEST` / `ENEMY_MOVE_REQUEST`) and have CollisionSystem subscribe; remove direct `CollisionSystem.move()` from HeroSystem and EnemySystem.
2. **VFX/Audio (Medium):** Have ProgressionSystem and HeroCombatService emit events (e.g. `VFX_PLAY_FOREGROUND`, level-up already has `HERO_LEVEL_UP`); VFXController and AudioManager subscribe. Cache or inject ProgressBarRenderer in EnemyBehavior.
3. **Spawners (Medium):** Cache IslandManager (and GameRenderer where needed) in SpawnManager and pass into spawners; avoid per-spawn getSystem/Registry.get.
4. **Data-driven (Low–Medium):** Add missing config keys (PathfindingSystem gridSize, spawn attempt caps, drop distance/variance); replace remaining literals with GameConstants/getConfig().
5. **Component logic (High/Medium):** Move damage/heal/death and stamina/cooldown/attack logic into DamageSystem, HealthSystem, and combat systems; keep components as data + minimal accessors. Then refactor Inventory and AI helpers as needed.

---

*End of Section B2 Full Audit.*
