/**
 * EnemyBehaviorUI – Health bar and threat indicator rendering for Enemy.
 */
import { Enemy } from './EnemyCore';
import { Registry } from '@core/Registry';

let _cachedProgressBarRenderer: { draw: (ctx: CanvasRenderingContext2D, opts: unknown) => void } | null = null;
function getProgressBarRenderer() {
    if (_cachedProgressBarRenderer == null) _cachedProgressBarRenderer = Registry.get('ProgressBarRenderer');
    return _cachedProgressBarRenderer;
}

export function setupEnemyUIBehavior() {
    Enemy.prototype.renderUI = function (this: Enemy, ctx: CanvasRenderingContext2D) {
        if (!this.active || this.isDead) return;
        this.renderHealthBar(ctx);
        this.renderThreatIndicator(ctx);
    };

    Enemy.prototype.renderHealthBar = function (this: Enemy, ctx: CanvasRenderingContext2D) {
        if (this.health >= this.maxHealth && !this.isBoss) return;

        const width = this.isBoss ? 160 : 60;
        const height = this.isBoss ? 12 : 6;
        const yOffset = this.isBoss ? 40 : 25;
        const x = this.x - width / 2;
        const y = this.y - this.height / 2 - yOffset;

        const ProgressBarRenderer = getProgressBarRenderer();
        if (ProgressBarRenderer) {
            ProgressBarRenderer.draw(ctx, {
                x, y, width, height,
                percent: this.health / this.maxHealth,
                mode: 'health',
                entityId: this.id,
                animated: true
            });
        } else {
            ctx.fillStyle = 'black';
            ctx.fillRect(x, y, width, height);
            ctx.fillStyle = 'red';
            ctx.fillRect(x + 1, y + 1, (width - 2) * (this.health / this.maxHealth), height - 2);
        }
    };

    Enemy.prototype.renderThreatIndicator = function (this: Enemy, ctx: CanvasRenderingContext2D) {
        if (!this.isElite) return;
        ctx.save();
        ctx.fillStyle = '#FFD700';
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.x - 10, this.y - this.height / 2 - 35, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
    };
}
