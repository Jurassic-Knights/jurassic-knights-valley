# Asset Generation Prompt Templates

**Centralized prompt definitions for AI-generated game assets.**

> This file ensures visual consistency across all generated assets.
> Always use these templates when generating new art.

---

## Reference Images

When generating assets, ALWAYS include a reference image. Use the appropriate reference based on asset type:

| Asset Type | Reference Image |
|------------|-----------------|
| **Dinosaurs (armored)** | `reference/style_samples/velociraptor_armor.png` |
| **Herbivores (naked)** | `reference/style_samples/velociraptor.png` |
| **Saurians (small/agile)** | `reference/style_samples/saurian.png` |
| **Saurians (large/stocky)** | `reference/style_samples/saurian_wide.png` |
| **Humans** | `reference/style_samples/human_base.png` |
| **Items/Resources** | `reference/style_samples/human_base.png` |
| **Equipment** | `reference/style_samples/human_base.png` |
| **UI Icons** | `reference/style_samples/UI_style.png` |
| **Architecture** | `reference/style_samples/wood_fence.png` |
| **Architecture (bridges)** | `reference/style_samples/bridge.png` |
| **Props** | `reference/style_samples/human_base.png` |
| **Flora** | `reference/style_samples/human_base.png` |
| **Environment** | `reference/style_samples/medic_crate.png` |
| **Environment (walls)** | `reference/style_samples/wood_fence.png` |
| **Environment (bridges)** | `reference/style_samples/bridge.png` |
| **Environment (furniture)** | `reference/style_samples/bench.png` |
| **Nodes (full)** | `reference/style_samples/node.png` |
| **Nodes (consumed)** | Use the approved full version of same node |

---

## How sourceDescription Works

The `sourceDescription` field in each asset's JSON is **NOT a full prompt**. It contains **ONLY the unique, contextual details** specific to that asset. The regenerate workflow combines:

```
[TEMPLATE FROM asset_prompts.md] + [sourceDescription from JSON]
```

### sourceDescription Should Include:
- **Physical traits**: body shape, size, distinctive features
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

**Biome-Aware Examples:**
- **Grasslands Herbivore**: "bright green-brown coloring, healthy muscular build"
- **Tundra Herbivore**: "thick white fur, frost-resistant hide, breath mist effect"
- **Desert Herbivore**: "pale sandy coloring, sun-bleached cracked skin, lean build"
- **Badlands Human**: "ash-covered armor, respirator mask, scorched uniform, mining equipment"

---

## Category Templates


### Dinosaurs (Armored) - from dinosaur.json
> These are war-beasts with armor/gear
```
full body sprite of a chibi [SPECIES NAME], a completely different dinosaur than the reference image, game creature asset, stoneshard style, high fidelity pixel art, war-beast appearance, heavy plating, facing left, side profile, isolated on white background, no text, no letters, no particles, no VFX, no smoke, no fire
```

---

### Herbivores (Naked) - from herbivore.json
> These are natural dinosaurs WITHOUT any armor or gear
```
full body sprite of a chibi [SPECIES NAME], a completely different dinosaur than the reference image, game creature asset, stoneshard style, high fidelity pixel art, natural appearance, no armor, no gear, facing left, side profile, isolated on white background, no text, no letters, no particles, no VFX, no smoke, no fire
```

---

### Saurians - from saurian.json
> These are anthropomorphic dinosaur soldiers with medieval + WWI aesthetic. sometimes they wear headgear sometimes they don't it depends on the character design.
```
full body sprite of an anthropomorphic [SPECIES NAME], a different character than the reference image, game creature asset, stoneshard style, high fidelity pixel art, medieval and WWI fusion aesthetic, armored and outfitted soldier appearance, facing left, isolated on white background, no text, no letters, no particles, no VFX, no smoke, no fire
```

**Size-based reference selection:**
- Small/agile saurians → use `saurian.png`
- Large/stocky saurians → use `saurian_wide.png`

