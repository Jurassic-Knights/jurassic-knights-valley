---
status: complete
priority: 4
depends_on: [07-loot-system.md, 08-leveling-system.md]
estimated_complexity: high
---

# 09 - Boss System

## Scope
Implement biome bosses that spawn on timers, have enhanced stats, and drop special loot.

## Files to Modify
- `src/config/EntityConfig.js` - Add boss configurations
- `src/systems/SpawnManager.js` - Add boss spawning

## Files to Create
- `src/gameplay/Boss.js` - Boss entity class
- `src/systems/BossSystem.js` - Boss management

## Implementation Details

### EntityConfig.js - Boss Section
```javascript
EntityConfig.boss = {
    defaults: {
        gridSize: 3,
        width: 384,
        height: 384,
        health: 1000,
        maxHealth: 1000,
        damage: 50,
        attackRate: 0.5,      // Slower but harder hitting
        attackRange: 150,
        speed: 40,            // Slow but menacing
        aggroRange: 400,      // Large aggro range
        leashDistance: 800,   // Larger leash
        xpReward: 500,
        respawnTime: 300,     // 5 minutes
        isBoss: true
    },
    
    types: {
        'grasslands_alpha': {
            name: 'Alpha Raptor',
            species: 'velociraptor',
            biomeId: 'grasslands',
            health: 800,
            damage: 35,
            speed: 100,           // Fast boss
            attackType: 'melee',
            xpReward: 300,
            lootTableId: 'boss_grasslands',
            abilities: ['pounce', 'call_pack']
        },
        'tundra_mammoth': {
            name: 'Frost Mammoth',
            species: 'mammoth',
            biomeId: 'tundra',
            gridSize: 4,
            width: 512,
            height: 512,
            health: 2000,
            damage: 80,
            speed: 30,
            attackType: 'melee',
            xpReward: 600,
            lootTableId: 'boss_tundra',
            abilities: ['stomp', 'charge']
        },
        'desert_scorpion': {
            name: 'Sand Emperor',
            species: 'scorpion',
            biomeId: 'desert',
            health: 1500,
            damage: 60,
            speed: 50,
            attackType: 'melee',
            xpReward: 500,
            lootTableId: 'boss_desert',
            abilities: ['burrow', 'poison_sting']
        },
        'lava_rex': {
            name: 'Inferno Rex',
            species: 'tyrannosaurus',
            biomeId: 'lava_crags',
            gridSize: 4,
            width: 512,
            height: 512,
            health: 3000,
            damage: 100,
            speed: 35,
            attackType: 'melee',
            xpReward: 1000,
            lootTableId: 'boss_lava',
            abilities: ['fire_breath', 'roar']
        }
    }
};
```

### Boss.js
```javascript
/**
 * Boss - Powerful biome boss entity
 * 
 * Larger, stronger, and has special abilities.
 * Respawns on a timer after death.
 */
class Boss extends Enemy {
    constructor(config = {}) {
        const defaults = EntityConfig.boss.defaults;
        const typeConfig = config.bossType ? 
            EntityConfig.boss.types[config.bossType] : {};
        
        const finalConfig = { ...defaults, ...typeConfig, ...config };
        
        // Call Enemy constructor with merged config
        super({
            ...finalConfig,
            enemyType: config.bossType
        });
        
        // Boss Identity
        this.isBoss = true;
        this.bossType = config.bossType;
        this.bossName = finalConfig.name || 'Unknown Boss';
        this.abilities = finalConfig.abilities || [];
        
        // Override entity type for special handling
        this.entityType = EntityTypes.ENEMY; // Still an enemy
        
        // Visual enhancements
        this.glowColor = '#FF4500'; // Boss glow
        this.scale = 1.2; // Slightly larger render
    }
}

window.Boss = Boss;
```

