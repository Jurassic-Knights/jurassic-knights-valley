---
description: Process all approved assets through Photoshop to create clean versions
---

# Clean Approved Assets Workflow

// turbo-all

## Steps

1. **Run Photoshop background removal on all approved assets**
   ```powershell
   python scripts/photoshop_remove_bg.py assets/images/buildings
   python scripts/photoshop_remove_bg.py assets/images/dinosaurs
   python scripts/photoshop_remove_bg.py assets/images/resources
   python scripts/photoshop_remove_bg.py assets/images/items
   python scripts/photoshop_remove_bg.py assets/images/characters
   python scripts/photoshop_remove_bg.py assets/images/tools
   python scripts/photoshop_remove_bg.py assets/images/ui
   ```

2. **Regenerate asset manifest**
   ```powershell
   python scripts/generate_asset_manifest.py
   ```

3. **Notify user** with results

## What This Does

- Finds all `*_approved_original.png` files in each folder
- Opens each in Photoshop (minimized, won't steal focus)
- Uses AI "Select Subject" to remove background
- Expands selection by 1px for clean edges
- Scales content to fit with 10px margin
- Saves as `*_clean.png`

## Prerequisites

- Assets must be approved in the dashboard first
- Photoshop 2026 must be installed