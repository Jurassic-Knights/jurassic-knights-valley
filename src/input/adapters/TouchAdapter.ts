/**
 * TouchAdapter - Maps Touch/Joystick inputs to Input State
 */


class TouchAdapter {
    joystick: { active: boolean; startX: number; startY: number; currentX: number; currentY: number; maxRadius: number };
    move: { x: number; y: number };
    isMobile: boolean;

    constructor() {
        this.joystick = {
            active: false,
            startX: 0,
            startY: 0,
            currentX: 0,
            currentY: 0,
            maxRadius: 50
        };

        this.move = { x: 0, y: 0 };
        this.isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

        if (this.isMobile) {
            this.initJoystick();
        }
    }

    initJoystick() {
        // Wait for DOM
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.bindEvents());
        } else {
            this.bindEvents();
        }
    }

    bindEvents() {
        const joystickArea = document.getElementById('joystick-area');
        const joystickBase = document.getElementById('joystick-base');
        const joystickKnob = document.getElementById('joystick-knob');

        if (!joystickArea) {
            return;
        }

        // Show joystick on mobile
        joystickArea.style.display = 'block';

        joystickArea.addEventListener(
            'touchstart',
            (e) => {
                // Prevent default to stop scrolling/zooming while using joystick
                if (e.cancelable) e.preventDefault();

                const touch = e.touches[0];
                const rect = joystickArea.getBoundingClientRect();

                this.joystick.active = true;
                this.joystick.startX = touch.clientX - rect.left;
                this.joystick.startY = touch.clientY - rect.top;
                this.joystick.currentX = this.joystick.startX;
                this.joystick.currentY = this.joystick.startY;

                // Position base at touch point
                if (joystickBase) {
                    joystickBase.style.left = `${this.joystick.startX}px`;
                    joystickBase.style.top = `${this.joystick.startY}px`;
                    joystickBase.style.opacity = '1';
                }
                if (joystickKnob) {
                    joystickKnob.style.left = `${this.joystick.startX}px`;
                    joystickKnob.style.top = `${this.joystick.startY}px`;
                    joystickKnob.style.opacity = '1';
                }
            },
            { passive: false }
        );

        joystickArea.addEventListener(
            'touchmove',
            (e) => {
                if (e.cancelable) e.preventDefault();

                if (!this.joystick.active) return;

                const touch = e.touches[0];
                const rect = joystickArea.getBoundingClientRect();

                this.joystick.currentX = touch.clientX - rect.left;
                this.joystick.currentY = touch.clientY - rect.top;

                // Calculate delta and clamp to max radius
                let dx = this.joystick.currentX - this.joystick.startX;
                let dy = this.joystick.currentY - this.joystick.startY;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist > this.joystick.maxRadius) {
                    dx = (dx / dist) * this.joystick.maxRadius;
                    dy = (dy / dist) * this.joystick.maxRadius;
                }

                // Update knob position
                if (joystickKnob) {
                    joystickKnob.style.left = `${this.joystick.startX + dx}px`;
                    joystickKnob.style.top = `${this.joystick.startY + dy}px`;
                }

                // Update movement vector
                this.move.x = dx / this.joystick.maxRadius;
                this.move.y = dy / this.joystick.maxRadius;
            },
            { passive: false }
        );

        const endTouch = () => {
            this.joystick.active = false;
            this.move.x = 0;
            this.move.y = 0;

            if (joystickBase) joystickBase.style.opacity = '0.5';
            if (joystickKnob) {
                joystickKnob.style.left = `50%`;
                joystickKnob.style.top = `50%`;
                joystickKnob.style.opacity = '0.5';
            }
        };

        joystickArea.addEventListener('touchend', endTouch);
        joystickArea.addEventListener('touchcancel', endTouch);
    }

    poll() {
        return {
            move: { ...this.move },
            action: false // Touch buttons (like attack) could be added here
        };
    }
}

if (InputSystem) {
    InputSystem.registerAdapter(new TouchAdapter());
}

export { TouchAdapter };
