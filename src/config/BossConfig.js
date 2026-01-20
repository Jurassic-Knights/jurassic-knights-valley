/**
 * BossConfig - Boss Enemy Configurations
 *
 * Separated from EntityConfig for single responsibility.
 * Defines boss defaults and specific boss types.
 */

const BossConfig = {
    defaults: {
        gridSize: 3,
        width: 384,
        height: 384,
        health: 1000,
        maxHealth: 1000,
        damage: 50,
        attackRate: 0.5,
        attackRange: 150,
        speed: 40,
        aggroRange: 400,
        leashDistance: 800,
        xpReward: 500,
        respawnTime: 300,
        isBoss: true,
        threatLevel: 5,
        glowColor: '#FF4500'
    },

    types: {
        grasslands_alpha: {
            name: 'Alpha Raptor',
            spriteId: 'enemy_saurian_t4_01',
            species: 'velociraptor',
            biomeId: 'grasslands',
            health: 800,
            damage: 35,
            speed: 100,
            attackType: 'melee',
            xpReward: 300,
            lootTableId: 'boss_grasslands',
            abilities: ['pounce', 'call_pack'],
            glowColor: '#32CD32'
        }
    }
};

window.BossConfig = BossConfig;

