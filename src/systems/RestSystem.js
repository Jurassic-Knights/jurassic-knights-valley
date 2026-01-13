/**
 * RestSystem
 * Handles the "Rest" mechanic at the Home Outpost.
 * Logic:
 * 1. Checks if player is at Home Outpost.
 * 2. Replenishes Health/Stamina.
 * 3. Triggers Cinematic Fade.
 * 4. Advances Time (Day/Night cycle) - Placeholder for now.
 * 5. Saves Game.
 */
class RestSystem {
    constructor() {
        this.game = null;
        Logger.info('[RestSystem] Constructed');
    }

    init(game) {
        this.game = game;
        this.initListeners();
        Logger.info('[RestSystem] Initialized');
    }

    initListeners() {
        if (window.EventBus) {
            EventBus.on(GameConstants.Events.REQUEST_REST, () => this.handleRest());
        }
    }

    handleRest() {
        if (!this.game || !this.game.hero) return;
        const hero = this.game.hero;

        // Validation (Double check location)
        if (!hero.isAtHomeOutpost) {
            Logger.warn('[RestSystem] Cannot rest outside home outpost');
            return;
        }

        Logger.info('[RestSystem] Resting...');

        // 1. Play Rest Melody SFX
        if (window.AudioManager) AudioManager.playSFX('sfx_rest_melody');

        // 2. Trigger Cinematic Fade via UIManager
        if (window.EventBus) {
            EventBus.emit(GameConstants.Events.UI_FADE_SCREEN, {
                onMidpoint: () => this.performRestLogic(hero)
            });
        } else {
            // Fallback (Instant)
            this.performRestLogic(hero);
        }
    }

    performRestLogic(hero) {
        Logger.info('[RestSystem] Performing rest logic (Restore stats)...');

        // Feature: Resilience Bonus
        // If resting with 0 Resolve (Stamina), gain permanent +1 Max Resolve
        if (hero.stamina <= 0.1) { // 0.1 epsilon for float safety
            hero.maxStamina += 1;
            Logger.info(`[RestSystem] Resilience Bonus! Max Stamina increased to ${hero.maxStamina}`);

            // Visual feedback for bonus?
            if (window.VFXController && hero) {
                // Use spawnFloatingText if available
                if (typeof VFXController.spawnFloatingText === 'function') {
                    VFXController.spawnFloatingText('+1 MAX RES', hero.x, hero.y - 50, '#FFD700', 2000);
                }
            }
        } else {
            // Advisory Hint
            if (window.VFXController && typeof VFXController.spawnFloatingText === 'function') {
                VFXController.spawnFloatingText('Hint: Rest at 0 Resolve for Bonus!', hero.x, hero.y - 50, '#CCCCCC', 2500);
            }
        }

        // Recover Stats
        hero.health = hero.maxHealth;
        hero.stamina = hero.maxStamina;

        // Save Game
        if (window.GameState) {
            // GameState might auto-save on set, but we can force explicit save if needed
            // For now, just updating gold/inventory in GameState is handled elsewhere
            Logger.info('[RestSystem] Game Saved (Simulated)');
        }

        // Respawn Resources?
        // In the future, this advances the "Day" and respawns resources logic in ResourceSystem/SpawnManager

        // Feedback
        Logger.info('[RestSystem] Rest Complete. HP/Stamina Restored.');

        // Emit events for UI updates
        if (window.EventBus) {
            EventBus.emit('HERO_HEALTH_CHANGE', { current: hero.health, max: hero.maxHealth });
            EventBus.emit('HERO_STAMINA_CHANGE', { current: hero.stamina, max: hero.maxStamina });
            // EventBus.emit('GAME_SAVED');
        }
    }
}

window.RestSystem = new RestSystem();
if (window.Registry) Registry.register('RestSystem', window.RestSystem);
