# B2 Architecture Audit — Implementation Work Packages

**Completed:** 2026-02-09  
**Reference:** `docs/audit_report_b2_architecture_full_2026-02.md`

---

## WP1: EventBus for movement ✅

- **Event:** `ENTITY_MOVE_REQUEST` with `{ entity, dx, dy }`.
- **CollisionSystem** subscribes and calls `move(entity, dx, dy)` when entity is registered.
- **HeroSystem** and **EnemySystem** no longer call `getSystem('CollisionSystem')`; they emit `ENTITY_MOVE_REQUEST` instead.
- **Files:** `GameConstants.ts`, `CollisionSystem.ts`, `HeroSystem.ts`, `EnemySystem.ts`.

---

## WP2: EventBus VFX/Audio & stamina ✅

- **Events:** `VFX_PLAY_FOREGROUND` (`{ x, y, options }`), `REQUEST_STAMINA_RESTORE` (`{ hero, amount }`).  
  Level-up uses existing `HERO_LEVEL_UP` (VFXController and AudioManager subscribe).
- **VFXController** subscribes to `VFX_PLAY_FOREGROUND` and `HERO_LEVEL_UP`; plays foreground VFX and level-up burst.
- **AudioManager** subscribes to `HERO_LEVEL_UP`; plays `sfx_level_up`.
- **ProgressionSystem** no longer uses `Registry.get('VFXController'/'AudioManager')` in `onLevelUp`; it only emits `HERO_LEVEL_UP`.
- **HeroCombatService** emits `VFX_PLAY_FOREGROUND` for muzzle flash instead of `getSystem('VFXController')`.
- **Hero.restStamina()** emits `REQUEST_STAMINA_RESTORE`; **HeroSystem** subscribes and calls `restoreStamina(hero, amount)`.
- **EnemyBehavior** caches ProgressBarRenderer via module-level `getProgressBarRenderer()` (no per-draw `Registry.get`).
- **Files:** `GameConstants.ts`, `VFXController.ts`, `AudioManager.ts`, `ProgressionSystem.ts`, `HeroCombatService.ts`, `Hero.ts`, `HeroSystem.ts`, `EnemyBehavior.ts`.

---

## WP3: Spawners/renderers cache IslandManager ✅

- **SpawnManager** caches `_islandManager` and `_gameRenderer` in `init()` (from `game.getSystem` / `Registry.get` fallback).  
  Exposes `getIslandManager()` and `getGameRenderer()`.
- **PropSpawner**, **ResourceSpawner**, **EnemySpawner** use `this.spawnManager.getIslandManager()` instead of `gameInstance.getSystem('IslandManager')`.
- **SpawnManager** uses cached refs in `spawnHero()`, `spawnMerchants()`, and `getMerchantNearHero()`.
- **Files:** `SpawnManager.ts`, `PropSpawner.ts`, `ResourceSpawner.ts`, `EnemySpawner.ts`.  
  (WorldRenderer already caches at init; no change.)

---

## WP4: Data-driven config ✅

- **New keys:**  
  `GameConstants.AI.PATHFINDING_GRID_SIZE` (64),  
  `Spawning.TREE_PLACEMENT_MAX_ATTEMPTS` (300), `TREE_PLACEMENT_FORCE_ATTEMPTS` (500),  
  `World.FALLBACK_WIDTH` / `FALLBACK_HEIGHT` (2000),  
  `Combat.DEFAULT_ATTACK_RATE`, `DEFAULT_ATTACK_RANGE`, `DEFAULT_MAX_HEALTH_NPC` (100),  
  `Timing.FLOATING_TEXT_Y_OFFSET` (50).
- **PathfindingSystem:** `gridSize` set from `GameConstants.AI.PATHFINDING_GRID_SIZE` in `init()`.
- **ResourceSpawner:** uses `TREE_PLACEMENT_*` for attempt caps.
- **DropSpawner:** crafted-item spawn distance from `getConfig().AI.DROP_SPAWN_*`.
- **SpawnManager:** fallback world size from `GameConstants.World.FALLBACK_*`.
- **RestSystem:** floating text offset and duration from `GameConstants.Timing`.
- **CombatComponent**, **HealthComponent**, **StatsComponent**, **AIComponent:** defaults from `getConfig().Combat` / `getConfig().AI` / `GameConstants.Biome`.
- **PropSpawner:** bridge padding from `GameConstants.UI.BRIDGE_VISUAL_PADDING`.
- **Files:** `GameConstants.ts`, `PathfindingSystem.ts`, `ResourceSpawner.ts`, `DropSpawner.ts`, `SpawnManager.ts`, `RestSystem.ts`, `CombatComponent.ts`, `HealthComponent.ts`, `StatsComponent.ts`, `AIComponent.ts`, `PropSpawner.ts`.

---

## WP5: Component logic (HealthComponent) ✅

- **HealthComponent** is data-only: `takeDamage`, `heal`, `die`, `respawn` only mutate `health`, `maxHealth`, `isDead`. No EventBus usage.
- **DamageSystem** after applying damage emits `HERO_HEALTH_CHANGE` or `ENTITY_HEALTH_CHANGE`; death is already handled (entity.die + ENTITY_DIED).
- **HeroSystem** after `health.respawn()` emits `HERO_HEALTH_CHANGE`.
- **Files:** `HealthComponent.ts`, `DamageSystem.ts`, `HeroSystem.ts`.

---

## WP5 (continued): CombatComponent & InventoryComponent ✅

- **CombatComponent** is now data-only (no `update()` or `attack()`). **HeroCombatService** ticks cooldown and performs attack (stamina deduct, `HERO_STAMINA_CHANGE`, cooldown set). **EnemySystem** ticks cooldown and performs attack (state change + `ENTITY_DAMAGED` / `ENEMY_ATTACK`).
- **InventoryComponent** `add`/`remove` only mutate `items`; no EventBus. **InteractionSystem** already emits `INVENTORY_UPDATED` after adding; no other callers of `inventory.add`/`remove` in gameplay.
- **Files:** `CombatComponent.ts`, `InventoryComponent.ts`, `HeroCombatService.ts`, `EnemySystem.ts`.

---

## Subagent handoff

If splitting work across sessions:

1. **EventBus / coupling:** Use the B2 audit table (section 2.1); each row is a single refactor (emit event or cache ref).
2. **Data-driven:** Use section 2.2; add missing keys to `GameConstants`/`GameConfig`, then replace literals in the listed files.
3. **Components:** Use section 2.3; one component at a time (Health ✅; next: Combat, then Inventory).

Run `npm run build` (or project build command) after changes to confirm no regressions.
