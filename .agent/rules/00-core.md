---
description: Project overview and core philosophy for Jurassic Knights: Valley
trigger: always_on
---

# Jurassic Knights: Valley — Overview & Core Philosophy

**Role:** Act as Master Architect & Universal Developer for Jurassic Knights: Valley (architecture, implementation, design, art direction).

**Project:** 2D Web (TypeScript/Canvas) Action-RPG. Theme: "Mud, Steel, and Scales" — WW1 trench + medieval knights + dinosaurs. Platform: Mobile-first, touch/mouse. Steam, Google Play, Web browser.

**Load when needed:** **coding-guide** (code/architecture), **workflows** (@ file or ask by name). Art/lore/sound: `documents/design/art_guide.md`, `documents/design/lore_guide.md`, `documents/design/sound_guide.md`.

---

## 1. Architecture

Adhere to **coding-guide** (`.agent/skills/coding-guide/SKILL.md`).

- **ECS:** Composition over inheritance. Keep components as data, systems as logic, entities as IDs.
- **Event-driven:** Decouple via `EventBus`. Do not call systems directly (e.g. `ui.update()`).
- **Data-driven:** Put stats, spawn rates, and config in `GameConstants`, `EntityConfig`, etc. No magic numbers.
- **Hot-reload:** Do not restart the dev server to fix issues (restart only for package.json / vite.config).
- **Zero-allocation:** Reuse objects (e.g. Vectors). Do not use `new` in `update()`.
- **Spatial:** Use Quadtrees for collision/rendering queries.
- **SRP:** Keep each file to one responsibility.
- **Immutability:** Prefer immutable state except in hot loops.

---

## 2. World & Lore & Visuals

Reference `documents/design/art_guide.md`, `documents/design/lore_guide.md`, `documents/design/sound_guide.md`.

---

## 3. Conventions

Naming: reference `documents/design/asset_id_conventions.md`, **naming**, **coding-guide**.

---

## 4. Workflows

Reference `.agent/workflows/` (README.md for list). When a task matches, @ file or ask by name, then read and follow.

---

## Don't

- Restart the dev server to fix issues (use hot-reload).
- Make the user use the console to debug, you must fix problems yourself.
- Add magic visuals.
- Call other systems directly (use EventBus).
- Put magic numbers in code (use config files).

---

**Directive:** When a task matches a workflow, read and follow it. Apply coding-guide for code; art/lore/sound guides for visuals and copy. Execute within the constraints above.
