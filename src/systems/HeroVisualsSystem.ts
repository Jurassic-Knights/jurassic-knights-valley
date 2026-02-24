/**
 * HeroVisualsSystem
 * Handles visual effects for the Hero entity (dust, death fx).
 * Purely cosmetic - no gameplay logic.
 */

import { Logger } from '@core/Logger';
import { EventBus } from '@core/EventBus';
// import { GameConstants } from '@data/GameConstants';
import { VFXController } from '@vfx/VFXController';
import { VFXConfig } from '@data/VFXConfig';
import { Registry } from '@core/Registry';
import type { IGame, IEntity } from '../types/core.d';
import type { ParticleOptions } from '../types/vfx';

class HeroVisualsSystem {
    game: IGame | null = null;
    hero: IEntity | null = null;
    _dustConfig: ParticleOptions;
    _vfxController: typeof VFXController | null = null;

    constructor() {
        // GC Optimization: Reusable config object
        this._dustConfig = {
            type: 'circle',
            color: '#FFFFFF',
            alpha: 0.25,
            count: 1,
            speed: 0,
            drag: 0.85,
            lifetime: 0,
            size: 0,
            sizeOverLifetime: [24, 0],
            gravity: -0.15
        };

        this.initListeners();
        Logger.info('[HeroVisualsSystem] Initialized');
    }

    init(game: IGame) {
        this.game = game;
        this.hero = game.hero;
        this._vfxController = Registry.get<typeof VFXController>('VFXController') || null;
    }

    initListeners() {
        if (EventBus) {
            EventBus.on('HERO_DIED', (data: { hero: IEntity; killer?: IEntity }) =>
                this.onHeroDied(data)
            );
        }
    }

    update(dt: number) {
        if (!this.hero && this.game?.hero) {
            this.hero = this.game.hero;
        }

        const hero = this.hero;
        if (!hero || !hero.components) return;

        this.updateDustTread(dt, hero);
    }

    updateDustTread(dt: number, hero: IEntity) {
        const dtSec = dt / 1000;
        // Check if hero moved (simple check against prevX/Y set by HeroSystem)
        // Note: HeroSystem must run BEFORE this system to update prevX/Y correctly
        const isMoving = hero.x !== hero.prevX || hero.y !== hero.prevY;
        const vfxController = this._vfxController;

        if (isMoving && vfxController) {
            hero.footstepTimer = (hero.footstepTimer || 0) - dtSec;

            if (hero.footstepTimer <= 0) {
                hero.footstepTimer = hero.footstepInterval || 0.15;

                if (VFXConfig) {
                    const cfg = VFXConfig.HERO.DUST;
                    const cloudDensity = cfg.DENSITY;
                    for (let i = 0; i < cloudDensity; i++) {
                        const offsetX = (Math.random() - 0.5) * cfg.OFFSET_X;
                        const offsetY = (Math.random() - 0.5) * cfg.OFFSET_Y;

                        // GC Config Reuse
                        this._dustConfig.color = cfg.COLOR;
                        this._dustConfig.speed = 1.5 + Math.random();
                        this._dustConfig.lifetime =
                            cfg.LIFETIME_BASE + Math.random() * cfg.LIFETIME_RND;
                        this._dustConfig.size = 20 + Math.random() * 8;

                        vfxController.playBackground(
                            hero.x + offsetX,
                            hero.y + hero.height / 2 - 35 + offsetY,
                            this._dustConfig
                        );
                    }
                }
            }
        } else {
            hero.footstepTimer = 0;
        }
    }

    onHeroDied(data: { hero: IEntity }) {
        const hero = data.hero;
        if (!hero) return;

        // Death VFX
        if (this._vfxController && VFXConfig) {
            this._vfxController.playForeground(
                hero.x,
                hero.y,
                VFXConfig.TEMPLATES?.HERO_DEATH_FX || {
                    type: 'circle',
                    color: '#FF0000',
                    count: 15
                }
            );
        }
    }
}

const heroVisualsSystem = new HeroVisualsSystem();
if (Registry) Registry.register('HeroVisualsSystem', heroVisualsSystem);

export { HeroVisualsSystem, heroVisualsSystem };
