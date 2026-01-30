/**
 * VFXConfig - Unified VFX Configuration
 *
 * Combines VFX_Templates, VFX_Categories, and VFX_Sequences into a single
 * VFXConfig object for backward compatibility with existing systems.
 *
 * Owner: VFX Specialist
 */

import { VFX_Templates } from './VFX_Templates';
import { VFX_Categories } from './VFX_Categories';
import { VFX_Sequences } from './VFX_Sequences';
import type { ParticleOptions, VFXSequence } from '../types/vfx';

// Create unified VFXConfig with proper typing
const VFXConfig = {
    // Templates from VFX_Templates.ts
    TEMPLATES: VFX_Templates as Record<string, ParticleOptions>,

    // Sequences from VFX_Sequences.ts
    SEQUENCES: VFX_Sequences as Record<string, VFXSequence>,

    // Domain-specific categories
    HERO: VFX_Categories.HERO,
    DINO: VFX_Categories.DINO,
    RESOURCE: VFX_Categories.RESOURCE,
    PURCHASE: VFX_Categories.PURCHASE,
    UNLOCK: VFX_Categories.UNLOCK,
    MAGNET: VFX_Categories.MAGNET,
    PROJECTILES: VFX_Categories.PROJECTILES
};

export { VFXConfig };
