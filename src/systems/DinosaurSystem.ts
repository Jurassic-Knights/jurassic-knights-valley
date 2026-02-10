/**
 * DinosaurSystem
 * Handles AI, Movement, and Animation updates for all Dinosaurs.
 */

import { Logger } from '@core/Logger';
import { EventBus } from '@core/EventBus';
import { entityManager } from '@core/EntityManager';
import { AudioManager } from '../audio/AudioManager';
import { VFXController } from '@vfx/VFXController';
import { VFXConfig } from '@data/VFXConfig';
import { spawnManager } from './SpawnManager';
import { GameConstants } from '@data/GameConstants';
import { Registry } from '@core/Registry';
import { EntityTypes } from '@config/EntityTypes';
import type { IGame, IEntity } from '../types/core.d';

// Bounds padding constant (was from BaseCreature)
const BOUNDS_PADDING = 30;

// Event data interfaces
interface EntityDamageEvent {
    entity: IEntity;
    amount: number;
    source?: IEntity;
}
interface EntityDeathEvent {
    entity: IEntity;
    killer?: IEntity;
}

class DinosaurSystem {
    game: IGame | null = null;

    constructor() {
        Logger.info('[DinosaurSystem] Initialized');
    }

    init(game: IGame) {
        this.game = game;
        this.initListeners();
    }

    initListeners() {
        if (EventBus) {
            EventBus.on(GameConstants.Events.ENTITY_DAMAGED, (data: EntityDamageEvent) => this.onEntityDamaged(data));
            EventBus.on(GameConstants.Events.ENTITY_DIED, (data: EntityDeathEvent) => this.onEntityDied(data));
            EventBus.on(
                GameConstants.Events.MOVEMENT_UPDATE_RESULT,
                (data: { entity: IEntity; actualDx: number; actualDy: number }) => {
                    const d = data.entity as IEntity & { _moveRequested?: { dx: number; dy: number }; _moveResult?: { actualDx: number; actualDy: number } };
                    if (d) d._moveResult = { actualDx: data.actualDx, actualDy: data.actualDy };
                }
            );
        }
    }

    onEntityDamaged(data: EntityDamageEvent) {
        const { entity, amount } = data;
        if (!entity || entity.entityType !== EntityTypes.DINOSAUR) return;

        // SFX: Hurt
        if (AudioManager) AudioManager.playSFX('sfx_dino_hurt');

        // Blood VFX - Multi-layered realistic gore
        if (VFXController && VFXConfig) {
            // Primary blood spray (directional splatter)
            VFXController.playForeground(entity.x, entity.y, VFXConfig.DINO.BLOOD_SPLATTER);
            // Blood mist (fine particles lingering)
            VFXController.playForeground(entity.x, entity.y, VFXConfig.DINO.BLOOD_MIST);
            // Blood droplets (falling drops)
            VFXController.playForeground(entity.x, entity.y, VFXConfig.DINO.BLOOD_DROPS);
            // Meat chunks on heavy hits
            if (amount > 10) {
                VFXController.playForeground(entity.x, entity.y, VFXConfig.DINO.MEAT_CHUNKS);
            }
        }
    }

    onEntityDied(data: EntityDeathEvent) {
        const { entity } = data;
        if (!entity || entity.entityType !== EntityTypes.DINOSAUR) return;

        // SFX: Death
        if (AudioManager) AudioManager.playSFX('sfx_dino_death');

        // Death logic handled in updateDino via HealthComponent sync
    }

    update(dt: number) {
        if (!entityManager) return;
        const dinos = entityManager.getByType('Dinosaur');
        for (const dino of dinos) {
            if (dino.active) {
                this.updateDino(dino, dt);
            }
        }
    }

