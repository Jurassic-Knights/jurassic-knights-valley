# Asset Generation Prompt Templates

**Centralized prompt definitions for AI-generated game assets.**

> This file ensures visual consistency across all generated assets.
> Always use these templates when generating new art.

---

## Reference Images

When generating assets, ALWAYS include a reference image. Use the appropriate reference based on asset type:

| Asset Type | Reference Image |
|------------|-----------------|
| **Dinosaurs (armored)** | `reference/style_samples/dinosaurs_armored.png` (+ `guns.png` if ranged) |
| **Herbivores** | `reference/style_samples/dinosaurs.png` |
| **Saurians** | `reference/style_samples/saurians.png` + `reference/style_samples/guns.png` |
| **Humans (male, medium)** | `reference/style_samples/male_medium.png` + `guns.png` (if ranged) |
| **Humans (male, skinny)** | `reference/style_samples/male_skinny.png` + `guns.png` (if ranged) |
| **Humans (male, fat)** | `reference/style_samples/male_fat.png` + `guns.png` (if ranged) |
| **Humans (male, muscle)** | `reference/style_samples/male_muscle.png` + `guns.png` (if ranged) |
| **Humans (female, medium)** | `reference/style_samples/female_medium.png` + `guns.png` (if ranged) |
| **Humans (female, skinny)** | `reference/style_samples/female_skinny.png` + `guns.png` (if ranged) |
| **Humans (female, fat)** | `reference/style_samples/female_fat.png` + `guns.png` (if ranged) |
| **Humans (female, muscle)** | `reference/style_samples/female_muscle.png` + `guns.png` (if ranged) |
| **Items/Resources** | `reference/style_samples/resource.png` |
| **Equipment** | `reference/style_samples/human_base.png` |
| **UI Icons** | `reference/style_samples/human_base.png` |
| **Architecture (linear)** | `reference/style_samples/wood_fence.png` |
| **Architecture (buildings)** | `assets/images/buildings/building_forge_clean.png` |
| **Architecture (bridges)** | `reference/style_samples/bridge.png` |
| **Props** | `reference/style_samples/human_base.png` |
| **Flora** | `reference/style_samples/human_base.png` |
| **Environment** | `reference/style_samples/medic_crate.png` |
| **Environment (walls)** | `reference/style_samples/wood_fence.png` |
| **Environment (bridges)** | `reference/style_samples/bridge.png` |
| **Environment (furniture)** | `reference/style_samples/bench.png` |
| **Nodes (full)** | `reference/style_samples/medic_crate.png` |
| **Nodes (consumed)** | Use the approved full version of same node |

> **Human Reference Selection**: Use gender + build from sourceDescription to select reference (e.g., "male soldier, muscle build" → `male_muscle.png`), but only include gender in the prompt.
> **Guns Reference**: Add `guns.png` to reference images for any unit with ranged weaponType.

---

## How sourceDescription Works

The `sourceDescription` field in each asset's JSON is **NOT a full prompt**. It contains **ONLY the unique, contextual details** specific to that asset. The regenerate workflow combines:

```
[TEMPLATE FROM asset_prompts.md] + [sourceDescription from JSON]
```

### sourceDescription Should Include:
- **Physical traits**: distinctive features
- **Coloring**: hide/skin/fur color, patterns, markings
- **Species details**: horns, plates, frills, spikes, claws
- **Biome adaptations**: "thick fur", "desert-adapted hide", "swamp-dwelling"
- **Equipment/gear** (for armored units): specific armor pieces, weapons
- **Unique visual traits**: scars, battle damage, wear patterns

### sourceDescription Should NOT Include:
- Template boilerplate (already in asset_prompts.md)
- "stoneshard style, high fidelity pixel art" (already in template)
- "isolated on white background" (already in template)
- "no text, no letters" (already in template)
- "side profile" (already in template for creatures)
- **Poses** - all assets use neutral poses defined in template
- **Emotions/states** - no "frightened", "angry", "tired", etc. - describe outfit/gear only

### Examples:

**BAD sourceDescription (includes pose):**
```
"brownish-green hide, grazing pose with lowered head"
```

**GOOD sourceDescription (physical appearance only):**
```
"thumb spike visible, bulky herbivore build, brownish-green hide with darker stripes"
```

