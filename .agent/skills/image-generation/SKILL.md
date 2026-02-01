---
name: Image Generation
description: Generate game assets following Jurassic Knights style guidelines, prompt templates, and reference image standards
---

# Image Generation Skill

This skill defines the complete process for generating game assets for Jurassic Knights: Valley.

## Mandatory Pre-Generation Steps

**BEFORE generating ANY image, you MUST:**

1. **Load reference images** from `reference/style_samples/` based on asset type
2. **Read sourceDescription** from the asset's JSON entry (if regenerating)
3. **Read declineNote** from the asset's JSON entry (if regenerating declined assets)

> [!CAUTION]
> **NEVER infer equipment/details from asset NAME** (e.g., "Crossbowman" might have a sniper rifle).
> The `sourceDescription` field contains the ACTUAL details set by the user.

---

## Reference Image Matrix

| Asset Type | Reference Image Path |
|------------|---------------------|
| **Dinosaurs (armored)** | `reference/style_samples/velociraptor_armor.png` |
| **Herbivores (naked)** | `reference/style_samples/velociraptor.png` |
| **Saurians (small/agile)** | `reference/style_samples/saurian.png` |
| **Saurians (large/stocky)** | `reference/style_samples/saurian_wide.png` |
| **Humans** | See Human Character Scaling Matrix below |
| **Items/Resources** | `reference/style_samples/resource.png` |
| **Equipment** | `reference/style_samples/human_base.png` |
| **UI Icons** | `reference/style_samples/human_base.png` |
| **Architecture** | `reference/style_samples/building_forge_final_original.png` |
| **Architecture (bridges)** | `reference/style_samples/bridge.png` |
| **Props** | `reference/style_samples/human_base.png` |
| **Flora** | `reference/style_samples/human_base.png` |
| **Environment** | `reference/style_samples/medic_crate.png` |
| **Environment (walls)** | `reference/style_samples/building_forge_final_original.png` |
| **Environment (bridges)** | `reference/style_samples/bridge.png` |
| **Environment (furniture)** | `reference/style_samples/bench.png` |
| **Ground Textures** | `reference/style_samples/grass.png` |
| **Nodes (full)** | `reference/style_samples/medic_crate.png` |
| **Nodes (consumed)** | Use the APPROVED full version of same node |

### Human Character Scaling Matrix

| Gender | Body Type | Reference Image Path |
|--------|-----------|---------------------|
| **Male** | Skinny | `reference/style_samples/male_skinny.png` |
| **Male** | Medium | `reference/style_samples/male_medium.png` |
| **Male** | Muscle | `reference/style_samples/male_muscle.png` |
| **Male** | Fat | `reference/style_samples/male_fat.png` |
| **Female** | Skinny | `reference/style_samples/female_skinny.png` |
| **Female** | Medium | `reference/style_samples/female_medium.png` |
| **Female** | Muscle | `reference/style_samples/female_muscle.png` |
| **Female** | Fat | `reference/style_samples/female_fat.png` |

---

## Core Style Rules

**Aesthetic**: High-Fidelity Pixel Art (Reference: *Stoneshard*)
**Tone**: Desaturated, utilitarian, weathered, gritty ("Mud, Steel, and Scales")

### Mandatory Prompt Elements
Always include in ALL prompts:
- `stoneshard style`
- `high fidelity pixel art`
- `isolated on white background` (EXCEPT for **Ground Textures** / **Backgrounds**)
- `no particles, no VFX, no smoke, no fire`

### Forbidden Elements
**NEVER include:**
- Glowing runes, magical effects, ethereal sparkles
- Particles, sparkles, VFX, smoke, fire
- Modern technology (phones, screens)
- Bright neon colors
- Poses or emotional states in sourceDescription
- text, letters(except UI icons/Props where contextual)

### The Helmet Mandate
- **Humans**: Must ALWAYS wear full-face helmets or headgear (gas masks, visors, heavy plating, knight helmets, hoods, masks). 95% faceless the other 5% mouth only shown.
- **Saurians**: Anthropomorphic dinosaurs wear the same type of clothing, gear or armor as humans. They can be with or without headgear.
- **NEVER show exposed human faces** unless mouth/chin only (5% max)

