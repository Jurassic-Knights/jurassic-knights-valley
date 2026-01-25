# Architecture Overview

**Last Updated:** 2026-01-25

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
│  Registry.js      │ Global service locator                      │
│  EntityManager.js │ Entity storage and retrieval                │
│  AssetLoader.js   │ Image/audio loading and caching             │
│  EventBus.js      │ Pub/sub event system                        │
│  Game.js          │ Main game loop and system orchestration     │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Systems Layer                             │
├─────────────────────────────────────────────────────────────────┤
│  Spawners/        │ Entity creation (Enemy, Resource, Drop)     │
│  *System.js       │ Per-frame logic (Combat, AI, Movement)      │
│  *Renderer.js     │ Drawing logic (Hero, Enemy, Resource)       │
│  *Controller.js   │ High-level coordination                     │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Gameplay Layer                             │
├─────────────────────────────────────────────────────────────────┤
│  Hero.js          │ Player entity                               │
│  Enemy.js         │ Hostile enemies                             │
│  Dinosaur.js      │ Passive herbivores                          │
│  Resource.js      │ Harvestable nodes                           │
│  DroppedItem.js   │ Collectible drops                           │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Data Layer                               │
├─────────────────────────────────────────────────────────────────┤
│  src/entities/    │ JSON entity definitions (source of truth)   │
│  src/config/      │ Game constants and configuration            │
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
```javascript
// Good
EventBus.emit('ENEMY_DIED', { enemy, xpReward });

// Bad
ProgressionSystem.addXP(xpReward);
```

### Data-Driven Entities
Entities defined in JSON, loaded by EntityLoader:
```
src/entities/
├── enemies/     # enemy_dinosaur_t1_01.json
├── items/       # food_t1_02.json
└── nodes/       # node_t1_02.json
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
| `*System.js` | Per-frame logic | DinosaurSystem.js |
| `*Renderer.js` | Drawing | HeroRenderer.js |
| `*Spawner.js` | Entity creation | EnemySpawner.js |
| `*Controller.js` | Coordination | CombatController.js |
| `*Config.js` | Constants | GameConstants.js |
| `*Manager.js` | Service singletons | SpawnManager.js |

## Entity ID Convention
```
{category}_{subcategory}_t{tier}_{variant}

Examples:
- enemy_dinosaur_t1_01
- enemy_human_t2_03
- node_t1_02
- food_t1_02
```
