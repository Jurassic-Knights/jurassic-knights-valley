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

// Ambient declarations for global dependencies
declare const Logger: any;
declare const EventBus: any;
declare const GameConstants: any;
declare const AudioManager: any;
declare const VFXController: any;
declare const GameState: any;
declare const Registry: any;

class RestSystem {
    game: any = null;

    constructor() {
        Logger.info('[RestSystem] Constructed');
    }

    init(game: any) {
        this.game = game;
        this.initListeners();
        Logger.info('[RestSystem] Initialized');
    }

    initListeners() {
        if (EventBus) {
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
        if (AudioManager) AudioManager.playSFX('sfx_rest_melody');

        // 2. Trigger Cinematic Fade via UIManager
        if (EventBus) {
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
        if (hero.stamina <= 0.1) {
            // 0.1 epsilon for float safety
            hero.maxStamina += 1;
            Logger.info(
                `[RestSystem] Resilience Bonus! Max Stamina increased to ${hero.maxStamina}`
            );

            // Visual feedback for bonus?
            if (VFXController && hero) {
                // Use spawnFloatingText if available
                if (typeof VFXController.spawnFloatingText === 'function') {
                    VFXController.spawnFloatingText(
                        '+1 MAX RES',
                        hero.x,
                        hero.y - 50,
                        '#FFD700',
                        2000
                    );
                }
            }
        } else {
            // Advisory Hint
            if (VFXController && typeof VFXController.spawnFloatingText === 'function') {
                VFXController.spawnFloatingText(
                    'Hint: Rest at 0 Resolve for Bonus!',
                    hero.x,
                    hero.y - 50,
                    '#CCCCCC',
                    2500
                );
            }
        }

        // Recover Stats
        hero.health = hero.maxHealth;
        hero.stamina = hero.maxStamina;

        // Save Game
        if (GameState) {
            // GameState might auto-save on set, but we can force explicit save if needed
            // For now, just updating gold/inventory in GameState is handled elsewhere
            Logger.info('[RestSystem] Game Saved (Simulated)');
        }

        // Respawn Resources?
        // In the future, this advances the "Day" and respawns resources logic in ResourceSystem/SpawnManager

        // Feedback
        Logger.info('[RestSystem] Rest Complete. HP/Stamina Restored.');

        // Emit events for UI updates
        if (EventBus) {
            EventBus.emit('HERO_HEALTH_CHANGE', { current: hero.health, max: hero.maxHealth });
            EventBus.emit('HERO_STAMINA_CHANGE', { current: hero.stamina, max: hero.maxStamina });
            // EventBus.emit('GAME_SAVED');
        }
    }
}

// Create singleton and export
const restSystem = new RestSystem();
if (Registry) Registry.register('RestSystem', restSystem);

export { RestSystem, restSystem };
