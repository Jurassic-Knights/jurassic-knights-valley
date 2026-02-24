/**
 * ResourceSystem
 * Handles state updates and respawning for all resources.
 */

import { Logger } from '@core/Logger';
import { entityManager } from '@core/EntityManager';
import { AudioManager } from '../audio/AudioManager';
import { VFXController } from '@vfx/VFXController';
import { VFXConfig } from '@data/VFXConfig';
import { Registry } from '@core/Registry';
import { EntityRegistry } from '@entities/EntityLoader';
import type { IGame, IResourceEntity } from '../types/core.d';

class ResourceSystem {
    game: IGame | null = null;

    constructor() {
        Logger.info('[ResourceSystem] Initialized');
    }

    init(game: IGame) {
        this.game = game;
    }

    update(dt: number) {
        if (!entityManager) return;
        const resources = entityManager.getByType('Resource');
        for (const res of resources) {
            if (res.active) {
                this.updateResource(res, dt);
            }
        }
    }

    updateResource(res: IResourceEntity, dt: number) {
        if (res.state === 'depleted') {
            const resData = res as any;
            resData.respawnTimer -= dt / 1000;
            if (resData.respawnTimer <= 0) {
                this.respawn(res);
            }
        }
    }

    respawn(res: IResourceEntity) {
        res.state = 'ready';
        res.health = res.maxHealth;
        res.respawnTimer = 0;

        // Play material-specific respawn SFX - config-driven
        if (AudioManager) {
            const typeConfig = res.resourceType ? (EntityRegistry?.resources?.[res.resourceType] || {}) : {};
            const suffix = typeConfig.sfxSuffix || 'metal';
            AudioManager.playSFX(`sfx_respawn_${suffix}`);
        }

        // Visual Effects
        if (VFXController && VFXConfig && VFXConfig.TEMPLATES.RESOURCE_RESPAWN_FX) {
            // New Pixelated Respawn
            // Allow dynamic color override if resource has specific color?
            // res.color is usually for the minimap dot, might be appropriate.
            // But usually resources are wood/stone.
            // Let's mix the template with a color override if present.

            const baseTemplate = VFXConfig.TEMPLATES.RESOURCE_RESPAWN_FX;
            const fx = { ...baseTemplate };

            // If resource has a color, maybe tint the debris?
            // For now, keep the "Digital Materialization" (Cyan/White) as distinct from the resource itself.
            // It implies the world is reconstructing it.

            VFXController.playForeground(res.x, res.y, fx);
        }
    }
}

// Create singleton and export
const resourceSystem = new ResourceSystem();
if (Registry) Registry.register('ResourceSystem', resourceSystem);

export { ResourceSystem, resourceSystem };
