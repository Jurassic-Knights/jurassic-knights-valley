# Section B2: Architecture Adherence — Full Audit Plan

**Purpose:** Assignable agent task for a full audit of ECS / EventBus / data-driven adherence across all systems and components. This document defines scope, method, and deliverables.

**Reference:** Project Audit Plan (Section B2); Master Architecture Principles in `.cursor/skills/coding-guide/SKILL.md` and `.cursor/rules/00-core.mdc`.

---

## 1. Scope

- **Systems:** Every module under `src/systems/` (including `spawners/`) that implements `ISystem` or is invoked by the game loop or other systems.
- **Components:** Every module under `src/components/`.
- **Cross-cutting:** Any gameplay or UI code that calls systems via `Registry.get()` or `game.getSystem()` instead of emitting/handling events.

---

## 2. Audit Dimensions

### 2.1 EventBus vs direct system calls

- **Rule:** Systems must not call other systems’ methods directly. Communication should be via `EventBus.emit` / `EventBus.on`.
- **Method:**
  - Grep for `getSystem(`, `Registry.get(` in `src/systems/`, `src/gameplay/`, `src/ui/`, `src/rendering/`. For each call, determine whether it is:
    - **Bootstrap/init only** (acceptable: e.g. getting a service once at init).
    - **Per-frame or per-action** (candidate for event-driven refactor).
  - List every direct call from one system to another (e.g. `HeroSystem` → `CollisionSystem`, spawners → `IslandManager`, `HeroCombatService` → `VFXController`). For each, note:
    - Caller, callee, method called, and where (file:line).
    - Suggested event name and payload if refactored to EventBus.
- **Deliverable:** Table or list: Location, Caller → Callee, Method, Suggested event (or “OK if init-only”).

### 2.2 Data-driven design (no magic numbers / config in code)

- **Rule:** Tunable values (spawn rates, timings, distances, health/damage defaults, etc.) must live in `GameConstants`, `getConfig()`, or entity/config modules, not as literals in systems.
- **Method:**
  - For each system and spawner, list numeric/string literals that represent:
    - Timings (ms, seconds), distances, radii, counts, rates, health/damage defaults, UI offsets.
  - Check whether each has a corresponding key in `src/data/GameConstants.ts` or `getConfig()`. If not, flag as “should be in config” with suggested key path.
- **Deliverable:** Per-file list of magic values with line reference and recommended config key (or “OK” if already in config).

### 2.3 Components: data-only

- **Rule:** Components are data containers; they must not contain business logic (no methods that perform game logic, only simple accessors if any).
- **Method:**
  - For each file in `src/components/`, list:
    - All methods (including from base `Component`).
    - For each method: does it only read/write component state, or does it emit events, call other systems, or implement game rules? Flag any that implement logic.
  - Note: Emitting events from a component (e.g. `HealthComponent.takeDamage` emitting `ENTITY_HEALTH_CHANGE`) is a gray area; document and classify as “component holds logic” for the audit.
- **Deliverable:** Per-component table: Component, Method, Classification (data-only / logic), Recommendation (e.g. move logic to DamageSystem or HealthSystem).

---

## 3. Execution order

1. **EventBus vs direct calls** — Grep and code read; produce the cross-system call list and event suggestions.
2. **Data-driven** — Scan systems and spawners for literals; map to config or recommend new keys.
3. **Components** — Read each component; classify methods and recommend moves if needed.

---

## 4. Deliverable

- **Single document:** `docs/audit_report_b2_architecture_full_YYYY-MM.md` (or append to a shared audit doc as “B2 Full Audit”).
- **Contents:**
  - Summary (high-level observations, counts of violations by category).
  - 2.1 EventBus/direct-calls findings (table or list).
  - 2.2 Data-driven findings (per-file magic numbers and config recommendations).
  - 2.3 Component logic findings (per-component method classification and recommendations).
- **Severity:** Classify each finding as Critical / High / Medium / Low using the rubric in `.cursor/skills/coding-guide/SKILL.md` (e.g. direct system coupling = Medium/High; component with core logic = High; magic number in one place = Low).

---

## 5. Out of scope for B2

- TypeScript strictness (B1).
- Performance and object pooling (B3).
- Error handling in `main.ts` / `Game.ts` (B7).
- README / docs wording (B5).