---

## AI-Crafted Descriptions

> [!IMPORTANT]
> **Do NOT use templated scripts for sourceDescriptions.**
> For each entity, read: name, role, biome, tier, weaponType
> Write a unique description following WWI rules below.
> **Weapons are always WIELDED** - never "slung", "holstered", or "on back"
> **Female humans** - ALWAYS include "large breasts" in description. Include hair descriptors ~50% of the time.
> **Skulls/bones/teeth** - ALWAYS specify dinosaur bones, skulls or teeth not human, "dinosaur skull", "raptor teeth", "dino bone" - never generic "skull visor"

---

## WWI Terminology Rules (CRITICAL)

> [!CAUTION]
> **FORBIDDEN WORDS (create tribal/fantasy vibes):**
> - ceremonial, ritual, tribal, ornate, gilded, arcane, mystical
> - ancient, rune, sigil, enchanted, blessed, sacred
> - primitive, shamanistic, totem
> 
> **MANDATORY BUT NOT LIMITED TO WWI KEYWORDS (use these instead):**
> - trench coat, officer's coat, military greatcoat
> - steel helmet, gas mask, iron visor, stahlhelm, brodie helmet
> - leather straps, ammunition pouches, bandoliers
> - riveted steel, plate armor (industrial-forged), battle-worn metal
> - insignia badges, rank chevrons, unit patches
> - military-issue, regulation gear, field equipment
> - mud-caked, trench-weathered, combat-scarred

---

## Category Templates


### Dinosaurs (Armored) - from dinosaur.json
> AI crafts unique sourceDescription for each entity.
> **NO humanoid face accessories** - no gas masks, goggles, visors on dinosaurs.
> **Mounted weapons ONLY if weaponType is ranged**
```
full body sprite of a chibi [SPECIES NAME], game creature asset, stoneshard style, high fidelity pixel art, ww1 animal clothing, ww1 armor, medieval armor, [sourceDescription], facing left, side profile, isolated on white background, no text, no letters, no particles, no VFX, no smoke, no fire
```

---

### Herbivores - from herbivore.json
> Natural dinosaurs - sourceDescription contains only physical traits and coloring
```
full body sprite of a chibi [SPECIES NAME], game creature asset, stoneshard style, high fidelity pixel art, natural appearance, [sourceDescription], facing left, side profile, isolated on white background, no text, no letters, no particles, no VFX, no smoke, no fire
```

---

### Saurians - from saurian.json
> Anthropomorphic humanoid dinosaur soldiers with medieval + WWI aesthetic. Headgear varies by character design.
```
full body sprite of a chibi anthropomorphic humanoid [SPECIES NAME], upright pose, game creature asset, stoneshard style, high fidelity pixel art, ww1 clothing, ww1 armor, medieval armor, [sourceDescription], facing left, side profile, isolated on white background, no text, no letters, no particles, no VFX, no smoke, no fire
```

---

### Humans - from human.json
> Select reference based on gender + build (e.g., male_muscle.png), but only include gender in prompt.
> Include hair descriptors for ~50% of female characters.
```
full body sprite of a chibi [DESCRIPTION], game character asset, stoneshard style, high fidelity pixel art, WWI-era soldier, ww1 clothing, ww1 armor, medieval armor, [sourceDescription], facing left, side profile, isolated on white background, no text, no letters, no particles, no VFX, no smoke, no fire
```

**Face covering options** (VARY - avoid overusing gas mask):

**Sparingly (<20% each):**
- gas mask
- full-face helmet

**Preferred (use more frequently):**
- stahlhelm with face guard
- medieval war helm / knight helmet
- iron mask / riveted faceplate  
- hooded mask / leather hood with goggles
- dinosaur skull visor / raptor death mask
- barbuta / sallet / great helm
- combat helmet with visor

---

## Enemy Biome Visual Identities

When generating enemies, match their uniforms, armor, and equipment to their assigned biome. **Humans and Saurians share the same military** and wear matching uniforms/armor.

> **IMPORTANT RULES:**
> - **Unique/Named Characters** (bosses, captains, specialists) may use ANY fitting color palette for their character design - not restricted to biome colors but should still be biome-appropriate
> - **Saurians NEVER wear shoes or boots** - they have exposed dinosaur feet with claws but can have modified shoes or armor that are retro-fitted to fit their dinosaur feet
> - **Distinctive Gear is OPTIONAL** - not every soldier needs biome-specific accessories

