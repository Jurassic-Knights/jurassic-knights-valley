# 🦖 Jurassic Knights: Valley

A 2D open-world dinosaur RPG built with TypeScript and HTML5 Canvas.

**Last Reviewed**: 2026-01-24

## Overview

Top-down action RPG where players explore prehistoric biomes, fight dinosaurs, and upgrade their outpost. Uses an ECS architecture with event-driven systems, procedural audio via Web Audio API, and AI-assisted development workflows.

### Dependencies

- **Build**: Vite 7, TypeScript 5.9, ESLint 9
- **Runtime**: Browser with Canvas 2D + Web Audio API support
- **Optional**: html2canvas (npm) for UI capture/debug; Pixi.js for map editor tool
- **Dev Tools**: Node 20+, npm

## Local Development Setup

### Prerequisites

- Node.js 20+
- npm

### Running Locally

```bash
npm install
npm run dev
# → localhost:5173
```

### Running Tests

```bash
npm run test           # Single run
npm run test:watch     # Watch mode
npm run test:coverage  # With coverage
```

## Tech Stack

| Category | Technology |
|----------|------------|
| Build | Vite 7 |
| Language | TypeScript (ES Modules) |
| Rendering | HTML5 Canvas 2D (main game); Pixi.js (map editor tool only) |
| Audio | Web Audio API (Procedural) |
| Testing | Vitest |
| Linting | ESLint 9 + Prettier |
| Git Hooks | Husky + lint-staged |

## Architecture

**Entity-Component-System (ECS)** with event-driven communication:

```
Registry (DI) ──► Systems (Logic) ──► EventBus (Pub/Sub)
                       │
                       ▼
               EntityManager ◄── Components (Data)
```

### Key Directories

| Path | Purpose |
|------|---------|
| `src/core/` | Engine core (Registry, EventBus, Logger, Game) |
| `src/systems/` | Game systems (Combat, Spawning, AI, Weather) |
| `src/audio/` | Procedural SFX (50 modules, tier-based) |
| `src/entities/` | Data-driven entity definitions (TypeScript modules, ~650 entities) |
| `src/components/` | ECS components (Health, Stats, Combat, AI) |
| `src/rendering/` | Canvas renderers (Hero, Dinosaur, World) |
| `src/vfx/` | Visual effects (Particles, Lighting, Fog) |
| `src/ui/` | UI panels and controllers |
| `src/config/` | Game constants and entity configs |

### Key Files

| File | Purpose |
|------|---------|
| `src/main.ts` | Application entry point |
| `src/core/Game.ts` | Main game loop |
| `src/SystemLoader.ts` | System registration orchestrator |
| `src/audio/SFXLoader.ts` | Procedural audio registration |

## Agent Workflows

This project uses AI-assisted development via `.agent/`:

| Command | Description |
|---------|-------------|
| `/github` | Commit and push to GitHub |
| `/feature` | Create implementation plan for new features |
| `/system-audit` | Full codebase audit |
| `/performance-audit` | FPS optimization audit |
| `/clean` | Process assets through Photoshop |
| `/regenerate` | Regenerate declined/missing assets |

### Skills Available

- `brainstorming` - Creative exploration before implementation
- `clean-code` - Code hygiene standards
- `frontend-design` - UI/UX development
- `software-architecture` - Architecture decisions
- `prompt-engineering` - AI prompt optimization

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server at localhost:5173 |
| `npm run build` | Production build to `dist/` |
| `npm run test` | Run Vitest tests |
| `npm run lint` | ESLint check |
| `npm run lint:fix` | ESLint with auto-fix |
| `npm run format` | Prettier formatting |
| `npm run typecheck` | TypeScript validation |
| `npm run dashboard:build` | Build asset dashboard |

## Runbooks

### Adding a New SFX Module

1. Create `src/audio/SFX_[Category]_T[Tier]_[Num].ts`
2. Import `Logger` from `../core/Logger`
3. Import `ProceduralSFX` from `./ProceduralSFX`
4. Add registration to `src/audio/SFXLoader.ts`

### Adding a New Entity

1. Add entity definition (TypeScript module or JSON as applicable) under `src/entities/[category]/`
2. Register in `src/entities/manifest.ts`
3. Add asset entry to `src/core/AssetLoader.ts`

### Bypassing Pre-Commit Hooks

```bash
git commit --no-verify -m "message"
```
Use sparingly—only when ESLint is failing on TypeScript syntax during migration.

## Troubleshooting

### "Logger is not defined" in SFX files

**Cause**: Missing import in procedural audio modules.  
**Fix**: Add `import { Logger } from '../core/Logger';` at top of file.

### ESLint "Unexpected token" errors

**Cause**: ESLint is parsing `.ts` files as JavaScript.  
**Fix**: Ensure `@typescript-eslint/parser` is configured in `eslint.config.js`.

### Game loads but no visuals

**Cause**: Missing side-effect imports for renderers.  
**Fix**: Check `src/SystemLoader.ts` for renderer registrations.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development guidelines.

Follow the Master Architecture Principles in the **coding-guide** skill (`.cursor/skills/coding-guide/SKILL.md`):
- Composition over Inheritance
- Event-driven communication via EventBus
- Data-driven design (no magic numbers)
- Object pooling (no `new` in update loops)

## License

[MIT License](LICENSE) - © 2026 Jurassic Knights
