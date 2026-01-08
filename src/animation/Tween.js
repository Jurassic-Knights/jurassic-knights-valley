/**
 * Tween System
 * Handles smooth property animations (position, scale, alpha, etc.)
 * 
 * Owner: Animator
 */

const Tween = {
    activeTweens: [],

    // Easing functions
    easing: {
        linear: t => t,
        easeIn: t => t * t,
        easeOut: t => t * (2 - t),
        easeInOut: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
        bounce: t => {
            if (t < 1 / 2.75) return 7.5625 * t * t;
            if (t < 2 / 2.75) return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
            if (t < 2.5 / 2.75) return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
            return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
        },
        elastic: t => {
            return t === 0 ? 0 : t === 1 ? 1 :
                -Math.pow(2, 10 * (t - 1)) * Math.sin((t - 1.1) * 5 * Math.PI);
        }
    },

    /**
     * Create a new tween
     * @param {object} target - Object to animate
     * @param {object} props - Properties to animate { x: 100, alpha: 0 }
     * @param {number} duration - Duration in ms
     * @param {object} options - { easing, delay, onComplete, loop }
     */
    to(target, props, duration, options = {}) {
        const tween = {
            target,
            startProps: {},
            endProps: props,
            duration,
            elapsed: 0,
            delay: options.delay || 0,
            easing: this.easing[options.easing] || this.easing.easeOut,
            onComplete: options.onComplete,
            loop: options.loop || false,
            yoyo: options.yoyo || false,
            direction: 1
        };

        // Store start values
        for (const key in props) {
            tween.startProps[key] = target[key] ?? 0;
        }

        this.activeTweens.push(tween);
        return tween;
    },

    /**
     * Update all active tweens
     * @param {number} dt - Delta time in ms
     */
    update(dt) {
        this.activeTweens = this.activeTweens.filter(tween => {
            // Handle delay
            if (tween.delay > 0) {
                tween.delay -= dt;
                return true;
            }

            tween.elapsed += dt * tween.direction;
            const progress = Math.min(Math.max(tween.elapsed / tween.duration, 0), 1);
            const easedProgress = tween.easing(progress);

            // Interpolate properties
            for (const key in tween.endProps) {
                const start = tween.startProps[key];
                const end = tween.endProps[key];
                tween.target[key] = start + (end - start) * easedProgress;
            }

            // Check completion
            if (progress >= 1) {
                if (tween.yoyo) {
                    tween.direction *= -1;
                    tween.elapsed = tween.duration;
                    return true;
                }
                if (tween.loop) {
                    tween.elapsed = 0;
                    return true;
                }
                if (tween.onComplete) tween.onComplete();
                return false;
            }

            return true;
        });
    },

    /**
     * Cancel all tweens for a target
     */
    cancel(target) {
        this.activeTweens = this.activeTweens.filter(t => t.target !== target);
    },

    /**
     * Quick shake effect
     */
    shake(target, intensity = 5, duration = 300) {
        const originalX = target.x || 0;
        const originalY = target.y || 0;

        const interval = setInterval(() => {
            target.x = originalX + (Math.random() - 0.5) * intensity * 2;
            target.y = originalY + (Math.random() - 0.5) * intensity * 2;
        }, 16);

        setTimeout(() => {
            clearInterval(interval);
            target.x = originalX;
            target.y = originalY;
        }, duration);
    },

    /**
     * Quick pulse effect (scale up and back)
     */
    pulse(target, scale = 1.2, duration = 200) {
        const original = target.scale || 1;
        this.to(target, { scale }, duration / 2, {
            easing: 'easeOut',
            onComplete: () => {
                this.to(target, { scale: original }, duration / 2, { easing: 'easeIn' });
            }
        });
    }
};

window.Tween = Tween;
