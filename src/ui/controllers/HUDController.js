/**
 * HUDController - Manages the Heads-Up Display
 *
 * Handles Stamina, Health, and Resource counters.
 * Listens to EventBus updates.
 */
class HUDController {
    constructor() {
        this.initListeners();
        Logger.info('[HUDController] Initialized');
    }

    initListeners() {
        if (!window.EventBus) return;

        EventBus.on(GameConstants.Events.HERO_STAMINA_CHANGE, (data) => this.updateStamina(data));
        EventBus.on(GameConstants.Events.HERO_HEALTH_CHANGE, (data) => this.updateHealth(data));
        EventBus.on(GameConstants.Events.INVENTORY_UPDATED, (data) => this.updateResources(data));
        EventBus.on(GameConstants.Events.HERO_HOME_STATE_CHANGE, (data) =>
            this.updateRestButton(data)
        );
    }

    updateStamina(data) {
        // Update new resolve bar (below quest)
        const fill = document.getElementById('resolve-fill');
        const text = document.getElementById('resolve-text');
        const percent = (data.current / data.max) * 100;

        if (fill) fill.style.width = `${percent}%`;
        if (text) text.textContent = `${Math.floor(data.current)} / ${Math.floor(data.max)}`;
    }

    updateHealth(data) {
        const bar = document.getElementById('health-bar');
        const text = document.getElementById('health-text');
        if (bar) bar.style.width = `${(data.current / data.max) * 100}%`;
        if (text) text.textContent = Math.floor(data.current);
    }

    updateRestButton(data) {
        const btn = document.getElementById('btn-rest');
        if (btn) btn.style.display = data.isHome ? 'flex' : 'none';

        // Re-bind click if needed, or rely on UIRoot binding
        // Ideally, Button Logic should be in a Controller too?
        // For now, UIRoot (UIManager) binds the click to emit 'REQUEST_REST'
        // This controller just handles VISIBILITY.
    }

    updateResources(inventory) {
        if (!inventory) return;

        const map = {
            scraps_t1_01: 'res-scrap',
            minerals_t1_01: 'res-iron',
            minerals_t2_01: 'res-fuel',
            gold: 'res-gold'
        };

        for (const [key, id] of Object.entries(map)) {
            const el = document.getElementById(id);
            if (el) {
                const amount = inventory[key] || 0;
                el.textContent = amount;
            }
        }
    }
}

// Register
window.HUDController = new HUDController();
if (window.Registry) Registry.register('HUDController', window.HUDController);

// ES6 Module Export
export { HUDController };
