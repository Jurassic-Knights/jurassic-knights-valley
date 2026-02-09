# Contributing to Jurassic Knights: Valley

**Last Updated:** 2026-01-25

Thank you for your interest in contributing!

## Development Setup

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Run tests
npm run test

# Lint and format
npm run lint:fix
npm run format
```

## Code Standards

### File Structure
- **Systems**: `src/systems/` - Pure logic, no rendering
- **Components**: `src/components/` - Data containers
- **VFX**: `src/vfx/` - Visual effects
- **UI**: `src/ui/` - User interface

### Import Aliases
Use path aliases for cleaner imports (no file extension):
```typescript
import { Logger } from '@core/Logger';
import { HeroSystem } from '@systems/HeroSystem';
```

### Code Style
- ESLint + Prettier configured
- 4 spaces indentation
- Single quotes
- Trailing commas: none

### Git Workflow
1. Create feature branch from `main`
2. Make changes
3. Run `npm run typecheck`, `npm run lint`, and `npm run test` before committing
4. Commit with descriptive message
5. Push and create PR

**Quality gates:** CI runs typecheck, lint, format check, tests, and build. Typecheck is not in pre-commit (keeps commits fast); CI will catch type errors before merge.

### Commit Messages
Follow conventional commits:
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `refactor:` Code refactoring
- `test:` Add tests
- `chore:` Maintenance

## Architecture Principles

1. **Composition over Inheritance**
2. **Event-Driven**: Use `EventBus` for system communication
3. **Data-Driven**: Config in `GameConstants.ts` (and `src/data/`, `src/config/`)
4. **No Magic Numbers**: All values in config files

## Testing

- **Runner:** Vitest. Tests live under `tests/` (e.g. `tests/core/`, `tests/systems/`).
- **Naming:** `*.test.ts`; mirror source layout (e.g. `tests/core/EventBus.test.ts` for core EventBus).
- **Structure:** Use `describe` / `it`; prefer testing public behavior and integration over internals.
- **Coverage goals:** Aim for 60%+ on critical paths (core, systems, gameplay). Run `npm run test:coverage`.
- **Priorities:** Core (Game, EntityManager, Registry, EventBus), then systems (Combat, Hero, Pathfinding), then integration flows.
