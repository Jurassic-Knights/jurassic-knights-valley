---
description: Regenerate marked SFX based on queue from dashboard
---

# Sound Regeneration Workflow

When the user calls `/sound-regenerate`, follow these steps:

## 1. Read the Regeneration Queue
// turbo
Read the file `C:\Users\Anthony\.gemini\antigravity\scratch\jurassic-knights-valley\tools\sfx_regeneration_queue.json` to get the list of SFX marked for regeneration.

## 2. Load Reference Sound - Compsognathus (Gold Standard)
The Compsognathus (dinosaur_t1_01) is the gold standard for sound quality. View `src/audio/SFX_Dinosaurs.js` and study the `sfx_aggro_dinosaur_t1_01` implementation which uses:
- Multi-oscillator synthesis with frequency sweeps
- Proper attack/decay envelopes via Web Audio API
- Layered noise textures for organic quality
- LFO vibrato modulation to make it feel alive

## 3. Load Source Descriptions
For each SFX in the queue, look up the corresponding enemy definition to get `sourceDescription`:
- Dinosaurs: `tools/enemies/dinosaur.json`
- Herbivores: `tools/enemies/herbivore.json`
- Saurians: `tools/enemies/saurian.json`
- Humans: `tools/enemies/human.json`

## 4. Epic Roar Standard (v22.8.1)
All sounds must follow the 5-layer synthesis architecture:
1. **Layer 1: Deep Rumbling Bass** - Earth-shaking foundation (sine wave at 25-45Hz)
2. **Layer 2: Mid-Frequency Growl** - Terrifying core (sawtooth with bandpass filtering)
3. **Layer 3: High-Pitched Screech** - Scary overtones (square wave harmonic)
4. **Layer 4: Noise Texture** - Organic, animalistic quality (hisses, rasps, gurgles)
5. **Layer 5: Vibrato Modulation** - Dynamic character (LFOs) to make the sound feel alive

## 5. Regenerate Each SFX
For each SFX in the queue:
1. Parse the SFX ID to determine the category, tier, and enemy number (e.g., `sfx_aggro_dinosaur_t1_01`)
2. Look up the enemy's `sourceDescription` from the JSON file
3. Identify the correct SFX file:
   - `dinosaur_*` → `src/audio/SFX_Dinosaurs.js`
   - `herbivore_*` → `src/audio/SFX_Herbivores.js`
   - `saurian_*` → `src/audio/SFX_Saurians.js`
   - `human_*` → `src/audio/SFX_Humans.js`
4. Rewrite the sound function using the Compsognathus pattern and source description
5. Use proper Web Audio API with:
   - `ctx.createOscillator()` for tones
   - `ctx.createGain()` with proper envelopes
   - `ctx.createBiquadFilter()` for filtering
   - LFO modulation for vibrato

## 6. Clear the Queue After Completion
After successfully regenerating all sounds:
1. Clear the regeneration queue file
2. Notify the user of the completed regenerations

## Example Gold Standard Implementation (Compsognathus)
```javascript
'sfx_aggro_dinosaur_t1_01': function() {
    const t = SFX.ctx.currentTime;
    // Quick chirpy sequence - small predator
    for (let i = 0; i < 3; i++) {
        const osc = SFX.ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(800 + i * 100, t + i * 0.08);
        osc.frequency.exponentialRampToValueAtTime(600, t + i * 0.08 + 0.06);
        
        const gain = SFX.ctx.createGain();
        gain.gain.setValueAtTime(0, t + i * 0.08);
        gain.gain.linearRampToValueAtTime(SFX.TARGET_VOLUME * 0.8, t + i * 0.08 + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.01, t + i * 0.08 + 0.06);
        
        osc.connect(gain);
        gain.connect(SFX.masterGain);
        osc.start(t + i * 0.08);
        osc.stop(t + i * 0.08 + 0.08);
    }
}
```

Key patterns to follow:
- Use `const t = SFX.ctx.currentTime` for timing base
- Create oscillators with proper frequency ramps
- Use `SFX.TARGET_VOLUME` for consistent volume
- Connect to `SFX.masterGain` for proper routing
- Use exponential ramps for natural decay
