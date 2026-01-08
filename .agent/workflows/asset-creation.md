---
description: How to create new assets following the ID-based registry system
---

# Asset Creation Workflow

All assets use ID-based linking for non-destructive workflows.

## Before Creating an Asset

1. Check `documents/style_guide.md` for art direction
2. Check `documents/technical_guidelines.md` for ID naming
3. Check existing registry to avoid duplicate IDs

## Creating an Image Asset

// turbo
1. Generate/create the image file with **white background**
2. Save to appropriate folder in `assets/images/` with `_original` suffix (e.g., `drop_wood_original.png`)
3. Run Photoshop background removal:
   ```powershell
   python scripts/photoshop_remove_bg.py "assets/images/<folder>"
   ```
   This creates `_clean.png` versions with transparent backgrounds.
4. Add entry to `src/core/AssetLoader.js` (embedded registry):

```javascript
"asset_id_here": { "path": "images/category/filename_clean.png" }
```

> **Note**: We use Photoshop's "Remove BG" action for high-quality transparency.
> The old `rembg` Python workflow is deprecated.

## Creating an Audio Asset

// turbo
1. Create/acquire the audio file
2. Save to appropriate folder in `assets/audio/`
3. Add entry to `assets/registry/audio.json`:

```json
{
  "sound_id_here": {
    "path": "audio/category/filename.wav",
    "category": "bgm|sfx|ambient",
    "volume": 0.7,
    "loop": false,
    "description": "When this sound plays"
  }
}
```

## ID Naming Rules

- Use `snake_case`
- Prefix with category: `ui_`, `char_`, `bg_`, `item_`, `sfx_`, `bgm_`
- Be descriptive: `ui_btn_primary`, `char_knight_idle`, `sfx_sword_clash`
- IDs are permanent - file paths can change