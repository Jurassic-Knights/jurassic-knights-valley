/**
 * FloatingText - Canvas-based damage numbers/popups
 * 
 * Renders directly to canvas to ensure perfect world alignment.
 */
class FloatingText {
    constructor(text, x, y, color = '#FFD700', duration = 2000) {
        this.text = text;
        this.x = x;
        this.y = y;
        this.color = color;
        this.duration = duration; // ms
        this.timer = 0;

        this.active = true;
        this.velocityY = -50; // Pixels per second upwards
        this.alpha = 1;
    }

    update(dt) {
        if (!this.active) return;

        const dtSec = dt / 1000;
        this.timer += dt;

        // Move up
        this.y += this.velocityY * dtSec;

        // Fade Logic (Match the "Stay visible then fade" feel)
        // 80% opacity 1, then fade.
        const pct = this.timer / this.duration;

        if (pct > 1) {
            this.active = false;
        } else if (pct > 0.8) {
            // Fade out last 20%
            this.alpha = 1 - ((pct - 0.8) / 0.2);
        } else {
            this.alpha = 1;
        }
    }

    render(ctx) {
        if (!this.active) return;

        ctx.save();
        ctx.globalAlpha = this.alpha;

        // Font Style
        ctx.font = 'bold 24px "Segoe UI", sans-serif'; // Cleaner font
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Shadow/Outline
        ctx.lineWidth = 3;
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.strokeText(this.text, this.x, this.y);

        // Fill
        ctx.fillStyle = this.color;
        ctx.fillText(this.text, this.x, this.y);

        ctx.restore();
    }
}

window.FloatingText = FloatingText;
