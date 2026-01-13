/**
 * InputSystem - Central Input Aggregator
 * 
 * Aggregates input from Keyboard, Touch, and Gamepad adapters.
 * Emits standardized events via EventBus.
 * 
 * Update: Supports Intent-based mapping (Keys -> Actions)
 */
class InputSystem {
    constructor() {
        this.adapters = [];
        this.inputState = {
            move: { x: 0, y: 0 },
            action: false,
            intents: new Set() // Current active intents
        };

        // Default Bindings (Action Name -> Key/Input IDs)
        this.bindings = {
            'INTERACT': ['e', 'E', 'Enter'],
            'MENU': ['Escape', 'p', 'P']
        };

        Logger.info('[InputSystem] Initialized');
    }

    init(game) {
        this.game = game;
        // Bindings or other setup could go here
    }

    registerAdapter(adapter) {
        this.adapters.push(adapter);
    }

    update() {
        // Aggregate input from all adapters
        let moveX = 0;
        let moveY = 0;
        let action = false;

        const currentFrameIntents = new Set();

        for (const adapter of this.adapters) {
            const state = adapter.poll();
            if (state) {
                // 1. Move Vector
                if (state.move) {
                    moveX += state.move.x;
                    moveY += state.move.y;
                }

                // 2. Legacy Action
                if (state.action) {
                    action = true;
                }

                // 3. Intent Mapping (Keyboard)
                if (state.heldKeys) {
                    for (const [intent, keys] of Object.entries(this.bindings)) {
                        for (const key of keys) {
                            if (state.heldKeys.has(key)) {
                                currentFrameIntents.add(intent);
                            }
                        }
                    }
                }
            }
        }

        // Normalize Move
        const len = Math.sqrt(moveX * moveX + moveY * moveY);
        if (len > 1) {
            moveX /= len;
            moveY /= len;
        }

        // Emit Move Event ONLY if changed
        if (moveX !== this.inputState.move.x || moveY !== this.inputState.move.y) {
            this.inputState.move.x = moveX;
            this.inputState.move.y = moveY;

            if (window.EventBus) {
                EventBus.emit(GameConstants.Events.INPUT_MOVE, { x: moveX, y: moveY });
            }
        }

        // Emit Intent Events (Start/End)
        if (window.EventBus) {
            // Check for New Intents (Pressed this frame)
            for (const intent of currentFrameIntents) {
                if (!this.inputState.intents.has(intent)) {
                    EventBus.emit(GameConstants.Events.INPUT_INTENT, { intent: intent, phase: 'START' });
                    // Logger.info(`[Input] Intent START: ${intent}`);
                }
            }

            // Check for Released Intents
            for (const intent of this.inputState.intents) {
                if (!currentFrameIntents.has(intent)) {
                    EventBus.emit(GameConstants.Events.INPUT_INTENT, { intent: intent, phase: 'END' });
                    // Logger.info(`[Input] Intent END: ${intent}`);
                }
            }
        }

        this.inputState.intents = currentFrameIntents;

        // Legacy Action Pulse (kept for compatibility)
        if (action && !this.inputState.action) {
            if (window.EventBus) EventBus.emit(GameConstants.Events.INPUT_ACTION);
        }
        this.inputState.action = action;
    }

    /**
     * Check if an intent is currently active (button held down)
     * @param {string} intent 
     */
    hasIntent(intent) {
        return this.inputState.intents.has(intent);
    }
}

window.InputSystem = new InputSystem();
if (window.Registry) Registry.register('InputSystem', window.InputSystem);
