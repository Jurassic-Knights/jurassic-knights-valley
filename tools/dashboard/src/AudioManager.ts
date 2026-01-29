
import { SFX } from '@audio/SFX_Core';

// Import all SFX category modules to register their handlers
import '@audio/SFX_UI';
import '@audio/SFX_Resources';
import '@audio/SFX_Enemies';
import '@audio/SFX_Herbivores';
import '@audio/SFX_Dino_T1_01';
import '@audio/SFX_Dino_T1_02';
import '@audio/SFX_Dino_T1_03';
import '@audio/SFX_Dino_T1_04';
import '@audio/SFX_Dino_T2_01';
import '@audio/SFX_Dino_T2_02';
import '@audio/SFX_Dino_T2_03';
import '@audio/SFX_Dino_T2_04';
import '@audio/SFX_Dino_T2_05';
import '@audio/SFX_Dino_T3_01';
import '@audio/SFX_Dino_T3_02';
import '@audio/SFX_Dino_T3_03';
import '@audio/SFX_Dino_T3_04';
import '@audio/SFX_Dino_T4_01';
import '@audio/SFX_Dino_T4_02';
import '@audio/SFX_Dino_T4_03';
import '@audio/SFX_Human_T1_01';
import '@audio/SFX_Human_T1_02';
import '@audio/SFX_Human_T1_03';
import '@audio/SFX_Human_T2_01';
import '@audio/SFX_Human_T2_02';
import '@audio/SFX_Human_T2_03';
import '@audio/SFX_Human_T3_01';
import '@audio/SFX_Human_T3_02';
import '@audio/SFX_Human_T3_03';
import '@audio/SFX_Human_T4_01';
import '@audio/SFX_Human_T4_02';
import '@audio/SFX_Human_T4_03';
import '@audio/SFX_Saurian_T1_01';
import '@audio/SFX_Saurian_T1_02';
import '@audio/SFX_Saurian_T1_03';
import '@audio/SFX_Saurian_T2_01';
import '@audio/SFX_Saurian_T2_02';
import '@audio/SFX_Saurian_T2_03';
import '@audio/SFX_Saurian_T3_01';
import '@audio/SFX_Saurian_T3_02';
import '@audio/SFX_Saurian_T3_03';
import '@audio/SFX_Saurian_T3_04';
import '@audio/SFX_Saurian_T4_01';
import '@audio/SFX_Saurian_T4_02';

// Audio Context State
let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;

export function initAudio(): void {
    if (audioCtx) return;
    audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0.7;
    masterGain.connect(audioCtx.destination);
    SFX.init(audioCtx, masterGain);
    console.log('[AudioManager] SFX initialized with', Object.keys(SFX.handlers).length, 'sounds');
}

export function playSound(id: string): void {
    initAudio();
    console.log('[AudioManager] Playing sound:', id);
    SFX.play(id);
}
