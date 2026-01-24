/**
 * ContextActionUI - Context-Sensitive Action Button Manager
 *
 * Separated from UIManager for single responsibility.
 * Handles the floating context action button (REST, FORGE, UNLOCK, SHOP).
 */

import { Logger } from '../core/Logger';
import { EventBus } from '../core/EventBus';
import { GameConstants } from '../data/GameConstants';
import { AssetLoader } from '../core/AssetLoader';
import { AudioManager } from '../audio/AudioManager';
import { MerchantUI } from './MerchantUI';
// ForgeController accessed via Registry to avoid circular dependency
import { Registry } from '../core/Registry';


class ContextActionService {
    // Property declarations
    btn: HTMLElement | null = null;
    icon: HTMLElement | null = null;
    label: HTMLElement | null = null;
    activeContext: string | null = null;
    contextData: any = null;

    constructor() {
        // Properties initialized as class fields above
    }

    init() {
        this.btn = document.getElementById('btn-context-action');
        this.icon = document.getElementById('context-icon');
        this.label = document.getElementById('context-label');

        if (this.btn) {
            this.btn.addEventListener('click', () => this.execute());
        }

        // EventBus Listeners
        if (EventBus && GameConstants) {
            const E = GameConstants.Events;

            // Unlock
            EventBus.on(E.UI_UNLOCK_PROMPT, (data: any) => this.show('unlock', data));
            EventBus.on(E.UI_HIDE_UNLOCK_PROMPT, () => this.hide('unlock'));
            EventBus.on(E.ISLAND_UNLOCKED, () => this.hide('unlock'));

            // Rest/Home
            EventBus.on(E.HOME_BASE_ENTERED, () => this.show('rest'));
            EventBus.on(E.HOME_BASE_EXITED, () => this.hide('rest'));

            // Forge
            EventBus.on(E.FORGE_ENTERED, () => this.show('forge'));
            EventBus.on(E.FORGE_EXITED, () => this.hide('forge'));

            // Merchant
            EventBus.on(E.INTERACTION_OPPORTUNITY, (data: any) => {
                if (data.type === 'merchant') {
                    if (data.visible) this.show('merchant', data);
                    else this.hide('merchant');
                }
            });
        }

        Logger.debug('[ContextActionUI]', 'Initialized');
    }

    show(type, data = null) {
        if (!this.btn) return;

        this.activeContext = type;
        this.contextData = data;

        const config = {
            rest: { iconId: 'ui_icon_rest', label: 'REST' },
            forge: { iconId: 'ui_icon_forge', label: 'FORGE' },
            unlock: { iconId: 'ui_icon_lock', label: data ? `${data.unlockCost}G` : 'UNLOCK' },
            merchant: { iconId: 'ui_icon_shop', label: 'SHOP' }
        }[type] || { iconId: '', label: '' };

        // Update Icon
        if (this.icon && AssetLoader) {
            const path = AssetLoader.getImagePath(config.iconId);
            if (path) {
                this.icon.style.backgroundImage = `url('${path}')`;
                this.icon.style.backgroundSize = 'contain';
            }
        }

        // Update Label
        if (this.label) this.label.textContent = config.label;

        this.btn.classList.add('active');
        Logger.debug('[ContextActionUI]', `Shown: ${type}`);
    }

    hide(type) {
        if (this.activeContext !== type) return;

        this.activeContext = null;
        this.contextData = null;

        if (this.btn) this.btn.classList.remove('active');
        if (this.icon) this.icon.style.backgroundImage = 'none';
        if (this.label) this.label.textContent = '';

        Logger.debug('[ContextActionUI]', `Hidden: ${type}`);
    }

    execute() {
        if (!this.activeContext) return;

        Logger.debug('[ContextActionUI]', `Executing: ${this.activeContext}`);
        if (AudioManager) AudioManager.playSFX('sfx_ui_click');

        const E = GameConstants ? GameConstants.Events : null;

        switch (this.activeContext) {
            case 'rest':
                if (E && EventBus) EventBus.emit(E.REQUEST_REST);
                break;
            case 'forge':
                const forgeCtrl = Registry?.get('ForgeController');
                if (forgeCtrl) {
                    forgeCtrl.render('dashboard');
                    forgeCtrl.open();
                }
                break;
            case 'unlock':
                if (this.contextData && E && EventBus) {
                    EventBus.emit(E.REQUEST_UNLOCK, {
                        gridX: this.contextData.gridX,
                        gridY: this.contextData.gridY,
                        cost: this.contextData.unlockCost
                    });
                }
                break;
            case 'merchant':
                if (MerchantUI) MerchantUI.open();
                break;
        }
    }
}

// Create singleton and export
const ContextActionUI = new ContextActionService();

export { ContextActionService, ContextActionUI };
