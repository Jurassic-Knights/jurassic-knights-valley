/**
 * InteractionSystem
 * Handles entity interactions, specifically item pickups and magnetism.
 * Decouples logic from Game.js.
 */

import { Logger } from '@core/Logger';
import { EventBus } from '@core/EventBus';
import { entityManager } from '@core/EntityManager';
// import removed
import type { DroppedItem } from '../gameplay/DroppedItem';
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
            EventBus.on('REQUEST_MAGNET', () => this.triggerMagnet());
        }
    }

    update(_dt: number) {
        if (!entityManager || !this.game || !this.game.hero) return;

        const hero = this.game.hero;
        const items = entityManager.getByType('DroppedItem');

        for (const item of items) {
            if (!item.active) continue;

            // 1. Magnet Logic Check (Auto-magnetize if close enough even without global trigger)
            if ((item as any).shouldAutoMagnetize?.(hero)) {
                (item as any).magnetize(hero);
            }

            // 2. Pickup Logic
            if ((item as any).canBePickedUpBy?.(hero)) {
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
    updateSpatialTriggers(_hero: IEntity) {
        // Merchant Button (merchants removed; placeholder for future map-placed merchants)
        if (EventBus) {
            EventBus.emit('INTERACTION_OPPORTUNITY', {
                type: 'merchant',
                target: null,
                visible: false
            });
        }
    }

    /**
     * Handle item collection
     */
    collectItem(hero: IEntity, item: IEntity) {
        // Hero logic (add to inventory)
        // Hero logic (add to inventory)
        const type = item.resourceType;
        const amount = (item as DroppedItem).amount || 1;

        // SFX - play for EVERY item pickup (no debounce)
        if (AudioManager) {
            AudioManager.playSFX('sfx_resource_collect');
        }

        // Add to Inventory
        if (hero.components?.inventory) {
            (hero.components.inventory as any).add(type, amount);
        }

        // Quest Update
        if (QuestManager && type) QuestManager.onCollect(type, amount);

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
            EventBus.emit('INVENTORY_UPDATED', (hero.components as any)?.inventory);
        }

        // SFX is handled by Hero.collect or specific item logic usually,
        // but if not, we can do it here. Hero.collect() usually plays 'sfx_pickup'.
    }

    /**
     * Trigger global magnet effect
     */
    triggerMagnet() {
        if (!this.game || !this.game.hero || !entityManager) return;

        // Check cooldown or resource cost if applicable (currently free/event based)

        let count = 0;
        const items = entityManager.getByType('DroppedItem');
        for (const item of items) {
            if (item.active && !(item as any).isMagnetized) {
                (item as any).magnetize(this.game.hero);
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
