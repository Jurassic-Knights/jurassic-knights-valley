/**
 * KeyboardAdapter - Maps keys to Input State
 * Refactored to generic key tracking.
 */
class KeyboardAdapter {
    constructor() {
        this.heldKeys = new Set();

        // Legacy support mappings
        this.mapping = {
            left: ['a', 'ArrowLeft'],
            right: ['d', 'ArrowRight'],
            up: ['w', 'ArrowUp'],
            down: ['s', 'ArrowDown'],
            action: [' ', 'Enter']
        };

        window.addEventListener('keydown', (e) => {
            this.heldKeys.add(e.key);
        });

        window.addEventListener('keyup', (e) => {
            this.heldKeys.delete(e.key);
        });
    }

    poll() {
        let x = 0;
        let y = 0;
        let action = false;

        // Legacy Vector Calculation
        if (this.isAnyDown(this.mapping.left)) x -= 1;
        if (this.isAnyDown(this.mapping.right)) x += 1;
        if (this.isAnyDown(this.mapping.up)) y -= 1;
        if (this.isAnyDown(this.mapping.down)) y += 1;

        if (this.isAnyDown(this.mapping.action)) action = true;

        return {
            move: { x, y },
            action: action,
            heldKeys: new Set(this.heldKeys) // Return clone to prevent mutation
        };
    }

    isAnyDown(keys) {
        return keys.some((k) => this.heldKeys.has(k));
    }
}

if (window.InputSystem) {
    window.InputSystem.registerAdapter(new KeyboardAdapter());
    Logger.info('[KeyboardAdapter] Registered');
} else {
    window.addEventListener('load', () => {
        if (window.InputSystem) {
            window.InputSystem.registerAdapter(new KeyboardAdapter());
            Logger.info('[KeyboardAdapter] Registered (Deferred)');
        }
    });
}

