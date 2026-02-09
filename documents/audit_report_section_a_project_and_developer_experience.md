# Project Audit Report: Section A - Project & Developer Experience

**Date:** 2026-02-09  
**Scope:** Project documentation, developer workflows, CI/CD, testing infrastructure  
**Status:** Standalone section (Section B: Codebase & Practices handled separately)

---

## Executive Summary

This audit examines the project's developer-facing documentation, workflows, and infrastructure. Key findings include documentation inconsistencies between README and actual stack, fragmented documentation locations, missing CI typecheck step, and minimal test coverage. Recommendations focus on consolidation, accuracy, and establishing quality gates.

---

## A1. Documentation Inconsistencies

### A1.1 README vs Actual Stack

**Finding:** README.md states "Rendering: HTML5 Canvas 2D" but package.json includes `pixi.js` dependency.

**Details:**
- **README.md** (line 46): Lists "HTML5 Canvas 2D" as rendering technology
- **package.json** (line 50): Includes `"pixi.js": "^8.15.0"` as dependency
- **Reality:** Main game uses Canvas 2D (`CanvasRenderingContext2D`), but Pixi.js is used in the map editor tool (`src/tools/map-editor/`)

**Recommendation:**
- Update README.md Tech Stack table to clarify:
  - Main game: HTML5 Canvas 2D
  - Map Editor Tool: Pixi.js
- Or add a note: "Pixi.js used for map editor tooling only"

**Files Affected:**
- `README.md` (line 46)

---

### A1.2 Outdated Rule References

**Finding:** README.md references `.agent/rules/coding-guide.md` but rules now live in `.cursor/rules/`.

**Details:**
- **README.md** (line 163): References `.agent/rules/coding-guide.md`
- **Actual location:** `.cursor/rules/coding-guide.mdc` (and other `.mdc` files)

**Recommendation:**
- Update README.md line 163 to: `.cursor/rules/coding-guide.mdc`
- Verify all references to `.agent/rules/` are updated to `.cursor/rules/`

**Files Affected:**
- `README.md` (line 163)

---

### A1.3 CONTRIBUTING.md TypeScript References

**Finding:** CONTRIBUTING.md uses `.js` file extensions and references non-existent paths.

**Details:**
- **CONTRIBUTING.md** (line 35): Example import shows `@core/Logger.js` (should be `.ts` or no extension)
- **CONTRIBUTING.md** (line 65): References `GameConstants.js` (should be `GameConstants.ts`)
- **Reality:** Project uses TypeScript with ES modules (no `.js` extensions needed in imports)

**Recommendation:**
- Update CONTRIBUTING.md line 35: Change `@core/Logger.js` to `@core/Logger` (or `@core/Logger.ts` if explicit extension preferred)
- Update CONTRIBUTING.md line 65: Change `GameConstants.js` to `GameConstants.ts`
- Verify import examples match actual project patterns (check `src/` for import style)

**Files Affected:**
- `CONTRIBUTING.md` (lines 35, 65)

---

### A1.4 ARCHITECTURE.md File Extensions

**Finding:** ARCHITECTURE.md uses `.js` filenames throughout but project uses `.ts`.

**Details:**
- **docs/ARCHITECTURE.md** (lines 17-21, 29-31, 38-42, 93-98): All examples use `.js` extensions
- **Reality:** All source files are `.ts` (TypeScript)

**Recommendation:**
- Update all file references in ARCHITECTURE.md from `.js` to `.ts`:
  - `Registry.js` → `Registry.ts`
  - `EntityManager.js` → `EntityManager.ts`
  - `AssetLoader.js` → `AssetLoader.ts`
  - `EventBus.js` → `EventBus.ts`
  - `Game.js` → `Game.ts`
  - `*System.js` → `*System.ts`
  - `*Renderer.js` → `*Renderer.ts`
  - `*Controller.js` → `*Controller.ts`
  - `*Config.js` → `*Config.ts`
  - `*Manager.js` → `*Manager.ts`
- Update entity examples (lines 76-78) to reflect actual structure (entities are TypeScript modules, not JSON)

**Files Affected:**
- `docs/ARCHITECTURE.md` (multiple lines)

---

## A2. Documentation Layout (docs/ vs documents/)

### A2.1 Split Documentation Locations

**Finding:** Design documentation is split between `docs/design/` and `documents/design/`, causing broken references in workflows.

**Details:**
- **Canonical location:** `docs/design/` contains:
  - `style_guide.md`
  - `technical_guidelines.md`
  - `asset_prompts.md`
  - `master_principles.md`
  - Other design documents
- **Alternative location:** `documents/design/` contains:
  - `zone_definitions.md`
- **Workflow references:** Multiple workflows reference `documents/` paths that don't exist:
  - `.agent/workflows/asset-creation.md` (lines 11-13): References `documents/style_guide.md`, `documents/technical_guidelines.md`, `documents/asset_prompts.md`
  - `.agent/workflows/feature.md` (lines 22, 24): References `documents/style_guide.md`, `documents/technical_guidelines.md`
  - `.agent/workflows/design-audit.md` (lines 12-14): References `documents/gdd/MASTER_GDD.md`, `documents/world_lore.md`, `documents/style_guide.md`
  - `.agent/workflows/gemini-review.md` (line 26): References `documents/technical_guidelines.md`
