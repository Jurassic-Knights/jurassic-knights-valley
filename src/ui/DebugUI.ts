/**
 * DebugUI - Debug cheat bar controls
 *
 * Owner: Director
 */

import { Logger } from '@core/Logger';
import { WorldManager } from '../world/WorldManager';
import { PlatformManager } from '@core/PlatformManager';
import { GameRenderer } from '@core/GameRenderer';
import { timeSystem } from '@systems/TimeSystem';
import { GameConstants, getConfig } from '@data/GameConstants';
import { EventBus } from '@core/EventBus';
import { weatherSystem } from '@systems/WeatherSystem';
import { GameInstance } from '@core/Game';
import { Registry } from '@core/Registry';
import { GameState } from '@core/State';
import { entityManager } from '@core/EntityManager';
import { CollisionSystem } from '@systems/CollisionSystem';
import { DOMUtils } from '@core/DOMUtils';
import { setupOverrideDropdowns } from './DebugUIOverrides';

const DebugUI = {
    container: null as HTMLElement | null,

    /**
     * Initialize debug UI
     */
    init() {
        this.container = document.getElementById('cheat-bar');
        if (!this.container) {
            Logger.warn('[DebugUI] Cheat bar not found');
            return;
        }

        this.setupPlatformToggle();
        this.setupDebugToggle();
        this.setupMerchantDebug();
        this.setupTimeDebug();
        setupOverrideDropdowns();
        this.updateActiveButton();

        Logger.info('[DebugUI] Initialized');
    },

    /**
     * Setup merchant debug buttons
     */
    setupMerchantDebug() {
        // Unlock all islands button
        const unlockBtn = DOMUtils.create('button', {
            text: 'Unlock All',
            onClick: () => {
                if (WorldManager) {
                    for (const island of (WorldManager as unknown as { islands: { unlocked: boolean }[] }).islands) {
                        island.unlocked = true;
                    }
                    Logger.info('[DebugUI] All islands unlocked!');
                }
            }
        });
        this.addControl('Islands', unlockBtn);

        // Teleport to merchant button
        const tpBtn = DOMUtils.create('button', {
            text: 'Go to Merchant',
            onClick: () => {
                if (entityManager && GameInstance?.hero) {
                    // Merchant is a type of entity now, usually 'Merchant' or 'NPC'
                    // Pivot: Using EntityManager to find the first Merchant
                    const merchants = entityManager.getByType('Merchant');
                    const merchant = merchants[0];

                    if (merchant) {
                        GameInstance.hero.x = merchant.x;
                        GameInstance.hero.y = merchant.y - 50; // Slightly above
                        Logger.info('[DebugUI] Teleported to merchant');
                    } else {
                        Logger.warn('[DebugUI] No merchants found');
                    }
                }
            }
        });
        this.addControl('Teleport', tpBtn);

        // Reset Gold button
        const goldBtn = DOMUtils.create('button', {
            text: '+100k Gold',
            onClick: () => {
                GameState.set('gold', 100000);
                if (GameInstance?.hero?.inventory) {
                    GameInstance.hero.inventory.gold = 100000;
                }
                Logger.info('[DebugUI] Gold set to 100000');
            }
        });
        this.addControl('Gold', goldBtn);
    },

    /**
     * Setup Time & Weather debug display
     */
    setupTimeDebug() {
        // Container for time stats
        const container = DOMUtils.create('div', {
            styles: {
                fontSize: '12px',
                color: '#aaa',
                display: 'flex',
                gap: '10px',
                alignItems: 'center'
            }
        });

        const stats = DOMUtils.create('span', {
            id: 'debug-time-stats',
            text: 'Waiting for time...'
        });
        container.appendChild(stats);

        // Advance Day Button
        const advanceBtn = DOMUtils.create('button', {
            text: '+1 Day',
            styles: { padding: '2px 5px' },
            onClick: () => {
                if (timeSystem) {
                    // Force advance time
                    const secondsPerDay = getConfig().Time.REAL_SECONDS_PER_GAME_DAY;
                    timeSystem.totalTime += secondsPerDay;
                    timeSystem.handleNewDay(); // Manually trigger logic to ensure events fire
                }
            }
        });

        container.appendChild(advanceBtn);
        this.addControl('Time', container);

        // Hook into event bus to update UI
        if (EventBus) {
            EventBus.on(GameConstants.Events.TIME_TICK as 'TIME_TICK', (data: any) => {
                const season = data.season ? data.season.substring(0, 3) : '???';
                const weather = weatherSystem ? weatherSystem.currentWeather : '---';
                stats.textContent = `D${data.dayCount} ${season} | ${data.phase} | ${weather}`;
            });
        }
    },

    /**
     * Setup platform toggle buttons
     */
    setupPlatformToggle() {
        const mobileBtn = document.getElementById('cheat-mobile');
        const pcBtn = document.getElementById('cheat-pc');

        if (mobileBtn) {
            mobileBtn.addEventListener('click', () => {
                PlatformManager.setMode('mobile');
                this.updateActiveButton();
            });
        }

        if (pcBtn) {
            pcBtn.addEventListener('click', () => {
                PlatformManager.setMode('pc');
                this.updateActiveButton();
            });
        }
    },

    /**
     * Setup debug toggle button
     */
    setupDebugToggle() {
        const btn = DOMUtils.create('button', {
            text: 'Toggle Debug',
            onClick: () => {
                if (GameRenderer) {
                    const isActive = GameRenderer.toggleDebug();
                    btn.classList.toggle('active', isActive);
                }
            }
        });

        // Sync initial state
        if (GameRenderer && GameRenderer.debugMode) {
            btn.classList.add('active');
        }

        this.addControl('Debug', btn);

        // Grid Toggle (separate)
        const gridBtn = DOMUtils.create('button', {
            text: 'Toggle Grid',
            onClick: () => {
                if (GameRenderer) {
                    const isActive = GameRenderer.toggleGrid();
                    gridBtn.classList.toggle('active', isActive);
                }
            }
        });
        this.addControl('Grid', gridBtn);

        // Collision Debug Toggle
        const colBtn = DOMUtils.create('button', {
            text: 'Hitboxes',
            onClick: () => {
                const collisionSystem = Registry?.get('CollisionSystem') as CollisionSystem;
                if (collisionSystem && typeof collisionSystem.toggleDebug === 'function') {
                    const isActive = collisionSystem.toggleDebug();
                    colBtn.classList.toggle('active', isActive);
                } else {
                    Logger.warn('[DebugUI] CollisionSystem not found or missing toggleDebug()');
                }
            }
        });

        // Check initial state
        const colSys = Registry?.get('CollisionSystem') as CollisionSystem;
        if (colSys && colSys['debugMode']) { // Accessing private property in JS style for check
            if (colSys && colSys.isDebugMode) {
                colBtn.classList.add('active');
            }
        }

        this.addControl('Collision', colBtn);

        // Profile Toggle (Performance Analysis)
        const profBtn = DOMUtils.create('button', {
            text: 'Profile',
            attributes: { title: 'Run 5 second profile to measure frame times' },
            onClick: () => {
                if (GameInstance) {
                    profBtn.classList.add('active');
                    profBtn.textContent = 'Profiling...';
                    GameInstance.startProfile();
                    // Also start render phase profiling
                    if (GameRenderer) GameRenderer.startRenderProfile();

                    // Auto-stop after 5 seconds
                    setTimeout(() => {
                        GameInstance.stopProfile();
                        if (GameRenderer) GameRenderer.stopRenderProfile();
                        profBtn.classList.remove('active');
                        profBtn.textContent = 'Profile';
                        alert('Profile complete! Check browser console (F12) for results.');
                    }, 5000);
                }
            }
        });
        this.addControl('Perf', profBtn);
    },

    /**
     * Update active state of toggle buttons
     */
    updateActiveButton() {
        const mobileBtn = document.getElementById('cheat-mobile');
        const pcBtn = document.getElementById('cheat-pc');

        if (mobileBtn) {
            mobileBtn.classList.toggle('active', PlatformManager.isMobile());
        }
        if (pcBtn) {
            pcBtn.classList.toggle('active', PlatformManager.isPC());
        }
    },

    /**
     * Add a custom control to the cheat bar
     * @param {string} label - Control label
     * @param {HTMLElement} element - Control element
     */
    addControl(label: string, element: HTMLElement) {
        if (!this.container) return;

        const wrapper = document.createElement('div');
        wrapper.className = 'cheat-control';

        const labelEl = document.createElement('label');
        labelEl.textContent = label;

        wrapper.appendChild(labelEl);
        wrapper.appendChild(element);
        this.container.appendChild(wrapper);
    },

};

// Register with Registry
if (Registry) Registry.register('DebugUI', DebugUI);

// ES6 Module Export
export { DebugUI };
