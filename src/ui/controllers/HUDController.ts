/**
 * HUDController - Manages the Heads-Up Display
 *
 * Handles Stamina, Health, and Resource counters.
 * Listens to EventBus updates.
 */

import { Logger } from '../../core/Logger';
import { EventBus } from '../../core/EventBus';
import { GameConstants, getConfig } from '../../data/GameConstants';
import { Registry } from '../../core/Registry';


class HUDControllerClass {
    constructor() {
        this.initListeners();
        Logger.info('[HUDController] Initialized');
    }

    initListeners() {
        if (!EventBus) return;

        EventBus.on(GameConstants.Events.HERO_STAMINA_CHANGE, (data: { current: number; max: number }) => this.updateStamina(data));
        EventBus.on(GameConstants.Events.HERO_HEALTH_CHANGE, (data: { current: number; max: number }) => this.updateHealth(data));
        EventBus.on(GameConstants.Events.INVENTORY_UPDATED, (data: { resources?: Record<string, number>; gold?: number }) => this.updateResources(data));
        EventBus.on(GameConstants.Events.HERO_HOME_STATE_CHANGE, (data: { isHome: boolean }) =>
            this.updateRestButton(data)
        );
    }

    updateStamina(data: { current: number; max: number }) {
        // Update new resolve bar (below quest)
        const fill = document.getElementById('resolve-fill');
        const text = document.getElementById('resolve-text');
        const percent = (data.current / data.max) * 100;

        if (fill) fill.style.width = `${percent}%`;
        if (text) text.textContent = `${Math.floor(data.current)} / ${Math.floor(data.max)}`;
    }

    updateHealth(data: { current: number; max: number }) {
        const bar = document.getElementById('health-bar');
        const text = document.getElementById('health-text');
        if (bar) bar.style.width = `${(data.current / data.max) * 100}%`;
        if (text) text.textContent = String(Math.floor(data.current));
    }

    updateRestButton(data: { isHome: boolean }) {
        const btn = document.getElementById('btn-rest');
        if (btn) btn.style.display = data.isHome ? 'flex' : 'none';

        // Re-bind click if needed, or rely on UIRoot binding
        // Ideally, Button Logic should be in a Controller too?
        // For now, UIRoot (UIManager) binds the click to emit 'REQUEST_REST'
        // This controller just handles VISIBILITY.
    }

    updateResources(inventory: any) {
        if (!inventory) return;

        const map: any = {
            scraps_t1_01: 'res-scrap',
            minerals_t1_01: 'res-iron',
            minerals_t2_01: 'res-fuel',
            gold: 'res-gold'
        };

        for (const [key, id] of Object.entries(map)) {
            const el = document.getElementById(id as string);
            if (el) {
                const amount = inventory[key] || 0;
                el.textContent = String(amount);
            }
        }
    }
}

// Register
const HUDController = new HUDControllerClass();
if (Registry) Registry.register('HUDController', HUDController);

// ES6 Module Export
export { HUDControllerClass, HUDController };