- **System-audit workflow:** Correctly references `docs/design/master_principles.md` and `docs/design/technical_guidelines.md` (line 9)

**Recommendation:**
- **Consolidate to `documents/` folder** (per user preference):
  1. Move all files from `docs/design/` to `documents/design/`
  2. Move `docs/ARCHITECTURE.md` to `documents/ARCHITECTURE.md` (or create `documents/technical/ARCHITECTURE.md`)
  3. Update all workflow references to use `documents/` paths
  4. Consider organizing `documents/` subfolders:
     - `documents/design/` - Art direction, style guides, GDD
     - `documents/technical/` - Architecture, technical guidelines
     - `documents/audits/` - Audit reports (already exists)
- **Alternative (if keeping split):** Document the split clearly:
  - `docs/` = Technical/architecture documentation
  - `documents/` = Design/creative documentation + audit reports
  - Update all workflows to use correct paths

**Files Affected:**
- Move: `docs/design/*` → `documents/design/`
- Update: `.agent/workflows/asset-creation.md`
- Update: `.agent/workflows/feature.md`
- Update: `.agent/workflows/design-audit.md`
- Update: `.agent/workflows/gemini-review.md`
- Update: `.agent/workflows/system-audit.md` (if consolidating)

---

## A3. CI and Quality Gates

### A3.1 Missing Typecheck Step

**Finding:** CI workflow does not run TypeScript typecheck, allowing type errors to slip into main branch.

**Details:**
- **`.github/workflows/ci.yml`** (lines 26-36): Runs lint, format check, tests, and build
- **Missing:** `npm run typecheck` step
- **package.json** (line 17): Defines `"typecheck": "tsc --noEmit"` script
- **Risk:** TypeScript compilation errors can be committed without CI catching them

**Recommendation:**
- Add typecheck step to CI workflow after dependency installation:
  ```yaml
  - name: Run TypeScript typecheck
    run: npm run typecheck
  ```
- Place before or alongside lint step (typecheck failures should block merge)
- Consider adding typecheck to pre-commit hooks (see A4)

**Files Affected:**
- `.github/workflows/ci.yml` (add step after line 24)

---

## A4. Pre-commit and Scripts

### A4.1 lint-staged Configuration

**Finding:** lint-staged runs ESLint and Prettier but does not include typecheck.

**Details:**
- **package.json** (lines 21-28): lint-staged config runs ESLint and Prettier on `*.{js,ts}` files
- **Consideration:** Typecheck can be slow on large codebases, but catching type errors early is valuable

**Recommendation:**
- **Option A (Recommended):** Keep typecheck in CI only (faster commits, CI catches type errors)
- **Option B:** Add typecheck to lint-staged for critical files only:
  ```json
  "lint-staged": {
    "*.{js,ts}": [
      "eslint --fix",
      "prettier --write"
    ],
    "src/core/**/*.ts": [
      "npm run typecheck -- --noEmit"
    ]
  }
  ```
- Document the decision in CONTRIBUTING.md

**Files Affected:**
- `package.json` (optional update to lint-staged)
- `CONTRIBUTING.md` (document decision)

---

## A5. Entry Point and Assets

### A5.1 Multiple CSS Files in index.html

**Finding:** index.html loads 25+ individual CSS files via separate `<link>` tags.

**Details:**
- **index.html** (lines 11-35): 25 individual `<link rel="stylesheet">` entries
- **Impact:** Increases HTTP requests (though HTTP/2 mitigates this)
- **Current state:** Acceptable but not optimal for production

**Recommendation:**
- **Short-term:** Document current approach as acceptable for development
- **Future optimization:** Consider CSS bundling for production:
  - Vite can bundle CSS automatically in production builds
  - Or create a single `styles.css` import that imports all component CSS files
  - Keep separate files for development (easier debugging)
- **Note:** This is a low-priority optimization; current approach works fine

**Files Affected:**
- `index.html` (no immediate changes needed)
- Consider: `vite.config.ts` for CSS bundling configuration

---

### A5.2 External Script Dependency (html2canvas)

**Finding:** html2canvas is loaded from CDN without version pinning.

**Details:**
- **index.html** (line 38): `<script type="module" src="https://html2canvas.hertzen.com/dist/html2canvas.min.js"></script>`
- **Risk:** CDN version may change, breaking functionality
- **Use case:** Likely used for UI capture/debugging features

**Recommendation:**
- **Option A:** Pin version in CDN URL: `https://html2canvas.hertzen.com/dist/html2canvas@1.0.0.min.js` (check latest version)
- **Option B:** Install via npm and bundle: `npm install html2canvas`, import in code
- **Option C:** Document the dependency and version in README.md dependencies section
- **Best practice:** Prefer npm installation for reproducibility

**Files Affected:**
- `index.html` (line 38)
- `package.json` (if moving to npm)
- `README.md` (document dependency)

