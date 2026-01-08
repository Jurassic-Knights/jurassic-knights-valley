/**
 * InteractionSystem
 * Handles entity interactions, specifically item pickups and magnetism.
 * Decouples logic from Game.js.
 */
class InteractionSystem {
    constructor() {
        this.game = null;
        this.magnetActiveCount = 0;
        console.log('[InteractionSystem] Constructed');
    }

    init(game) {
        this.game = game;
        this.initListeners();
        console.log('[InteractionSystem] Initialized');
    }

    initListeners() {
        if (window.EventBus) {
            EventBus.on(GameConstants.Events.REQUEST_MAGNET, () => this.triggerMagnet());
        }
    }

    update(dt) {
        if (!window.EntityManager || !this.game.hero) return;

        const hero = this.game.hero;
        const items = EntityManager.getByType('DroppedItem');

        for (const item of items) {
            if (!item.active) continue;

            // 1. Magnet Logic Check (Auto-magnetize if close enough even without global trigger)
            if (item.shouldAutoMagnetize(hero)) {
                item.magnetize(hero);
            }

            // 2. Pickup Logic
            if (item.canBePickedUpBy(hero)) {
                this.collectItem(hero, item);
            }
        }

        // 3. Spatial Triggers (UI Prompts)
        this.updateSpatialTriggers(hero);
    }

    /**
     * Check for spatial triggers (Merchant, Bridge)
     * Replaces Game.updateUITriggers
     */
    updateSpatialTriggers(hero) {
        // Merchant Button
        if (window.SpawnManager && window.EventBus) {
            const nearbyMerchant = SpawnManager.getMerchantNearHero(hero);
            EventBus.emit(GameConstants.Events.INTERACTION_OPPORTUNITY, {
                type: 'merchant',
                target: nearbyMerchant,
                visible: !!nearbyMerchant
            });
        }

        // Bridge Unlocks
        if (window.IslandManager) {
            const lockedIsland = IslandManager.getUnlockTrigger(hero.x, hero.y);
            if (lockedIsland) {
                if (window.EventBus) EventBus.emit(GameConstants.Events.UI_UNLOCK_PROMPT, lockedIsland);
            } else {
                if (window.EventBus) EventBus.emit(GameConstants.Events.UI_HIDE_UNLOCK_PROMPT);
            }
        }
    }

    /**
     * Handle item collection
     */
    collectItem(hero, item) {
        // Hero logic (add to inventory)
        // Hero logic (add to inventory)
        const type = item.resourceType;
        const amount = item.amount || 1;

        // SFX
        if (window.AudioManager) AudioManager.playSFX('sfx_resource_collect');

        // Add to Inventory
        if (hero.components.inventory) {
            hero.components.inventory.add(type, amount);
        }

        // Quest Update
        if (window.QuestManager) QuestManager.onCollect(type, amount);

        // Check magnet completion logic
        if (item.isMagnetized && this.magnetActiveCount > 0) {
            this.magnetActiveCount--;
            if (this.magnetActiveCount <= 0) {
                this.magnetActiveCount = 0;
                this.triggerMagnetCompletionVFX(hero);
            }
        }

        // Deactivate
        item.active = false;
        if (window.EntityManager) EntityManager.remove(item);

        // Events & Feedback
        if (window.EventBus) {
            EventBus.emit(GameConstants.Events.INVENTORY_UPDATED, hero.inventory);
        }

        // SFX is handled by Hero.collect or specific item logic usually, 
        // but if not, we can do it here. Hero.collect() usually plays 'sfx_pickup'.
    }

    /**
     * Trigger global magnet effect
     */
    triggerMagnet() {
        if (!this.game.hero || !window.EntityManager) return;

        // Check cooldown or resource cost if applicable (currently free/event based)

        let count = 0;
        const items = EntityManager.getByType('DroppedItem');
        for (const item of items) {
            if (item.active && !item.isMagnetized) {
                item.magnetize(this.game.hero);
                count++;
            }
        }

        if (count > 0) {
            this.magnetActiveCount = count;
            console.log(`[InteractionSystem] Magnet triggered for ${count} items`);
            if (window.AudioManager) AudioManager.playSFX('sfx_ui_magnet');
        }
    }

    /**
     * Trigger "Singularity" VFX when all magnetized items arrive
     */
    triggerMagnetCompletionVFX(hero) {
        if (window.VFXTriggerService) {
            VFXTriggerService.triggerMagnetCompletionVFX(hero);
        }
    }
}

window.InteractionSystem = new InteractionSystem();
if (window.Registry) Registry.register('InteractionSystem', window.InteractionSystem);
