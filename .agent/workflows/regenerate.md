---
description: Regenerate all declined assets following style guidelines
---

# Regenerate Declined Assets Workflow

// turbo-all

## Steps

1. **Reload prompt templates** (MANDATORY FIRST STEP)
   - Use `view_file` tool to read `documents/asset_prompts.md` 
   - This MUST be done before generating any images
   - Apply the exact prompt structure and keywords from this file
   - Pay special attention to:
     - VFX exclusions: `no particles, no VFX, no smoke, no fire`
     - Isometric perspective requirements per asset type
     - Reference image paths for each category

2. **Scan for declined assets**
   ```powershell
   Get-ChildItem -Path "assets/images" -Recurse -Filter "*_declined*" | Select-Object FullName, Name
   ```

2. **Check for decline notes** (optional user feedback)
   - Read `tools/decline_notes.json` if it exists
   - Use any notes as additional prompt guidance

3. **For each declined asset:**
   - Determine asset type from folder (items, resources, dinos, ui, etc.)
   - Load appropriate prompt template from `documents/asset_prompts.md`
   - For **consumed resources**: Use the approved base resource as reference image
   - For **other assets**: Use reference from `reference/style_samples/`
   - Generate replacement image using `generate_image` tool
   - **IMPORTANT: Save the prompt used to `tools/asset_prompts.json`** (keyed by filename)
   - Save to same folder with `_original.png` suffix (pending review)
   - Delete the old `_declined*.png` file

4. **Update prompt registry** (MANDATORY - DO NOT SKIP)
   - **IMMEDIATELY after generating each asset**, update `tools/asset_prompts.json`
   - Key = filename (e.g., `icon_lock_original.png`)
   - Value = full prompt string used for generation
   - This enables prompt display in the dashboard
   - Use `replace_file_content` to add each prompt as you go

5. **Regenerate manifest**
   ```powershell
   python scripts/generate_asset_manifest.py
   ```

6. **Notify user** to review new pending assets in dashboard

## Prompt Templates Reference

See `documents/asset_prompts.md` for full templates. Key patterns:

- **Items/Tools**: `icon of [DESCRIPTION], game ui asset, stoneshard style, high fidelity pixel art, rusty, gritty, weathered...`
- **World Resources**: `sprite of [DESCRIPTION], game world asset, stoneshard style...`
- **Consumed Resources**: Use `{name}_approved_original.png` as reference, describe depleted version
- **Characters**: `full body sprite of [DESCRIPTION], game character asset...`
- **Dinosaurs**: `full body sprite of [SPECIES], game creature asset...`

## Important Rules

1. **CONSUMED RESOURCES REQUIRE APPROVED BASE**: Never generate a `{name}_consumed` asset unless `{name}_approved_original.png` exists. Skip and notify user if base is not approved.
2. Always include reference image from `reference/style_samples/` (except consumed resources)
3. Always add: `no text, no letters, no watermark, isolated on white background`
4. Match isometric perspective of reference
5. Use Stoneshard style keywords: rusty, gritty, weathered, high fidelity pixel art