---

## Prompt Templates by Category

### Dinosaurs (Armored) - from dinosaur.json
```
full body sprite of a chibi [SPECIES NAME], a completely different dinosaur than the reference image, game creature asset, stoneshard style, high fidelity pixel art, war-beast appearance, heavy plating, facing left, side profile, isolated on white background, no text, no letters, no particles, no VFX, no smoke, no fire
```

### Herbivores (Naked) - from herbivore.json
> **CRITICAL**: NO armor, NO gear - natural dinosaurs only
```
full body sprite of a chibi [SPECIES NAME], a completely different dinosaur than the reference image, game creature asset, stoneshard style, high fidelity pixel art, natural appearance, no armor, no gear, facing left, side profile, isolated on white background, no text, no letters, no particles, no VFX, no smoke, no fire
```

### Saurians - from saurian.json
> Medieval + WWI fusion aesthetic, anthropomorphic dinosaur soldiers
```
full body sprite of an anthropomorphic [SPECIES NAME], a different character than the reference image, game creature asset, stoneshard style, high fidelity pixel art, medieval and WWI fusion aesthetic, armored soldier appearance, facing left, isolated on white background, no text, no letters, no particles, no VFX, no smoke, no fire
```
- **Small/agile saurians** → use `saurian.png`
- **Large/stocky saurians** → use `saurian_wide.png`
- **NEVER wear full shoes/boots** - exposed dinosaur feet with claws

### Humans - from human.json
> Medieval + WWI fusion, face must be covered
```
full body sprite of a [DESCRIPTION], a different character and headgear than the reference image but similar body proportions to the reference image, game character asset, stoneshard style, high fidelity pixel art, medieval and WWI fusion aesthetic, wearing military gear with medieval armor elements, [SPECIFIC FACE COVERING], facing left, isolated on white background, no text, no letters, no particles, no VFX, no smoke, no fire
```

**Face Covering Options (VARY these):**
- **Sparingly (<20% each):** gas mask
- **Preferred:** otherwise any medieval + WW1 fusion helmet, knight fullplate helm, mask, hood, etc.

### NPCs/Merchants
```
full body sprite of a [MERCHANT TYPE], a different character and headgear or helmet than the reference image but similar body proportions to the reference image, game character asset, stoneshard style, high fidelity pixel art, medieval and WWI fusion aesthetic, wearing military gear with medieval armor elements, [SPECIFIC FACE COVERING], facing left, isolated on white background, no text, no letters, no particles, no VFX, no smoke, no fire
```

### Items (Crafted Materials)
```
sprite of [ITEM DESCRIPTION], game item asset, stoneshard style, high fidelity pixel art, rusty, gritty, weathered, isometric perspective, isolated on white background, no text, no letters, no particles, no VFX, no smoke, no fire
```

### Resources (Drops)
```
sprite of [DROP DESCRIPTION], game item asset, stoneshard style, high fidelity pixel art, rusty, gritty, weathered, isometric perspective, isolated on white background, no text, no letters, no particles, no VFX, no smoke, no fire
```

### Equipment (Weapons, Armor, Tools)
> **IMPORTANT**: Weapons MUST be flat horizontal (like lying on a table) - NOT isometric
> **EPIC DESIGN**: Weapons should look EPIC, HULKING, VIDEO GAME-WORTHY but grounded in realism
> **Fusion Elements**: Medieval craftsmanship + WWI industrial brutality + Dinosaur integration (30-40%)
```
icon of [EQUIPMENT DESCRIPTION], game ui asset, stoneshard style, high fidelity pixel art, medieval and WWI fusion aesthetic, legendary unique ornate appearance, battle-worn detail, exaggerated proportions, rusty, gritty, weathered, flat horizontal laying position facing right, profile view, no angle, isolated on white background, no text, no letters, no particles, no VFX, no smoke, no fire
```

### UI Icons
> May include text/letters if meaningful. NO FRAMES - use 'icon' not 'button'
```
icon of [UI ELEMENT], game ui asset, stoneshard style, detailed pixel art iconography, pixelated texture, rusted iron, isolated on white background
```

