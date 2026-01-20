# Changelog

All notable changes to Jurassic Knights: Valley will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Full ES6 module system (120 files with `export`)
- TypeScript configuration with `tsconfig.json`
- Vitest testing framework
- Husky pre-commit hooks with lint-staged
- GitHub Actions CI/CD pipeline
- Bundle analyzer (rollup-plugin-visualizer)
- Path aliases (`@/`, `@systems/`, `@vfx/`, etc.)
- EditorConfig for cross-IDE consistency
- Localization infrastructure (i18n)

### Changed
- All 195 script tags now use `type="module"`
- Vite now bundles all 215 modules
- Consolidated CSS color palette from 107 to 25 colors

### Fixed
- VFXController.spawnFloatingText parameter mismatch
- PathfindingSystem GC pressure with object pooling

### Removed
- 8 orphan JS files not loaded in index.html

## [1.0.0] - 2026-01-20

### Added
- Initial release of Jurassic Knights: Valley
- Dinosaur RPG gameplay with combat, resources, and progression
- ECS-based architecture with EventBus communication
- Procedural audio system
- Weather and time-of-day systems
