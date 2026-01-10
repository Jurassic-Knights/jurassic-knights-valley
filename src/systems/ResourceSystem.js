/**
 * ResourceSystem
 * Handles state updates and respawning for all resources.
 */
class ResourceSystem {
    constructor() {
        console.log('[ResourceSystem] Initialized');
    }

    init(game) {
        this.game = game;
    }

    update(dt) {
        if (!window.EntityManager) return;
        const resources = EntityManager.getByType('Resource');
        for (const res of resources) {
            if (res.active) {
                this.updateResource(res, dt);
            }
        }
    }

    updateResource(res, dt) {
        if (res.state === 'depleted') {
            res.respawnTimer -= dt / 1000;
            if (res.respawnTimer <= 0) {
                this.respawn(res);
            }
        }
    }

    respawn(res) {
        res.state = 'ready';
        res.health = res.maxHealth;
        res.respawnTimer = 0;

        // Play material-specific respawn SFX - config-driven
        if (window.AudioManager) {
            const typeConfig = (window.EntityConfig && EntityConfig.resource.types[res.resourceType]) || {};
            const suffix = typeConfig.sfxSuffix || 'metal';
            AudioManager.playSFX(`sfx_respawn_${suffix}`);
        }

        // Visual Effects
        if (window.VFXController && window.VFXConfig && VFXConfig.TEMPLATES.RESOURCE_RESPAWN_FX) {
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

window.ResourceSystem = new ResourceSystem();
if (window.Registry) Registry.register('ResourceSystem', window.ResourceSystem);
