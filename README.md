# Jurassic Knights: Valley - AI Reference

## Quick Commands
```bash
# Dev server (Vite)
cd C:\Users\Anthony\.gemini\antigravity\scratch\jurassic-knights-valley
npm run dev          # http://localhost:5173

# Format all code
npm run format

# Build production
npm run build        # Output: dist/
```

## Critical Paths
| What | Path |
|------|------|
| Game entry | `index.html` |
| Script loading order | `index.html` lines 320-480 |
| Entity JSONs | `src/entities/{enemies,items,nodes,resources,npcs,equipment}/` |
| Asset registry | `src/core/AssetLoader.js` (lines 20-200 for image/audio maps) |
| Game constants | `src/data/GameConstants.js` |
| Entity loader | `src/entities/EntityLoader.js` |

## Entity ID Convention
```
{category}_{subcategory}_t{tier}_{variant}

Categories:
- enemy_dinosaur_t1_01, enemy_human_t2_03, enemy_saurian_t3_01
- enemy_herbivore_t1_01 (passive, non-hostile)
- node_t1_02 (harvestable resources)
- food_t1_02, bone_t1_01, leather_t2_02 (drops/resources)
- weapon_t1_01, armor_t2_03 (equipment)
- npc_merchant_01
```

## Spawner → Entity Flow
```
EnemySpawner.spawnEnemyGroup(biomeId, x, y, enemyId, count)
    → new Enemy({ enemyType, lootTable, ... })
        → Enemy.die() → SpawnManager.spawnDrop(x, y, itemId, amount)

ResourceSpawner.spawnDinosaursOnIsland(island)
    → new Dinosaur({ dinoType, lootTable, ... })
        → DinosaurSystem.processDeath() → SpawnManager.spawnDrop()
```

## Loot System (Unified Pattern)
**All drops use:** `SpawnManager.spawnDrop(x, y, itemId, amount)`

Loot data flows:
1. Entity JSON defines `loot: [{ item, chance, amount }]`
2. Spawner passes `lootTable` to constructor (inline config for file:// compat)
3. On death, entity's die() loops lootTable → SpawnManager.spawnDrop()

## Key Classes & Responsibilities
| Class | File | Purpose |
|-------|------|---------|
| `Enemy` | `src/gameplay/Enemy.js` | Hostile enemies (dinosaur, human, saurian) |
| `Dinosaur` | `src/gameplay/Dinosaur.js` | Passive herbivores |
| `Resource` | `src/gameplay/Resource.js` | Harvestable nodes |
| `DroppedItem` | `src/gameplay/DroppedItem.js` | Collectible drops |
| `Hero` | `src/gameplay/Hero.js` | Player character |
| `SpawnManager` | `src/systems/SpawnManager.js` | Central spawn coordinator |
| `EnemySpawner` | `src/systems/spawners/EnemySpawner.js` | Enemy group spawning |
| `ResourceSpawner` | `src/systems/spawners/ResourceSpawner.js` | Nodes, herbivores, props |
| `EntityLoader` | `src/entities/EntityLoader.js` | Fetches entity JSONs → EntityRegistry |
| `AssetLoader` | `src/core/AssetLoader.js` | Image/audio loading, asset ID → path mapping |

## Asset System
**Asset ID → Path mapping** in `AssetLoader.js`:
```javascript
registries.images.assets = {
    "enemy_dinosaur_t1_01": { path: "images/enemies/dinosaur_t1_01_..." },
    "node_t1_02": { path: "images/nodes/node_t1_02_..." },
    ...
}
```

**To add new asset:**
1. Add image to `assets/images/{category}/`
2. Add entry to `AssetLoader.js` registries.images.assets
3. Use asset ID in entity JSON or spawner

## Event System
**EventBus** for decoupled communication:
```javascript
EventBus.emit('ENEMY_DIED', { enemy, killer, xpReward });
EventBus.on('ENEMY_DIED', (data) => { ... });
```

Key events: `ENEMY_DIED`, `HERO_LEVEL_UP`, `ITEM_COLLECTED`, `QUEST_COMPLETE`

## Dashboard Tools
```bash
cd tools
python serve_dashboard.py    # http://localhost:5173
```
Dashboard manages: entity JSONs, asset approval, SFX regeneration

## Inline Loot Config Locations
**For file:// compatibility**, loot is duplicated inline:
- `EnemySpawner.js` lines 46-82: `enemyLoot` object
- `ResourceSpawner.js` lines 80-120: `herbivoreLoot` object

When editing entity JSON loot, **also update inline config** or use Vite server.

## Common Gotchas
1. **file:// protocol**: EntityLoader.fetch() fails → use Vite dev server
2. **Asset not showing**: Check AssetLoader.js has entry with matching ID
3. **Loot not dropping**: Check spawner passes lootTable to constructor
4. **Script order**: index.html load order matters (dependencies first)

## User Preferences
- **Never generalize**: Always read exact entity JSON data
- **Auto-run scripts**: User should never manually run script files
- **Asset Dashboard**: Source of truth for all entities
- **Style Guide**: `docs/design/style_guide.md` (Stoneshard pixel art, gritty, no magic)
- **Helmet Mandate**: Humans always wear full-face coverings whether that be helmets, masks, hoods, visors, etc.

## Project Structure
```
├── assets/images/{enemies,nodes,items,...}/
├── src/
│   ├── core/          # Registry, EntityManager, AssetLoader, Profiler
│   ├── config/        # Events, SystemConfig, EntityTypes
│   ├── data/          # GameConstants, VFX_*, BiomeConfig
│   ├── entities/      # JSON definitions (source of truth)
│   ├── gameplay/      # Hero, Enemy, Dinosaur, Resource, DroppedItem
│   ├── systems/       # *System.js, *Renderer.js, spawners/
│   ├── ui/            # UIManager, HUDController, InventoryUI
│   └── vfx/           # VFXController, ParticleSystem
├── tools/             # Dashboard, scripts
├── docs/              # ARCHITECTURE.md, COMMITS.md, design/
└── feature-requests/  # /feature workflow output
```

## Development Workflow
1. `npm run dev` → Vite server at localhost:5173
2. Edit files → auto-refresh
3. Test in browser, check console for errors
4. `npm run format` before commits
5. Follow `docs/COMMITS.md` convention