### Props (World Objects)
> May include text/letters if contextually appropriate
```
sprite of [PROP DESCRIPTION], game world prop, stoneshard style, high fidelity pixel art, weathered, isometric perspective, isolated on white background, no text, no letters
```

### Architecture

**Linear Structures (fences, walls, bridges, roads):**
```
sprite of [ARCHITECTURE DESCRIPTION], game world structure, stoneshard style, high fidelity pixel art, weathered, medieval/WWI aesthetic, horizontal side view, facing left to right, isolated on white background, no text, no letters
```

**Buildings & Towers:**
```
sprite of [BUILDING DESCRIPTION], game world structure, stoneshard style, high fidelity pixel art, weathered, medieval/WWI aesthetic, isometric perspective, isolated on white background, no text, no letters
```

### Flora (Vegetation)
> **CRITICAL**: Standalone vegetation only - NO ground, NO tiles, NO terrain base
```
sprite of [FLORA DESCRIPTION], game world vegetation, stoneshard style, high fidelity pixel art, natural growth, standalone asset, white background, no ground, no square tile, no text, no letters
```

### Nodes (Full - Harvestable)
```
[RESOURCE TYPE] harvestable resource node, top-down RPG asset, stoneshard style, high fidelity pixel art, [DESCRIPTION], natural growth with organic boundaries, no square tile, standalone asset on white background, isolated on white background, no text, no letters
```

### Nodes (Consumed/Depleted)
> **PREREQUISITE**: Base node must be approved before generating consumed version
> > Use the APPROVED full version as reference image
```
depleted [RESOURCE TYPE] with [DEPLETED STATE DESCRIPTION], top-down RPG asset, stoneshard style, high fidelity pixel art, harvested remains, isolated on white background, no text, no letters
```

### Ground Textures (Seamless)
> **CRITICAL**: Must be TILING/SEAMLESS. No transparency. No white background.
```
don't make the reference image just use it as art style reference, ground texture of [DESCRIPTION], top-down game tile, stoneshard style, high fidelity pixel art
```

### Environment/Backgrounds
```
game environment background of [ZONE DESCRIPTION], high-fidelity pixel art, Stoneshard style, top-down RPG, [ZONE KEYWORDS], detailed texture, sharp pixels
```

---

## Biome Visual Identities

Apply these palettes when generating biome-specific assets. Each biome has **two color palettes** based on role:

### Grasslands (Home Region)
**Uniform Style:** Standard military - slightly dirty
| Role | Clothing Colors | Armor Colors |
|------|-----------------|--------------|
| **Melee** | brown, tan, dark red trim | iron, brass accents |
| **Ranged** | dark grey, forest green | gunmetal, steel |
- **Dinosaurs:** Bronze barding, tan saddle cloth
- **Optional Gear:** Backpacks, canteens, binoculars

### Tundra (Frozen North)
**Uniform Style:** Heavy insulated - bulky, fur-lined
| Role | Clothing Colors | Armor Colors |
|------|-----------------|--------------|
| **Melee** | white, grey, brown fur trim | silver, polished steel |
| **Ranged** | navy blue, charcoal grey | blackened iron, dark steel |
- **Dinosaurs:** Thick white/grey fur, frosted armor
- **Optional Gear:** Snow goggles, thermal cloaks, fur gloves

### Desert (Arid Wastes)
**Uniform Style:** Light, loose-fitting - protection from sun
| Role | Clothing Colors | Armor Colors |
|------|-----------------|--------------|
| **Melee** | sand tan, terracotta, cream | copper, bronze |
| **Ranged** | pale cream, dusty brown | dark leather, brass buckles |
- **Dinosaurs:** Light mesh barding, sand-scoured hide
- **Optional Gear:** Water skins, cloth wraps, goggles

### Badlands (Volcanic/Industrial)
**Uniform Style:** Heavy industrial - heat-resistant
| Role | Clothing Colors | Armor Colors |
|------|-----------------|--------------|
| **Melee** | rust orange, charred brown | blackened iron, brass fittings |
| **Ranged** | coal black, ash grey | dark iron, ember orange rivets |
- **Dinosaurs:** Soot-stained barding, heat vents in armor
- **Optional Gear:** Welding visors, heat-resistant aprons

