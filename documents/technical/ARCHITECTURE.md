# Architecture Overview

**Last Updated:** 2026-02-09

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         index.html                               │
│                    (Entry point + Script loading)                │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                          Core Layer                              │
├─────────────────────────────────────────────────────────────────┤
│  Registry.ts      │ Global service locator                      │
│  EntityManager.ts │ Entity storage and retrieval                │
│  AssetLoader.ts   │ Image/audio loading and caching             │
│  EventBus.ts      │ Pub/sub event system                        │
│  Game.ts          │ Main game loop and system orchestration     │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Systems Layer                             │
├─────────────────────────────────────────────────────────────────┤
│  Spawners/        │ Entity creation (Enemy, Resource, Drop)     │
│  *System.ts       │ Per-frame logic (Combat, AI, Movement)      │
│  *Renderer.ts     │ Drawing logic (Hero, Enemy, Resource)        │
│  *Controller.ts   │ High-level coordination                     │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Gameplay Layer                             │
├─────────────────────────────────────────────────────────────────┤
│  Hero.ts          │ Player entity                               │
│  Enemy.ts         │ Hostile enemies                             │
│  Dinosaur.ts      │ Passive herbivores                          │
│  Resource.ts      │ Harvestable nodes                           │
│  DroppedItem.ts   │ Collectible drops                           │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Data Layer                               │
├─────────────────────────────────────────────────────────────────┤
│  src/entities/    │ Entity definitions (TypeScript/JSON, source of truth) │
│  src/config/      │ Game constants and configuration            │
│  src/data/        │ GameConstants, configs                      │
│  assets/          │ Images, audio files                         │
└─────────────────────────────────────────────────────────────────┘
```

## Key Patterns

### Entity Component System (ECS-like)
- **Entities**: IDs managed by EntityManager
- **Components**: Data containers (HealthComponent, StatsComponent)
- **Systems**: Logic processors (CombatSystem, DinosaurSystem)

### Event-Driven Communication
Systems communicate via EventBus, not direct calls:
```typescript
// Good
EventBus.emit('ENEMY_DIED', { enemy, xpReward });

// Bad
ProgressionSystem.addXP(xpReward);
```

### Data-Driven Entities
Entities defined in TypeScript modules and/or JSON, loaded by EntityLoader:
```
src/entities/
├── enemies/     # enemy_dinosaur_t1_01, etc.
├── items/       # food_t1_02, etc.
└── nodes/       # node_t1_02, etc.
```

### Spawner → Constructor → System Flow
```
ResourceSpawner.spawnDinosaursOnIsland()
    → new Dinosaur({ dinoType, lootTable })
        → DinosaurSystem.update()
            → SpawnManager.spawnDrop()
```

## File Naming Conventions

| Pattern | Purpose | Example |
|---------|---------|---------|
| `*System.ts` | Per-frame logic | DinosaurSystem.ts |
| `*Renderer.ts` | Drawing | HeroRenderer.ts |
| `*Spawner.ts` | Entity creation | EnemySpawner.ts |
| `*Controller.ts` | Coordination | CombatController.ts |
| `*Config.ts` | Constants | GameConstants.ts |
| `*Manager.ts` | Service singletons | SpawnManager.ts |

## Entity ID Convention
```
{category}_{subcategory}_t{tier}_{variant}

Examples:
- enemy_dinosaur_t1_01
- enemy_human_t2_03
- node_t1_02
- food_t1_02
```
