/**
 * ProceduralSFX - Legacy compatibility wrapper
 *
 * This file now just re-exports SFX for backward compatibility.
 * The actual sounds are in the modular SFX_*.ts files.
 */

import { SFX } from './SFX_Core';

// ProceduralSFX is an alias for SFX
const ProceduralSFX = SFX;

export { SFX, ProceduralSFX };
