/**
 * FloatingText - Canvas-based damage numbers/popups
 *
 * Animation: Start full size → shrink while floating → hold small → pop out
 * Stacking: Multiple popups at same position stack vertically
 *
 * Owner: VFX Specialist
 */
import { Registry } from '@core/Registry';

class FloatingText {
    text: string;
    x: number;
    y: number;
    color: string;
    outlineColor: string;
    fontSize: number;
    fontWeight: string;
    floatDuration: number;
    holdDuration: number;
    totalDuration: number;
    floatDistance: number;
    shrinkScale: number;
    timer: number;
    active: boolean;
    startY: number;

    constructor(text: any, x: number, y: number, config: any = {}, stackOffset: number = 0) {
        this.text = String(text);
        this.x = x + (config.offsetX || 0);
        this.y = y + (config.offsetY || -60) - stackOffset; // Stack offset moves up

        this.color = config.color || '#FFFFFF';
        this.outlineColor = config.outlineColor || '#000000';
        this.fontSize = config.fontSize || 96;
        this.fontWeight = config.fontWeight || 'bold';

        // Timing (in seconds)
        this.floatDuration = config.floatDuration || 0.4; // Time to float and shrink
        this.holdDuration = config.holdDuration || 0.15; // Time to hold at small size
        this.totalDuration = this.floatDuration + this.holdDuration;

        this.floatDistance = config.floatDistance || 40; // Pixels to float up
        this.shrinkScale = config.shrinkScale || 0.5; // Final scale (50%)

        this.timer = 0;
        this.active = true;
        this.startY = this.y;
    }

    update(dt) {
        if (!this.active) return;

        const dtSec = dt / 1000;
        this.timer += dtSec;

        if (this.timer >= this.totalDuration) {
            this.active = false;
            return;
        }

        // Float phase: move up and shrink
        if (this.timer < this.floatDuration) {
            const floatProgress = this.timer / this.floatDuration;
            // Ease out for smooth deceleration
            const easedProgress = 1 - Math.pow(1 - floatProgress, 2);
            this.y = this.startY - this.floatDistance * easedProgress;
        }
        // Hold phase: stay still at final position
    }

    getScale() {
        if (this.timer >= this.floatDuration) {
            // Hold phase - stay at shrink scale
            return this.shrinkScale;
        }
        // Float phase - interpolate from 1.0 to shrinkScale
        const progress = this.timer / this.floatDuration;
        return 1.0 - (1.0 - this.shrinkScale) * progress;
    }

    render(ctx) {
        if (!this.active) return;

        const scale = this.getScale();
        const scaledFontSize = this.fontSize * scale;

        ctx.save();
        ctx.translate(this.x, this.y);

        // Font Style
        ctx.font = `${this.fontWeight} ${scaledFontSize}px "Segoe UI", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Outline
        ctx.lineWidth = 4 * scale;
        ctx.strokeStyle = this.outlineColor;
        ctx.strokeText(this.text, 0, 0);

        // Fill
        ctx.fillStyle = this.color;
        ctx.fillText(this.text, 0, 0);

        ctx.restore();
    }
}

/**
 * FloatingTextManager - Manages all floating text with stacking support
 */
const FloatingTextManager = {
    texts: [],

    // Track recent spawn positions for stacking
    recentSpawns: new Map(), // key: "x,y" -> { count, lastTime }
    stackSpacing: 50, // Pixels between stacked texts
    stackTimeout: 500, // ms before stack resets

    // Type-based configurations
    configs: {
        damage: {
            color: '#FFFFFF',
            outlineColor: '#000000',
            fontSize: 96,
            fontWeight: 'bold',
            floatDuration: 0.4,
            holdDuration: 0.15,
            floatDistance: 40,
            shrinkScale: 0.5,
            offsetY: -60
        },
        critical: {
            color: '#FF4444',
            outlineColor: '#440000',
            fontSize: 128,
            fontWeight: 'bold',
            floatDuration: 0.5,
            holdDuration: 0.2,
            floatDistance: 50,
            shrinkScale: 0.4,
            offsetY: -80
        },
        heal: {
            color: '#44FF44',
            outlineColor: '#004400',
            fontSize: 88,
            fontWeight: 'bold',
            floatDuration: 0.4,
            holdDuration: 0.15,
            floatDistance: 35,
            shrinkScale: 0.5,
            offsetY: -60
        },
        gold: {
            color: '#FFD700',
            outlineColor: '#8B6914',
            fontSize: 80,
            fontWeight: 'bold',
            floatDuration: 0.5,
            holdDuration: 0.2,
            floatDistance: 30,
            shrinkScale: 0.6,
            offsetY: -50
        },
        xp: {
            color: '#9966FF',
            outlineColor: '#330066',
            fontSize: 72,
            fontWeight: 'normal',
            floatDuration: 0.5,
            holdDuration: 0.2,
            floatDistance: 30,
            shrinkScale: 0.6,
            offsetY: -40
        },
        miss: {
            color: '#888888',
            outlineColor: '#333333',
            fontSize: 72,
            fontWeight: 'italic',
            floatDuration: 0.3,
            holdDuration: 0.1,
            floatDistance: 25,
            shrinkScale: 0.5,
            offsetY: -60
        }
    },

    /**
     * Get stack offset for position
     */
    getStackOffset(x, y) {
        const key = `${Math.round(x / 50)},${Math.round(y / 50)}`; // Round to grid
        const now = Date.now();

        const existing = this.recentSpawns.get(key);
        if (existing && now - existing.lastTime < this.stackTimeout) {
            existing.count++;
            existing.lastTime = now;
            return existing.count * this.stackSpacing;
        } else {
            this.recentSpawns.set(key, { count: 0, lastTime: now });
            return 0;
        }
    },

    /**
     * Spawn floating text
     */
    spawn(x, y, text, type = 'damage') {
        const config = this.configs[type] || this.configs.damage;
        const stackOffset = this.getStackOffset(x, y);
        this.texts.push(new FloatingText(text, x, y, config, stackOffset));
    },

    /**
     * Convenience method for damage numbers
     */
    showDamage(x, y, damage, isCritical = false) {
        const type = isCritical ? 'critical' : 'damage';
        const text = isCritical ? `${damage}!` : damage;
        this.spawn(x, y, text, type);
    },

    /**
     * Update all texts
     */
    update(dt) {
        for (let i = this.texts.length - 1; i >= 0; i--) {
            this.texts[i].update(dt);
            if (!this.texts[i].active) {
                this.texts.splice(i, 1);
            }
        }

        // Clean old stack entries
        const now = Date.now();
        for (const [key, value] of this.recentSpawns) {
            if (now - value.lastTime > this.stackTimeout * 2) {
                this.recentSpawns.delete(key);
            }
        }
    },

    /**
     * Render all texts
     */
    render(ctx) {
        for (const text of this.texts) {
            text.render(ctx);
        }
    },

    /**
     * Clear all texts
     */
    clear() {
        this.texts = [];
        this.recentSpawns.clear();
    }
};

if (Registry) Registry.register('FloatingTextManager', FloatingTextManager);

// ES6 Module Export
export { FloatingText, FloatingTextManager };
