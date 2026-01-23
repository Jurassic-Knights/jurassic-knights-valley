# 🦖 Jurassic Knights: Valley

A 2D open-world dinosaur RPG built with modern JavaScript and HTML5 Canvas.

## 🎮 Features

- **Open World Exploration** - Traverse diverse biomes from lush valleys to dangerous bone fields
- **Dynamic Combat** - Real-time combat with melee and ranged weapons
- **Dinosaur Encounters** - Face off against procedurally spawned prehistoric creatures
- **Day/Night Cycle** - Dynamic time and weather systems
- **Crafting & Progression** - Gather resources, craft gear, and upgrade your outpost
- **Procedural Audio** - Web Audio API-powered sound effects

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm run test

# Build for production
npm run build
```

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| Build | Vite 5 |
| Language | JavaScript (ES6 Modules) + TypeScript configs |
| Rendering | HTML5 Canvas 2D |
| Audio | Web Audio API (Procedural) |
| Testing | Vitest |
| Linting | ESLint 9 + Prettier |
| CI/CD | GitHub Actions |

## 📁 Project Structure

```
jurassic-knights-valley/
├── src/
│   ├── core/           # Engine core (Registry, EventBus, Logger)
│   ├── systems/        # Game systems (Combat, Spawning, AI)
│   ├── entities/       # Entity definitions (JSON-based)
│   ├── components/     # ECS components
│   ├── rendering/      # Renderers (Hero, Dinosaur, World)
│   ├── vfx/            # Visual effects (Particles, Lighting)
│   ├── ui/             # UI components
│   ├── audio/          # Procedural audio system
│   └── config/         # Game configuration
├── assets/             # Images, audio, fonts
├── locales/            # Internationalization
├── tests/              # Unit tests
└── tools/              # Build scripts
```

## 🏗️ Architecture

The game uses an **Entity-Component-System (ECS)** architecture with event-driven communication:

- **Registry** - Dependency injection container
- **EventBus** - Pub/sub system for decoupled communication
- **EntityManager** - Entity lifecycle management
- **Systems** - Pure logic processors (Combat, AI, Spawning)
- **Components** - Data containers (Health, Stats, Inventory)

## 📜 Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server at localhost:5173 |
| `npm run build` | Production build to `dist/` |
| `npm run test` | Run Vitest tests |
| `npm run lint` | ESLint check |
| `npm run format` | Prettier formatting |
| `npm run typecheck` | TypeScript validation |

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development guidelines.

## 📄 License

[MIT License](LICENSE) - © 2026 Jurassic Knights
