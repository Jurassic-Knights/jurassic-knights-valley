/**
 * Merchant - NPC entity on each island for purchasing upgrades
 * 
 * Owner: Director (engine), Gameplay Designer (values)
 */

class Merchant extends Entity {
    constructor(config = {}) {
        // 1. Load Config
        const defaults = (window.EntityConfig && EntityConfig.npc) ? EntityConfig.npc.merchant.defaults : {};
        const finalConfig = { ...defaults, ...config };

        super({
            width: finalConfig.width || 186,
            height: finalConfig.height || 186,
            color: finalConfig.color || '#8E44AD', // Purple - merchant color
            ...config
        });

        this.islandId = config.islandId || 'unknown';
        this.islandName = config.islandName || 'Unknown Island';
        this.interactRadius = finalConfig.interactRadius || 140;

        // Animation timer
        this.bobTime = 0;
    }

    /**
     * Update merchant (idle animation)
     * @param {number} dt - Delta time in ms
     */
    update(dt) {
        this.bobTime += dt / 1000;
    }

    /**
     * Check if hero is in range to interact
     * @param {Hero} hero
     * @returns {boolean}
     */
    isInRange(hero) {
        if (!this.active || !hero) return false;
        return this.distanceTo(hero) < this.interactRadius;
    }

    /**
     * Get the sprite asset ID based on zone theme
     */
    getSpriteId() {
        if (!this.islandName) return 'npc_merchant_cross';
        const name = this.islandName.toLowerCase();

        let suffix = 'cross'; // Default
        if (name.includes('home')) suffix = 'home';
        else if (name.includes('quarry')) suffix = 'quarry';
        else if (name.includes('iron')) suffix = 'iron';
        else if (name.includes('dead')) suffix = 'dead';
        else if (name.includes('cross')) suffix = 'cross';
        else if (name.includes('scrap')) suffix = 'scrap';
        else if (name.includes('mud')) suffix = 'mud';
        else if (name.includes('bone')) suffix = 'bone';
        else if (name.includes('ruins')) suffix = 'ruins';

        return `npc_merchant_${suffix}`;
    }

