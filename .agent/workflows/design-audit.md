---
description: Game design review - analyze gameplay systems, features, and suggest improvements
---

# Design Audit Workflow

A game designer's perspective review of the entire game, focusing on gameplay quality, feature completeness, and improvement opportunities.

## 1. Preparation

1. **Load Design Documents**:
   - `documents/gdd/MASTER_GDD.md` - Core game design
   - `documents/lore/MASTER_LORE.md` - World and narrative
   - `documents/style_guide.md` - Visual direction

2. **Analyze Implementation**:
   - Review key gameplay systems in `src/gameplay/` and `src/systems/`
   - Cross-reference implemented features vs GDD
   - Identify gaps between design intent and current code

3. **Request User Input** (critical):

## 2. Analysis Areas

### Gameplay Loop
- Is the core loop (harvest → craft → upgrade) satisfying?
- Are rewards properly paced?
- What's missing for player motivation?

### Systems Audit
For each major system, evaluate:

| System | Questions |
|--------|-----------|
| **Resource/Crafting** | Is progression clear? Are recipes balanced? |
| **Combat** | Is it engaging? Does difficulty scale? |
| **Economy** | Is gold useful? Are upgrade costs balanced? |
| **Exploration** | Is there reason to explore? Secrets? |
| **UI/UX** | Is feedback immediate? Are controls intuitive? |

### Scalability Review
- Can the system support 10x content without refactoring?
- Is data externalized (JSON configs) or hardcoded?
- Can designers tune values without code changes?

## 3. Output Artifact

Create `design_audit_v[X].md` with:

```markdown
# Design Audit Report [Version]
Date: [Date]

## Current State Summary
Brief description of where the game is at.

## System Health Scores

| System | Health | Status | Notes |
|--------|--------|--------|-------|
| **Core Loop** | 🟢 8/10 | Healthy | Harvest-craft-upgrade working |
| **Combat** | 🟡 6/10 | Needs Work | Auto-aim only, no depth |
| **Economy** | 🟡 5/10 | Needs Work | Gold underutilized |
| **Progression** | 🔴 3/10 | Critical | No endgame, no goals |
| **UI/UX** | 🟢 7/10 | Healthy | Functional, needs polish |
| **Audio** | 🔴 2/10 | Critical | Sparse/missing |
| **Content** | 🟡 5/10 | Needs Work | Limited variety |

**Legend**: 🟢 7-10 Healthy | 🟡 4-6 Needs Work | 🔴 1-3 Critical

## Strengths
What's working well.

## Pain Points
What needs improvement (player-facing issues).

## Feature Recommendations

### Priority 1 (Quick Wins)
- [Feature]: [Why it matters] - [Effort: Low/Med/High]

### Priority 2 (Medium Term)
- ...

### Priority 3 (Backlog)
- ...

## Scalability Concerns
Systems that need refactoring before expansion.

## Recommended Next Steps
Top 3 actionable items.
```

## 4. Action Plan

Convert top recommendations into:
1. `implementation_plan.md` for approved features
2. `task.md` checklist for execution

## 5. Completion Criteria

The audit is complete when:
- All major systems have been reviewed
- At least 3 actionable recommendations per priority tier
- Report reviewed and approved by user