# Clean Code Audit Report

**Date:** 2026-01-29
**Auditor:** Antigravity (Clean Code Agent)
**Scope:** Critical Systems (`HeroSystem`, `HUDController`, `AssetLoader`)

## Executive Summary

The codebase has improved since v1, notably with `AssetLoader` delegating its static registry to `AssetManifest`. However, significant "Clean Code" violations persist in `HeroSystem` (Coupling) and `HUDController` (Logic/View mixing).

## 1. Static Analysis & Code Quality

### 🚨 Critical Violations (Must Fix)

| File | Issue | Principle Violated | Recommendation |
|------|-------|--------------------|----------------|
| `HeroSystem.ts` | Direct coupling to `VFXController` | **Decoupling** | Emit `HERO_MOVED` or `HERO_STEP` events. Let a `HeroVisuals` system listen and play effects. |
| `HUDController.ts` | Manual DOM creation in logic method | **SRP / Separation of Concerns** | Move DOM generation to `UIBinder` or a specific View class. Controller should only update data. |
| `HUDController.ts` | Usage of `any` for `inventory` | **Type Safety** | Define `Inventory` interface or use `Partial<Record<string, number>>`. |
| `AssetLoader.ts` | `_constructPathFromId` is a 140-line `if/else` block | **Open/Closed Principle** | Refactor into a configuration map or Strategy pattern to allow adding paths without modifying code. |

### ⚠️ Magic Numbers (Move to `GameConstants.ts`)

| Location | Value | Context | Suggested Constant |
|----------|-------|---------|--------------------|
| `HeroSystem.ts:202` | `2000` | Respawn delay | `GameConstants.Hero.RESPAWN_DELAY_MS` |
| `HeroSystem.ts:117` | `100` | Stamina emit throttle | `GameConstants.Hero.STAMINA_EMIT_THROTTLE` |
| `HUDController.ts:17` | `5` | Resolve per pip | `GameConstants.UI.RESOLVE_PER_PIP` |
| `HUDController.ts:102` | `900` | Animation timeout | `GameConstants.UI.ANIMATION_SHATTER_MS` |
| `AssetLoader.ts:24` | `250` | White threshold | `GameConstants.Rendering.WHITE_BG_THRESHOLD` |

## 2. Deep Dive

### HeroSystem.ts
- **Status:** Functional but impure.
- **Problem:** `updateVFX` (Line 264) contains specific logic for "Dust" particles. This is visual polish polluting core gameplay logic.
- **Fix:** Remove `updateVFX`. Add `HeroVisualsSystem` that listens to `HERO_MOVE` (or checks hero state) and handles particles.

### HUDController.ts
- **Status:** Fragile.
- **Problem:** `document.getElementById` and `document.createElement` are used directly. If the HTML structure changes (e.g., renaming `resolve-fill`), this code breaks silently.
- **Fix:** `UIBinder` is present but underused. Extend `UIBinder` to handle element creation or use a simple templating function.

### AssetLoader.ts
- **Status:** Improved but complex.
- **Problem:** `_constructPathFromId` is a maintenance bottleneck. Adding a new entity type requires modifying this massive function.
- **Fix:** Use a pattern config object:
  ```typescript
  const PATH_PATTERNS = {
      'enemy_herbivore_': 'images/enemies/{val}_original.png',
      'weapon_melee_': 'images/equipment/weapons/{subtype}/weapon_{subtype}_{tier}_{variant}_original.png',
      // ...
  };
  ```

## 3. Action Plan

1.  **Refactor Constants:** Move identified magic numbers to `GameConstants.ts`.
2.  **Decouple Hero:** Extract VFX logic from `HeroSystem`.
3.  **Harden UI:** Replace `any` in `HUDController` and improve DOM extraction.
