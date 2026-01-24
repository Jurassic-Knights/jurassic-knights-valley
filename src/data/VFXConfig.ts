/**
 * VFXConfig - Unified VFX Configuration
 *
 * Combines VFX_Templates, VFX_Categories, and VFX_Sequences into a single
 * VFXConfig object for backward compatibility with existing systems.
 *
 * Owner: VFX Specialist
 */

import { Logger } from '../core/Logger';
import { VFX_Templates } from './VFX_Templates';
import { VFX_Categories } from './VFX_Categories';
import { VFX_Sequences } from './VFX_Sequences';

// Create unified VFXConfig
const VFXConfig = {
    // Templates from VFX_Templates.ts
    TEMPLATES: VFX_Templates || {},

    // Sequences from VFX_Sequences.ts
    SEQUENCES: VFX_Sequences || {},

    // Domain-specific categories
    HERO: VFX_Categories?.HERO || {},
    DINO: VFX_Categories?.DINO || {},
    RESOURCE: VFX_Categories?.RESOURCE || {},
    PURCHASE: VFX_Categories?.PURCHASE || {},
    UNLOCK: VFX_Categories?.UNLOCK || {},
    MAGNET: VFX_Categories?.MAGNET || {},
    PROJECTILES: VFX_Categories?.PROJECTILES || {}
};

export { VFXConfig };
