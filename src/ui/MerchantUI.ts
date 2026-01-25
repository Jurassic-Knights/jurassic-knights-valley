/**
 * MerchantPanel - Controller for merchant purchase modal
 */

import { Logger } from '../core/Logger';
import { EventBus } from '../core/EventBus';
import { IslandUpgrades } from '../gameplay/IslandUpgrades';
import { Registry } from '../core/Registry';
import { UIPanel } from './core/UIPanel';
import type { Merchant } from '../types/ui';


class MerchantPanel extends UIPanel {
    // Property declarations
    currentMerchant: any = null;

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

            // Interaction Event
            EventBus.on('INTERACTION_OPPORTUNITY', (data: { type: string; target?: Merchant; visible?: boolean }) => {
                const { type, target, visible } = data;
                if (type === 'merchant') {
                    if (visible && target) {
                        this.updateButtonVisibility(target);
                    } else {
                        this.updateButtonVisibility(null);
                    }
                }
            });
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

    updateButtonVisibility(merchant) {
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
        if (!this.currentMerchant || !IslandUpgrades) return;

        const [gridX, gridY] = this.currentMerchant.islandId.split('_').map(Number);
        const island = IslandUpgrades.getIsland(gridX, gridY);
        if (!island) return;

        const title = document.getElementById('merchant-title');
        if (title) {
            title.textContent = island.name.toUpperCase();
        }

        this.renderUpgradeRow('resourceSlots', island.resourceSlots, 'Resource Slots', 'nodes');
        this.renderUpgradeRow('autoChance', island.autoChance, 'Auto Collect', '%');

        const currentRespawn = IslandUpgrades.calculateRespawnTime(
            island.respawnTime.level,
            30
        ).toFixed(1);
        const nextRespawn = IslandUpgrades.calculateRespawnTime(
            island.respawnTime.level + 1,
            30
        ).toFixed(1);
        const respawnText = `${island.respawnTime.level}/${island.respawnTime.max} lvl (${currentRespawn}s -> ${nextRespawn}s)`;
        this.renderUpgradeRow(
            'respawnTime',
            island.respawnTime,
            'Production Speed',
            'lvl',
            respawnText
        );
    }

    renderUpgradeRow(type, data, label, unit, customDisplay = null) {
        const levelEl = document.getElementById(`upgrade-${type}-level`);
        const costEl = document.getElementById(`upgrade-${type}-cost`);
        const btn = document.getElementById(`btn-upgrade-${type}`);

        if (levelEl) {
            levelEl.textContent = customDisplay
                ? customDisplay
                : `${data.level}/${data.max} ${unit}`;
        }

        if (costEl) {
            const cost = IslandUpgrades.getUpgradeCost(type, data.level);
            costEl.textContent = data.level >= data.max ? 'MAX' : `${cost} Gold`;
        }

        if (btn) {
            (btn as HTMLButtonElement).disabled = data.level >= data.max;
        }
    }

    purchaseUpgrade(type) {
        if (!this.currentMerchant || !IslandUpgrades) return;

        const [gridX, gridY] = this.currentMerchant.islandId.split('_').map(Number);
        const island = IslandUpgrades.getIsland(gridX, gridY);
        if (!island) return;

        const upgrade = island[type];
        if (!upgrade || upgrade.level >= upgrade.max) return;

        const cost = IslandUpgrades.getUpgradeCost(type, upgrade.level);

        if (EventBus) {
            EventBus.emit('REQUEST_UPGRADE', {
                gridX: gridX,
                gridY: gridY,
                type: type,
                cost: cost
            });
        }
    }
}

// Create singleton and export
const MerchantUI = new MerchantPanel();
if (Registry) Registry.register('MerchantUI', MerchantUI);

export { MerchantPanel, MerchantUI };
