---
description: How to conduct a full system audit of the codebase
---

# Full System Audit Workflow

## 1. Preparation
1.  **Identify Scope**: Determine which directories or subsystems need auditing (e.g., `src/systems`, `src/components`, or full `src/`).
2.  **Reference Standards**: Load `documents/master_principles.md` and `documents/technical_guidelines.md` into context.

## 2. Analysis (Deep Read)
*   **CRITICAL**: You must read **ALL** lines of the target files. Do not skim.
*   Check for adherence to `master_principles.md`:
    *   **ECS**: Are logic and data separated?
    *   **Events**: Is coupling avoided?
    *   **Magic Numbers**: Are constants used?
    *   **Performance**: Are there allocs in loops?
    *   **Workflow**: Are types validated? Are assets processed?

## 3. Scoring & Reporting
For each file or module, assign:

### Ratings
*   **Decoupling (1-10)**: How well does it handle SRP and Events?
*   **Performance (1-10)**: Is the update loop clean?
*   **Readability (1-10)**: Is it documented and clear?
*   **Overall Grade (F to A)**

### Severity Scale (Impact)
*   **CRITICAL**: Architecturally broken or blocks features.
*   **HIGH**: Significant technical debt or hardcoding.
*   **MEDIUM**: Modularity or potential performance issue.
*   **LOW**: Polish / nitpick.

## 4. Output Artifact
Create a markdown file (e.g., `audit_report_v[X].md`) with the following structure:

```markdown
# System Audit Report [Version]
Date: [Date]

## Executive Summary
High-level overview of the codebase state.

## Scorecard
| Module | Grade | Severity | Notes |
|--------|-------|----------|-------|
| `HeroSystem` | B | LOW | Minor magic numbers. |

## Detailed Analysis
### [System Name]
*   **Issues**: [List specific line numbers and violations]
*   **Proposal**: [How to fix]
```

## 5. Action Plan
After the audit, convert the **CRITICAL** and **HIGH** items into a prioritized `task.md` or `implementation_plan.md`.

## 6. Completion Metrics (Definition of Done)
To prevent infinite optimization loops, a module or phase is considered **COMPLETE** when:

1.  **The "Green" State**:
    *   **Zero CRITICAL** issues.
    *   **Zero HIGH** severity issues.
    *   All targeted Modules rated **B (7/10)** or higher.

2.  **The "Good Enough" State (Constraint)**:
    *   **Zero CRITICAL** issues.
    *   Remaining issues are only **LOW** (Polish) or **MEDIUM** (Modularity) if refactoring risk is high.
    *   **Max 2 Iterations**: The module has undergone 2 rounds of improvements without significant grade lift.

*If these criteria are met, move to the next Feature/Task instead of polishing further.*
