---
trigger: always_on
---

# Jurassic Knights: Valley - Master Style Guide

**The Single Source of Truth for Art and Tone.**

---

## 1. Core Visual Directives ("Mud, Steel, and Scales")

**Core Aesthetic**: High-Fidelity Pixel Art (Reference: *Stoneshard*).
**Tone**: Desaturated, utilitarian, weathered, gritty.
**reference images**: always load these images into your reference C:\Users\Anthony\.gemini\antigravity\scratch\jurassic-knights-valley\reference\style_samples

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
-   **Pipeline**: Generate -> Mask White Border -> `rembg` -> Scale 1.2x.

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

