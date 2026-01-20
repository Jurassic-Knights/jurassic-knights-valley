# Contributing to Jurassic Knights: Valley

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
Use path aliases for cleaner imports:
```javascript
import { Logger } from '@core/Logger.js';
import { HeroSystem } from '@systems/HeroSystem.js';
```

### Code Style
- ESLint + Prettier configured
- 4 spaces indentation
- Single quotes
- Trailing commas: none

### Git Workflow
1. Create feature branch from `main`
2. Make changes
3. Run `npm run lint` and `npm run test`
4. Commit with descriptive message
5. Push and create PR

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
3. **Data-Driven**: Config in `GameConstants.js`
4. **No Magic Numbers**: All values in config files
