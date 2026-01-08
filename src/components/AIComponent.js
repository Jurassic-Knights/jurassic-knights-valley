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

        console.log(`[AIComponent] Attached to ${parent.constructor.name}`);
    }

    setState(newState) {
        if (this.state === newState) return;
        this.previousState = this.state;
        this.state = newState;
        // console.log(`[AI] ${this.parent.id} switched to ${newState}`);
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
        this.wanderTimer = this.wanderIntervalMin + Math.random() * (this.wanderIntervalMax - this.wanderIntervalMin);
    }
}

window.AIComponent = AIComponent;
