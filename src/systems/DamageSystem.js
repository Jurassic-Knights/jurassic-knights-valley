/**
 * DamageSystem
 * Centralized damage calculation and application.
 * Handles defense mitigation, crits, and damage events.
 * 
 * Work Package: 06-damage-system.md
 */
const DamageSystem = {
    game: null,

    /**
     * Calculate final damage after defense mitigation
     * @param {number} baseDamage - Raw damage
     * @param {number} defense - Target's defense stat
     * @returns {number} Final damage
     */
    calculateDamage(baseDamage, defense = 0) {
        // Diminishing returns formula: defense / (defense + 100)
        const reduction = defense / (defense + 100);
        const finalDamage = Math.floor(baseDamage * (1 - reduction));
        return Math.max(1, finalDamage); // Minimum 1 damage
    },

    /**
     * Calculate crit damage
     * @param {number} baseDamage
     * @param {number} critChance - 0-1
     * @param {number} critMultiplier - e.g., 1.5
     * @returns {{ damage: number, isCrit: boolean }}
     */
    rollCrit(baseDamage, critChance = 0, critMultiplier = 1.5) {
        const isCrit = Math.random() < critChance;
        const damage = isCrit ? Math.floor(baseDamage * critMultiplier) : baseDamage;
        return { damage, isCrit };
    },

    /**
     * Apply damage from attacker to target
     * @param {Entity} attacker
     * @param {Entity} target
     * @param {number} baseDamage
     * @returns {{ dealt: number, killed: boolean }}
     */
    applyDamage(attacker, target, baseDamage) {
        if (!target || !target.components?.health) return { dealt: 0, killed: false };

        // Get defense
        const defense = target.components.stats?.getDefense?.() ||
            target.components.stats?.defense || 0;

        // Calculate mitigated damage
        const mitigatedDamage = this.calculateDamage(baseDamage, defense);

        // Apply
        const killed = target.components.health.takeDamage(mitigatedDamage);

        // Emit event
        if (window.EventBus && window.GameConstants) {
            EventBus.emit(GameConstants.Events.DAMAGE_DEALT, {
                attacker,
                target,
                baseDamage,
                finalDamage: mitigatedDamage,
                killed
            });
        }

        return { dealt: mitigatedDamage, killed };
    },

    init(game) {
        this.game = game;
        this.initListeners();
        console.log('[DamageSystem] Initialized');
    },

    initListeners() {
        if (window.EventBus && window.GameConstants) {
            // Listen for enemy attacks
            EventBus.on(GameConstants.Events.ENEMY_ATTACK, (data) => this.onEnemyAttack(data));
        }
    },

    onEnemyAttack(data) {
        const { attacker, target, damage } = data;
        if (!target || target.entityType !== EntityTypes.HERO) return;

        const result = this.applyDamage(attacker, target, damage);

        // VFX
        if (window.VFXController && window.VFXConfig) {
            VFXController.playForeground(target.x, target.y, VFXConfig.HERO?.HIT || {
                type: 'burst',
                color: '#FF0000',
                count: 5
            });
        }

        // SFX
        if (window.AudioManager) {
            AudioManager.playSFX('sfx_hero_hurt');
        }

        // Check death
        if (result.killed) {
            if (window.EventBus && window.GameConstants) {
                EventBus.emit(GameConstants.Events.HERO_DIED, { hero: target });
            }
        }
    }
};

window.DamageSystem = DamageSystem;
if (window.Registry) Registry.register('DamageSystem', DamageSystem);
