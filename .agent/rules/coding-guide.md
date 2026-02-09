---
trigger: always_on
---

---
trigger: always_on
---

# Master Architecture Principles

**Version:** 1.1  
**Date:** 2026-01-08  
**Goal:** Ensure scalable, maintainable, and verifiable game development.

### Changelog
- **v1.2 (2026-01-24)**: Added **CRITICAL** hot-reload rule - NEVER restart server to fix problems.
- **v1.1 (2026-01-08)**: Added `EntityTypes` constants. All registries now embedded in AssetLoader.ts.
- **v1.0 (2026-01-04)**: Initial principles.

## 0. CRITICAL: Hot-Reload Development
*   **NEVER restart the dev server to fix problems.** All code is hot-reload via Vite HMR.
*   When you edit a file, Vite automatically reloads it. The server only needs restart if package.json or vite.config.ts changes.
*   If something seems broken after a code change, the issue is in the code - do NOT attempt to restart the server.

## 1. Core Architecture (ECS & Composition)
*   **Composition over Inheritance:** Use Components to define *what an entity has* rather than Inheritance to define *what it is*.
*   **Separation of Data and Logic:**
    *   **Components**: Pure data containers (JSON-serializable ideally). No methods (except simple accessors).
    *   **Systems**: Pure logic. Process entities with specific component signatures.
*   **Entities are IDs:** Entities should ideally be just an ID. If wrapping is used, the wrapper must be a thin facade.

## 2. Communication & Events
*   **Event-Driven:** Systems communicate via `EventBus`. Direct coupling between systems must be avoided.
    *   *Bad:* `InventorySystem` calls `UISystem.update()`.
    *   *Good:* `InventorySystem` emits `INVENTORY_CHANGED`. `UISystem` listens.
*   **Single Source of Truth:** Events should carry the new state or the ID of the changed entity. Do not duplicate state in the event if it risks desync.

## 3. Data & Configuration
*   **Data-Driven Design:** All magic numbers, spawn rates, and balancing values must reside in Config files (`GameConstants`, `EntityConfig`).
*   **No Hardcoded Logic:** Avoid `if (dino.type === 't-rex')`. Use `dino.config.behavior` or components.

## 4. Performance & Memory
*   **Object Pooling:** Avoid `new` in the update loop. Reuse objects (Vectors, Particles) or use static primitive buffers.
*   **Spatial Partitioning:** Use Quadtrees/Grids for spatial queries (Rendering, Collision, Proximity). Avoid O(N^2) checks.
*   **Batching:** Group similar operations (e.g., rendering same-texture sprites) to minimize draw calls/context switches.

## 5. Input & Control
*   **Input Abstraction:** `InputSystem` produces *Intent* (e.g., `MOVE_UP`, `ACTION`), not raw keys.
*   **Command Pattern:** Actions should be encapsulated (optional, for replay/undo).

## 6. Rendering
*   **Decoupled Rendering:** `GameRenderer` reads state; it typically does not mutate state.
*   **Interpolation:** Separate `Update` (Fixed Step) from `Render` (Variable Step) using alpha interpolation for smooth movement.

## 7. Code Quality
*   **Single Responsibility:** Classes/Systems should do one thing perfectly.
*   **Immutability:** Prefer immutable operations for math/state where performance allows.
*   **Documentation:** Every System/Component must have a top-level JSDoc explaining its responsibility.

---

## Audit Rubric
Each system will be graded on:
1.  **Modularity**: Is it decoupled?
2.  **Scalability**: Can we add 100x items/units without rewrite?
3.  **Performance**: Are there allocs in the loop?
4.  **Readability**: Is adherence to principles obvious?

**Critical Levels:**
*   **CRITICAL**: Breaks the game or fundamental architecture. Immediate Fix.
*   **HIGH**: Significant debt, limits features (e.g., Hardcoded types).
*   **MEDIUM**: Modularity violation (e.g., Coupled Systems).
*   **LOW**: Polish / nitpick (e.g., Naming convention).

---

# Asset Creation Workflow

All assets use ID-based linking for non-destructive workflows.
All registries are **embedded** in `src/core/AssetLoader.ts`.

## Before Creating an Asset

1. Check `documents/design/art_guide.md` for art direction (`documents/design/lore_guide.md`, `documents/design/sound_guide.md` for copy/audio)
2. Check `documents/design/technical_guidelines.md` for ID naming
3. Check existing registry in `src/core/AssetLoader.ts` to avoid duplicate IDs

## Creating an Image Asset

// turbo
1. Generate/create the image file with white background
2. Save to appropriate folder in `assets/images/` with `_original` suffix
3. Review in Asset Dashboard → Approve → becomes `_approved_original.png`
4. Run Photoshop script → Creates `_clean.png` (transparent, 10px padding)
5. Add entry to `src/core/AssetLoader.ts` in `registries.images.assets`:

```typescript
"asset_id_here": { "path": "images/category/filename_clean.png" }
```

## Creating an Audio Asset

// turbo
1. Create/acquire the audio file
2. Save to appropriate folder in `assets/audio/`
3. Add entry to `src/core/AssetLoader.ts` in `registries.audio.assets`:

```typescript
"sfx_sound_id": { "path": "audio/category/filename.wav", "volume": 0.7 }
```

## ID Naming Rules

- Use `snake_case`
- Prefix with category: `ui_`, `npc_`, `dino_`, `drop_`, `item_`, `world_`, `sfx_`, `bgm_`
- Be descriptive: `ui_btn_primary`, `npc_merchant_home`, `dino_velociraptor_base`
- IDs are permanent - file paths can change