/**
 * InputSystem - Central Input Aggregator
 *
 * Aggregates input from Keyboard, Touch, and Gamepad adapters.
 * Emits standardized events via EventBus.
 *
 * Update: Supports Intent-based mapping (Keys -> Actions)
 *
 * Owner: Core Infrastructure
 */

import { Logger } from '@core/Logger';
import { EventBus } from '@core/EventBus';
// import { GameConstants } from '@data/GameConstants';
import { Registry } from '@core/Registry';
import type { IGame } from '../types/core';

interface InputAdapter {
    poll(): {
        move?: { x: number; y: number };
        action?: boolean;
        heldKeys?: Set<string>;
    } | null;
}

class InputSystem {
    // No game reference needed currently
    private adapters: InputAdapter[] = [];
    private inputState = {
        move: { x: 0, y: 0 },
        action: false,
        intents: new Set<string>()
    };

    // Default Bindings (Action Name -> Key/Input IDs)
    private bindings: Record<string, string[]> = {
        INTERACT: ['e', 'E', 'Enter'],
        MENU: ['Escape', 'p', 'P']
    };

    constructor() {
        Logger.info('[InputSystem] Initialized');
    }

    init(_game: IGame): void {
        // game available if needed in future
    }

    registerAdapter(adapter: InputAdapter): void {
        this.adapters.push(adapter);
    }

    update(): void {
        let moveX = 0;
        let moveY = 0;
        let action = false;

        const currentFrameIntents = new Set<string>();

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
            EventBus.emit('INPUT_MOVE', { x: moveX, y: moveY });
        }

        // Emit Intent Events (Start/End)
        // Check for New Intents (Pressed this frame)
        for (const intent of currentFrameIntents) {
            if (!this.inputState.intents.has(intent)) {
                EventBus.emit('INPUT_INTENT', {
                    action: intent,
                    active: true
                });
            }
        }

        // Check for Released Intents
        for (const intent of this.inputState.intents) {
            if (!currentFrameIntents.has(intent)) {
                EventBus.emit('INPUT_INTENT', {
                    action: intent,
                    active: false
                });
            }
        }

        this.inputState.intents = currentFrameIntents;

        // Legacy Action Pulse (kept for compatibility)
        if (action && !this.inputState.action) {
            EventBus.emit('INPUT_ACTION', { action: 'pulse' });
        }
        this.inputState.action = action;
    }

    /**
     * Check if an intent is currently active (button held down)
     */
    hasIntent(intent: string): boolean {
        return this.inputState.intents.has(intent);
    }
}

// Create and export singleton instance
const inputSystem = new InputSystem();
if (Registry) Registry.register('InputSystem', inputSystem);
export { InputSystem, inputSystem };
