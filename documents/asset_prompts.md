# Asset Generation Prompt Templates

**Centralized prompt definitions for AI-generated game assets.**

> This file ensures visual consistency across all generated assets.
> Always use these templates when generating new art.

---

## Reference Images

When generating assets, ALWAYS include a reference image. Use the appropriate reference based on asset type:

| Asset Type | Reference Image |
|------------|-----------------|
| **Dinosaurs** | `reference/style_samples/dino_velociraptor_base_original.png` |
| **All Others** (Items, Resources, Characters, UI) | `reference/style_samples/world_hero.png` |
| **Consumed Resources** | Use the approved base resource (e.g., `assets/images/resources/{name}_approved_original.png`) |

**Full paths:**
```
Dinosaurs:    C:\Users\Anthony\.gemini\antigravity\scratch\jurassic-knights-valley\reference\style_samples\dino_velociraptor_base_original.png
All Others:   C:\Users\Anthony\.gemini\antigravity\scratch\jurassic-knights-valley\reference\style_samples\world_hero.png
```

---

## Base Prompt Structure

All prompts follow this structure:
```
icon/sprite of [SUBJECT], game [TYPE] asset, stoneshard style, high fidelity pixel art, [MATERIAL KEYWORDS], match the isometric perspective of the reference image, isolated on white background, no text, no letters, no watermark, no particles, no VFX, no smoke, no fire
```

---

## Category Templates

### Drops (Resource Pickups)
```
sprite of [DROP DESCRIPTION], game item asset, stoneshard style, high fidelity pixel art, rusty, gritty, weathered, isolated on white background, no text, no letters, no watermark, no particles, no VFX, no smoke, no fire
```

**Examples:**
- `sprite of a pile of raw wood logs` → drop_wood
- `sprite of jagged rusty metal scrap sheets and debris` → drop_scrap_metal
- `sprite of a heavy chunk of raw grey iron ore rock` → drop_iron_ore
- `sprite of a shiny raw gold nugget` → drop_gold
- `sprite of a dark oily fossil fuel canister` → drop_fossil_fuel
- `sprite of a raw bloody red meat steak chunk` → drop_primal_meat

---

### Items (Crafted Materials)
```
sprite of [ITEM DESCRIPTION], game item asset, stoneshard style, high fidelity pixel art, rusty, gritty, weathered, match the isometric perspective of the reference image, isolated on white background, no text, no letters, no watermark, no particles, no VFX, no smoke, no fire
```

**Examples:**
- `sprite of a refined cast iron ingot bar` → item_iron_ingot
- `sprite of a rusted scrap metal plate sheet` → item_scrap_plate

---

### Weapons & Tools
```
icon of [WEAPON/TOOL DESCRIPTION], game ui asset, stoneshard style, high fidelity pixel art, rusty, gritty, weathered, straight horizontal angle, side view, isolated on white background, no text, no letters, no watermark, no particles, no VFX, no smoke, no fire
```

> **IMPORTANT**: Weapons and tools must be angled **straight and horizontally** (like lying flat on a table).

**Examples:**
- `sprite of a military entrenching shovel with wooden handle, straight horizontal angle` → tool_shovel
- `sprite of a weathered vintage military pistol or revolver, straight horizontal angle` → tool_gun

---

### Characters (NPCs, Merchants, Hero)
```
full body sprite of [CHARACTER DESCRIPTION], game character asset, stoneshard style, high fidelity pixel art, wearing WWI-era military gear, gas mask or helmet covering face, match the isometric perspective of the reference image, isolated on white background, no text, no letters, no watermark, no particles, no VFX, no smoke, no fire
```

**Zone-Themed Merchants:**
- Quarry: dusty grey uniform, miner's helmet
- Iron Ridge: rust-stained overalls, welding mask
- Dead Woods: tattered cloak, plague doctor mask
- Crossroads: travel-worn coat, wide-brimmed hat with visor
- Scrap Yard: salvaged armor patchwork, riveted faceplate
- Mud Flats: waterproof poncho, diving helmet
- Bone Valley: bone-decorated armor, skull visor
- The Ruins: ancient-styled armor, mysterious full-face helm

---

### Dinosaurs
```
full body sprite of [DINOSAUR SPECIES], game creature asset, stoneshard style, high fidelity pixel art, war-beast appearance, heavy plating optional, side profile, match the isometric perspective of the reference image, isolated on white background, no text, no letters, no watermark, no particles, no VFX, no smoke, no fire
```

