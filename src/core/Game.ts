/**
 * Game - Main game loop and orchestration
 *
 * Owner: Director
 */
import { Logger } from './Logger';
import { Registry } from './Registry';
import { GameConstants, getConfig } from '@data/GameConstants';
import { EntityLoader } from '@entities/EntityLoader';
import { entityManager } from './EntityManager';
import { GameState } from './State';
import { Hero } from '../gameplay/Hero';
// IslandManager singleton from barrel file (ensures proper prototype extension order)
import { IslandManager } from '../world/IslandManager';
import { GameRenderer } from './GameRenderer';

// Modules that don't exist yet - use ambient declarations
import { EventBus } from './EventBus';
import { SystemConfig } from '@config/SystemConfig';
import { Tween } from '../animation/Tween';
import { IslandUpgrades } from '../gameplay/IslandUpgrades';
import { logProfileResults } from './GameProfile';
import { MerchantUI } from '@ui/MerchantUI';
import { VFXController } from '@vfx/VFXController';
import type { ISystem, IEntity } from '../types/core';

class Game {
    private isRunning: boolean = false;
    private lastTime: number = 0;
    private tickRate: number;
    private accumulator: number = 0;
    public hero: Hero | null = null;
    private systems: ISystem[] = [];
    private _boundGameLoop: (timestamp: number) => void;
    private _profile: import('./GameProfile').ProfileData | null = null;

    constructor() {
        this.tickRate = GameConstants.Core.TICK_RATE_MS;
        this._boundGameLoop = this.gameLoop.bind(this);
    }

    /**
     * Get a registered system
     * @param {string} name
     */
    getSystem<T extends ISystem>(name: string): T | null {
        if (Registry) {
            const sys = Registry.get(name);
            if (sys) return sys as T;
        }
        return (window as unknown as Record<string, unknown>)[name] as T | null;
    }

    async init() {
        Logger.info('[Game] Initializing...');

        // Debug helper - writes status to loading screen for headless debugging
        const debugStatus = (msg: string) => {
            const loading = document.getElementById('loading');
            if (loading) {
                const p = loading.querySelector('p');
                if (p) p.textContent = msg;
            }
            Logger.info('[Game Debug]', msg);
        };
        debugStatus('Starting initialization...');

        // 1. Sort Systems by Priority
        // This ensures AssetLoader (-5) runs before GameRenderer (33)
        if (!SystemConfig) {
            Logger.error('[Game] SystemConfig not found! Critical failure.');
            return false;
        }

        const sortedSystems = [...SystemConfig].sort((a, b) => a.priority - b.priority);

        // 2. Bootloader Loop (Init Phase)
        Logger.info(`[Game] Booting ${sortedSystems.length} systems...`);
        debugStatus(`Booting ${sortedSystems.length} systems...`);

        let criticalInitFailed = false;
        for (const config of sortedSystems) {
            const name = config.global;
            let sys;

            try {
                debugStatus(`Loading: ${name}`);

                // Special case: Use directly imported singletons to avoid module duplication issues
                // The Registry/window lookup can return a different module instance due to Vite bundling
                if (name === 'IslandManager') {
                    sys = IslandManager;
                } else {
                    const globalWindow = window as unknown as Record<string, unknown>;
                    sys = Registry ? Registry.get(name) : (globalWindow[name] as ISystem);
                    if (!sys) sys = globalWindow[name] as ISystem; // Fallback
                }

                if (!sys) {
                    Logger.warn(`[Game] System not found: ${name}`);
                    debugStatus(`MISSING: ${name}`);
                    continue;
                }

                // Initialization
                if (config.init) {
                    if (typeof sys.init === 'function') {
                        // Check for Async
                        if (config.isAsync) {
                            Logger.info(`[Game] Awaiting async init: ${name}`);
                            debugStatus(`Awaiting: ${name}...`);
                            await sys.init(this);
                        } else {
                            sys.init(this);
                        }
                        Logger.info(`[Game] Initialized ${name}`);
                        debugStatus(`OK: ${name}`);
                    } else {
                        Logger.warn(`[Game] System ${name} missing init() method`);
                    }
                }

                // Register for Update Loop
                if (typeof sys.update === 'function') {
                    this.systems.push(sys);
                }
            } catch (err) {
                Logger.error(`[Game] CRITICAL: Failed to initialize ${name}:`, err);
                debugStatus(`ERROR: ${name} - ${(err as Error).message}`);
                Logger.error(`[Game] CRITICAL: ${name} init failed - Stack:`, err);
                if (config.critical) {
                    criticalInitFailed = true;
                }
            }
        }

        if (criticalInitFailed) {
            Logger.error('[Game] A critical system failed to initialize. Aborting.');
            return false;
        }

        // 3. Post-Init Phase (Special Cases)

        // Tween (External Lib) verification
        if (Tween && !this.systems.includes(Tween)) this.systems.push(Tween);

        // IslandUpgrades (Requires IslandManager data, so init here or in start phase)
        if (IslandUpgrades && IslandManager && IslandManager.islands) {
            // Check if IslandUpgrades was already init in loop?
            // Currently SystemConfig says init:false for it because it needs args.
            IslandUpgrades.init(IslandManager.islands);
            Logger.info('[Game] Initialized IslandUpgrades');
        }

        // 4. Start Phase
        Logger.info('[Game] Starting systems...');
        for (const config of sortedSystems) {
            if (config.start) {
                const globalWindow = window as unknown as Record<string, unknown>;
                const sys =
                    (globalWindow[config.global] as ISystem) || (Registry && Registry.get(config.global));
                if (sys && typeof sys.start === 'function') {
                    sys.start();
                    Logger.info(`[Game] Started ${config.global}`);
                }
            }
        }

        if (MerchantUI) MerchantUI.init();
        Logger.info('[Game] Boot Complete.');
        return true;
    }

