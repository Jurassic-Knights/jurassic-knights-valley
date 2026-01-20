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

### 1. Load Reference Documents (MANDATORY - EVERY TIME)

> [!CAUTION]
> **ALWAYS reload these files fresh on EVERY workflow invocation, even if you loaded them earlier in the conversation.**
> Files may have been edited since the last load. Never rely on cached/previous content.

Before generating ANY images, read these files:
- `docs/design/asset_prompts.md` - **Primary source** for all prompt templates, reference images, terminology rules
- `docs/design/style_guide.md` - Art direction, tone, visual rules

**FAILURE TO LOAD THESE FILES WILL RESULT IN INCORRECT ASSETS**

### 2. Scan for Assets Needing Images

```powershell
python tools/scan_regenerate.py
```

This scans `src/entities/` and outputs:
- Declined assets (have declineNote)
- Missing images (approved/pending but no image file)

### 3. For Each Asset - Generate Image

> [!CAUTION]
> **CRITICAL: Read the sourceDescription from JSON BEFORE generating!**
> - The sourceDescription contains the ACTUAL visual details
> - The declineNote contains FEEDBACK that must be incorporated

**Process:**
1. Read entity JSON from `src/entities/{category}/`
2. Get `sourceDescription` and `declineNote` (if present)
3. Look up template in `docs/design/asset_prompts.md`
4. Combine: `[TEMPLATE] + [sourceDescription] + [declineNote adjustments]`
5. Select correct reference image per `asset_prompts.md`
6. Generate all images in parallel (default behavior)

**Example:**
- sourceDescription: `"navy blue coat, blackened iron armor, hooded mask, sniper rifle"`
- declineNote: `"face cannot be showing"`
- Final prompt includes both: sourceDescription details + ensuring face is covered

### 4. Update Entity JSON (REQUIRED)

After each generation:
- Set `status` to `"pending"` (not `approved`)
- Keep `sourceDescription` unchanged
- Clear `declineNote` field
- Set `files.original` to the new image path
- Copy image to `assets/images/{category}/{id}_original.png`

### 5. Notify User

Notify user to review new pending assets in dashboard.

---

## Important Rules

1. **NEVER generate consumed node without approved base** - The base node must be approved/clean first
2. **Do NOT overwrite sourceDescription** - Only update status and files fields
3. **Herbivores have no equipment** - Just natural dinosaurs
4. **All prompts/references are in asset_prompts.md** - That is the single source of truth

## File Locations

| Purpose | Location |
|---------|----------|
| Entity JSONs (source of truth) | `src/entities/{category}/` |
| Image output | `assets/images/{category}/{id}_original.png` |
| Reference images | `reference/style_samples/` |
| Prompt templates | `docs/design/asset_prompts.md` |
| Scan script | `tools/scan_regenerate.py` |