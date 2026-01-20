/**
 * AIComponent
 * Manages behavioral state for autonomous entities (Dinosaurs, Army Units).
 *
 * Properties:
 * - State: 'IDLE', 'WANDER', 'CHASE', 'ATTACK', 'FLEE'
 * - Target: Entity reference (Hero, Enemy)
 * - Timers: Wander timers, decision intervals
 * - Navigation: Wander direction, pathing data
 */
class AIComponent extends Component {
    constructor(parent, config = {}) {
        super(parent);
        this.type = 'AIComponent';

        // State Machine
        this.state = config.state || 'WANDER';
        this.previousState = null;

        // Navigation
        this.wanderDirection = { x: 1, y: 0 };
        this.wanderTimer = 0;
        this.wanderIntervalMin = config.wanderIntervalMin || 2000;
        this.wanderIntervalMax = config.wanderIntervalMax || 5000;

        // Combat / Interaction
        this.target = null;
        this.combatCooldown = 0;

        // Aggro System (Enemy AI)
        this.aggroRange = config.aggroRange || 200;
        this.leashDistance = config.leashDistance || 500;
        this.attackRange = config.attackRange || 100;

        // Combat State
        this.attackCooldown = 0;
        this.attackWindup = 0;
        this.isAttacking = false;

        Logger.info(`[AIComponent] Attached to ${parent.constructor.name}`);
    }

    setState(newState) {
        if (this.state === newState) return;
        this.previousState = this.state;
        this.state = newState;
        // Logger.info(`[AI] ${this.parent.id} switched to ${newState}`);
    }

    /**
     * Helper to pick a random wander direction
     */
    randomizeWander() {
        const angle = Math.random() * Math.PI * 2;
        this.wanderDirection = {
            x: Math.cos(angle),
            y: Math.sin(angle)
        };
        this.wanderTimer =
            this.wanderIntervalMin +
            Math.random() * (this.wanderIntervalMax - this.wanderIntervalMin);
    }

    /**
     * Check if target is within aggro range
     */
    canAggro(target) {
        if (!target) return false;
        const dx = target.x - this.parent.x;
        const dy = target.y - this.parent.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        return dist <= this.aggroRange;
    }

    /**
     * Check if too far from spawn (should leash)
     */
    shouldLeash() {
        if (!this.parent.spawnX) return false;
        const dx = this.parent.x - this.parent.spawnX;
        const dy = this.parent.y - this.parent.spawnY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        return dist > this.leashDistance;
    }

    /**
     * Check if in attack range
     */
    inAttackRange(target) {
        if (!target) return false;
        const dx = target.x - this.parent.x;
        const dy = target.y - this.parent.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        return dist <= this.attackRange;
    }
}

window.AIComponent = AIComponent;

