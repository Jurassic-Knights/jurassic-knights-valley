/**
 * HUDController - Manages the Heads-Up Display
 *
 * Handles Stamina, Health, and Resource counters.
 * Listens to EventBus updates.
 */

import { Logger } from '@core/Logger';
import { EventBus } from '@core/EventBus';
import { GameConstants, getConfig } from '@data/GameConstants';
import { Registry } from '@core/Registry';
import { UIBinder } from '@core/UIBinder';
import { SFX } from '@audio/ProceduralSFX';

class HUDControllerClass {
    private lastPipCount: number = -1;
    private readonly RESOLVE_PER_PIP = 5;

    constructor() {
        this.initListeners();
        Logger.info('[HUDController] Initialized');
    }

    initListeners() {
        if (!EventBus) return;

        EventBus.on(
            GameConstants.Events.HERO_STAMINA_CHANGE,
            (data: { current: number; max: number }) => this.updateStamina(data)
        );
        EventBus.on(
            GameConstants.Events.HERO_HEALTH_CHANGE,
            (data: { current: number; max: number }) => this.updateHealth(data)
        );
        EventBus.on(
            GameConstants.Events.INVENTORY_UPDATED,
            (data: { resources?: Record<string, number>; gold?: number }) =>
                this.updateResources(data)
        );
        EventBus.on(GameConstants.Events.HERO_HOME_STATE_CHANGE, (data: { isHome: boolean }) =>
            this.updateRestButton(data)
        );
    }

    updateStamina(data: { current: number; max: number }) {
        const barContainer = UIBinder.get('ui-resolve-bar');
        if (!barContainer) return;

        // Ensure container exists
        const pipsContainer = UIBinder.ensureContainer(
            'resolve-pips-container',
            'ui-resolve-bar'
        );
        if (!pipsContainer) return;

        // 1. Calculate Target Pip Count (Dynamic Scaling)
        const totalPips = Math.ceil(data.max / this.RESOLVE_PER_PIP);
        const currentActivePips = Math.ceil(data.current / this.RESOLVE_PER_PIP);

        // 2. Rebuild DOM if max resolve changed (or init)
        if (pipsContainer.children.length !== totalPips) {
            // Clean up old artifacts if we are rebuilding
            const oldFill = document.getElementById('resolve-fill');
            if (oldFill) oldFill.remove();

            pipsContainer.innerHTML = '';
            for (let i = 0; i < totalPips; i++) {
                const pip = document.createElement('div');
                pip.className = 'resolve-pip';
                pipsContainer.appendChild(pip);
            }
            // Reset last count on rebuild to avoid animation spam
            this.lastPipCount = currentActivePips;
        }

        // 3. Update States
        const pips = Array.from(pipsContainer.children) as HTMLElement[];

        pips.forEach((pip, index) => {
            const isActive = index < currentActivePips;

            if (isActive) {
                // Determine if this pip needs to be filled
                if (!pip.classList.contains('active')) {
                    pip.classList.add('active');
                    pip.classList.remove('lost');
                }
            } else {
                // It is empty. Did it JUST lose its active state?
                if (pip.classList.contains('active')) {
                    pip.classList.remove('active');
                    // Only trigger shatter if we aren't initializing (lastPipCount check)
                    // But logic dictates if it WAS active in DOM, it's a valid loss frame.
                    pip.classList.add('lost');

                    // Play Sound
                    SFX?.play('sfx_ui_resolve_shatter');

                    // Clean up animation class after it finishes to reset state strictly
                    setTimeout(() => {
                        pip.classList.remove('lost');
                    }, 900);
                }
            }
        });

        this.lastPipCount = currentActivePips;
    }

    updateHealth(data: { current: number; max: number }) {
        const bar = UIBinder.get('health-bar');
        const text = UIBinder.get('health-text');
        if (bar) bar.style.width = `${(data.current / data.max) * 100}%`;
        if (text) text.textContent = String(Math.floor(data.current));
    }

    updateRestButton(data: { isHome: boolean }) {
        const btn = UIBinder.get('btn-rest');
        if (btn) btn.style.display = data.isHome ? 'flex' : 'none';
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
            const el = UIBinder.get(id as string);
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
