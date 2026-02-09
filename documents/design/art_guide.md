# Jurassic Knights: Valley — Art & Visual Guide

**Single source of truth for visuals and asset generation.**

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
    4. Register `_clean.png` in `AssetLoader.ts`

### Characters & Entities
-   **Style**: High-Fidelity Pixel Art, Realistic proportions.
-   **Constraint**: **NEVER** generate text/letters/numbers in the image.
-   **Prompt Addition**: "no text, no letters".
-   **Saurians**: Use "anthropomorphic [SPECIES]" to describe humanoid dinosaur warriors.
-   **Herbivores**: Natural dinosaurs with no equipment.
-   **Humans**: Must specify exact face covering - VARY THE TYPES (see below).

### Medieval + WWI Fusion Aesthetic
All human and saurian soldiers must blend **medieval armor** with **WWI military technology**:

**Armor Elements (Medieval):**
- Plate armor, chain mail, brigandine, leather jerkin
- Pauldrons, gauntlets, greaves, breastplates
- Knight helms, barbuta, sallet, great helms
- Shields (kite, tower, heater, buckler)

**Military Elements (WWI):**
- Uniforms: trench coat, field jacket, tunic, greatcoat
- Gear: ammunition belts, pouches, bandoliers, harnesses
- Equipment: gas mask, goggles, combat helmet (stahlhelm)
- Insignia: rank badges, unit patches, medals

**Weapon Guidelines (based on attackType):**
| attackType | Melee Weapons | Ranged Weapons |
|------------|---------------|----------------|
| **melee** | sword, longsword, greatsword, axe, war_axe, mace, war_hammer, lance, halberd, spear, flail, knife | *(n/a)* |
| **ranged** | *(n/a)* | rifle, pistol, submachine_gun, machine_gun, flamethrower, shotgun, sniper_rifle, bazooka |

### Epic Weapon Design Philosophy
> Weapons should look **EPIC, HULKING, VIDEO GAME-WORTHY** but grounded in realism.
> Never generate bland or generic weapons. Every weapon is a fusion of eras.

**Core Principles:**
- **Medieval + WWI Fusion** - Blend detailed medieval craftsmanship with industrial WWI brutality
- **Exaggerated Proportions** - Bulky, oversized, imposing silhouettes
- **Battle-Worn Detail** - Scratches, dents, wrapped grips, field repairs, wear marks
- **Dinosaur Integration (30-40%)** - Raptor claws, T-Rex teeth, bone grips, dinosaur leather

**Melee Weapons:** Add WWI elements like bayonet points, trench tool blades, wire wrapping, shell casing decorations
**Ranged Weapons:** Add medieval elements like brass engravings, bone stocks, decorated receivers, leather accents

**Dinosaur (Non-Saurian) Restrictions:**
- **NO humanoid face accessories** - no gas masks, goggles, visors, searchlights on face
- **Mounted weapons ONLY if weaponType is ranged** - otherwise armor/harness only
- Skulls/bones must be "dinosaur skull", "raptor teeth" - never generic

**Fusion Examples:**
- "plate armor over trench coat, stahlhelm with face guard, wielding a trench mace with shell casing decorations"
- "chain mail under field jacket, medieval war helm, carrying a bolt-action rifle with bone stock"
- "leather brigandine, ammunition bandolier, great helm, wielding a halberd with bayonet point"
- "WWI officer uniform, pauldron on left shoulder, barbuta helmet, dinosaur-tooth revolver"

### Face Covering Variety (Helmet Mandate)
To avoid repetitive designs, distribute face coverings across human units:

**Common (use sparingly, < 20% each):**
- gas mask
- full-face helmet

**Preferred (use more frequently):**
- stahlhelm with face guard
- medieval war helm / knight helmet
- iron mask / riveted faceplate
- hooded mask / leather hood with goggles
- dinosaur skull visor / raptor death mask
- barbuta helmet / sallet helm / great helm
- combat helmet with visor

**Female Human Requirements:**
- ALWAYS include "large breasts" in sourceDescription
- Include hair descriptors ~50% of the time (braided hair, short cropped, etc.)

### Avoiding Scene Generation
sourceDescriptions must describe ONLY the character, not their environment:

**FORBIDDEN scene-implying words:**
- emplacement, defensive position, fortification, turret
- trench, bunker, sandbags, barricade, platform
- battlefield, environment, background, ground
- explosion, smoke, fire, debris
- camp, outpost, deployment, formation

**ALLOWED character descriptors:**
- equipment they carry/wear
- physical appearance and build
- armor and clothing details
- weapons held (not mounted)

### WWI Terminology Rules (CRITICAL)
sourceDescriptions must use WWI-appropriate language, avoiding fantasy/tribal terms:

**FORBIDDEN WORDS (create tribal/fantasy/ritualistic vibes):**
- ceremonial, ritual, tribal, ornate, gilded, arcane, mystical
- ancient, rune, sigil, enchanted, blessed, sacred
- primitive, shamanistic, totem, mystic
- king's, crown, throne (too fantasy)

**USE INSTEAD, BUT NOT LIMITED TO:**
| Forbidden | Preferred Alternative |
|-----------|----------------------|
| ceremonial mask | regulation iron mask, military-issue visor |
| ornate armor | decorated steel plate, officer's plate armor |
| gilded | brass-trimmed, polished, lacquered |
| decorated | insignia-bearing, badge-adorned, rank-marked |
| commander cape | officer's greatcoat, trench coat |

**EXAMPLE WWI KEYWORDS:**
- Uniforms: trench coat, officer's coat, field jacket, military greatcoat, officer pants
- Headgear: stahlhelm, brodie helmet, gas mask, iron visor, combat helmet
- Gear: leather straps, ammunition pouches, bandoliers, utility belt
- Armor: riveted steel, industrial-forged plate, battle-worn metal
- Condition: mud-caked, trench-weathered, combat-scarred, field-worn

### UI & Icons
-   **Style**: Detailed Pixel Art Iconography, cleaner than world assets but textured.
-   **Materials**: Pixelated parchment, rusted iron, worn leather, brass frames.
-   **Reference**: Stoneshard UI, Diablo 2 inventory.
-   **Text allowed**: UI icons may include text/letters if meaningful (e.g., "X" close button).

### Props (World Objects)
-   **Style**: High-Fidelity Pixel Art, top-down perspective.
-   **Text allowed**: Props may include text/letters if contextually appropriate (e.g., signs, crate labels).

### Zone Visual Identities
*   **Home Outpost**: Mud, Timber, Green grass, Military supplies.
*   **Quarry Fields**: Grey stone, Dust, Excavation pits.
*   **Iron Ridge**: Rust orange, Industrial debris, Red clay.
*   **Dead Woods**: Desaturated green-grey, Twisted roots, Fog.
*   **Bone Valley**: Bleached white bone, Beige sand, Fossils.
*   **The Ruins**: Ancient stone, Moss, Mystery (No magic visuals).
