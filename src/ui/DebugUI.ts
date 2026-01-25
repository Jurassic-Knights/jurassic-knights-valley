/**
 * DebugUI - Debug cheat bar controls
 *
 * Owner: Director
 */

import { Logger } from '../core/Logger';
import { IslandManager } from '../world/IslandManager';
import { PlatformManager } from '../core/PlatformManager';
import { GameRenderer } from '../core/GameRenderer';
import { timeSystem } from '../systems/TimeSystem';
import { GameConstants, getConfig } from '../data/GameConstants';
import { EventBus } from '../core/EventBus';
import { weatherSystem } from '../systems/WeatherSystem';
import { GameInstance } from '../core/Game';
import { Registry } from '../core/Registry';
import { GameState } from '../core/State';


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
        this.setupOverrideDropdowns(); // New
        this.updateActiveButton();

        Logger.info('[DebugUI] Initialized');
    },

    /**
     * Setup merchant debug buttons
     */
    setupMerchantDebug() {
        // Unlock all islands button
        const unlockBtn = document.createElement('button');
        unlockBtn.textContent = 'Unlock All';
        unlockBtn.onclick = () => {
            if (IslandManager) {
                for (const island of IslandManager.islands) {
                    island.unlocked = true;
                }
                Logger.info('[DebugUI] All islands unlocked!');
            }
        };
        this.addControl('Islands', unlockBtn);

        // Teleport to merchant button
        const tpBtn = document.createElement('button');
        tpBtn.textContent = 'Go to Merchant';
        tpBtn.onclick = () => {
            const isMgr = IslandManager as any;
            if (isMgr && GameInstance?.hero) {
                const merchant = isMgr.merchants?.[0];
                if (merchant) {
                    GameInstance.hero.x = merchant.x;
                    GameInstance.hero.y = merchant.y - 50; // Slightly above
                    Logger.info('[DebugUI] Teleported to merchant at', merchant.islandName);
                }
            }
        };
        this.addControl('Teleport', tpBtn);

        // Reset Gold button
        const goldBtn = document.createElement('button');
        goldBtn.textContent = '+100k Gold';
        goldBtn.onclick = () => {
            GameState.set('gold', 100000);
            if (GameInstance?.hero?.inventory) {
                GameInstance.hero.inventory.gold = 100000;
            }
            Logger.info('[DebugUI] Gold set to 100000');
        };
        this.addControl('Gold', goldBtn);
    },

    /**
     * Setup Time & Weather debug display
     */
    setupTimeDebug() {
        // Container for time stats
        const container = document.createElement('div');
        container.style.fontSize = '12px';
        container.style.color = '#aaa';
        container.style.display = 'flex';
        container.style.gap = '10px';
        container.style.alignItems = 'center';

        const stats = document.createElement('span');
        stats.id = 'debug-time-stats';
        stats.textContent = 'Waiting for time...';

        container.appendChild(stats);

        // Advance Day Button
        const advanceBtn = document.createElement('button');
        advanceBtn.textContent = '+1 Day';
        advanceBtn.style.padding = '2px 5px';
        advanceBtn.onclick = () => {
            if (timeSystem) {
                // Force advance time
                const secondsPerDay = getConfig().Time.REAL_SECONDS_PER_GAME_DAY;
                timeSystem.totalTime += secondsPerDay;
                timeSystem.handleNewDay(); // Manually trigger logic to ensure events fire
            }
        };

        container.appendChild(advanceBtn);
        this.addControl('Time', container);

        // Hook into event bus to update UI
        if (EventBus) {
            EventBus.on(GameConstants.Events.TIME_TICK, (data: any) => {
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
        const btn = document.createElement('button');
        btn.textContent = 'Toggle Debug';
        btn.onclick = () => {
            if (GameRenderer) {
                const isActive = GameRenderer.toggleDebug();
                btn.classList.toggle('active', isActive);
            }
        };

        // Sync initial state
        if (GameRenderer && GameRenderer.debugMode) {
            btn.classList.add('active');
        }

        this.addControl('Debug', btn);

        // Grid Toggle (separate)
        const gridBtn = document.createElement('button');
        gridBtn.textContent = 'Toggle Grid';
        gridBtn.onclick = () => {
            if (GameRenderer) {
                const isActive = GameRenderer.toggleGrid();
                gridBtn.classList.toggle('active', isActive);
            }
        };
        this.addControl('Grid', gridBtn);

        // Profile Toggle (Performance Analysis)
        const profBtn = document.createElement('button');
        profBtn.textContent = 'Profile';
        profBtn.title = 'Run 5 second profile to measure frame times';
        profBtn.onclick = () => {
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
        };
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
    addControl(label, element) {
        if (!this.container) return;

        const wrapper = document.createElement('div');
        wrapper.className = 'cheat-control';

        const labelEl = document.createElement('label');
        labelEl.textContent = label;

        wrapper.appendChild(labelEl);
        wrapper.appendChild(element);
        this.container.appendChild(wrapper);
    },

    /**
     * Setup override dropdowns (Time, Season, Weather)
     */
    setupOverrideDropdowns() {
        // Time Override
        const timeSelect = document.getElementById('cheat-time');
        if (timeSelect) {
            timeSelect.addEventListener('change', (e) => {
                Logger.info('[DebugUI] Time dropdown changed to:', (e.target as HTMLSelectElement).value);
                if (timeSystem) {
                    timeSystem.setTimeOverride((e.target as HTMLSelectElement).value);
                } else {
                    Logger.warn('[DebugUI] timeSystem not found on window!');
                }
                (e.target as HTMLElement).blur(); // Remove focus so movement keys don't change selection
            });
        } else {
            Logger.warn('[DebugUI] cheat-time select not found!');
        }

        // Season Override
        const seasonSelect = document.getElementById('cheat-season');
        if (seasonSelect) {
            seasonSelect.addEventListener('change', (e) => {
                Logger.info('[DebugUI] Season dropdown changed to:', (e.target as HTMLSelectElement).value);
                if (timeSystem) {
                    timeSystem.setSeasonOverride((e.target as HTMLSelectElement).value);
                } else {
                    Logger.warn('[DebugUI] timeSystem not found on window!');
                }
                (e.target as HTMLElement).blur();
            });
        } else {
            Logger.warn('[DebugUI] cheat-season select not found!');
        }

        // Weather Override
        const weatherSelect = document.getElementById('cheat-weather');
        if (weatherSelect) {
            weatherSelect.addEventListener('change', (e) => {
                Logger.info('[DebugUI] Weather dropdown changed to:', (e.target as HTMLSelectElement).value);
                if (weatherSystem) {
                    weatherSystem.setWeatherOverride((e.target as HTMLSelectElement).value);
                } else {
                    Logger.warn('[DebugUI] weatherSystem not found on window!');
                }
                (e.target as HTMLElement).blur();
            });
        } else {
            Logger.warn('[DebugUI] cheat-weather select not found!');
        }
    }
};

// Register with Registry
if (Registry) Registry.register('DebugUI', DebugUI);

// ES6 Module Export
export { DebugUI };
