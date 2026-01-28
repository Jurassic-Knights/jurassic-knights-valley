/**
 * Performance Profiler - In-game FPS and memory stats
 *
 * Shows real-time performance metrics when enabled.
 * Toggle with F3 key or ENV.SHOW_FPS.
 */

import { Logger } from './Logger';
import { entityManager } from './EntityManager';
import { VFXController } from '@vfx/VFXController';
import { IslandManager } from '../world/IslandManager';
import { GameInstance } from './Game';
import { Registry } from './Registry';
import { DOMUtils } from './DOMUtils';

// ENV fallback for runtime flags (in production this would be injected)
const ENV: any = {
    SHOW_FPS: false,
    DEBUG: false
};

const Profiler = {
    enabled: false,
    element: null,

    // Metrics
    fps: 0,
    frameTime: 0,
    deltaTime: 0,
    memoryUsed: 0,
    entityCount: 0,
    vfxCount: 0,
    currentZone: 'N/A',
    heroPos: { x: 0, y: 0 },

    // Internals
    frames: 0,
    lastTime: performance.now(),
    lastFrameTime: performance.now(),

    /**
     * Initialize profiler display
     */
    init() {
        // Check if should auto-enable
        this.enabled = ENV?.SHOW_FPS || false;

        // Create display element
        this.element = DOMUtils.create('div', {
            id: 'profiler',
            cssText: `
            position: fixed;
            top: 50%;
            right: calc(50% + 520px);
            transform: translateY(-50%);
            background: rgba(0, 0, 0, 0.9);
            color: #fff;
            font-family: 'Consolas', monospace;
            font-size: 24px;
            padding: 16px 20px;
            border-radius: 8px;
            border: 1px solid #444;
            z-index: 99999;
            pointer-events: none;
            display: ${this.enabled ? 'block' : 'none'};
            line-height: 1.5;
        `
        });
        document.body.appendChild(this.element);

        // Toggle with F3
        document.addEventListener('keydown', (e) => {
            if (e.key === 'F3') {
                this.toggle();
                e.preventDefault();
            }
        });

        Logger.info('[Profiler] Initialized (F3 to toggle)');
    },

    /**
     * Toggle visibility
     */
    toggle() {
        this.enabled = !this.enabled;
        this.element.style.display = this.enabled ? 'block' : 'none';
    },

    /**
     * Call each frame
     */
    update() {
        const now = performance.now();
        this.deltaTime = now - this.lastFrameTime;
        this.lastFrameTime = now;

        if (!this.enabled) return;

        this.frames++;
        const delta = now - this.lastTime;

        // Update every 500ms
        if (delta >= 500) {
            this.fps = Math.round((this.frames * 1000) / delta);
            this.frameTime = (delta / this.frames).toFixed(1);
            this.frames = 0;
            this.lastTime = now;

            // Get memory if available
            if ((performance as any).memory) {
                this.memoryUsed = Math.round((performance as any).memory.usedJSHeapSize / 1048576);
            }

            // Get entity count
            if (entityManager) {
                this.entityCount = entityManager.getAll().length;
            }

            // Get VFX/particle count
            if (VFXController && VFXController.getActiveCount) {
                this.vfxCount = VFXController.getActiveCount();
            }

            // Get current zone
            if (IslandManager && GameInstance?.hero) {
                const hero = GameInstance.hero;
                const island = IslandManager.getIslandAt?.(hero.x, hero.y);
                this.currentZone = island?.name || 'Unknown';
            }

            // Get hero position
            if (GameInstance?.hero) {
                this.heroPos.x = Math.round(GameInstance.hero.x);
                this.heroPos.y = Math.round(GameInstance.hero.y);
            }

            this.render();
        }
    },

    /**
     * Render stats
     */
    render() {
        const fpsColor = this.fps >= 55 ? '#4f4' : this.fps >= 30 ? '#ff4' : '#f44';

        let html = `<div style="margin-bottom:4px"><b>PROFILER</b> <span style="font-size:10px;opacity:0.6">(F3)</span></div>`;
        html += `<div style="color:${fpsColor}">FPS: ${this.fps}</div>`;
        html += `<div>Frame: ${this.frameTime}ms</div>`;
        html += `<div>Delta: ${this.deltaTime.toFixed(1)}ms</div>`;

        if (this.memoryUsed > 0) {
            html += `<div>Memory: ${this.memoryUsed}MB</div>`;
        }

        html += `<div style="margin-top:8px;border-top:1px solid #444;padding-top:8px">`;
        html += `<div>Entities: ${this.entityCount}</div>`;
        html += `<div>VFX: ${this.vfxCount}</div>`;
        html += `</div>`;

        html += `<div style="margin-top:8px;border-top:1px solid #444;padding-top:8px">`;
        html += `<div>Zone: ${this.currentZone}</div>`;
        html += `<div>Pos: ${this.heroPos.x}, ${this.heroPos.y}</div>`;
        html += `</div>`;

        this.element.innerHTML = html;
    }
};

// Self-updating loop (no need to call from game loop)
function profilerLoop() {
    Profiler.update();
    requestAnimationFrame(profilerLoop);
}

// Auto-init when DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        Profiler.init();
        profilerLoop();
    });
} else {
    Profiler.init();
    profilerLoop();
}

// ES6 Module Export
export { Profiler };
