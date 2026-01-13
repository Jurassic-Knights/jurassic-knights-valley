/**
 * DebugUI - Debug cheat bar controls
 * 
 * Owner: Director
 */

const DebugUI = {
    container: null,

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
            if (window.IslandManager) {
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
            if (window.IslandManager && window.GameInstance?.hero) {
                const merchant = IslandManager.merchants[0];
                if (merchant) {
                    GameInstance.hero.x = merchant.x;
                    GameInstance.hero.y = merchant.y - 50; // Slightly above
                    Logger.info('[DebugUI] Teleported to merchant at', merchant.islandName);
                }
            }
        };
        this.addControl('Teleport', tpBtn);
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
            if (window.TimeSystem) {
                // Force advance time
                const secondsPerDay = GameConstants.Time.REAL_SECONDS_PER_GAME_DAY;
                TimeSystem.totalTime += secondsPerDay;
                TimeSystem.handleNewDay(); // Manually trigger logic to ensure events fire
            }
        };

        container.appendChild(advanceBtn);
        this.addControl('Time', container);

        // Hook into event bus to update UI
        if (window.EventBus) {
            EventBus.on(GameConstants.Events.TIME_TICK, (data) => {
                const season = data.season ? data.season.substring(0, 3) : '???';
                const weather = window.WeatherSystem ? window.WeatherSystem.currentWeather : '---';
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
            if (window.GameRenderer) {
                const isActive = GameRenderer.toggleDebug();
                btn.classList.toggle('active', isActive);
            }
        };

        // Sync initial state
        if (window.GameRenderer && GameRenderer.debugMode) {
            btn.classList.add('active');
        }

        this.addControl('Debug', btn);

        // Grid Toggle (separate)
        const gridBtn = document.createElement('button');
        gridBtn.textContent = 'Toggle Grid';
        gridBtn.onclick = () => {
            if (window.GameRenderer) {
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
            if (window.GameInstance) {
                profBtn.classList.add('active');
                profBtn.textContent = 'Profiling...';
                GameInstance.startProfile();
                // Also start render phase profiling
                if (window.GameRenderer) GameRenderer.startRenderProfile();

                // Auto-stop after 5 seconds
                setTimeout(() => {
                    GameInstance.stopProfile();
                    if (window.GameRenderer) GameRenderer.stopRenderProfile();
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
                Logger.info('[DebugUI] Time dropdown changed to:', e.target.value);
                if (window.TimeSystem) {
                    window.TimeSystem.setTimeOverride(e.target.value);
                } else {
                    Logger.warn('[DebugUI] TimeSystem not found on window!');
                }
                e.target.blur(); // Remove focus so movement keys don't change selection
            });
        } else {
            Logger.warn('[DebugUI] cheat-time select not found!');
        }

        // Season Override
        const seasonSelect = document.getElementById('cheat-season');
        if (seasonSelect) {
            seasonSelect.addEventListener('change', (e) => {
                Logger.info('[DebugUI] Season dropdown changed to:', e.target.value);
                if (window.TimeSystem) {
                    window.TimeSystem.setSeasonOverride(e.target.value);
                } else {
                    Logger.warn('[DebugUI] TimeSystem not found on window!');
                }
                e.target.blur();
            });
        } else {
            Logger.warn('[DebugUI] cheat-season select not found!');
        }

        // Weather Override
        const weatherSelect = document.getElementById('cheat-weather');
        if (weatherSelect) {
            weatherSelect.addEventListener('change', (e) => {
                Logger.info('[DebugUI] Weather dropdown changed to:', e.target.value);
                if (window.WeatherSystem) {
                    window.WeatherSystem.setWeatherOverride(e.target.value);
                } else {
                    Logger.warn('[DebugUI] WeatherSystem not found on window!');
                }
                e.target.blur();
            });
        } else {
            Logger.warn('[DebugUI] cheat-weather select not found!');
        }
    }
};

window.DebugUI = DebugUI;