### Grasslands (Home Region)
**Uniform Style:** Standard military - slightly dirty
| Role | Primary Clothing | Accent Clothing | Armor/Gear Colors |
|------|------------------|-----------------|-------------------|
| **Melee** | brown, tan | olive drab | dark grey iron |
| **Ranged** | dark grey, forest green | khaki | gunmetal, steel |
| **Dinosaurs** | tan saddle cloth, brown harness | olive drab straps | dark grey iron barding |
- **Optional Gear:** Backpacks, canteens, binoculars

### Tundra (Frozen North)
**Uniform Style:** Heavy insulated - bulky, fur-lined
| Role | Primary Clothing | Accent Clothing | Armor/Gear Colors |
|------|------------------|-----------------|-------------------|
| **Melee** | wolf grey, feldgrau, slate grey | snow white, dead grass, dark moss green | dark brown leather, whitewashed steel |
| **Ranged** | drab taupe, lichen green | pale straw, ice blue | grey felt, raw sheepskin, cream fur |
| **Dinosaurs** | thick white/grey fur, feldgrau saddle cloth | snow white, pale straw | whitewashed steel barding, dark brown leather harness |
- **Snow Coverage:** All tundra characters and dinosaurs should have light snow dusting on shoulders, head, and upper surfaces
- **Optional Gear:** thermal cloaks, fur gloves, fur boots

### Desert (Arid Wastes)
**Uniform Style:** Light, loose-fitting - protection from sun
| Role | Primary Clothing | Accent Clothing | Armor/Gear Colors |
|------|------------------|-----------------|-------------------|
| **Melee** | khaki, sand tan, light earth brown | cream, dry sage green, terra cotta | natural tan leather, mid-brown leather, matte khaki metal paint, sand matte metal paint |
| **Ranged** | pale stone grey, sun-bleached drab | pale dust, reddish-brown | natural tan leather, mid-brown leather, matte khaki metal paint, sand matte metal paint |
| **Dinosaurs** | sand tan saddle cloth, light earth brown harness | cream, pale dust | natural tan leather barding, matte khaki metal plates |
- **Optional Gear:** Water skins, cloth wraps, goggles

### Badlands (Volcanic/Industrial)
**Uniform Style:** Heavy industrial - heat-resistant
| Role | Primary Clothing | Accent Clothing | Armor/Gear Colors |
|------|------------------|-----------------|-------------------|
| **Melee** | charcoal grey, dark slate grey, basalt grey | soot black, burnt umber, dull rust | matte black, blackened steel |
| **Ranged** | ash-drab, midnight navy blue | ash white, pale chalk grey | dark slate matte finish, blackened steel |
| **Dinosaurs** | charcoal grey saddle cloth, soot-stained harness | burnt umber, dull rust | matte black barding, blackened steel plates, heat vents |
- **Optional Gear:** Welding visors, heat-resistant aprons


### NPCs/Merchants
```
full body sprite of a chibi [MERCHANT TYPE], game character asset, stoneshard style, high fidelity pixel art, medieval and WWI fusion aesthetic, wearing military gear with medieval armor elements, [SPECIFIC FACE COVERING], facing left, side profile, isolated on white background, no text, no letters, no particles, no VFX, no smoke, no fire
```
### Items (Crafted Materials)
```
sprite of [ITEM DESCRIPTION], game item asset, stoneshard style, high fidelity pixel art, rusty, gritty, weathered, isometric perspective, isolated on white background, no text, no letters, no particles, no VFX, no smoke, no fire
```

---

### Resources (Drops)
```
sprite of [DROP DESCRIPTION], game item asset, stoneshard style, high fidelity pixel art, rusty, gritty, weathered, isometric perspective, isolated on white background, no text, no letters, no particles, no VFX, no smoke, no fire
```
---

### Equipment (Weapons, Armor, Tools)
```
icon of [EQUIPMENT DESCRIPTION], game ui asset, stoneshard style, high fidelity pixel art, [sourceDescription], isolated on white background, no text, no letters, no particles, no VFX, no smoke, no fire
```

