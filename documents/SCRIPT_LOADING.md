# Script Loading Order

> [!IMPORTANT]
> This project uses manual script loading in `index.html`. Order matters critically.

## Load Order Principles

1. **Data Files First** - Configuration and constants before anything that uses them
2. **Core Before Systems** - Base classes/utilities before derived systems
3. **Dependencies Before Dependents** - Services before their consumers
4. **UI Last** - UI components after game systems are initialized

## Current Loading Groups (in order)

```
1. Utilities (Logger.js, html2canvas)
2. Data (GameConstants, Events, entities.js, VFX configs)
3. Core Architecture (Registry, Entity, Component)
4. Entity Bases (_bases/*.js)
5. Entity Definitions (creatures, enemies, resources)
6. Core Systems (EntityManager, EventBus, AssetLoader)
7. Input System (InputSystem, Adapters)
8. World System (BiomeManager, IslandManager)
9. Rendering (ShadowRenderer → EntityRenderService → GameRenderer)
10. Gameplay Systems (Spawn, Combat, Hero)
11. UI (UIManager, Controllers)
12. VFX (ParticleSystem, VFXController)
13. Entry Point (main.js)
```

## Known Conflicts

| File | Conflict | Resolution |
|------|----------|------------|
| `entities/merchant.js` | Name collision with `gameplay/Merchant.js` | Deferred; entity file commented out |
| `InputManager.js` | Deprecated by `InputSystem.js` | Commented out in index.html |

## Adding New Scripts

1. **Identify dependencies** - What globals/classes does your script need?
2. **Find the right group** - Place after all dependencies
3. **Test in browser** - Check console for undefined errors
4. **Update this doc** - Document any new conflicts

## Verification ("Grep-Zero" Check)

Before refactoring, verify no external references:

```bash
# Check if old path is still used
grep -r "OldModule.method" src/

# Result should be 0 for safe deletion
```

## Common Errors

**"X is not defined"** → Script loaded before its dependency  
**"Cannot read property of undefined"** → Async init race condition  
**"Maximum call stack exceeded"** → Circular dependency or self-reference
