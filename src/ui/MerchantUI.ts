/**
 * MerchantPanel - Controller for merchant purchase modal
 */

import { Logger } from '@core/Logger';
import { EventBus } from '@core/EventBus';
import { GameConstants } from '@data/GameConstants';
import { Registry } from '@core/Registry';
import { UIPanel } from './core/UIPanel';
interface IslandInteraction {
    islandId: string;
    islandName: string;
    [key: string]: unknown;
}

class MerchantPanel extends UIPanel {
    // Property declarations
    currentMerchant: IslandInteraction | null = null;

    constructor() {
        super('modal-merchant', {
            dockable: true,
            defaultDock: 'ui-hud-right'
        });
        this.init();
    }

    init() {
        Logger.info('[MerchantPanel] Initializing...');
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.bindEvents());
        } else {
            this.bindEvents();
        }
    }

    bindEvents() {
        // Setup purchase button click
        const btnPurchase = document.getElementById('btn-purchase');
        if (btnPurchase) {
            btnPurchase.onclick = () => {
                this.toggle(); // Use toggle for consistency
            };
        }

        const btnClose = document.getElementById('btn-close-merchant');
        if (btnClose) {
            btnClose.addEventListener('click', () => {
                this.close();
            });
        }

        const upgradeTypes = ['resourceSlots', 'autoChance', 'respawnTime'];
        for (const type of upgradeTypes) {
            const btn = document.getElementById(`btn-upgrade-${type}`);
            if (btn) {
                // Clone to remove old listeners (prevent double binding)
                const newBtn = btn.cloneNode(true);
                btn.parentNode.replaceChild(newBtn, btn);
                newBtn.addEventListener('click', () => {
                    this.purchaseUpgrade(type);
                });
            }
        }

        this.bindBusEvents();
    }

    bindBusEvents() {
        if (EventBus) {
            EventBus.on('UPGRADE_PURCHASED', () => {
                if (this.isOpen) this.render();
            });
            if (GameConstants?.Events) {
                EventBus.on(GameConstants.Events.OPEN_MERCHANT, () => this.open());
            }

            // Interaction Event
            EventBus.on(
                'INTERACTION_OPPORTUNITY',
                (data: { type: string; target?: IslandInteraction; visible?: boolean }) => {
                    const { type, target, visible } = data;
                    if (type === 'merchant') {
                        if (visible && target) {
                            this.updateButtonVisibility(target);
                        } else {
                            this.updateButtonVisibility(null);
                        }
                    }
                }
            );
        }
    }

    /**
     * Override Open logic
     */
    onOpen() {
        Logger.info(
            '[MerchantPanel] Opening for:',
            this.currentMerchant ? this.currentMerchant.islandName : 'None'
        );
        if (!this.currentMerchant) {
            // If opened manually or without target, maybe close?
            // Or just render empty?
            this.close();
            return;
        }
        this.render();
    }

    updateButtonVisibility(merchant: IslandInteraction | null) {
        // Always track the merchant opportunity
        if (merchant) {
            this.currentMerchant = merchant;
        }

        // Handle Legacy Button (if exists)
        const btn = document.getElementById('btn-purchase');
        if (!btn) return;

        if (this.isOpen) {
            btn.style.display = 'none';
            return;
        }

        if (merchant) {
            btn.style.display = 'flex';
        } else {
            btn.style.display = 'none';
        }
    }

    render() {
        if (!this.currentMerchant) return;

        const title = document.getElementById('merchant-title');
        if (title) {
            title.textContent = this.currentMerchant.islandName?.toUpperCase() || 'MERCHANT';
        }
        // Island logic removed
    }

    renderUpgradeRow(type: string, data: any, label: string, unit: string, customDisplay: string | null = null) {
        // Obsolete
    }

    purchaseUpgrade(type: string) {
        // Obsolete
    }
}

// Create singleton and export
const MerchantUI = new MerchantPanel();
if (Registry) Registry.register('MerchantUI', MerchantUI);

export { MerchantPanel, MerchantUI };
