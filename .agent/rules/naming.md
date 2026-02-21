---
description: Naming conventions for files, code, entities, and assets. Apply when creating or renaming files, adding entities, adding assets, or writing identifiers (classes, variables, functions, constants).
glob: src/**/*.ts, assets/**/*, documents/design/asset_id_conventions.md
---

# Naming Conventions

## Files

- Use `PascalCase.ts` for classes and TypeScript modules (e.g. `HeroSystem.ts`).
- Use `snake_case` for assets (e.g. `dino_run.png`, `footstep_gravel.ogg`).
- Match project pattern for config/data (e.g. `GameConstants.ts`, `entities/`).

## Code

- Use `PascalCase` for classes, types, interfaces.
- Use `camelCase` for variables, functions, methods.
- Use `UPPER_SNAKE_CASE` for true immutable constants; otherwise `camelCase`.
- Prefix private fields with `_` only if the project already does; otherwise `camelCase`.

## Asset and Entity IDs

- Follow `documents/design/asset_id_conventions.md`; add new patterns there.

## Avoid

- camelCase for class file names (use PascalCase.ts).
- PascalCase for asset file names (use snake_case).
- Inconsistent abbreviations; spell out or document in asset_id_conventions.
