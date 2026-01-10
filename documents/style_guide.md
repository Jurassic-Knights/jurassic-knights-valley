# Jurassic Knights: Valley - Master Style Guide

**The Single Source of Truth for Art and Tone.**

---

## 1. Core Visual Directives ("Mud, Steel, and Scales")

**Core Aesthetic**: High-Fidelity Pixel Art (Reference: *Stoneshard*).
**Tone**: Desaturated, utilitarian, weathered, gritty.

### The Helmet Mandate
To maintain the "Gritty Trench" feel and dehumanized scale of the war:
-   **Humans**: Must **ALWAYS** wear full-face helmets or headgear (gas masks, visors, heavy plating). 95% faceless; 5% chin visible. Hair may flow out (humanizing element), but eyes generally hidden.
-   **Saurians**: War-beasts often wear heavy plate headers, blinders.

### "No Magic" Visuals
Ground visuals in physical reality.
-   **Forbidden**: Glowing runes, floating magical circles, ethereal sparkles.
-   **Allowed**: Radio sparks, chemical signal flares, steam venting, exhaust, mud splashes.
-   **"Auras"**: Interpreted as spotlights or chemical smoke.

### The "Juicy" Standard (VFX)
-   **Layering**: Combine Flash + Smoke + Sparks. Never single emitters.
-   **Variance**: Randomize Scale, Lifetime, Velocity, Emission Count.
-   **Blending**: `lighter` (additive) for fire/energy; `source-over` (alpha) for smoke/dust.
-   **Directionality**: Cone-based emission to guide the eye.

---

## 2. Asset Generation Guidelines

### Environments (Backgrounds)
-   **Style**: High-Fidelity Pixel Art, Top-down RPG.
-   **Keywords**: "High-fidelity pixel art", "Stoneshard style", "detailed texture", "sharp pixels".
-   **Pipeline**: 
    1. Generate → Save as `_original.png`
    2. Review in Asset Dashboard → Approve → becomes `_approved_original.png`
    3. Run `photoshop_remove_bg.py` → Removes background, scales to 10px padding, creates `_clean.png`
    4. Register `_clean.png` in `AssetLoader.js`

### Characters & Entities
-   **Style**: High-Fidelity Pixel Art, Realistic proportions.
-   **Constraint**: **NEVER** generate text/letters/numbers in the image.
-   **Prompt Addition**: "no text, no letters, no watermark".

### UI & Icons
-   **Style**: Detailed Pixel Art Iconography, cleaner than world assets but textured.
-   **Materials**: Pixelated parchment, rusted iron, worn leather, brass frames.
-   **Reference**: Stoneshard UI, Diablo 2 inventory.

### Zone Visual Identities
*   **Home Outpost**: Mud, Timber, Green grass, Military supplies.
*   **Quarry Fields**: Grey stone, Dust, Excavation pits.
*   **Iron Ridge**: Rust orange, Industrial debris, Red clay.
*   **Dead Woods**: Desaturated green-grey, Twisted roots, Fog.
*   **Bone Valley**: Bleached white bone, Beige sand, Fossils.
*   **The Ruins**: Ancient stone, Moss, Mystery (No magic visuals).

---

## 3. Tone & Writing Guide

**Core Pillars**: Epic, Primal, Grounded.

### Writing Style
-   **Do**: Active voice, punchy descriptions, sensory details (physicality). Reference dinosaurs/knights naturally.
-   **Don't**: Modern slang, anachronisms, over-explaining, verbose UI text.

### Examples
-   *Good*: "Raptor-tooth blade. Swift. Deadly. Hungry." / "Forge ahead, Knight."
-   *Bad*: "A sword made from dinosaur teeth." / "Click here to continue."


---

## 4. Audio Design Guidelines ("Mud & Steel Sounds")

**Core Aesthetic**: Low-frequency, analog, grounded. No bright 8-bit bleeps.
**Reference**: `restMelody()` in `ProceduralSFX.js` - the benchmark for thematic audio.

### Synthesis Principles
| Guideline | Do | Don't |
| :--- | :--- | :--- |
| **Waveforms** | Triangle, Sawtooth (warm, analog) | Pure Sine (too clean) |
| **Frequency Range** | Low (60-300Hz base), Mid (300-800Hz accents) | High-pitched (>1000Hz lead) |
| **Key/Mode** | Minor, Dorian, Pentatonic (somber) | Major (too cheerful) |
| **Tempo** | Slow, deliberate (300-500ms gaps) | Fast arpeggios (<150ms) |
| **Layering** | Drone + Melody + Noise texture | Single isolated tones |

### Sound Categories

#### UI Sounds
- **Clicks**: Mechanical switches, not blips. Low thud (60-150Hz drop).
- **Unlocks**: Hydraulic hiss + servo sweep. Industrial.
- **Errors**: Dull clunk. Low square wave (55Hz).

#### Combat Sounds
- **Impacts**: Material-specific (Wood thud, Stone crack, Metal clang).
- **Swings**: Filtered noise whoosh (200→600Hz sweep).
- **Shots**: Deep thump (120→40Hz) + muzzle blast noise.

#### Ambient/Weather
- **Rain/Storm**: Filtered white noise, very subtle (0.015 gain).
- **Thunder**: Deep rumble (400→100Hz filter sweep), loud (0.4 gain).
- **Wind**: Bandpass noise (400Hz) with LFO modulation.

#### Melodic (Rest, Victory, etc.)
- **Reference**: `restMelody()` - D minor pentatonic, triangle waves, 350ms note gaps.
- **Always include**: Low drone underneath (D2/73Hz), soft noise texture.
- **Chord resolution**: Minor or modal (avoid major triads).

### Technical Standards
- **Ambient Loops**: 0.015 gain (subtle background).
- **One-shots**: 0.1-0.3 gain (action feedback).
- **Dramatic events**: 0.4+ gain (thunder, impacts).
- **Always guard** for `this.ctx === null` before synthesis.
