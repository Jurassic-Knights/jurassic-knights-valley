/**
 * SFXLoader - Imports all SFX category files to register sound handlers
 *
 * This file imports all SFX_* category files so their IIFE registration code runs
 * and registers handlers with SFX_Core.
 */

// Core must be imported first
import './SFX_Core';

// UI Sounds
import './SFX_UI';

// Shared/Common
import './SFX_Shared';

// Resources (mining, breaking, etc.)
import './SFX_Resources';

// Enemy sounds
import './SFX_Enemies';

// Herbivore dinosaur sounds
import './SFX_Herbivores';

// Dino T1-T4 sounds
import './SFX_Dino_T1_01';
import './SFX_Dino_T1_02';
import './SFX_Dino_T1_03';
import './SFX_Dino_T1_04';
import './SFX_Dino_T2_01';
import './SFX_Dino_T2_02';
import './SFX_Dino_T2_03';
import './SFX_Dino_T2_04';
import './SFX_Dino_T2_05';
import './SFX_Dino_T3_01';
import './SFX_Dino_T3_02';
import './SFX_Dino_T3_03';
import './SFX_Dino_T3_04';
import './SFX_Dino_T4_01';
import './SFX_Dino_T4_02';
import './SFX_Dino_T4_03';

// Human sounds
import './SFX_Human_T1_01';
import './SFX_Human_T1_02';
import './SFX_Human_T1_03';
import './SFX_Human_T2_01';
import './SFX_Human_T2_02';
import './SFX_Human_T2_03';
import './SFX_Human_T3_01';
import './SFX_Human_T3_02';
import './SFX_Human_T3_03';
import './SFX_Human_T4_01';
import './SFX_Human_T4_02';
import './SFX_Human_T4_03';

// Saurian sounds
import './SFX_Saurian_T1_01';
import './SFX_Saurian_T1_02';
import './SFX_Saurian_T1_03';
import './SFX_Saurian_T2_01';
import './SFX_Saurian_T2_02';
import './SFX_Saurian_T2_03';
import './SFX_Saurian_T3_01';
import './SFX_Saurian_T3_02';
import './SFX_Saurian_T3_03';
import './SFX_Saurian_T3_04';
import './SFX_Saurian_T4_01';
import './SFX_Saurian_T4_02';

import { Logger } from '../core/Logger';
Logger.info('[SFXLoader] All SFX categories registered');