    /**
     * Draw shadow for merchant (called by GameRenderer shadow pass)
     */
    drawShadow(ctx, forceOpaque = false) {
        if (!this.active || !this._img) return;

        // Standard Shadow config
        const env = window.EnvironmentRenderer;
        let scaleY = 0.3;
        let alpha = 0.3;
        if (env) {
            scaleY = env.shadowScaleY;
            alpha = env.shadowAlpha;
        }

        const size = 186; // Match Hero size

        // 1. Static Contact Shadow
        ctx.save();
        ctx.translate(this.x, this.y + size / 2 - 6);

        if (forceOpaque) {
            ctx.fillStyle = 'black';
            ctx.globalAlpha = 1.0;
        } else {
            ctx.fillStyle = 'black';
            ctx.globalAlpha = alpha;
        }

        const contactWidth = size * 0.4;
        const contactHeight = size * 0.1;

        ctx.beginPath();
        ctx.ellipse(0, 0, contactWidth / 2, contactHeight / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // 2. Dynamic Shadow
        ctx.save();
        ctx.translate(this.x, this.y + size / 2 - 6);

        const skew = env ? (env.shadowSkew || 0) : 0;
        ctx.transform(1, 0, skew, 1, 0, 0);

        ctx.scale(1, -scaleY);

        if (forceOpaque) {
            ctx.globalAlpha = 1.0;
        } else {
            ctx.globalAlpha = alpha;
        }

        // Optimize: Use Cached Shadow
        let shadowImg = null;
        if (window.MaterialLibrary && this._imgAssetId) {
            shadowImg = MaterialLibrary.get(this._imgAssetId, 'shadow', {}, this._img);
        }

        if (shadowImg) {
            ctx.drawImage(shadowImg, -size / 2, -size, size, size);
        } else {
            // Fallback Oval - skipped if contact shadow exists
            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            if (forceOpaque) ctx.fillStyle = 'black';
            ctx.beginPath();
            ctx.ellipse(0, -size / 5, size / 2, size / 4, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }

    /**
     * Render merchant
     * @param {CanvasRenderingContext2D} ctx
     */
    render(ctx) {
        if (!this.active) return;

        const bob = Math.sin(this.bobTime * 2) * 3;

        // Try to draw sprite
        if (window.AssetLoader) {
            const id = this.getSpriteId();
            const path = AssetLoader.getImagePath(id);

            if (path) {
                if (!this._img || this._imgAssetId !== id) {
                    this._img = AssetLoader.createImage(path);
                    this._imgAssetId = id;
                }

                if (this._img.complete && this._img.naturalWidth) {
                    const size = 186; // Match Hero size

                    ctx.save();

                    // Shadow is now handled by GameRenderer's Shadow Pass calling drawShadow()
                    // We DO NOT draw shadow here to avoid double shadow / stacking issues.

                    /* Custom shadow removed in favor of standard
                    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
                    ctx.beginPath();
                    ctx.ellipse(this.x, this.y + size / 2 - 10, 50, 12, 0, 0, Math.PI * 2);
                    ctx.fill();
                    */

                    // Sprite (centered)
                    ctx.drawImage(this._img, this.x - size / 2, this.y - size / 2 + bob, size, size);

                    ctx.restore();

                    // Speech Bubble Icon (Above head)
                    const iconPath = AssetLoader.getImagePath('ui_icon_speech_bubble');
                    if (iconPath) {
                        if (!this._iconImg) {
                            this._iconImg = AssetLoader.createImage(iconPath);
                        }

                        if (this._iconImg.complete && this._iconImg.naturalWidth) {
                            const iconSize = 64; // Size of the bubble
                            const hoverOffset = Math.sin(this.bobTime * 3) * 5; // Float animation
                            const iconY = this.y - size / 2 - iconSize + 20 + hoverOffset; // Position above head

                            ctx.drawImage(this._iconImg, this.x - iconSize / 2, iconY, iconSize, iconSize);
                        } else {
                            // Fallback if icon not loaded yet
                            // ctx.fillText('...', this.x, this.y - size / 2 - 20);
                        }
                    }
                    return;
                }
            }
        }

        // Fallback: Procedural Rendering
        ctx.save();

        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(this.x, this.y + this.height / 2 + 5, this.width / 2, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        // Body (robe shape)
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.moveTo(this.x - this.width / 2, this.y + this.height / 2 + bob);
        ctx.lineTo(this.x - this.width / 4, this.y - this.height / 3 + bob);
        ctx.lineTo(this.x + this.width / 4, this.y - this.height / 3 + bob);
        ctx.lineTo(this.x + this.width / 2, this.y + this.height / 2 + bob);
        ctx.closePath();
        ctx.fill();

        // Head
        ctx.fillStyle = '#F5CBA7';
        ctx.beginPath();
        ctx.arc(this.x, this.y - this.height / 3 + bob, 12, 0, Math.PI * 2);
        ctx.fill();

        // Hood
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y - this.height / 3 - 5 + bob, 14, Math.PI, 0);
        ctx.fill();

        // Border
        ctx.strokeStyle = '#1A1A2E';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.restore();

        // Speech Bubble Icon (Fallback path)
        if (window.AssetLoader) {
            const iconPath = AssetLoader.getImagePath('ui_icon_speech_bubble');
            if (iconPath) {
                if (!this._iconImg) {
                    this._iconImg = AssetLoader.createImage(iconPath);
                }

                if (this._iconImg.complete && this._iconImg.naturalWidth) {
                    const iconSize = 64;
                    const hoverOffset = Math.sin(this.bobTime * 3) * 5;
                    // Adjust base position for procedural height
                    const headY = this.y - this.height / 3 - 20;

                    ctx.drawImage(this._iconImg, this.x - iconSize / 2, headY - iconSize + hoverOffset, iconSize, iconSize);
                }
            }
        }
    }
}

window.Merchant = Merchant;
