---
description: Regenerate declined assets and generate missing images for approved assets
---

# Regenerate Assets Workflow

// turbo-all

## Overview

This workflow handles TWO scenarios:
1. **Declined assets** - Regenerate assets marked as declined with feedback
2. **Missing images** - Generate images for assets that are approved/pending but have no image file

## Steps

1. **MANDATORY: Load ALL reference documents FIRST** (DO NOT SKIP)
   Before generating ANY images, you MUST read these files using `view_file`:
   
   ```
   documents/style_guide.md         - Art direction, tone, visual rules
   documents/asset_prompts.md       - Prompt templates per category
   documents/technical_guidelines.md - ID naming, file conventions
   reference/style_samples/         - Load relevant reference images
   ```
   
   **FAILURE TO LOAD THESE FILES WILL RESULT IN INCORRECT ASSETS**
   
   Key rules from these documents:
   - Stoneshard high-fidelity pixel art style
   - "Mud, Steel, and Scales" aesthetic
   - Herbivores: NO armor, NO gear - naked natural dinosaurs
   - Enemies with armor: Only dinosaur.json entries with armor in sourceDescription
   - Always include: `no text, no letters, isolated on white background`
   
   **Reference Images by Asset Type:**
   | Category | Reference Image Path |
   |----------|---------------------|
   | Dinosaurs (armored) | `reference/style_samples/velociraptor_armor.png` |
   | Herbivores (naked) | `reference/style_samples/velociraptor.png` |
   | Saurians (small/agile) | `reference/style_samples/saurian.png` |
   | Saurians (large/stocky) | `reference/style_samples/saurian_wide.png` |
   | Humans | `reference/style_samples/human_base.png` |
   | UI Icons | `reference/style_samples/UI_style.png` |
   | Resources/Items | `reference/style_samples/human_base.png` |
   | Equipment | `reference/style_samples/human_base.png` |
   | Props | `reference/style_samples/medic_crate.png` |
   | Nodes (full) | `reference/style_samples/node.png` |
   | Nodes (consumed) | Use the APPROVED full version of same node as reference |

2. **Scan category JSON files for assets needing images**
   Use Python to scan all category JSON files:
   ```powershell
   python -c "
   import json, os, glob
   
   categories = ['enemies', 'items', 'resources', 'npcs', 'environment', 'props', 'ui', 'nodes', 'equipment']
   missing = []
   declined = []
   
   for cat in categories:
       cat_dir = f'tools/{cat}'
       if not os.path.isdir(cat_dir):
           continue
       for jf in glob.glob(f'{cat_dir}/*.json'):
           if '_config' in jf or 'queue' in jf:
               continue
           with open(jf) as f:
               try:
                   data = json.load(f)
               except:
                   continue
           for item in data:
               # Check main image
               img_path = item.get('files', {}).get('original') or item.get('files', {}).get('clean')
               status = item.get('status', 'pending')
               
               if status == 'declined':
                   declined.append({'id': item['id'], 'cat': cat, 'file': os.path.basename(jf), 'prompt': item.get('sourceDescription',''), 'note': item.get('declineNote','')})
               elif img_path and not os.path.exists(img_path):
                   missing.append({'id': item['id'], 'cat': cat, 'file': os.path.basename(jf), 'prompt': item.get('sourceDescription','')})
               
                # Check consumed image for nodes - ONLY if base is approved/clean
                base_approved = status in ['approved', 'clean']
                consumed_path = item.get('files', {}).get('consumed_original') or item.get('files', {}).get('consumed_clean')
                consumed_status = item.get('consumedStatus', status)
                if consumed_status == 'declined' and base_approved:
                    declined.append({'id': item['id']+'_consumed', 'cat': cat, 'file': os.path.basename(jf), 'prompt': item.get('consumedSourceDescription',''), 'note': item.get('consumedDeclineNote',''), 'base_ref': item.get('files', {}).get('clean') or item.get('files', {}).get('original')})
                elif consumed_path and not os.path.exists(consumed_path) and base_approved:
                    missing.append({'id': item['id']+'_consumed', 'cat': cat, 'file': os.path.basename(jf), 'prompt': item.get('consumedSourceDescription',''), 'base_ref': item.get('files', {}).get('clean') or item.get('files', {}).get('original')})
   
   print('=== DECLINED ASSETS ===')
   for d in declined:
       print(f\"{d['cat']}/{d['id']}: {d['note'] or 'no note'}\")
   print(f'Total declined: {len(declined)}')
   print()
   print('=== MISSING IMAGES ===')
   for m in missing:
       print(f\"{m['cat']}/{m['id']}\")
   print(f'Total missing: {len(missing)}')
   "
   ```

