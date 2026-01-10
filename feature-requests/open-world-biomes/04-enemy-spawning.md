---
status: pending
priority: 2
depends_on: [01-biome-config.md, 02-enemy-config.md]
estimated_complexity: high
---

# 04 - Enemy Spawning System

## Scope
Create the spawning system for enemies in biomes. Handles group spawning, patrol area assignment, and population management.

## Files to Modify
- `src/systems/SpawnManager.js` - Add enemy spawning methods
- `src/core/EntityManager.js` - Register Enemy type

## Files to Create
- `src/gameplay/Enemy.js` - Enemy entity class

## Implementation Details

### Enemy.js - Entity Class
```javascript
/**
 * Enemy - Hostile entity that attacks the player
 * 
 * Different from Dinosaur (passive zone creatures)
 */
class Enemy extends Entity {
    constructor(config = {}) {
        const defaults = EntityConfig.enemy.defaults;
        const typeConfig = config.enemyType ? 
            (EntityConfig.enemy.dinosaurs[config.enemyType] || 
             EntityConfig.enemy.soldiers[config.enemyType]) : {};
        
        const finalConfig = { ...defaults, ...typeConfig, ...config };
        
        // NEW: Elite roll
        const isElite = config.isElite || 
            (Math.random() < EntityConfig.enemy.eliteSpawnChance);
        
        // Apply elite multipliers
        if (isElite) {
            const mult = EntityConfig.enemy.eliteMultipliers;
            finalConfig.health *= mult.health;
            finalConfig.damage *= mult.damage;
            finalConfig.xpReward *= mult.xpReward;
        }
        
        super({
            entityType: finalConfig.entityType || EntityTypes.ENEMY_DINOSAUR,
            width: finalConfig.width || 192,
            height: finalConfig.height || 192,
            ...config
        });
        
        // Enemy Identity
        this.enemyType = config.enemyType;
        this.enemyName = finalConfig.name || 'Unknown Enemy';
        this.level = config.level || 1;
        this.isElite = isElite;
        this.threatLevel = finalConfig.threatLevel || 1;
        
        // NEW: Pack Behavior
        this.packAggro = finalConfig.packAggro !== false; // Default true
        
        // Patrol Area (spawn location + radius)
        this.spawnX = config.x;
        this.spawnY = config.y;
        this.patrolRadius = finalConfig.patrolRadius || BiomeConfig.patrolDefaults.areaRadius;
        this.leashDistance = finalConfig.leashDistance || BiomeConfig.patrolDefaults.leashDistance;
        
        // Combat
        this.xpReward = finalConfig.xpReward || 10;
        this.lootTableId = finalConfig.lootTableId || 'common_enemy';
        
        // Biome Context
        this.biomeId = config.biomeId;
        this.groupId = config.groupId; // Links enemies in same group for pack aggro
        
        // NEW: Respawn Wave tracking
        this.waveId = config.waveId; // Groups respawn together
        
        // Components
        this.components = {};
        
        if (window.HealthComponent) {
            this.components.health = new HealthComponent(this, {
                maxHealth: finalConfig.health,
                health: finalConfig.health
            });
        }
        
        if (window.CombatComponent) {
            this.components.combat = new CombatComponent(this, {
                damage: finalConfig.damage,
                rate: finalConfig.attackRate,
                range: finalConfig.attackRange
            });
        }
        
        if (window.StatsComponent) {
            this.components.stats = new StatsComponent(this, {
                speed: finalConfig.speed
            });
        }
        
        if (window.AIComponent) {
            this.components.ai = new AIComponent(this, {
                state: 'WANDER',
                aggroRange: finalConfig.aggroRange,
                leashDistance: this.leashDistance
            });
        }
        
        // State
        this.state = 'alive';
        this.respawnTimer = 0;
        this.maxRespawnTime = config.respawnTime || 60;
    }
    
    // Accessors
    get health() { return this.components.health?.health || 0; }
    set health(val) { if (this.components.health) this.components.health.health = val; }
    
    get speed() { return this.components.stats?.speed || 80; }
}

window.Enemy = Enemy;
```

### SpawnManager.js Additions
```javascript
// Add to SpawnManagerService class:

/**
 * Spawn enemy group in a biome
 * @param {string} biomeId
 * @param {number} x - Group center X
 * @param {number} y - Group center Y
 * @param {string} enemyId - Enemy type ID
 * @param {number} count - Group size
 */
spawnEnemyGroup(biomeId, x, y, enemyId, count) {
    const groupId = `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const spacing = GameConstants.Biome.GROUP_SPACING;
    
    for (let i = 0; i < count; i++) {
        const offsetX = (Math.random() - 0.5) * spacing * 2;
        const offsetY = (Math.random() - 0.5) * spacing * 2;
        
        const enemy = new Enemy({
            x: x + offsetX,
            y: y + offsetY,
            enemyType: enemyId,
            biomeId: biomeId,
            groupId: groupId,
            level: this.getEnemyLevelForBiome(biomeId)
        });
        
        if (window.EntityManager) {
            EntityManager.add(enemy);
        }
    }
}

/**
 * Get appropriate enemy level for biome
 */
getEnemyLevelForBiome(biomeId) {
    const biome = BiomeConfig.types[biomeId];
    if (!biome) return 1;
    
    const { min, max } = biome.levelRange;
    return min + Math.floor(Math.random() * (max - min + 1));
}

/**
 * Populate biome with enemy groups
 */
populateBiome(biomeId, bounds) {
    const biome = BiomeConfig.types[biomeId];
    if (!biome) return;
    
    for (const spawn of biome.enemySpawnTable) {
        const groupCount = Math.floor(spawn.weight / 20); // Rough conversion
        
        for (let g = 0; g < groupCount; g++) {
            const x = bounds.x + Math.random() * bounds.width;
            const y = bounds.y + Math.random() * bounds.height;
            const size = spawn.groupSize.min + 
                Math.floor(Math.random() * (spawn.groupSize.max - spawn.groupSize.min + 1));
            
            this.spawnEnemyGroup(biomeId, x, y, spawn.enemyId, size);
        }
    }
}
```

## Acceptance Criteria
- [ ] Enemy.js class created extending Entity
- [ ] Enemy uses EntityTypes.ENEMY_DINOSAUR or ENEMY_SOLDIER
- [ ] Enemy stores patrol area (spawnX, spawnY, patrolRadius, leashDistance)
- [ ] Enemy has all required components (Health, Combat, Stats, AI)
- [ ] **Elite spawning**: 5% chance, 2x stats, 3x loot
- [ ] **isElite** and **threatLevel** properties set
- [ ] **packAggro** flag respected per enemy type
- [ ] **waveId** tracks respawn wave groups
- [ ] SpawnManager.spawnEnemyGroup() creates grouped enemies
- [ ] SpawnManager.populateBiome() spawns based on biome config
- [ ] Enemy level scales based on biome levelRange
- [ ] groupId links enemies for pack aggro behavior
- [ ] EntityManager can query enemies by type

## Notes
- AI behavior (pack aggro) handled by 05-enemy-ai.md
- Loot drops (elite multipliers) handled by 07-loot-system.md
- Respawn wave logic: When all enemies in a waveId are dead, respawn timer starts
