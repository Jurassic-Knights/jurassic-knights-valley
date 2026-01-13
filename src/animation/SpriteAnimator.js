/**
 * Sprite Animation System
 * Handles sprite sheet playback and animation states
 * 
 * Owner: Animator
 */

const SpriteAnimator = {
    animations: {},
    activeAnimations: new Map(),

    /**
     * Initialize with animation registry
     */
    async init() {
        try {
            const response = await fetch('assets/registry/animations.json');
            const data = await response.json();
            this.animations = data.animations || {};
            Logger.info('[SpriteAnimator] Initialized');
        } catch (error) {
            Logger.warn('[SpriteAnimator] No animation registry found');
        }
    },

    /**
     * Get animation definition by ID
     */
    getAnimation(animId) {
        return this.animations[animId] || null;
    },

    /**
     * Create an animation instance for an entity
     * @param {string} entityId - Unique entity identifier
     * @param {string} animId - Animation ID from registry
     */
    play(entityId, animId) {
        const anim = this.getAnimation(animId);
        if (!anim) {
            Logger.warn(`[SpriteAnimator] Animation not found: ${animId}`);
            return null;
        }

        const instance = {
            animId,
            currentFrame: 0,
            elapsed: 0,
            playing: true,
            ...anim
        };

        this.activeAnimations.set(entityId, instance);
        return instance;
    },

    /**
     * Stop animation for an entity
     */
    stop(entityId) {
        this.activeAnimations.delete(entityId);
    },

    /**
     * Update all active animations
     * @param {number} dt - Delta time in ms
     */
    update(dt) {
        this.activeAnimations.forEach((anim, entityId) => {
            if (!anim.playing) return;

            anim.elapsed += dt;

            if (anim.elapsed >= anim.frameDuration) {
                anim.elapsed = 0;
                anim.currentFrame++;

                if (anim.currentFrame >= anim.frames.length) {
                    if (anim.loop) {
                        anim.currentFrame = 0;
                    } else {
                        anim.playing = false;
                        anim.currentFrame = anim.frames.length - 1;
                    }
                }
            }
        });
    },

    /**
     * Get current frame index for an entity
     */
    getCurrentFrame(entityId) {
        const anim = this.activeAnimations.get(entityId);
        if (!anim) return 0;
        return anim.frames[anim.currentFrame];
    },

    /**
     * Get sprite sheet source rect for current frame
     */
    getSourceRect(entityId) {
        const anim = this.activeAnimations.get(entityId);
        if (!anim) return null;

        const frameIndex = anim.frames[anim.currentFrame];
        const cols = anim.columns || Math.floor(anim.sheetWidth / anim.frameWidth) || 8;

        const col = frameIndex % cols;
        const row = Math.floor(frameIndex / cols);

        return {
            x: col * anim.frameWidth,
            y: row * anim.frameHeight,
            width: anim.frameWidth,
            height: anim.frameHeight
        };
    }
};

window.SpriteAnimator = SpriteAnimator;
