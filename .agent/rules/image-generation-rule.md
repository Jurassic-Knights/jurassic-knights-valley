---
trigger: whenever the user asks to generate an image or create an asset visual
---

# Image Generation Compliance Rule

When the user asks you to generate an image, create an asset visual, or design a sprite, you **MUST** follow these steps **BEFORE** calling any generation tools:

1.  **Load the Skill**: You **MUST** read the full instructions in:
    `c:\Users\Anthony\.gemini\antigravity\scratch\jurassic-knights-valley\.agent\skills\image-generation\SKILL.md`

2.  **Follow the Protocol**:
    *   Use the **Reference Images** specified in the skill.
    *   Construct the prompt using the **Templates** in the skill.
    *   **CRITICAL**: You **MUST** save the generation prompt to `tools/dashboard/asset_prompts.json` immediately after generating the image.

3.  **Verification**:
    *   Do NOT generate an image without having the `SKILL.md` content in your context.
    *   Do NOT finish the task without confirming the prompt has been saved to the JSON file.

> [!IMPORTANT]
> This rule ensures consistent art style (Stoneshard aesthetic) and data persistence (prompt saving). Failure to load the skill will result in incorrect asset generation.