    updateDino(dino: IEntity, dt: number) {
        // Sync with HealthComponent
        if (dino.components.health) {
            dino.health = dino.components.health.health;
            if (dino.components.health.isDead && dino.state !== 'dead') {
                dino.state = 'dead';
                dino.health = 0;
                dino.respawnTimer = dino.maxRespawnTime;
                if (AudioManager) AudioManager.playSFX('sfx_dino_death');

                // Trigger Death VFX (Huge Rebirth Effect)
                // Trigger Death VFX (Pixelated Blood Explosion)
                if (VFXController && VFXConfig && VFXConfig.TEMPLATES.DINO_DEATH_FX) {
                    VFXController.playForeground(dino.x, dino.y, VFXConfig.TEMPLATES.DINO_DEATH_FX);
                }

                // Drop loot directly using SpawnManager (same pattern as Resource.js)
                // This bypasses the complex LootSystem chain and works on file:// protocol
                if (spawnManager && dino.lootTable && Array.isArray(dino.lootTable)) {
                    for (const entry of dino.lootTable) {
                        // Roll chance (0-1 format)
                        if (Math.random() > (entry.chance || 1)) continue;

                        // Calculate amount
                        let amount = 1;
                        if (Array.isArray(entry.amount)) {
                            amount = Math.floor(
                                entry.amount[0] +
                                Math.random() * (entry.amount[1] - entry.amount[0] + 1)
                            );
                        } else if (entry.amount) {
                            amount = entry.amount;
                        }

                        // Spawn the drop directly
                        spawnManager.spawnDrop(dino.x, dino.y, entry.item, amount);
                    }
                }
            }
        }

        // 1. Handle Death / Respawn
        if (dino.state === 'dead') {
            dino.respawnTimer -= dt / 1000;
            if (dino.respawnTimer <= 0) {
                // Respawn
                dino.state = 'alive';
                dino.health = dino.maxHealth;
                if (dino.components.health) {
                    dino.components.health.isDead = false;
                    dino.components.health.health = dino.components.health.maxHealth;
                }

                if (AudioManager) AudioManager.playSFX('sfx_dino_respawn');
                if (VFXController && VFXConfig) {
                    VFXController.playForeground(dino.x, dino.y, VFXConfig.DINO.RESPAWN);
                }
            }
            return;
        }

        // 2. Handle Combat Freeze
        if (dino.isBeingAttacked) {
            return;
        }

        // 3. Wandering AI
        dino.wanderTimer -= dt;
        if (dino.wanderTimer <= 0) {
            this.changeDirection(dino);
        }

        // Move via EventBus: emit ENTITY_MOVE_REQUEST; CollisionSystem applies and emits MOVEMENT_UPDATE_RESULT
        const cfg = GameConstants.Dinosaur;
        const speedPxPerSec = (dino.moveSpeed ?? cfg.DEFAULT_MOVE_SPEED) * cfg.SPEED_SCALE;
        const msPerSecond = GameConstants.Timing.MS_PER_SECOND;
        const dx = dino.wanderDirection.x * (speedPxPerSec * dt / msPerSecond);
        const dy = dino.wanderDirection.y * (speedPxPerSec * dt / msPerSecond);

        const d = dino as IEntity & { _moveRequested?: { dx: number; dy: number }; _moveResult?: { actualDx: number; actualDy: number } };
        d._moveRequested = { dx, dy };
        d._moveResult = undefined;
        EventBus.emit(GameConstants.Events.ENTITY_MOVE_REQUEST, { entity: dino, dx, dy });

        const res = d._moveResult;
        const collidedX = res && dx !== 0 && res.actualDx === 0;
        const collidedY = res && dy !== 0 && res.actualDy === 0;
        if (collidedX) dino.wanderDirection.x *= -1;
        if (collidedY) dino.wanderDirection.y *= -1;
        if (res && res.actualDx === 0 && res.actualDy === 0 && dt > 0) {
            this.changeDirection(dino);
        }


        // 4. Animation Frame Cycling
        dino.frameTimer += dt;
        if (dino.frameTimer >= dino.frameInterval) {
            dino.frameTimer = 0;
            if (dino.walkFrames) {
                dino.frameIndex = (dino.frameIndex + 1) % dino.walkFrames.length;
            }
        }
    }

    changeDirection(dino: IEntity) {
        if (dino.components.ai) {
            dino.components.ai.randomizeWander();
        } else {
            // Fallback for legacy (or if component missing)
            const angle = Math.random() * Math.PI * 2;
            // GC Optimization: Reuse existing object instead of allocating new one
            if (!dino.wanderDirection) {
                dino.wanderDirection = { x: 0, y: 0 };
            }
            dino.wanderDirection.x = Math.cos(angle);
            dino.wanderDirection.y = Math.sin(angle);
            dino.wanderTimer =
                GameConstants.AI.WANDER_TIMER_MIN +
                Math.random() *
                (GameConstants.AI.WANDER_TIMER_MAX - GameConstants.AI.WANDER_TIMER_MIN);
        }
    }
}

// Create singleton and export
const dinosaurSystem = new DinosaurSystem();
if (Registry) Registry.register('DinosaurSystem', dinosaurSystem);

export { DinosaurSystem, dinosaurSystem };
