---
description: How to create new assets following the ID-based registry system
---

# Asset Creation Workflow

All assets use ID-based linking for non-destructive workflows.

## Before Creating an Asset

1. Check `documents/style_guide.md` for art direction
2. Check `documents/technical_guidelines.md` for ID naming
3. Check `documents/asset_prompts.md` for generation templates
4. Check existing assets to avoid duplicate IDs

---

## Creating an Image Asset

// turbo
1. Generate/create the image file with **white background**
2. Save to appropriate folder in `assets/images/` with `_original` suffix (e.g., `drop_wood_original.png`)
3. Review in Asset Dashboard, mark as **Approved** → becomes `{name}_approved_original.png`
4. Run Photoshop background removal:
   ```powershell
   python scripts/photoshop_remove_bg.py "assets/images/<folder>"
   ```
   This creates `_clean.png` versions with transparent backgrounds.
5. Add entry to `src/core/AssetLoader.js`:

```javascript
"asset_id_here": { "path": "images/category/filename_clean.png" }
```

> **Note**: Images use an embedded registry in AssetLoader.js for faster loading.

---

## Creating an Audio Asset

// turbo
1. Create/acquire the audio file
2. Save to appropriate folder in `assets/audio/`
3. Add entry to `src/core/AssetLoader.js` in the `registries.audio.assets` object:

```javascript
"sfx_sound_id": { "path": "audio/category/filename.wav", "volume": 0.7 }
```

> **Note**: All registries are embedded in AssetLoader.js for faster loading and simpler deployment.

---

## Registry Locations

All registries are **embedded** in `src/core/AssetLoader.js`:

| Asset Type | Registry Object | Example |
|------------|-----------------|---------|
| Images | `registries.images.assets` | `"ui_icon_map": { "path": "images/ui/icon_map_clean.png" }` |
| Audio | `registries.audio.assets` | `"sfx_click": { "path": "audio/ui_click.wav", "volume": 0.5 }` |
| VFX | `registries.vfx.presets` | (currently empty) |

---

## ID Naming Rules

- Use `snake_case`
- Prefix by category (see `documents/technical_guidelines.md`):
  - `ui_` - UI elements
  - `npc_` - NPCs/Merchants
  - `dino_` - Dinosaurs  
  - `drop_` - Dropped items
  - `item_` - Crafted items
  - `world_` - World assets
  - `sfx_` / `bgm_` - Audio
- Be descriptive: `dino_velociraptor_base`, `drop_iron_ore`
- IDs are permanent - file paths can change