---

### Humans - from human.json
> All humans must have faces covered (Helmet Mandate) with medieval + WWI aesthetic
```
full body sprite of a [DESCRIPTION], a different character and headgear or helmet than the reference image, game character asset, stoneshard style, high fidelity pixel art, medieval and WWI fusion aesthetic, wearing military gear with medieval armor elements, [SPECIFIC FACE COVERING], facing left, isolated on white background, no text, no letters, no particles, no VFX, no smoke, no fire
```

**Face covering options** (VARY - avoid overusing gas mask):

**Sparingly (< 20% each):**
- gas mask
- full-face helmet

**Preferred (use more frequently):**
- stahlhelm with face guard
- medieval war helm / knight helmet
- iron mask / riveted faceplate  
- hooded mask / leather hood with goggles
- skull visor / death mask
- barbuta / sallet / great helm
- combat helmet with visor

**Zone-appropriate:**
- Grasslands: stahlhelm, combat helmet
- Tundra: hooded mask, fur-lined helm
- Desert: cloth-wrapped face, goggles
- Badlands: iron mask, skull visor
- Swamp: diving helmet, gas mask

---

## Enemy Biome Visual Identities

When generating enemies, match their uniforms, armor, and equipment to their assigned biome. **Humans and Saurians share the same military** and wear matching uniforms/armor.

> **IMPORTANT RULES:**
> - **Unique/Named Characters** (bosses, captains, specialists) may use ANY fitting color palette for their character design - not restricted to biome colors
> - **Saurians NEVER wear shoes or boots** - they have exposed dinosaur feet with claws
> - **Distinctive Gear is OPTIONAL** - not every soldier needs biome-specific accessories

### Grasslands (Home Region)
**Uniform Style:** Standard military - slightly dirty
| Role | Clothing Colors | Armor Colors |
|------|-----------------|--------------|
| **Melee** | brown, tan, dark red trim | iron |
| **Ranged** | dark grey, forest green | gunmetal, steel |
- **Dinosaurs:** Bronze barding, tan saddle cloth
- **Optional Gear:** Backpacks, canteens, binoculars

### Tundra (Frozen North)
**Uniform Style:** Heavy insulated - bulky, fur-lined
| Role | Clothing Colors | Armor Colors |
|------|-----------------|--------------|
| **Melee** | white, grey, brown fur trim | polished steel |
| **Ranged** | navy blue, charcoal grey | blackened iron, dark steel |
- **Dinosaurs:** Thick white/grey fur, armor covered in snow
- **Optional Gear:** thermal cloaks, fur gloves, fur boots

### Desert (Arid Wastes)
**Uniform Style:** Light, loose-fitting - protection from sun
| Role | Clothing Colors | Armor Colors |
|------|-----------------|--------------|
| **Melee** | sand tan, terracotta, cream | bronze |
| **Ranged** | pale cream, dusty brown | dark leather |
- **Dinosaurs:** Light mesh barding, sand-scoured hide
- **Optional Gear:** Water skins, cloth wraps, goggles

### Badlands (Volcanic/Industrial)
**Uniform Style:** Heavy industrial - heat-resistant
| Role | Clothing Colors | Armor Colors |
|------|-----------------|--------------|
| **Melee** | rust orange, charred brown | blackened iron |
| **Ranged** | coal black, ash grey | dark iron |
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


### NPCs/Merchants
```
full body sprite of a [MERCHANT TYPE], a different character and headgear than the reference image, game character asset, stoneshard style, high fidelity pixel art, wearing WWI-era military gear, [SPECIFIC FACE COVERING], facing left, isolated on white background, no text, no letters, no particles, no VFX, no smoke, no fire
```

