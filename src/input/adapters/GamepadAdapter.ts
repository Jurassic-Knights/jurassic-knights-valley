/**
 * GamepadAdapter - Maps Gamepad inputs to Input State
 */

import { Logger } from '@core/Logger';
import { inputSystem } from '../InputSystem';

class GamepadAdapter {
    gamepadIndex: number | null;

    constructor() {
        this.gamepadIndex = null;

        addEventListener('gamepadconnected', (e) => {
            Logger.info('[Gamepad] Connected:', e.gamepad.id);
            this.gamepadIndex = e.gamepad.index;
        });

        addEventListener('gamepaddisconnected', (e) => {
            Logger.info('[Gamepad] Disconnected');
            if (this.gamepadIndex === e.gamepad.index) {
                this.gamepadIndex = null;
            }
        });
    }

    poll() {
        if (this.gamepadIndex === null) return null;

        const gp = navigator.getGamepads()[this.gamepadIndex];
        if (!gp) return null;

        let x = 0;
        let y = 0;
        let action = false;

        // Left Stick (Axes 0, 1)
        // Deadzone check
        const deadzone = 0.1;
        if (Math.abs(gp.axes[0]) > deadzone) x = gp.axes[0];
        if (Math.abs(gp.axes[1]) > deadzone) y = gp.axes[1];

        // D-Pad (Often mapped to axes 6, 7 or buttons 12-15)
        if (gp.buttons[14] && gp.buttons[14].pressed) x -= 1; // Left
        if (gp.buttons[15] && gp.buttons[15].pressed) x += 1; // Right
        if (gp.buttons[12] && gp.buttons[12].pressed) y -= 1; // Up
        if (gp.buttons[13] && gp.buttons[13].pressed) y += 1; // Down

        // Action Button (A / Cross = Button 0)
        if (gp.buttons[0] && gp.buttons[0].pressed) action = true;

        return {
            move: { x, y },
            action: action
        };
    }
}

if (inputSystem) {
    inputSystem.registerAdapter(new GamepadAdapter());
}

export { GamepadAdapter };
