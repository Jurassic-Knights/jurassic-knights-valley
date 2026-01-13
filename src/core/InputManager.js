/**
 * InputManager - Unified input handler for keyboard and touch
 * 
 * Owner: Director
 */

const InputManager = {
    // Current movement vector (normalized)
    movement: { x: 0, y: 0 },

    // Keyboard state
    keys: {
        w: false, a: false, s: false, d: false,
        ArrowUp: false, ArrowLeft: false, ArrowDown: false, ArrowRight: false
    },

    // Touch joystick state
    joystick: {
        active: false,
        startX: 0,
        startY: 0,
        currentX: 0,
        currentY: 0,
        maxRadius: 50
    },

    // Device detection
    isMobile: false,

    /**
     * Initialize input listeners
     */
    init() {
        // Detect mobile
        this.isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

        // Keyboard events
        window.addEventListener('keydown', (e) => this.onKeyDown(e));
        window.addEventListener('keyup', (e) => this.onKeyUp(e));

        // Touch events for joystick
        if (this.isMobile) {
            this.initJoystick();
        }

        Logger.info(`[InputManager] Initialized (Mobile: ${this.isMobile})`);
    },

    /**
     * Initialize virtual joystick
     */
    initJoystick() {
        const joystickArea = document.getElementById('joystick-area');
        const joystickBase = document.getElementById('joystick-base');
        const joystickKnob = document.getElementById('joystick-knob');

        if (!joystickArea) {
            Logger.warn('[InputManager] Joystick elements not found');
            return;
        }

        // Show joystick on mobile
        joystickArea.style.display = 'block';

        joystickArea.addEventListener('touchstart', (e) => {
            e.preventDefault();
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
        }, { passive: false });

        joystickArea.addEventListener('touchmove', (e) => {
            e.preventDefault();
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
            this.movement.x = dx / this.joystick.maxRadius;
            this.movement.y = dy / this.joystick.maxRadius;
        }, { passive: false });

        const endTouch = () => {
            this.joystick.active = false;
            this.movement.x = 0;
            this.movement.y = 0;

            if (joystickBase) joystickBase.style.opacity = '0.5';
            if (joystickKnob) {
                joystickKnob.style.left = `50%`;
                joystickKnob.style.top = `50%`;
                joystickKnob.style.opacity = '0.5';
            }
        };

        joystickArea.addEventListener('touchend', endTouch);
        joystickArea.addEventListener('touchcancel', endTouch);
    },

    /**
     * Handle key down
     */
    onKeyDown(e) {
        if (this.keys.hasOwnProperty(e.key)) {
            this.keys[e.key] = true;
            this.updateKeyboardMovement();
            e.preventDefault();
        }
    },

    /**
     * Handle key up
     */
    onKeyUp(e) {
        if (this.keys.hasOwnProperty(e.key)) {
            this.keys[e.key] = false;
            this.updateKeyboardMovement();
            e.preventDefault();
        }
    },

    /**
     * Calculate movement from keyboard state
     */
    updateKeyboardMovement() {
        // Only update from keyboard if joystick not active
        if (this.joystick.active) return;

        let x = 0, y = 0;

        if (this.keys.a || this.keys.ArrowLeft) x -= 1;
        if (this.keys.d || this.keys.ArrowRight) x += 1;
        if (this.keys.w || this.keys.ArrowUp) y -= 1;
        if (this.keys.s || this.keys.ArrowDown) y += 1;

        // Normalize diagonal movement
        if (x !== 0 && y !== 0) {
            const len = Math.sqrt(x * x + y * y);
            x /= len;
            y /= len;
        }

        this.movement.x = x;
        this.movement.y = y;
    },

    /**
     * Get current movement vector
     * @returns {{x: number, y: number}} Normalized movement vector
     */
    getMovementVector() {
        return { x: this.movement.x, y: this.movement.y };
    }
};

window.InputManager = InputManager;
if (window.Registry) Registry.register('InputManager', InputManager);