**Zone-Themed Merchants:**
- Home Outpost: quartermaster uniform, supply crates, command insignia, full-face helmet
- Quarry: dusty grey uniform, miner's helmet with visor
- Iron Ridge: rust-stained overalls, welding mask
- Dead Woods: tattered cloak, plague doctor mask
- Crossroads: travel-worn coat, wide-brimmed hat with visor
- Scrap Yard: salvaged armor patchwork, riveted faceplate
- Mud Flats: waterproof poncho, diving helmet
- Bone Valley: bone-decorated armor, skull visor
- The Ruins: ancient-styled armor, mysterious full-face helm

---

### Items (Crafted Materials)
```
sprite of [ITEM DESCRIPTION], game item asset, stoneshard style, high fidelity pixel art, rusty, gritty, weathered, isometric perspective, isolated on white background, no text, no letters, no particles, no VFX, no smoke, no fire
```

---

### Resources (Drops)
```
sprite of [DROP DESCRIPTION], game item asset, stoneshard style, high fidelity pixel art, rusty, gritty, weathered, isometric perspective, isolated on white background, no text, no letters, no particles, no VFX, no smoke, no fire
```

**Examples:**
- `sprite of a pile of raw wood logs` → drop_wood
- `sprite of jagged rusty metal scrap sheets and debris` → drop_scrap_metal
- `sprite of a heavy chunk of raw grey iron ore rock` → drop_iron_ore

---

### Equipment (Weapons, Armor, Tools)
```
icon of [EQUIPMENT DESCRIPTION], game ui asset, stoneshard style, high fidelity pixel art, medieval and WWI fusion aesthetic, legendary unique ornate appearance, rusty, gritty, weathered, flat horizontal laying position facing right, profile view, no angle, isolated on white background, no text, no letters, no particles, no VFX, no smoke, no fire
```

> **IMPORTANT**: Weapons and tools must be angled **flat and horizontally** (like lying on a table viewed from directly above). Do NOT use isometric perspective for weapons.

**Weapon Design Rules:**
- **Never basic** - Weapons should usually but not always look legendary, hulking, unique, or ornate (not standard military issue)
- **Medieval+WWI fusion** - Blend archaic craftsmanship with industrial warfare elements
- **Examples of fusion**: gilded engravings on a rifle, serrated bayonet blade, chainmail-wrapped grip, brass fittings on sword
- **Examples of dinosaur fusion**: it's also possible to integrate dinosaur elements into weapons, but more rare.

**Enemy Weapon Types:**

| Ranged | Melee |
|--------|-------|
| rifle | sword |
| pistol | longsword |
| submachine_gun | greatsword |
| machine_gun | axe |
| crossbow | war_axe |
| flamethrower | mace |
| shotgun | war_hammer |
| sniper_rifle | lance |
| bazooka | halberd |
| | spear |
| | dual_blades |
| | flail |
| | knife |

---

### UI Icons
```
icon of [UI ELEMENT], game ui asset, stoneshard style, detailed pixel art iconography, isolated on white background
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
```
sprite of [ARCHITECTURE DESCRIPTION], game world structure, stoneshard style, high fidelity pixel art, weathered, medieval/WWI aesthetic, horizontal side view, facing left to right, isolated on white background, no text, no letters
```

> **IMPORTANT**: Architecture assets must be rendered in **horizontal side view** (left to right), NOT isometric diagonal. Think of viewing a fence or wall from the side.

**Examples:**
- Fences, walls, gates, bridges
- Roads, paths, trenches
- Towers, posts, signposts
- Barricades, rails, ladders

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

**ALWAYS include:**
- `no text, no letters` (except UI icons and Props where contextual)
- `isolated on white background` (for BG removal pipeline)
- `stoneshard style` and `high fidelity pixel art`

---

## Asset Naming Convention

**Format**: `{name}_{status}.png`

| Status | Pattern | Example |
|--------|---------|---------|
| Pending | `{name}_original.png` | `wood_original.png` |
| Approved | `{name}_approved_original.png` | `wood_approved_original.png` |
| Declined | `{name}_declined_original.png` | `wood_declined_original.png` |
| Production | `{name}_clean.png` | `wood_clean.png` |

