# Commit Conventions

This project uses [Conventional Commits](https://www.conventionalcommits.org/).

## Format

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

## Types

| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | Formatting, no code change |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `perf` | Performance improvement |
| `test` | Adding tests |
| `chore` | Build process, dependencies, etc. |

## Examples

```
feat(combat): add critical hit system
fix(loot): enemies now drop correct items
docs: update README with build instructions
refactor(spawner): extract loot logic to helper
chore: update vite to v5.1.0
```

## Scopes (optional)

Use the system/area affected:
- `combat`, `loot`, `spawn`, `ui`, `audio`, `build`, `config`, `enemy`, `hero`, `resource`

## Breaking Changes

Add `!` after type or `BREAKING CHANGE:` in footer:
```
feat(save)!: change save format to JSON

BREAKING CHANGE: Old save files are incompatible.
```
