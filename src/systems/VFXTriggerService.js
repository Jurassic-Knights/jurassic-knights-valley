/**
 * VFXTriggerService - Orchestrates complex visual effect sequences
 *
 * Extracted from Game.js to separate cinematic visuals from core logic.
 * Uses VFXController for low-level particle management.
 *
 * Owner: VFX Artist
 */

const VFXTriggerService = {
    /**
     * Trigger VFX for a successful purchase
     * @param {number} x
     * @param {number} y
     */
    triggerPurchaseVFX(x, y) {
        if (!window.VFXController) return;

        if (window.VFXConfig) {
            // 1. Coin Fountain
            VFXController.playForeground(x, y, VFXConfig.PURCHASE.COIN_FOUNTAIN);
            // 2. Sparkle Burst
            VFXController.playForeground(x, y, VFXConfig.PURCHASE.SPARKLE_BURST);
            // 3. Success Aura
            VFXController.playBackground(x, y, VFXConfig.PURCHASE.SUCCESS_AURA);
        }

        // Floating text disabled until ready
        // if (window.FloatingText && window.VFXController) {
        //     const text = new FloatingText('UPGRADED!', x, y - 50, '#32CD32', 2000);
        //     VFXController.addFloatingText(text);
        // }
    },

    /**
     * Trigger VFX for unlocking a new zone
     * @param {number} x
     * @param {number} y
     */
    triggerUnlockVFX(x, y) {
        if (!window.VFXController) return;

        if (window.VFXConfig) {
            // 1. Core Flash
            VFXController.playForeground(x, y, VFXConfig.UNLOCK.CORE_FLASH);
            // 2. Primary Shockwave
            VFXController.playBackground(x, y, VFXConfig.UNLOCK.SHOCKWAVE_PRIMARY);
            // 3. Secondary Atmosphere
            VFXController.playBackground(x, y, VFXConfig.UNLOCK.SHOCKWAVE_SECONDARY);
            // 4. Divine Glint
            VFXController.playForeground(x, y, VFXConfig.UNLOCK.DIVINE_GLINT);

            // 5. Heavy Debris
            VFXConfig.UNLOCK.DEBRIS_COLORS.forEach((col) => {
                VFXController.playForeground(x, y, { ...VFXConfig.UNLOCK.DEBRIS_BASE, color: col });
            });
        }

        if (window.VFXController && typeof VFXController.spawnFloatingText === 'function') {
            VFXController.spawnFloatingText('ZONE SECURED', x, y - 80, '#FFD700', 3000);
        }
    },

    /**
     * Trigger completion VFX when all magnet items arrive
     * "Electromagnetic Field Collapse" - Realistic Sequence
     * @param {object} hero - Hero entity for position reference
     */
    triggerMagnetCompletionVFX(hero) {
        if (!hero || !window.VFXController) return;

        Logger.info('[VFXTriggerService] Electromagnetic Collapse Triggered');

        const x = hero.x;
        const y = hero.y;

        if (window.VFXConfig) {
            // --- PHASE 1: FIELD BUILDUP ---
            // Electric arcs converging toward hero
            VFXController.playForeground(x, y, VFXConfig.MAGNET.ELECTRIC_ARCS);
            // Static flash at center
            VFXController.playForeground(x, y, VFXConfig.MAGNET.STATIC_FLASH);

            // Trigger the collapse after buildup (150ms delay)
            setTimeout(() => {
                // --- PHASE 2: FIELD COLLAPSE ---
                // Magnetic pulse wave
                VFXController.playBackground(x, y, VFXConfig.MAGNET.FIELD_PULSE);
                // Metal debris pulled in
                VFXController.playForeground(x, y, VFXConfig.MAGNET.METAL_DEBRIS);
                // Impact sparks
                VFXController.playForeground(x, y, VFXConfig.MAGNET.IMPACT_SPARKS);

                // --- PHASE 3: SETTLING ---
                // Dust cloud from the disturbance
                VFXController.playBackground(x, y, VFXConfig.MAGNET.DUST_CLOUD);
            }, 150);
        }
    }
};

window.VFXTriggerService = VFXTriggerService;

// ES6 Module Export
export { VFXTriggerService };
