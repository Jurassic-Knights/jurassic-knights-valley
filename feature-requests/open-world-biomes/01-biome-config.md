---
status: complete
priority: 1
depends_on: none
estimated_complexity: medium
---

# 01 - Biome Configuration System

## Scope
Create the data-driven configuration system for biomes that extend organically from the zone grid. Defines biome types, boundaries, visual themes, difficulty scaling, and spawn tables.

## Geography Design
- Biomes extend outward from the existing zone grid (islands)
- Players can freely travel to any biome at their own risk
- Transition zones create gradient borders between biomes
- Future task: Organic ecosystem layout logic

## Files to Modify
- `src/config/EntityConfig.js` - Add `biome` section
- `src/config/GameConstants.js` - Add biome constants

## Files to Create
- `src/config/BiomeConfig.js` - Dedicated biome configuration

## Implementation Details

### BiomeConfig.js Structure
```javascript
const BiomeConfig = {
    // Biome Types
    types: {
        grasslands: {
            id: 'grasslands',
            name: 'The Grasslands',
            description: 'Rolling plains teeming with feral beasts.',
            difficulty: 1,
            levelRange: { min: 1, max: 10 },
            visualTheme: {
                groundColor: '#4A7C3F',
                ambientColor: '#E8F5E9',
                fogDensity: 0.1
            },
            enemySpawnTable: [
                { enemyId: 'feral_raptor', weight: 60, groupSize: { min: 2, max: 4 } },
                { enemyId: 'feral_soldier', weight: 40, groupSize: { min: 1, max: 2 } }
            ],
            bossId: 'grasslands_alpha',
            bossRespawnTime: 300 // 5 minutes
        },
        tundra: {
            id: 'tundra',
            name: 'The Frozen Wastes',
            description: 'Bitter cold and hardened survivors.',
            difficulty: 2,
            levelRange: { min: 10, max: 20 },
            // ... similar structure
        },
        desert: {
            id: 'desert',
            name: 'The Scorched Sands',
            difficulty: 3,
            levelRange: { min: 20, max: 30 },
        },
        badlands: {
            id: 'badlands',
            name: 'The Badlands',
            description: 'Volcanic hellscape, ash, obsidian, fire.',
            difficulty: 4,
            levelRange: { min: 30, max: 40 },
            visualTheme: {
                groundColor: '#2F2F2F',
                ambientColor: '#FF4500',
                fogDensity: 0.2
            },
            enemySpawnTable: [
                // Placeholder for specific badlands enemies
                { enemyId: 'saurian_elite', weight: 50, groupSize: { min: 1, max: 3 } },
                { enemyId: 'lava_golem', weight: 30, groupSize: { min: 1, max: 1 } },
                { enemyId: 'fire_drake_hatchling', weight: 20, groupSize: { min: 1, max: 2 } }
            ],
            bossId: 'badlands_titan',
            bossRespawnTime: 600 // 10 minutes
        }
    },
    
    // Difficulty Scaling
    difficultyMultipliers: {
        1: { health: 1.0, damage: 1.0, xp: 1.0 },
        2: { health: 1.5, damage: 1.3, xp: 1.5 },
        3: { health: 2.0, damage: 1.6, xp: 2.0 },
        4: { health: 3.0, damage: 2.0, xp: 3.0 }
    },
    
    // Patrol Area Settings
    patrolDefaults: {
        areaRadius: 300,      // Enemies wander within this radius
        leashDistance: 500,   // Stop chasing beyond this distance
        aggroRange: 200       // Detection range for player
    }
};
```

### GameConstants.js Additions
```javascript
GameConstants.Biome = {
    PATROL_AREA_RADIUS: 300,
    LEASH_DISTANCE: 500,
    AGGRO_RANGE: 200,
    BOSS_RESPAWN_DEFAULT: 300,
    GROUP_SPACING: 50
};
```

## Acceptance Criteria
- [x] BiomeConfig.js created with all 4 biomes defined
- [x] Each biome has: id, name, difficulty, levelRange, enemySpawnTable, bossId
- [x] Difficulty multipliers are data-driven, not hardcoded
- [x] GameConstants.Biome section added
- [x] No hardcoded values in config (all tunable)
- [x] File registers with window.BiomeConfig

## Notes
- Visual themes are placeholders for future renderer integration
- Enemy IDs reference 02-enemy-config.md definitions
- Boss IDs reference 09-boss-system.md definitions