3. **For each asset needing regeneration:**
   
   > [!CAUTION]
   > **CRITICAL: You MUST read the sourceDescription from the JSON file BEFORE generating!**
   > - Do NOT infer weapon/equipment from the character's NAME (e.g., "Crossbowman" might have a sniper rifle)
   > - The sourceDescription contains the ACTUAL details set by the user
   > - The declineNote contains FEEDBACK that must be incorporated
   
   **Correct process:**
   1. Read the item's `sourceDescription` field from JSON
   2. Read the item's `declineNote` field from JSON (if present)
   3. Combine: `[TEMPLATE] + [sourceDescription from JSON] + [declineNote adjustments]`
   4. Generate image using the combined prompt
   5. After generation, update ONLY `status` and `files` fields - DO NOT overwrite `sourceDescription`
   
   **Example with declineNote:**
   - sourceDescription: `"Sniper soldier, navy blue coat, blackened iron armor, hooded mask, sniper rifle"`
   - declineNote: `"face cannot be showing"`
   - Final prompt includes both: the sourceDescription details PLUS ensuring face is covered per feedback

   **Example Assembly (Herbivore):**
   - Template: `full body sprite of a Stegosaurus, a completely different dinosaur than the reference image, game creature asset, stoneshard style, high fidelity pixel art, natural appearance, no armor, no gear, side profile, isolated on white background, no text, no letters, no particles, no VFX, no smoke, no fire`
   - sourceDescription: `distinctive back plates glowing orange at edges, spiked tail thagomizer, grey-green armored hide, defensive stance`
   - **Final prompt**: Template text with sourceDescription appended after "natural appearance"

4. **Asset-specific prompt patterns:**

   **Dinosaurs (armored) - dinosaur.json:**
   ```
   full body sprite of a chibi [SPECIES], a completely different dinosaur than the reference image, 
   game creature asset, stoneshard style, high fidelity pixel art, war-beast appearance, 
   heavy plating, facing left, side profile, isolated on white background, no text, no letters, 
   no particles, no VFX, no smoke, no fire
   ```

   **Herbivores (naked) - herbivore.json:**
   ```
   full body sprite of a chibi [SPECIES], a completely different dinosaur than the reference image, 
   game creature asset, stoneshard style, high fidelity pixel art, natural appearance, 
   no armor, no gear, facing left, side profile, isolated on white background, no text, no letters, 
   no particles, no VFX, no smoke, no fire
   ```

   **Saurians - saurian.json:**
   ```
   full body sprite of an anthropomorphic [SPECIES], a different warrior than the reference image but same proportions, 
   game creature asset, stoneshard style, high fidelity pixel art, war-beast appearance, armored, facing left, side profile, 
   isolated on white background, no text, no letters, no particles, no VFX, no smoke, no fire
   ```

   **Humans - human.json:**
   ```
   full body sprite of a [DESCRIPTION], a different soldier than the reference image but same proportions, 
   game character asset, stoneshard style, high fidelity pixel art, wearing WWI-era military gear, 
   [SPECIFIC FACE COVERING], facing left, side profile, isolated on white background, no text, no letters, 
   no particles, no VFX, no smoke, no fire
   ```

   **Items (bone, leather, metal, wood, mechanical):**
   ```
   sprite of [NAME], game item asset, stoneshard style, high fidelity pixel art, 
   rusty, gritty, weathered, isometric perspective, isolated on white background, 
   no text, no letters, no particles, no VFX, no smoke, no fire
   ```

   **Resources (food, minerals, salvage, scraps):**
   ```
   sprite of [NAME], game item asset, stoneshard style, high fidelity pixel art, 
   rusty, gritty, weathered, isometric perspective, isolated on white background, 
   no text, no letters, no particles, no VFX, no smoke, no fire
   ```

   **Equipment (armor, weapons, tools):**
   ```
   icon of [NAME], game ui asset, stoneshard style, high fidelity pixel art, 
   rusty, gritty, weathered, straight horizontal angle, side view, 
   isolated on white background, no text, no letters, no particles, no VFX, no smoke, no fire
   ```

   **Props (world objects):**
   ```
   sprite of [NAME], game world prop, stoneshard style, high fidelity pixel art,
   [DESCRIPTION], top-down perspective, isolated on white background
   ```
   (Props may include text/letters if contextually appropriate)

   **UI Icons:**
   ```
   icon of [UI ELEMENT], game ui asset, stoneshard style, detailed pixel art iconography, 
   rusted iron frame, worn leather texture, brass accents, isolated on white background
   ```
   (UI icons may include text/letters if meaningful)

   **Nodes (full version):**
   ```
   [sourceDescription] - usually includes full context
   ```

   **Nodes (consumed version):**
   - MUST use the approved full version as reference image
   - Use `consumedSourceDescription` for prompt
   ```
   depleted [NODE TYPE], [consumedSourceDescription], isolated on white background,
   no text, no letters
   ```

5. **Update asset status after generation:**
   - Set status to 'pending' (not 'approved') so user can review
   - Clear any declineNote fields

6. **Regenerate manifest**
   ```powershell
   python scripts/generate_asset_manifest.py
   ```

7. **Notify user** to review new pending assets in dashboard

## Important Rules

1. **NEVER generate consumed node version without approved/clean base** - The base node status must be 'approved' or 'clean' before generating its consumed version. The scan script enforces this automatically. Use the approved base image as a reference for visual consistency.
2. **Use reference images** from `reference/style_samples/` for consistency
3. **Always include** these in prompts: `no text, no letters, no watermark, isolated on white background`
4. **Herbivores are NAKED** - No armor or gear, just natural dinosaurs
5. **Enemies with armor** - Only add armor keywords for dinosaurs in `dinosaur.json` that have armor mentions in their sourceDescription
6. **Update asset_prompts.json** immediately after each generation for traceability
7. **Stoneshard style keywords**: rusty, gritty, weathered, high fidelity pixel art

## File Locations

- Category JSONs: `tools/{category}/{type}.json`
- Image output: `assets/images/{category}/{id}_original.png`
- Prompt registry: `tools/asset_prompts.json`
- Decline notes: In each item's `declineNote` or `consumedDeclineNote` field
- Style reference: `reference/style_samples/`