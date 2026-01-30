/**
 * InteractionSystem
 * Handles entity interactions, specifically item pickups and magnetism.
 * Decouples logic from Game.js.
 */

import { Logger } from '@core/Logger';
import { EventBus } from '@core/EventBus';
import { GameConstants, getConfig } from '@data/GameConstants';
import { entityManager } from '@core/EntityManager';
import { spawnManager } from './SpawnManager';
import { IslandManager } from '../world/IslandManager';
import { AudioManager } from '../audio/AudioManager';
import { QuestManager } from '../gameplay/QuestManager';
import { VFXTriggerService } from './VFXTriggerService';
import { Registry } from '@core/Registry';

import type { IGame, IEntity } from '../types/core.d';

class InteractionSystem {
    game: IGame | null = null;
    magnetActiveCount: number = 0;

    constructor() {
        Logger.info('[InteractionSystem] Constructed');
    }

    init(game: IGame) {
        this.game = game;
        this.initListeners();
        Logger.info('[InteractionSystem] Initialized');
    }

    initListeners() {
        if (EventBus) {
            EventBus.on(GameConstants.Events.REQUEST_MAGNET, () => this.triggerMagnet());
        }
    }

    update(dt: number) {
        if (!entityManager || !this.game.hero) return;

        const hero = this.game.hero;
        const items = entityManager.getByType('DroppedItem');

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
    updateSpatialTriggers(hero: IEntity) {
        // Merchant Button
        if (spawnManager && EventBus) {
            const nearbyMerchant = spawnManager.getMerchantNearHero(hero);
            EventBus.emit(GameConstants.Events.INTERACTION_OPPORTUNITY, {
                type: 'merchant',
                target: nearbyMerchant,
                visible: !!nearbyMerchant
            });
        }

        // Bridge Unlocks
        if (IslandManager) {
            const lockedIsland = IslandManager.getUnlockTrigger(hero.x, hero.y);
            if (lockedIsland) {
                if (EventBus) EventBus.emit(GameConstants.Events.UI_UNLOCK_PROMPT, lockedIsland);
            } else {
                if (EventBus) EventBus.emit(GameConstants.Events.UI_HIDE_UNLOCK_PROMPT);
            }
        }
    }

    /**
     * Handle item collection
     */
    collectItem(hero: IEntity, item: IEntity) {
        // Hero logic (add to inventory)
        // Hero logic (add to inventory)
        const type = item.resourceType;
        const amount = (item as any).amount || 1;

        // SFX - play for EVERY item pickup (no debounce)
        if (AudioManager) {
            AudioManager.playSFX('sfx_resource_collect');
        }

        // Add to Inventory
        if (hero.components.inventory) {
            hero.components.inventory.add(type, amount);
        }

        // Quest Update
        if (QuestManager) QuestManager.onCollect(type, amount);

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
        if (entityManager) entityManager.remove(item);

        // Events & Feedback
        if (EventBus) {
            EventBus.emit(GameConstants.Events.INVENTORY_UPDATED, hero.components.inventory);
        }

        // SFX is handled by Hero.collect or specific item logic usually,
        // but if not, we can do it here. Hero.collect() usually plays 'sfx_pickup'.
    }

    /**
     * Trigger global magnet effect
     */
    triggerMagnet() {
        if (!this.game.hero || !entityManager) return;

        // Check cooldown or resource cost if applicable (currently free/event based)

        let count = 0;
        const items = entityManager.getByType('DroppedItem');
        for (const item of items) {
            if (item.active && !item.isMagnetized) {
                item.magnetize(this.game.hero);
                count++;
            }
        }

        if (count > 0) {
            this.magnetActiveCount = count;
            Logger.info(`[InteractionSystem] Magnet triggered for ${count} items`);
            if (AudioManager) AudioManager.playSFX('sfx_ui_magnet');
        }
    }

    /**
     * Trigger "Singularity" VFX when all magnetized items arrive
     */
    triggerMagnetCompletionVFX(hero: IEntity) {
        if (VFXTriggerService) {
            VFXTriggerService.triggerMagnetCompletionVFX(hero);
        }
    }
}

// Create singleton and export
const interactionSystem = new InteractionSystem();
if (Registry) Registry.register('InteractionSystem', interactionSystem);

export { InteractionSystem, interactionSystem };
