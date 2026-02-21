# Island System Deep Audit Report

The following is a comprehensive audit of the remaining remnants of the deprecated `Island` system within the codebase. The user's directive is to completely excise this system rather than bypassing it via the `WorldManager`.

## 1. Dead Files to Delete
The following files are either entirely dedicated to the old system or exist solely for backwards compatibility:
- `src/world/IslandManager.ts` (Currently just an alias re-exporting `WorldManager`)
- `src/gameplay/IslandUpgrades.ts` (Legacy progression system for unlocking islands)

## 2. Global Type & Interface Contamination
The word "Island" natively exists in several core type definitions that need to be renamed or removed.
- `src/types/world.ts`: Defines `Island`, `IslandType`, and uses them in `WalkableZone` and `CollisionBlock`.
- `src/config/WorldTypes.ts`: Contains `IslandType` enum (e.g., `HOME`, `NORMAL`).
- `src/types/core.d.ts`: Interfaces like `IIslandManager` map directly to the old system instead of a generic world manager.
- `src/data/GameConstants/Entities.ts`: Contains keys like `ISLAND_CELLS` or limits.

## 3. WorldManager & Registry Aliasing
The `WorldManager` currently registers itself under the alias `'IslandManager'` to prevent the game from crashing when legacy systems request it.
- `src/world/WorldManager.ts`:
  - Registers as: `Registry.register('IslandManager', WorldManager);`
  - Explanatory comments: `// --- IslandManager compatibility stubs ---`
  - Contains stub methods: `isIslandUnlocked()`, `unlockIsland()`, `getIslandByGrid()`, `getIslandAt()`, `getHomeIsland()`, etc.

## 4. Systems still requesting "IslandManager"
The following operational files request `'IslandManager'` from the registry and must be updated to request `'WorldManager'` and use the updated API:
- `src/core/Game.ts`
- `src/systems/HeroSystem.ts`
- `src/systems/InteractionSystem.ts`
- `src/systems/CollisionSystemCollision.ts`
- `src/systems/CollisionSystemDebug.ts`
- `src/systems/EconomySystem.ts`
- `src/systems/PathfindingSystem.ts`
- `src/ui/UIManager.ts`
- `src/ui/UIManagerUnlockPrompt.ts`
- `src/ui/MerchantUI.ts`
- `src/ui/MinimapRenderer.ts`
- `src/gameplay/SpawnHelper.ts`
- `src/gameplay/EnemyBehaviorPath.ts`
- `src/rendering/GridRenderer.ts`

## 5. Extraneous Game Constants & Data
- `src/data/WorldData.ts`: Defines `islandNames`, `islandCategories`, etc.
- `src/core/State.ts`: The game state (`GameState`) tracks `"unlocks"` strictly as a grid of unlocked islands.
- `src/data/GameConstants/index.ts`: Game events still trigger `ISLAND_UNLOCKED` and `UI_UNLOCK_PROMPT`, which tie back to physical island bridges.

## Summary Conclusion
To completely remove the Island system:
1. Delete `IslandManager.ts` and `IslandUpgrades.ts`.
2. Strip the compatibility stubs out of `WorldManager.ts` and register it natively as `"WorldManager"`.
3. Rename or remove the `Island` types from the system types.
4. Refactor the ~15 functional files (listed in section 4) to request `"WorldManager"` and use standard spatial checks instead of asking for `Island` grids.
