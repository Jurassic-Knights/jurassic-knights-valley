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
import { GameConstants, getConfig } from '@data/GameConstants';
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
            EventBus.on('ENTITY_DAMAGED', (data: EntityDamageEvent) => this.onEntityDamaged(data));
            EventBus.on('ENTITY_DIED', (data: EntityDeathEvent) => this.onEntityDied(data));
        }
    }

    onEntityDamaged(data) {
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

    onEntityDied(data) {
        const { entity } = data;
        if (!entity || entity.entityType !== EntityTypes.DINOSAUR) return;

        // SFX: Death
        if (AudioManager) AudioManager.playSFX('sfx_dino_death');

        // Death logic handled in updateDino via HealthComponent sync
    }

    update(dt) {
        if (!entityManager) return;
        const dinos = entityManager.getByType('Dinosaur');
        for (const dino of dinos) {
            if (dino.active) {
                this.updateDino(dino, dt);
            }
        }
    }

    updateDino(dino, dt) {
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
                // Sync component
                if (dino.components.health) dino.components.health.respawn();

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

        // Move
        const speedPerSecond = (dino.moveSpeed || 0.5) * 60;
        let nextX = dino.x + dino.wanderDirection.x * speedPerSecond * (dt / 1000);
        let nextY = dino.y + dino.wanderDirection.y * speedPerSecond * (dt / 1000);

        // Bounds Check - use config value for padding
        if (dino.islandBounds) {
            const padding = BOUNDS_PADDING;
            if (
                nextX < dino.islandBounds.x + padding ||
                nextX > dino.islandBounds.x + dino.islandBounds.width - padding
            ) {
                dino.wanderDirection.x *= -1;
                nextX = dino.x + dino.wanderDirection.x * 5;
            }
            if (
                nextY < dino.islandBounds.y + padding ||
                nextY > dino.islandBounds.y + dino.islandBounds.height - padding
            ) {
                dino.wanderDirection.y *= -1;
                nextY = dino.y + dino.wanderDirection.y * 5;
            }
        }

        dino.x = nextX;
        dino.y = nextY;

        // 4. Animation Frame Cycling
        dino.frameTimer += dt;
        if (dino.frameTimer >= dino.frameInterval) {
            dino.frameTimer = 0;
            if (dino.walkFrames) {
                dino.frameIndex = (dino.frameIndex + 1) % dino.walkFrames.length;
            }
        }
    }

    changeDirection(dino) {
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
                (GameConstants?.AI?.WANDER_TIMER_MIN || 2000) +
                Math.random() *
                    ((GameConstants?.AI?.WANDER_TIMER_MAX || 5000) -
                        (GameConstants?.AI?.WANDER_TIMER_MIN || 2000));
        }
    }
}

// Create singleton and export
const dinosaurSystem = new DinosaurSystem();
if (Registry) Registry.register('DinosaurSystem', dinosaurSystem);

export { DinosaurSystem, dinosaurSystem };