**Weapon Design Rules (EPIC FUSION AESTHETIC):**

> [!IMPORTANT]  
> Weapons should look **EPIC, HULKING, VIDEO GAME-WORTHY** but grounded in realism.
> Never generate bland, generic, or standard-issue weapons. Every weapon tells a story.

**Core Principles:**
- **Medieval + WWI Fusion** - Blend medieval craftsmanship with industrial warfare brutality
- **Exaggerated Proportions** - Bulky, oversized, imposing silhouettes (video game aesthetic)
- **Battle-Worn Detail** - Scratches, dents, wear marks, wrapped grips, field repairs
- **Dinosaur Integration** - Optional but powerful when used (raptor claws, T-Rex teeth, bone grips)

**Dinosaur Element Options (use 30-40% of weapons):**
- **Bone grips/hilts** - Carved dinosaur bone handles
- **Tooth edges** - Raptor or T-Rex teeth as blade serrations or decorations
- **Leather/hide** - Dinosaur leather wrapping or stocks
- **Claw tips** - Velociraptor claw pommels or blade tips
- **Fossil accents** - Embedded amber or fossil fragments

**Enemy Weapon Types (from dashboard):**

| Ranged | Melee |
|--------|-------|
| rifle | sword |
| pistol | longsword |
| submachine_gun | greatsword |
| machine_gun | axe |
| flamethrower | war_axe |
| shotgun | mace |
| sniper_rifle | war_hammer |
| bazooka | lance |
| | halberd |
| | spear |
| | flail |
| | knife |

---

### UI Icons
```
### UI Icons (Weapons & Tools)
```
Pixel art icon of [WEAPON/TOOL]. Orientation: Diagonal facing upwards-right (45 degrees). Shape: ULTRA-COMPACT, STUBBY. Squashed proportions, heavy weight. Material: Matte steel, battle-worn, NO RUST, NO HIGH SHINE. Functional, utilitarian metal. Focus: Heavy BLACK outline. Isolated on white background.
```

### UI Icons (Armor & Accessories)
```
Pixel art icon of [ITEM]. Orientation: 3/4 view facing forward. Shape: ULTRA-COMPACT, SQUASHED, CHUNKY. Width equals height (1:1 ratio). Material: Matte steel, battle-worn, NO RUST, NO HIGH SHINE. Functional, utilitarian metal. Focus: Heavy BLACK outline. Isolated on white background.
```
```

> Note: UI icons may include text/letters if meaningful for the icon purpose 

---

### Props (World Objects)
```
sprite of [PROP DESCRIPTION], game world prop, stoneshard style, high fidelity pixel art, weathered, isometric perspective, isolated on white background, no text, no letters
```

> Note: Props may include text/letters if contextually appropriate (e.g., signs, labels on crates)

---

### Architecture (Structures)

**Linear Structures (fences, walls, bridges, roads):**
```
sprite of [ARCHITECTURE DESCRIPTION], game world structure, stoneshard style, high fidelity pixel art, weathered, medieval/WWI aesthetic, horizontal side view, facing left to right, isolated on white background, no text, no letters
```

**Buildings & Towers:**
```
sprite of [BUILDING DESCRIPTION], game world structure, stoneshard style, high fidelity pixel art, weathered, medieval/WWI aesthetic, isometric perspective, isolated on white background, no text, no letters
```

> **IMPORTANT**: 
> - **Linear structures** (fences, walls, gates, bridges, roads) use **horizontal side view** (left to right)
> - **Buildings and towers** use **isometric perspective**

**Examples:**
- Linear: Fences, walls, gates, bridges, roads, paths, trenches, barricades, rails
- Buildings: Towers, guard posts, outposts, bunkers, watchtowers

---

### Flora (Vegetation)
```
sprite of [FLORA DESCRIPTION], game world vegetation, stoneshard style, high fidelity pixel art, natural growth, standalone asset, white background, no ground, no square tile, no text, no letters
```

> **IMPORTANT**: Flora assets must be **standalone vegetation only** - NO isometric tiles, NO ground beneath, NO terrain base. The asset should appear to "float" on the white background with no visible base or platform. Think individual clumps of grass, single bushes, or standalone rocks.