    /** Start the game loop */
    start() {
        if (this.isRunning) return;

        this.isRunning = true;
        this.lastTime = performance.now();
        this.loop();
        Logger.info('[Game] Started');
    }

    /**
     * Stop the game loop
     */
    stop() {
        this.isRunning = false;
        Logger.info('[Game] Stopped');
    }

    /**
     * Main game loop
     */
    loop() {
        if (!this.isRunning) return;

        this.lastTime = performance.now();
        this.isRunning = true;
        this.gameLoop(this.lastTime);
    }

    /**
     * Main game loop
     * @param {number} timestamp
     */
    gameLoop(timestamp: number) {
        if (!this.isRunning) return;

        // Calculate delta time
        let dt = timestamp - this.lastTime;
        this.lastTime = timestamp;

        // Cap dt to prevent spiral of death (max 100ms)
        if (dt > 100) dt = 100;

        this.accumulator += dt;

        // Fixed Timestep Update
        while (this.accumulator >= this.tickRate) {
            this.update(this.tickRate);
            this.accumulator -= this.tickRate;
        }

        // Interpolation Factor
        const alpha = this.accumulator / this.tickRate;
        this.render(alpha);

        // Increment profile frame count
        if (this._profile) this._profile.frameCount++;

        // Use pre-bound method to avoid closure allocation every frame
        requestAnimationFrame(this._boundGameLoop);
    }

    /**
     * Update game logic (fixed timestep)
     * @param {number} dt - Delta time in ms
     */
    update(dt: number) {
        const profile = this._profile;

        // 1. Update Registered Systems
        if (profile) {
            for (const system of this.systems) {
                const name = system.constructor?.name || 'Unknown';
                const start = performance.now();
                system.update(dt);
                profile.systems[name] = (profile.systems[name] || 0) + (performance.now() - start);
            }
        } else {
            for (const system of this.systems) {
                system.update(dt);
            }
        }

        // 2. Update Entities (via EntityManager)
        if (entityManager) {
            if (profile) {
                const start = performance.now();
                entityManager.update?.(dt);
                profile.entityManager = (profile.entityManager || 0) + (performance.now() - start);
            } else {
                entityManager.update?.(dt);
            }
        }
    }

    /**
     * Render updates (variable timestep)
     * @param {number} [alpha] - Interpolation factor (0-1)
     */
    render(alpha = 1) {
        const profile = this._profile;

        // 3. Render Game World (includes BG VFX)
        if (GameRenderer) {
            if (profile) {
                const start = performance.now();
                GameRenderer.render();
                profile.gameRenderer = (profile.gameRenderer || 0) + (performance.now() - start);
            } else {
                GameRenderer.render();
            }
        }

        // 4. Render Foreground VFX (Overlay Layer)
        if (VFXController) {
            if (profile) {
                const start = performance.now();
                VFXController.renderForeground();
                profile.vfxForeground = (profile.vfxForeground || 0) + (performance.now() - start);
            } else {
                VFXController.renderForeground();
            }
        }
    }

    /**
     * Start profiling frame times
     */
    startProfile() {
        this._profile = {
            systems: {},
            entityManager: 0,
            gameRenderer: 0,
            vfxForeground: 0,
            frameCount: 0,
            startTime: performance.now()
        };
        Logger.info('[Game] Profiling started...');
    }

    /**
     * Stop profiling and print results
     */
    stopProfile() {
        if (!this._profile) return;
        logProfileResults(this._profile);
        this._profile = null;
    }
}

// Create and export singleton
const GameInstance = new Game();
export { Game, GameInstance };