### Dead Woods (Haunted Forest)
**Uniform Style:** Decayed, moss-covered - camouflaged
| Role | Clothing Colors | Armor Colors |
|------|-----------------|--------------|
| **Melee** | rotting brown, dried blood, olive | tarnished copper, corroded iron |
| **Ranged** | sickly green, mold grey | corroded black, rusted iron |
- **Dinosaurs:** Mottled grey-green hide, fungal growths
- **Optional Gear:** Lanterns, plague masks

### Bone Valley (Ancient Graveyard)
**Uniform Style:** Bone-decorated, ritualistic
| Role | Clothing Colors | Armor Colors |
|------|-----------------|--------------|
| **Melee** | bleached white, bone ivory, blood red | bone plate, obsidian trim |
| **Ranged** | dark grey, fossil brown | obsidian black, amber inlays |
- **Dinosaurs:** Fossil fragments in barding, skull masks
- **Optional Gear:** Bone clubs, jaw-bone necklaces

### The Ruins (Ancient Civilization)
**Uniform Style:** Ancient-styled, ceremonial
| Role | Clothing Colors | Armor Colors |
|------|-----------------|--------------|
| **Melee** | royal purple, faded gold, cream | polished bronze, gold trim |
| **Ranged** | stone grey, jade green | verdigris bronze, aged copper |
- **Dinosaurs:** Temple guardian barding, ancient symbols
- **Optional Gear:** Ceremonial staffs

### Crossroads (Trade Hub)
**Uniform Style:** Eclectic, well-traveled
| Role | Clothing Colors | Armor Colors |
|------|-----------------|--------------|
| **Melee** | mixed patchwork | salvaged mixed metals |
| **Ranged** | varied mercenary colors | mismatched plate |
- **Dinosaurs:** Multi-cultural barding
- **Optional Gear:** Coin pouches, maps

### Scrap Yard (Junkyard)
**Uniform Style:** Improvised, salvaged
| Role | Clothing Colors | Armor Colors |
|------|-----------------|--------------|
| **Melee** | oil-stained brown, rust orange | welded scrap, corroded iron |
| **Ranged** | grimy grey, mud brown | cold grey steel, oxidized green |
- **Dinosaurs:** Salvaged vehicle parts, chain-link
- **Optional Gear:** Wrenches, welding torches

### Mud Flats (Swamp)
**Uniform Style:** Waterproof, amphibious
| Role | Clothing Colors | Armor Colors |
|------|-----------------|--------------|
| **Melee** | murky brown, mud orange, olive | rusted copper, barnacle-covered |
| **Ranged** | grey-green, dark algae | sealed steel, greenish patina |
- **Dinosaurs:** Waterproof barding, mud-caked hide
- **Optional Gear:** Harpoons, diving helmets

> **IMPORTANT RULES:**
> - **Unique/Named Characters** (bosses, captains, specialists) may use ANY fitting color palette - not restricted to biome colors
> - **Saurians NEVER wear shoes or boots** - they have exposed dinosaur feet with claws
> - **Distinctive Gear is OPTIONAL** - not every soldier needs biome-specific accessories

---

## Post-Generation Steps

1. **Save image** to `assets/images/{category}/{id}_original.png`
2. **Update asset status** in JSON to `pending` (not `approved`)
3. **Clear declineNote** field if regenerating declined asset
4. **Run manifest regeneration**:
   ```powershell
   python scripts/generate_asset_manifest.py
   ```
5. **Save the Prompt** (CRITICAL):
   You MUST save the exact prompt used to generate the image.
   *   Read the existing `tools/asset_prompts.json` file.
   *   Add or update the key for the `asset_id` with the full prompt text.
   *   Write the updated JSON back to `tools/asset_prompts.json`.

---

## Prompt Assembly Process

When generating an asset, combine:
```
[TEMPLATE FROM THIS SKILL] + [sourceDescription from JSON] + [declineNote adjustments if any]
```

**Example:**
- Template: `full body sprite of a chibi Stegosaurus...`
- sourceDescription: `distinctive back plates glowing orange at edges, spiked tail thagomizer`
- declineNote: `needs darker coloring`
- **Final**: Template + sourceDescription details + darker color adjustment
