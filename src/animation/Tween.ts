/**
 * Tween System
 * Handles smooth property animations (position, scale, alpha, etc.)
 *
 * Owner: Animator
 */

interface TweenOptions {
    delay?: number;
    easing?: string;
    onComplete?: () => void;
    loop?: boolean;
    yoyo?: boolean;
}

interface TweenTask {
    target: any;
    startProps: Record<string, number>;
    endProps: Record<string, number>;
    duration: number;
    elapsed: number;
    delay: number;
    easing: (t: number) => number;
    onComplete?: () => void;
    loop: boolean;
    yoyo: boolean;
    direction: number;
}

const Tween = {
    activeTweens: [] as TweenTask[],

    easing: {
        linear: (t: number) => t,
        easeIn: (t: number) => t * t,
        easeOut: (t: number) => t * (2 - t),
        easeInOut: (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
        bounce: (t: number) => {
            if (t < 1 / 2.75) return 7.5625 * t * t;
            if (t < 2 / 2.75) return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
            if (t < 2.5 / 2.75) return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
            return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
        },
        elastic: (t: number) => {
            return t === 0 ? 0 : t === 1 ? 1 : -Math.pow(2, 10 * (t - 1)) * Math.sin((t - 1.1) * 5 * Math.PI);
        }
    },

    to(target: any, props: Record<string, number>, duration: number, options: TweenOptions = {}) {
        const tween: TweenTask = {
            target,
            startProps: {},
            endProps: props,
            duration,
            elapsed: 0,
            delay: options.delay || 0,
            easing: (this.easing as any)[options.easing || 'easeOut'] || this.easing.easeOut,
            onComplete: options.onComplete,
            loop: options.loop || false,
            yoyo: options.yoyo || false,
            direction: 1
        };

        for (const key in props) {
            tween.startProps[key] = target[key] ?? 0;
        }

        this.activeTweens.push(tween);
        return tween;
    },

    update(dt: number) {
        this.activeTweens = this.activeTweens.filter((tween) => {
            if (tween.delay > 0) {
                tween.delay -= dt;
                return true;
            }

            tween.elapsed += dt * tween.direction;
            const progress = Math.min(Math.max(tween.elapsed / tween.duration, 0), 1);
            const easedProgress = tween.easing(progress);

            for (const key in tween.endProps) {
                const start = tween.startProps[key];
                const end = tween.endProps[key];
                tween.target[key] = start + (end - start) * easedProgress;
            }

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

    cancel(target: any) {
        this.activeTweens = this.activeTweens.filter((t) => t.target !== target);
    },

    shake(target: any, intensity: number = 5, duration: number = 300) {
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

    pulse(target: any, scale: number = 1.2, duration: number = 200) {
        const original = target.scale || 1;
        this.to(target, { scale }, duration / 2, {
            easing: 'easeOut',
            onComplete: () => {
                this.to(target, { scale: original }, duration / 2, { easing: 'easeIn' });
            }
        });
    }
};

export { Tween };
