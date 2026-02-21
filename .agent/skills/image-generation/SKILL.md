---
name: image-generation
description: Image generation compliance - when user asks to generate/create images, use reference images, follow protocol, save prompts to tools/asset_prompts.json
---

# Image Generation Compliance Rule

When the user asks you to generate an image, create an asset visual, or design a sprite, you **MUST** follow these steps **BEFORE** calling any generation tools:

## 1. Load the Skill
You **MUST** read the full instructions in:
`.agent/skills/image-generation/SKILL.md`

(If migrating from Antigravity: the skill content may need to be copied to a Cursor skill or this rule.)

## 2. Follow the Protocol
*   Use the **Reference Images** specified in the skill.
*   Construct the prompt using the **Templates** in the skill.
*   **CRITICAL**: You **MUST** append the prompt actually used for that asset to the log at `tools/asset_prompts.json` immediately after generating the image. (Templates live in `documents/design/asset_prompts.md`; the JSON is only a log of prompts used.)

## 3. Verification
*   Do NOT generate an image without having the skill content in your context.
*   Do NOT finish the task without confirming the prompt has been saved to the JSON/TS file.

> [!IMPORTANT]
> This rule ensures consistent art style (Stoneshard aesthetic) and data persistence (prompt saving). Failure to load the skill will result in incorrect asset generation.