**Species Keywords:**
- Velociraptor: agile, feathered, predatory stance
- T-Rex: massive jaws, tiny arms, imposing
- Triceratops: armored frill, three horns, sturdy
- Pteranodon: wingspan, flying pose, leathery wings
- Stegosaurus: back plates, tail spikes, docile
- Ankylosaurus: armored shell, club tail, tank-like
- Spinosaurus: sail back, crocodile snout, semi-aquatic

---

### World Resources (Harvestable)
```
sprite of [RESOURCE DESCRIPTION], game world asset, stoneshard style, high fidelity pixel art, weathered, natural, match the isometric perspective of the reference image, isolated on white background
```

**Examples:**
- `sprite of a dead fallen tree trunk with exposed roots` → wood
- `sprite of a raw iron ore rock outcrop with rust-colored veins` → iron_ore
- `sprite of a raw gold ore rock outcrop with shiny golden veins` → gold
- `sprite of a pile of abandoned rusted machinery parts` → scrap_metal
- `sprite of a dark oil seep or tar pit with bubbling black sludge` → fossil_fuel

---

### Consumed Resources (Depleted State)

> **PREREQUISITE**: The base resource (`{name}_approved_original.png`) must exist and be approved before generating the consumed version.

> **IMPORTANT**: For consumed resources, use the **approved base resource image** as your reference image (NOT the style_samples folder). The prompt should describe it as the broken-down, depleted version of that specific resource.

**Reference Image**: Use `assets/images/resources/{resource_name}_approved_original.png`

```
sprite showing the consumed and depleted version of this resource, same style, harvested remains, broken down, picked over, match the isometric perspective of the reference image, isolated on white background
```

**Examples:**
- Use `wood_approved_original.png` as reference → `sprite of a chopped tree stump with axe marks, harvested remains` → wood_consumed
- Use `iron_ore_approved_original.png` as reference → `sprite of a depleted mined rock with pick marks, crumbled remains` → iron_ore_consumed
- Use `gold_approved_original.png` as reference → `sprite of a depleted gold ore with traces remaining, mined out` → gold_consumed
- Use `scrap_metal_approved_original.png` as reference → `sprite of a picked-over pile with only small debris remaining` → scrap_metal_consumed
- Use `fossil_fuel_approved_original.png` as reference → `sprite of a drained tar pit with dried oily residue` → fossil_fuel_consumed

### UI Icons
```
icon of [UI ELEMENT], game ui asset, stoneshard style, detailed pixel art iconography, rusted iron frame, worn leather texture, brass accents, isolated on white background
```

---

## Forbidden Elements

**NEVER include in prompts:**
- Glowing runes or magical effects
- particles, sparkles, VFX, smoke, fire
- Text, letters, or numbers (unless the asset type calls for it like a sign)
- Modern technology (phones, screens)
- Bright neon colors

**ALWAYS include:**
- `no text, no letters, no watermark` (unless the asset type calls for it like a sign)
- `isolated on white background` (for BG removal pipeline)
- `stoneshard style` or `high fidelity pixel art`

---

## Asset Naming Convention

**Format**: `{name}_{status}_original.png`

| Status | Pattern | Example |
|--------|---------|---------|
| Pending | `{name}_original.png` | `wood_original.png` |
| Approved | `{name}_approved_original.png` | `wood_approved_original.png` |
| Final | `{name}_final_original.png` | `wood_final_original.png` |
| Declined | `{name}_declined_original.png` | `wood_declined_original.png` |
| Clean | `{name}_clean.png` | `wood_clean.png` |

**Lifecycle:**
1. Generated → `_original.png` (pending review)
2. Approved in dashboard → `_approved_original.png`
3. Cleaned via Photoshop → `_clean.png` created + renamed to `_final_original.png`
4. If declined → `_declined_original.png` (for regeneration)

**Key:**
- `_original.png` = raw, unprocessed
- `_approved` = approved, awaiting cleaning
- `_final` = cleaned, source archived
- `_declined` = needs regeneration
- `_clean.png` = production-ready (transparent background)

---

## Post-Generation Pipeline

1. Save generated image as `{asset_name}_original.png`
2. Review in Asset Dashboard, mark as **Approved** → becomes `{name}_approved_original.png`
3. Run Photoshop background removal (processes `*_approved_original.png` files):
   ```powershell
   python scripts/photoshop_remove_bg.py "assets/images/<folder>"
   ```
4. Register `_clean.png` in `src/core/AssetLoader.js`