**Examples:**
- Shrubs, bushes, grass patches
- Mushrooms, flowers, ferns
- Stumps, logs, fallen branches
- Boulders, rocks (biome-specific)

---

### Nodes (Full - Harvestable)
```
[RESOURCE TYPE] harvestable resource node, top-down RPG asset, stoneshard style, high fidelity pixel art, [DESCRIPTION], isolated on white background, no text, no letters
```

---

### Nodes (Consumed/Depleted)
> **PREREQUISITE**: The base node must be approved before generating consumed version
> **Reference**: Use the APPROVED full version of the same node as reference

```
depleted [RESOURCE TYPE] with [DEPLETED STATE DESCRIPTION], top-down RPG asset, stoneshard style, high fidelity pixel art, harvested remains, isolated on white background, no text, no letters
```

---

### Environment/Backgrounds
```
game environment background of [ZONE DESCRIPTION], high-fidelity pixel art, Stoneshard style, top-down RPG, [ZONE KEYWORDS], detailed texture, sharp pixels
```

**Zone Visual Identities:**
- Home Outpost: Mud, Timber, Green grass, Military supplies
- Quarry Fields: Grey stone, Dust, Excavation pits
- Iron Ridge: Rust orange, Industrial debris, Red clay
- Dead Woods: Desaturated green-grey, Twisted roots, Fog
- Bone Valley: Bleached white bone, Beige sand, Fossils
- The Ruins: Ancient stone, Moss, Mystery

---

## Forbidden Elements

**NEVER include in prompts:**
- Glowing runes or magical effects
- particles, sparkles, VFX, smoke, fire
- Modern technology (phones, screens)
- Bright neon colors
- "no watermark" (removed from all prompts)
---

## Asset Naming Convention

**Format**: `{name}_{status}.png`

| Status | Pattern | Example |
|--------|---------|---------|
| Pending | `{name}_original.png` | `wood_original.png` |
| Approved | `{name}_approved_original.png` | `wood_approved_original.png` |
| Declined | `{name}_declined_original.png` | `wood_declined_original.png` |
| Production | `{name}_clean.png` | `wood_clean.png` |

---

## Prompt Sidecar Files (MANDATORY)

> [!IMPORTANT]
> **Every generated asset MUST have a corresponding prompt sidecar file.**
> This enables exact regeneration and maintains reproducibility.

### File Format

When you generate an image, save the **exact prompt used** in a `.prompt.txt` file with the same base name:

| Image File | Prompt Sidecar File |
|------------|---------------------|
| `ui_icon_sword_original.png` | `ui_icon_sword.prompt.txt` |
| `enemy_raptor_t1_01_original.png` | `enemy_raptor_t1_01.prompt.txt` |
| `stat_damage_original.png` | `stat_damage.prompt.txt` |

### Sidecar File Contents

The `.prompt.txt` file should contain **ONLY the exact prompt text** used for generation - no metadata, no formatting, just the raw prompt string.

**Example** (`ui_icon_sword.prompt.txt`):
```
Pixel art icon of medieval longsword. Style: Compact, stubby proportions, wide shape. Material: Iron with leather grip, battle-worn. Focus: Icon readability, maximized width for visibility. Isolated on white background.
```

### Workflow

1. **Generate image** using your prompt
2. **Save the prompt** to `{asset_id}.prompt.txt` in the same folder as the image
3. **Run scan script** - it will automatically read the sidecar file and populate the `prompt` field in the entity

```bash
# After adding new assets with prompt files
python tools/scripts/scan_missing_entities.py --category ui
```

### Entity Field

The scan script reads the sidecar file and populates the `prompt` field:

```typescript
export default {
    id: "ui_icon_sword",
    name: "Sword",
    status: "pending",
    sourceDescription: "Sword icon, detailed pixel art iconography",
    prompt: "Pixel art icon of medieval longsword. Style: Compact...",  // From sidecar
    files: {
        original: "assets/images/ui/ui_icon_sword_original.png"
    }
} satisfies UIEntity;
```

### Benefits

- **Exact regeneration** - Run the same prompt to get consistent results
- **Version control** - Track prompt changes alongside image changes
- **Batch operations** - Scripts can read prompts for bulk regeneration
- **Dashboard visibility** - See and edit prompts directly in the dashboard

