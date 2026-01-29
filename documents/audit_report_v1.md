# System Audit Report v1
Date: 2026-01-28

## Executive Summary
The codebase follows a pragmatic defined architecture. The ECS implementation is "Hybrid" — Systems manage logic, entities are data containers, but there is some direct coupling for pragmatism (e.g., `HeroSystem` calling `VFXController` directly). This is acceptable for the current scale but should be monitored.

**Key Strength:** Zero allocations detected in hot loops (`update`/`render`).
**Key Weakness:** UI Logic (`HUDController`) relies heavily on fragile DOM ID lookups (`document.getElementById`) which may break if HTML structure changes.

## Static Analysis Results

| Check | Status | Issues |
|-------|--------|--------|
| **Allocations in loops** | ✅ Pass | 0 detected in core systems. |
| **Coupling violations** | ⚠️ Warn | `HeroSystem` → `VFXController` (Direct dependency, should use Events). |
| **Magic Numbers** | ⚠️ Warn | `WeatherSystem.ts:66` (timer logic), `SpawnManager.ts:174` (layout offsets). |
| **Asset Validation** | ⚠️ Warn | `AssetLoader` relies on large static registry. |

## Module Scorecard

| Module | Grade | Severity | Notes |
|--------|-------|----------|-------|
| `HeroSystem` | A- | LOW | Good separation of Combat Service. Minor VFX coupling. |
| `GameState` | A | NONE | Clean centralized store. |
| `HUDController` | B | MEDIUM | Brittle DOM coupling (`getElementById`). Logic mixed with view. |
| `AssetLoader` | B- | MEDIUM | Large manual registry is a maintenance risk. |
| `SpawnManager` | B | LOW | Magic numbers for layout offsets. |

## Detailed Analysis

### 1. `HeroSystem.ts`
*   **Strengths:** Uses `HeroCombatService` to offload complex combat logic. Uses `EventBus` for state changes (`HERO_STAMINA_CHANGE`).
*   **Issues:**
    *   `updateVFX` method (Line 264) contains specific particle logic (`_dustConfig`). This belongs in a `HeroVisuals` system or metadata.
    *   Directly calls `VFXController`.

### 2. `HUDController.ts`
*   **Strengths:** Reactively updates UI based on `EventBus`.
*   **Issues:**
    *   Hardcoded DOM IDs (`resolve-pips-container`, `health-bar`). If `index.html` changes, this breaks silently.
    *   `updateStamina` (Line 44) contains complex DOM construction logic (creating divs). This should be a template or utility.

### 3. `AssetLoader.ts`
*   **Strengths:** Robust fallback chain (Clean -> Original -> Placeholder).
*   **Issues:**
    *   Lines 52-164 contains a massive hardcoded list of assets. This will grow indefinitely.
    *   **Recommendation:** Move to a JSON manifest or auto-discovery script if possible.

## Recommendations (Prioritized)

1.  **[LOW] Refactor Magic Numbers:** Move `WeatherSystem` and `SpawnManager` layout numbers to `GameConstants.ts`.
2.  **[MEDIUM] UI Resilience:** Create a `DOMCache` or `UIBinder` helper to fail fast if IDs are missing, rather than silent failures in `HUDController`.
3.  **[LOW] Asset Registry:** Flatten `staticAssets` into a separate `data/AssetManifest.json` to keep logic clean.
