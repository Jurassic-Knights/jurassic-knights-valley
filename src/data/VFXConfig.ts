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

export interface VFXCategory {
    [key: string]: Partial<ParticleOptions> | string | string[] | any; // Temporary fallback if needed, but primarily structural
}

// Create unified VFXConfig with proper typing
const VFXConfig = {
    // Templates from VFX_Templates.ts
    TEMPLATES: VFX_Templates as Record<string, ParticleOptions>,

    // Sequences from VFX_Sequences.ts
    SEQUENCES: VFX_Sequences as Record<string, VFXSequence>,

    // Domain-specific categories
    HERO: VFX_Categories.HERO as VFXCategory,
    DINO: VFX_Categories.DINO as VFXCategory,
    RESOURCE: VFX_Categories.RESOURCE as VFXCategory,
    PURCHASE: VFX_Categories.PURCHASE as VFXCategory,
    UNLOCK: VFX_Categories.UNLOCK as VFXCategory,
    MAGNET: VFX_Categories.MAGNET as VFXCategory,
    PROJECTILES: VFX_Categories.PROJECTILES as VFXCategory
};

export { VFXConfig };
