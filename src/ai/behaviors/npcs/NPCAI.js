/**
 * NPCAI - NPC behavior for merchants, quest givers, and patrol NPCs
 *
 * Supports:
 * - Static (merchants)
 * - Patrol routes
 * - Dialogue triggers
 *
 * Owner: AI System
 */

const NPCAI = {
    /**
     * Update NPC AI state
     */
    updateState(npc, hero, dt) {
        if (!npc.active) return;

        switch (npc.state) {
            case 'idle':
                this.updateIdle(npc, hero, dt);
                break;
            case 'patrol':
                this.updatePatrol(npc, dt);
                break;
            case 'dialogue':
                this.updateDialogue(npc, hero, dt);
                break;
        }
    },

    /**
     * Idle behavior - check for player proximity
     */
    updateIdle(npc, hero, dt) {
        if (!hero) return;

        const dist = npc.distanceTo
            ? npc.distanceTo(hero)
            : Math.sqrt((hero.x - npc.x) ** 2 + (hero.y - npc.y) ** 2);

        // Show interaction prompt when player is close
        const interactRange = npc.interactRadius || 140;
        if (dist <= interactRange) {
            if (!npc.playerNearby) {
                npc.playerNearby = true;
                this.onPlayerApproach(npc, hero);
            }
        } else {
            if (npc.playerNearby) {
                npc.playerNearby = false;
                this.onPlayerLeave(npc);
            }
        }

        // Face the player when nearby
        if (npc.playerNearby) {
            npc.facingRight = hero.x > npc.x;
        }
    },

    /**
     * Patrol behavior
     */
    updatePatrol(npc, dt) {
        if (!npc.patrolPoints || npc.patrolPoints.length === 0) {
            npc.state = 'idle';
            return;
        }

        const target = npc.patrolPoints[npc.patrolIndex || 0];
        const dist = Math.sqrt((target.x - npc.x) ** 2 + (target.y - npc.y) ** 2);

        if (dist < 20) {
            // Wait at patrol point
            npc.patrolWait = (npc.patrolWait || 0) + dt;
            if (npc.patrolWait >= (npc.patrolWaitTime || 2000)) {
                npc.patrolWait = 0;
                npc.patrolIndex = ((npc.patrolIndex || 0) + 1) % npc.patrolPoints.length;
            }
        } else {
            // Move to patrol point
            const speed = (npc.speed || 50) * (dt / 1000);
            npc.x += ((target.x - npc.x) / dist) * speed;
            npc.y += ((target.y - npc.y) / dist) * speed;
            npc.facingRight = target.x > npc.x;
        }
    },

    /**
     * Dialogue state (player is interacting)
     */
    updateDialogue(npc, hero, dt) {
        // Face the player during dialogue
        if (hero) {
            npc.facingRight = hero.x > npc.x;
        }
        // Dialogue is handled by UI system
    },

    /**
     * Player approached NPC
     */
    onPlayerApproach(npc, hero) {
        if (window.EventBus) {
            EventBus.emit('NPC_PLAYER_NEARBY', {
                npc,
                hero
            });
        }
    },

    /**
     * Player left NPC range
     */
    onPlayerLeave(npc) {
        if (window.EventBus) {
            EventBus.emit('NPC_PLAYER_LEFT', { npc });
        }
    },

    /**
     * Start dialogue with NPC
     */
    startDialogue(npc) {
        npc.state = 'dialogue';

        if (window.EventBus) {
            EventBus.emit('NPC_DIALOGUE_START', { npc });
        }
    },

    /**
     * End dialogue
     */
    endDialogue(npc) {
        npc.state = 'idle';

        if (window.EventBus) {
            EventBus.emit('NPC_DIALOGUE_END', { npc });
        }
    }
};

window.NPCAI = NPCAI;