---

## A6. Test Coverage and Location

### A6.1 Current Test Coverage

**Finding:** Only 3 test files exist, covering core utilities only.

**Details:**
- **Existing tests:**
  - `tests/core/EventBus.test.ts` - EventBus pub/sub system
  - `tests/core/Logger.test.ts` - Logging utility
  - `tests/core/Quadtree.test.ts` - Spatial partitioning
- **Coverage:** ~3% of codebase (estimated)
- **Missing:** No tests for systems, gameplay, UI, or integration flows

**Recommendation:**
- Document current state and establish testing priorities

---

### A6.2 Test Coverage Gaps Analysis

**Critical Gaps:**

1. **Core Systems (High Priority)**
   - `src/core/Game.ts` - Main game loop (critical path)
   - `src/core/EntityManager.ts` - Entity lifecycle management
   - `src/core/Registry.ts` - Dependency injection system
   - `src/core/AssetLoader.ts` - Asset loading and caching

2. **Game Systems (High Priority)**
   - `src/systems/CombatController.ts` - Combat logic
   - `src/systems/HeroSystem.ts` - Player movement/state
   - `src/systems/EnemySystem.ts` - Enemy AI/behavior
   - `src/systems/PathfindingSystem.ts` - Pathfinding algorithm
   - `src/systems/CollisionSystem.ts` - Collision detection

3. **Gameplay Entities (Medium Priority)**
   - `src/gameplay/Hero.ts` - Player entity
   - `src/gameplay/Enemy.ts` - Enemy entities
   - `src/gameplay/Dinosaur.ts` - Dinosaur entities
   - `src/gameplay/Merchant.ts` - Merchant interactions

4. **UI Systems (Medium Priority)**
   - `src/ui/UIManager.ts` - UI state management
   - `src/ui/InventoryUI.ts` - Inventory system
   - `src/ui/MerchantUI.ts` - Merchant interface

5. **Integration Tests (Low Priority, High Value)**
   - End-to-end gameplay flow (spawn → combat → loot → inventory)
   - EventBus integration (system communication)
   - Asset loading pipeline

**Recommendation:**
- **Phase 1 (Immediate):** Add tests for critical paths:
  - `Game.ts` initialization and game loop
  - `EventBus` (already exists, verify coverage)
  - `EntityManager` basic CRUD operations
- **Phase 2 (Short-term):** Add system tests:
  - `CombatController` - Damage calculation, hit detection
  - `HeroSystem` - Movement, state transitions
  - `PathfindingSystem` - Path calculation correctness
- **Phase 3 (Medium-term):** Add integration tests:
  - Combat flow (spawn enemy → attack → death → loot drop)
  - Inventory management (pickup → store → use)
- **Documentation:** Add testing guidelines to CONTRIBUTING.md:
  - Test file naming: `*.test.ts` alongside source files or in `tests/`
  - Test structure: Use Vitest `describe`/`it` blocks
  - Coverage goals: Aim for 60%+ on critical systems

**Files Affected:**
- Create: `tests/core/Game.test.ts`
- Create: `tests/core/EntityManager.test.ts`
- Create: `tests/systems/CombatController.test.ts`
- Create: `tests/systems/HeroSystem.test.ts`
- Update: `CONTRIBUTING.md` (add testing section)

---

## Summary of Recommendations

### Immediate Actions (Before Next Release)
1. ✅ Update README.md to clarify Canvas 2D vs Pixi.js usage
2. ✅ Fix outdated rule reference in README.md (`.agent/rules/` → `.cursor/rules/`)
3. ✅ Update CONTRIBUTING.md TypeScript examples (`.js` → `.ts` or no extension)
4. ✅ Add typecheck step to CI workflow
5. ✅ Consolidate documentation to `documents/` folder and update workflow references

### Short-term Improvements (Next Sprint)
1. Update ARCHITECTURE.md file extensions (`.js` → `.ts`)
2. Document html2canvas dependency in README.md
3. Add tests for critical systems (Game, EntityManager, CombatController)

### Long-term Optimizations (Backlog)
1. Consider CSS bundling for production builds
2. Move html2canvas to npm dependency
3. Expand test coverage to 60%+ on critical paths
4. Add integration tests for core gameplay flows

---

## Files Requiring Updates

| File | Lines | Change Type | Priority |
|------|-------|-------------|----------|
| `README.md` | 46, 163 | Update | High |
| `CONTRIBUTING.md` | 35, 65 | Update | High |
| `docs/ARCHITECTURE.md` | Multiple | Update | Medium |
| `.github/workflows/ci.yml` | After 24 | Add step | High |
| `.agent/workflows/asset-creation.md` | 11-13 | Update paths | High |
| `.agent/workflows/feature.md` | 22, 24 | Update paths | High |
| `.agent/workflows/design-audit.md` | 12-14 | Update paths | High |
| `.agent/workflows/gemini-review.md` | 26 | Update paths | High |
| `index.html` | 38 | Document/update | Low |
| `package.json` | 21-28 | Optional update | Low |

---

**End of Section A**
