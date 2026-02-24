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
import { spawnDrop } from '../gameplay/SpawnHelper';
import { GameConstants } from '@data/GameConstants';
import { Registry } from '@core/Registry';
import { EntityTypes } from '@config/EntityTypes';
import type { IGame, IEntity } from '../types/core.d';

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

export interface IDinosaurEntity extends IEntity {
    respawnTimer: number;
    maxRespawnTime: number;
    wanderTimer: number;
    wanderDirection: { x: number; y: number };
    moveSpeed?: number;
    frameTimer: number;
    frameInterval: number;
    walkFrames?: any[];
    frameIndex: number;
    isBeingAttacked?: boolean;
    lootTable?: any[];
    lootTableId?: string;
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
            EventBus.on('ENTITY_DAMAGED', (data: EntityDamageEvent) =>
                this.onEntityDamaged(data)
            );
            EventBus.on('ENTITY_DIED', (data: EntityDeathEvent) =>
                this.onEntityDied(data)
            );
            EventBus.on(
                'MOVEMENT_UPDATE_RESULT',
                (data: { entity: IEntity; x: number; y: number; moved: boolean }) => {
                    const d = data.entity as IEntity & {
                        _moveRequested?: { dx: number; dy: number };
                        _moveResult?: { actualDx: number; actualDy: number };
                    };
                    if (d && d._moveRequested) {
                        d._moveResult = {
                            actualDx: data.moved ? d._moveRequested.dx : 0,
                            actualDy: data.moved ? d._moveRequested.dy : 0
                        };
                    }
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
            const vfx = VFXConfig as any;
            // Primary blood spray (directional splatter)
            VFXController.playForeground(entity.x, entity.y, vfx.DINO.BLOOD_SPLATTER);
            // Blood mist (fine particles lingering)
            VFXController.playForeground(entity.x, entity.y, vfx.DINO.BLOOD_MIST);
            // Blood droplets (falling drops)
            VFXController.playForeground(entity.x, entity.y, vfx.DINO.BLOOD_DROPS);
            // Meat chunks on heavy hits
            if (amount > 10) {
                VFXController.playForeground(entity.x, entity.y, vfx.DINO.MEAT_CHUNKS);
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
                this.updateDino(dino as IEntity & {
                    respawnTimer: number; maxRespawnTime: number;
                    wanderTimer: number; wanderDirection: { x: number, y: number };
                    moveSpeed?: number; frameTimer: number; frameInterval: number;
                    walkFrames?: any[]; frameIndex: number; isBeingAttacked?: boolean;
                    lootTable?: any[]; lootTableId?: string;
                }, dt);
            }
        }
    }

    updateDino(dino: IEntity, dt: number) {
        // Sync with HealthComponent
        if (dino.components?.health) {
            dino.health = dino.components.health.health;
            if (dino.components.health.isDead && dino.state !== 'dead') {
                const d = dino as IDinosaurEntity;
                dino.state = 'dead';
                dino.health = 0;
                d.respawnTimer = d.maxRespawnTime;
                if (AudioManager) AudioManager.playSFX('sfx_dino_death');

                // Trigger Death VFX (Huge Rebirth Effect)
                // Trigger Death VFX (Pixelated Blood Explosion)
                if (VFXController && VFXConfig && VFXConfig.TEMPLATES.DINO_DEATH_FX) {
                    VFXController.playForeground(dino.x, dino.y, VFXConfig.TEMPLATES.DINO_DEATH_FX);
                }

                // Drop loot directly using SpawnManager (same pattern as Resource.js)
                // This bypasses the complex LootSystem chain and works on file:// protocol
                const dLoot = dino as IDinosaurEntity;
                if (dLoot.lootTable && Array.isArray(dLoot.lootTable)) {
                    for (const entry of dLoot.lootTable) {
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
                        spawnDrop(dino.x, dino.y, entry.item, amount);
                    }
                }
            }
        }

        // 1. Handle Death / Respawn
        const dTimer = dino as IDinosaurEntity;
        if (dino.state === 'dead') {
            dTimer.respawnTimer -= dt / 1000;
            if (dTimer.respawnTimer <= 0) {
                // Respawn
                dino.state = 'alive';
                dino.health = dino.maxHealth;
                if (dino.components?.health) {
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
        const dWander = dino as IDinosaurEntity;
        dWander.wanderTimer -= dt;
        if (dWander.wanderTimer <= 0) {
            this.changeDirection(dino);
        }

        // Move via EventBus: emit ENTITY_MOVE_REQUEST; CollisionSystem applies and emits MOVEMENT_UPDATE_RESULT
        const cfg = GameConstants.Dinosaur;
        const speedPxPerSec = (dWander.moveSpeed ?? cfg.DEFAULT_MOVE_SPEED) * cfg.SPEED_SCALE;
        const msPerSecond = GameConstants.Timing.MS_PER_SECOND;
        const dx = dWander.wanderDirection.x * ((speedPxPerSec * dt) / msPerSecond);
        const dy = dWander.wanderDirection.y * ((speedPxPerSec * dt) / msPerSecond);

        const d = dino as IEntity & {
            _moveRequested?: { dx: number; dy: number };
            _moveResult?: { actualDx: number; actualDy: number };
        };
        d._moveRequested = { dx, dy };
        d._moveResult = undefined;
        EventBus.emit('ENTITY_MOVE_REQUEST', { entity: dino, dx, dy });

        const res = (d as any)._moveResult as { actualDx: number; actualDy: number } | undefined;
        const collidedX = res && dx !== 0 && res.actualDx === 0;
        const collidedY = res && dy !== 0 && res.actualDy === 0;
        if (collidedX) dWander.wanderDirection.x *= -1;
        if (collidedY) dWander.wanderDirection.y *= -1;
        if (res && res.actualDx === 0 && res.actualDy === 0 && dt > 0) {
            this.changeDirection(dino);
        }

        // 4. Animation Frame Cycling
        const dAnim = dino as IDinosaurEntity;
        dAnim.frameTimer += dt;
        if (dAnim.frameTimer >= dAnim.frameInterval) {
            dAnim.frameTimer = 0;
            if (dAnim.walkFrames) {
                dAnim.frameIndex = (dAnim.frameIndex + 1) % dAnim.walkFrames.length;
            }
        }
    }

    changeDirection(dino: IEntity) {
        if (dino.components?.ai) {
            (dino.components.ai as any).randomizeWander?.();
        } else {
            // Fallback for legacy (or if component missing)
            const d = dino as IDinosaurEntity;
            const angle = Math.random() * Math.PI * 2;
            // GC Optimization: Reuse existing object instead of allocating new one
            if (!d.wanderDirection) {
                d.wanderDirection = { x: 0, y: 0 };
            }
            d.wanderDirection.x = Math.cos(angle);
            d.wanderDirection.y = Math.sin(angle);
            d.wanderTimer =
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
