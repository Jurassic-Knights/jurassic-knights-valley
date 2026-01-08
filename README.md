# Jurassic Knights: Valley

A 2D video game for mobile and 16:9 PC formats, built with a modular multi-agent architecture.

## Quick Start

1. Open `index.html` in a browser
2. For development, use a local server: `npx serve .`

## Project Structure

- `.agent/` - Agent coordination (prompts, workflows, locks)
- `assets/` - Game assets with ID-based registry
- `lore/` - World-building and style guides
- `src/` - Source code (modular by domain)
- `css/` - Stylesheets

## Agent Roles

| Role | Domain |
|------|--------|
| Director | Full project oversight |
| UI Artist | `src/ui/`, `css/`, `index.html` |
| SFX Engineer | `src/audio/`, `assets/audio/` |
| Lore Writer | `lore/`, narrative metadata |
| VFX Specialist | `src/vfx/`, `css/vfx.css` |
| Image Artist | `assets/images/` |
| Gameplay Designer | `src/gameplay/`, balance data |

## File Locking

Before editing, check `.agent/locks/active_locks.json` and follow `.agent/workflows/file-locking.md`.
