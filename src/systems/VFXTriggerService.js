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
            VFXConfig.UNLOCK.DEBRIS_COLORS.forEach(col => {
                VFXController.playForeground(x, y, { ...VFXConfig.UNLOCK.DEBRIS_BASE, color: col });
            });
        }

        if (window.VFXController && typeof VFXController.spawnFloatingText === 'function') {
            VFXController.spawnFloatingText('ZONE SECURED', x, y - 80, '#FFD700', 3000);
        }
    },

    /**
     * Trigger completion VFX when all magnet items arrive
     * "The Magnetic Singularity" - AAA Sequence
     * @param {object} hero - Hero entity for position reference
     */
    triggerMagnetCompletionVFX(hero) {
        if (!hero || !window.VFXController) return;

        console.log('[VFXTriggerService] Magnetic Singularity Triggered');

        const x = hero.x;
        const y = hero.y;

        if (window.VFXConfig) {
            // --- PHASE 1: THE GATHER ---
            VFXController.playForeground(x, y, VFXConfig.MAGNET.GATHER_STREAK);
            VFXController.playForeground(x, y, VFXConfig.MAGNET.GATHER_GLOW);

            // Trigger the burst after the gather (200ms delay)
            setTimeout(() => {
                // --- PHASE 2: THE DISCHARGE ---
                VFXController.playBackground(x, y, VFXConfig.MAGNET.IMPACT_SHOCKWAVE);
                VFXController.playForeground(x, y, VFXConfig.MAGNET.GOD_RAYS);
                VFXController.playForeground(x, y, VFXConfig.MAGNET.STREAK_SPARKS);
                VFXController.playForeground(x, y, VFXConfig.MAGNET.COOLING_DEBRIS);

                // --- PHASE 3: THE AFTERMATH ---
                VFXController.playForeground(x, y, VFXConfig.MAGNET.SMOKE);
            }, 200);
        }
    }
};

window.VFXTriggerService = VFXTriggerService;
