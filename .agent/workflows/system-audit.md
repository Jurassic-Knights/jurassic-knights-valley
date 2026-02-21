---
description: How to conduct a full system audit of the codebase
---

# Full System Audit Workflow

## 1. Preparation
1. **Identify Scope**: Determine which directories or subsystems need auditing (e.g., `src/systems`, `src/components`, or full `src/`).
2. **Reference Standards**: Load `.cursor/skills/coding-guide/SKILL.md` (or coding-guide skill) and `documents/design/technical_guidelines.md` into context.
3. **Load README**: Read `README.md` for current architecture and patterns.

---

## 2. Automated Static Analysis

### 2.1 Allocation Detection (Performance)
Find `new` keyword inside update/render loops:
```bash
grep -rn "new " src/systems/ --include="*.ts" | grep -E "(update|render|draw)\s*\("
```
**Red flags:** `new Array`, `new Object`, `new Vector`, `new Date` in hot paths.

### 2.2 Asset Validation
With the migration to dynamic TS-based arrays, run a custom Node script to check for orphan images. Example:
```javascript
import fs from 'fs';
// Read AssetManifest.ts and AssetLoader.ts, grep through src/entities/**/*.ts 
// Compare against all files in assets/images/
```

### 2.3 Orphan File Detection
Find TS modules not imported by Vite:
```bash
# Using ts-prune or similar static analysis tool to find dead code
npx ts-prune | grep -v "(used in module)"
```

### 2.4 Coupling Analysis
Find direct class calls that should use EventBus:
```bash
# Bad: Direct system calls
grep -rn "\.update\(" src/ --include="*.ts" | grep -v "this\.update"

# Good: EventBus usage
grep -rn "EventBus.emit\|EventBus.on" src/ --include="*.ts" | wc -l
```

### 2.5 Magic Number Scan
Find hardcoded numbers in logic:
```bash
grep -rn "[^a-zA-Z]\d\{2,\}[^x]" src/ --include="*.ts" | grep -v "0x" | grep -v "//"
```
**Exceptions:** Line numbers, hex colors, common values (0, 1, 100).

### 2.6 Entity TS Validation
Verify all entity TypeScript configurations match interfaces:
```bash
# Verify all entities correctly export default config objects
grep -L "export default" src/entities/**/*.ts
```

---

## 3. Manual Code Review

### 3.1 Architecture Checks
*   **ECS**: Are logic and data separated?
*   **Events**: Is coupling avoided via EventBus?
*   **Magic Numbers**: Are constants in GameConstants.ts?
*   **Performance**: Are there allocations in update loops?

### 3.2 Pattern Compliance
*   **Spawner pattern**: Does spawner pass lootTable to constructor?
*   **Drop pattern**: Does die() use SpawnManager.spawnDrop()?
*   **Asset pattern**: Is asset ID same as entity ID?

---

## 4. Scoring & Reporting

### Ratings
*   **Decoupling (1-10)**: How well does it handle SRP and Events?
*   **Performance (1-10)**: Is the update loop clean?
*   **Readability (1-10)**: Is it documented and clear?
*   **Overall Grade (F to A)**

### Severity Scale
*   **CRITICAL**: Architecturally broken or blocks features.
*   **HIGH**: Significant technical debt or hardcoding.
*   **MEDIUM**: Modularity or potential performance issue.
*   **LOW**: Polish / nitpick.

---

## 5. Output Artifact
Create `audit_report_v[X].md`:

```markdown
# System Audit Report v[X]
Date: [Date]

## Executive Summary
High-level overview of codebase state.

## Static Analysis Results
| Check | Status | Issues |
|-------|--------|--------|
| Allocations in loops | ✅/❌ | [count] |
| Orphan assets | ✅/❌ | [list] |
| Coupling violations | ✅/❌ | [count] |
| Entity JSON validation | ✅/❌ | [missing fields] |

## Module Scorecard
| Module | Grade | Severity | Notes |
|--------|-------|----------|-------|
| `HeroSystem` | B | LOW | Minor magic numbers |

## Detailed Analysis
### [System Name]
*   **Issues**: [List specific line numbers and violations]
*   **Proposal**: [How to fix]
```

---

## 6. Action Plan
Convert **CRITICAL** and **HIGH** items into prioritized `task.md` or `implementation_plan.md`.

---

## 7. Completion Metrics (Definition of Done)

### "Green" State
*   **Zero CRITICAL** issues
*   **Zero HIGH** severity issues
*   All modules rated **B (7/10)** or higher
*   Static analysis passes all checks

### "Good Enough" State
*   **Zero CRITICAL** issues
*   Remaining issues are only **LOW** or **MEDIUM**
*   **Max 2 Iterations**: Module has undergone 2 improvement rounds

*If criteria met, move to next task instead of polishing further.*