### BossSystem.js
```javascript
/**
 * BossSystem
 * Manages boss spawning, respawn timers, and encounter tracking.
 */
class BossSystem {
    constructor() {
        this.bosses = new Map();      // biomeId -> boss instance
        this.respawnTimers = new Map(); // biomeId -> timer
        console.log('[BossSystem] Initialized');
    }
    
    init(game) {
        this.game = game;
        this.initListeners();
    }
    
    initListeners() {
        if (window.EventBus) {
            EventBus.on('ENEMY_KILLED', (data) => this.onEnemyKilled(data));
            EventBus.on('BIOME_ENTERED', (data) => this.onBiomeEntered(data));
        }
    }
    
    /**
     * Spawn boss for a biome
     * @param {string} biomeId
     */
    spawnBoss(biomeId) {
        const biome = BiomeConfig.types[biomeId];
        if (!biome || !biome.bossId) return;
        
        const bossConfig = EntityConfig.boss.types[biome.bossId];
        if (!bossConfig) return;
        
        // Get spawn location (center of biome or designated spot)
        const spawnPos = this.getBossSpawnPosition(biomeId);
        
        const boss = new Boss({
            x: spawnPos.x,
            y: spawnPos.y,
            bossType: biome.bossId,
            biomeId: biomeId,
            level: biome.levelRange.max // Boss is max level for biome
        });
        
        if (window.EntityManager) {
            EntityManager.add(boss);
        }
        
        this.bosses.set(biomeId, boss);
        
        // Emit spawn event
        if (window.EventBus) {
            EventBus.emit('BOSS_SPAWNED', { boss, biomeId });
        }
        
        console.log(`[BossSystem] Spawned ${boss.bossName} in ${biomeId}`);
    }
    
    getBossSpawnPosition(biomeId) {
        // TODO: Get from biome config or calculate
        switch (biomeId) {
            case 'desert':
                return { x: 25000, y: 30000 };
            case 'badlands':
                return { x: 30000, y: 30000 };
            default:
                return { x: 2000, y: 2000 }; // Default placeholder
        }
    }
    
    onEnemyKilled(data) {
        const { enemy } = data;
        if (!enemy?.isBoss) return;
        
        const biomeId = enemy.biomeId;
        
        // Remove from tracking
        this.bosses.delete(biomeId);
        
        // Start respawn timer
        const respawnTime = EntityConfig.boss.defaults.respawnTime * 1000;
        this.respawnTimers.set(biomeId, respawnTime);
        
        // Emit boss death event
        if (window.EventBus) {
            EventBus.emit('BOSS_KILLED', {
                boss: enemy,
                biomeId,
                respawnIn: respawnTime / 1000
            });
        }
        
        console.log(`[BossSystem] ${enemy.bossName} killed! Respawns in ${respawnTime/1000}s`);
    }
    
    onBiomeEntered(data) {
        const { biomeId } = data;
        
        // Check if boss should spawn
        if (!this.bosses.has(biomeId) && !this.respawnTimers.has(biomeId)) {
            this.spawnBoss(biomeId);
        }
    }
    
    update(dt) {
        // Update respawn timers
        for (const [biomeId, timer] of this.respawnTimers.entries()) {
            const newTimer = timer - dt;
            
            if (newTimer <= 0) {
                this.respawnTimers.delete(biomeId);
                this.spawnBoss(biomeId);
            } else {
                this.respawnTimers.set(biomeId, newTimer);
            }
        }
    }
    
    /**
     * Check if boss is alive in biome
     */
    isBossAlive(biomeId) {
        const boss = this.bosses.get(biomeId);
        return boss && boss.state !== 'dead';
    }
    
    /**
     * Get time until boss respawn
     */
    getRespawnTime(biomeId) {
        return this.respawnTimers.get(biomeId) || 0;
    }
}

window.BossSystem = new BossSystem();
if (window.Registry) Registry.register('BossSystem', window.BossSystem);
```

### Events.js Additions
```javascript
// Boss
BOSS_SPAWNED: 'BOSS_SPAWNED',     // { boss, biomeId }
BOSS_KILLED: 'BOSS_KILLED',       // { boss, biomeId, respawnIn }
BIOME_ENTERED: 'BIOME_ENTERED',   // { biomeId, hero }
```

### SystemConfig.js Addition
```javascript
{ global: 'BossSystem', priority: 23, init: true },
```

## Acceptance Criteria
- [x] Boss.js class created extending Enemy
- [x] EntityConfig.boss section with 4 bosses defined
- [x] BossSystem.js manages spawn/respawn
- [x] One boss per biome
- [x] Boss respawns on timer after death
- [x] Boss has enhanced stats (config-driven)
- [x] BOSS_SPAWNED event emitted
- [x] BOSS_KILLED event emitted with respawn time
- [x] Boss uses special loot table
- [x] Visual indicator (glow, scale) for boss
- [x] SystemConfig updated

## Notes
- Abilities are placeholder for future system
- Boss spawn positions need biome integration
- UI for boss health bar is separate work
- Boss mechanics (phases, special attacks) can be added later
