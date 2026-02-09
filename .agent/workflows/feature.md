---
description: Feature request workflow - audit codebase and create implementation plan for new features
---

# Feature Request Workflow

When the user describes a new feature, follow this structured process to audit the codebase and create parallelizable work packages for multiple AI agents.

**IMPORTANT:** This workflow is for PLANNING ONLY. Do NOT implement any code. At the end, ask clarifying questions and propose design improvements.

---

## Phase 1: Feature Understanding

1. **Clarify Requirements**
   - Identify the core functionality requested
   - Note any specific constraints or preferences mentioned
   - List any ambiguities that need clarification (save for end)

2. **Load Reference Documents**
   // turbo
   - Review `documents/design/art_guide.md`, `documents/design/lore_guide.md` for art/tone consistency
   // turbo
   - Review `documents/design/technical_guidelines.md` for ID naming and conventions
   // turbo
   - Review `src/core/AssetLoader.ts` for existing registries and asset patterns

---

## Phase 2: Codebase Audit

3. **Identify Affected Systems**
   - Search for existing systems that will interact with the new feature
   - Map dependencies between systems (who calls whom, event subscriptions)
   - Identify components that will need modification vs. new components

4. **Architecture Review**
   - Check adherence to ECS principles (Components = data, Systems = logic)
   - Verify event-driven communication patterns (EventBus usage)
   - Review data-driven design (configs in GameConstants, EntityConfig)
   - Assess spatial partitioning needs (Quadtree/Grid requirements)

5. **Scalability Assessment**
   - Evaluate if the feature can handle 100x scale without rewrite
   - Check for potential O(N²) operations
   - Identify object pooling opportunities
   - Consider batching requirements

6. **Modularity Check**
   - Ensure feature can be enabled/disabled cleanly
   - Verify no tight coupling with unrelated systems
   - Check that feature follows single-responsibility principle

7. **Code Quality Standards**
   
   **No Hardcoded Values:**
   - All magic numbers must go in `GameConstants.ts` or relevant config files
   - Spawn rates, timings, distances, sizes → Config variables
   - Colors, thresholds, multipliers → Named constants
   - *Bad:* `if (health < 50)` → *Good:* `if (health < CONFIG.LOW_HEALTH_THRESHOLD)`
   
   **No Hardcoded Type Checks:**
   - Avoid `if (entity.type === 'velociraptor')` style conditionals
   - Use component flags or config-driven behavior instead
   - *Bad:* `if (dino.type === 't-rex')` → *Good:* `if (dino.config.canRoar)`
   
   **Config-Driven Design:**
   - New entity types defined in `EntityConfig`, not code
   - Balancing values externalized for easy tuning
   - Feature flags for toggling functionality
   
   **ID-Based References:**
   - Use asset IDs, not file paths in game logic
   - Reference entities by ID, not direct object references where possible
   - Follow naming conventions: `snake_case` with category prefix
   
   **Reusable Abstractions:**
   - Extract common patterns into utility functions
   - Create composable components over specialized ones
   - Design for extension without modification (Open/Closed principle)

---

## Phase 3: Work Package Creation

8. **Identify Parallelizable Work Units**
   - Group related systems/files that can be worked on in isolation
   - Ensure each work unit has clear boundaries (no overlapping file edits)
   - Define dependencies between work units (what must complete first)
   - Aim for maximum parallelization while respecting dependencies

9. **Create Feature Requests Folder**
   // turbo
   - Create folder: `feature-requests/[feature-name]/`
   - Each work package becomes its own `.md` file in this folder

10. **Generate Work Package Files**
    
    For each parallelizable work unit, create a file:
    `feature-requests/[feature-name]/[unit-name].md`
    
    Each file MUST contain:
    ```markdown
    ---
    status: pending
    priority: [1-5, where 1 is highest]
    depends_on: [list of other unit filenames that must complete first, or "none"]
    estimated_complexity: [low/medium/high]
    ---
    
    # [Unit Name]
    
    ## Scope
    [What this work unit covers]
    
    ## Files to Modify
    - [List of files this agent will touch]
    
    ## Files to Create
    - [List of new files to create]
    
    ## Implementation Details
    [Specific implementation instructions]
    
    ## Integration Checklist
    **CRITICAL: These steps MUST be completed for the feature to work!**
    
    - [ ] **index.html**: Add `<script>` tags for any new .js files created
    - [ ] **SystemConfig.js**: Register any new systems with `{ global: 'SystemName', priority: N, init: true }`
    - [ ] **Trigger/Entry Point**: Ensure something CALLS the new code (e.g., event listener, game loop, spawn call)
    - [ ] **Verify in Browser**: Open the game and confirm the feature works (no console errors)
    
    ## Acceptance Criteria
    - [ ] [Testable criteria]
    - [ ] All Integration Checklist items completed
    
    ## Notes
    [Any special considerations]
    ```

11. **Status Values for Lock Tracking**
    
    The `status` field in frontmatter tracks work state:
    - `pending` - Not yet started, available for an agent to claim
    - `in-progress` - Currently being worked on by an agent
    - `blocked` - Waiting on dependencies
    - `review` - Implementation complete, needs verification
    - `complete` - Fully done and verified
    
    **Agent Claim Process:**
    When an agent picks up a work package:
    1. Check `status: pending` and all `depends_on` items are `complete`
    2. Change status to `in-progress`
    3. Add `claimed_at: [ISO timestamp]` to frontmatter
    4. Begin work
    5. On completion, change status to `review` or `complete`

12. **Create Index File**
    
    Create `feature-requests/[feature-name]/INDEX.md`:
    ```markdown
    # [Feature Name] - Work Packages
    
    ## Overview
    [Brief description of the feature]
    
    ## Dependency Graph
    [Mermaid diagram showing work unit dependencies]
    
    ## Work Units
    | File | Status | Priority | Depends On | Claimed By |
    |------|--------|----------|------------|------------|
    | unit-a.md | pending | 1 | none | - |
    | unit-b.md | pending | 2 | unit-a | - |
    
    ## Integration Order
    1. [Which units to complete first]
    2. [Integration sequence]
    ```

---

## Phase 4: Review & Proposal

13. **DO NOT IMPLEMENT - Compile Summary**
    
    Present to the user:
    - Total number of work packages created
    - Estimated parallelization (how many agents can work simultaneously)
    - Critical path (longest dependency chain)
    - Any shared resources that need coordination

14. **Ask Clarifying Questions**
    
    List any ambiguities or decisions that need user input:
    - Gameplay behavior questions
    - Edge cases that need definition
    - Priority decisions between approaches

15. **Propose Design Improvements**
    
    Suggest enhancements based on the audit:
    - Better architectural patterns discovered
    - Scalability improvements
    - Game design refinements
    - UX considerations

---

## For Agents Picking Up Work Packages

When starting work on an existing feature request:

// turbo
1. List `feature-requests/` to find available features
// turbo
2. Read the `INDEX.md` for the feature
3. Find a `.md` file where:
   - `status: pending`
   - All items in `depends_on` have `status: complete`
4. Claim it by updating the frontmatter:
   ```yaml
   status: in-progress
   claimed_at: [current ISO timestamp]
   ```
5. Follow the implementation details in the file
6. On completion, update status to `complete`

---

## Audit Rubric Reference

When auditing, grade each affected system on:

| Criterion | Questions to Ask |
|-----------|------------------|
| **Modularity** | Is it decoupled? Can it be swapped out? |
| **Scalability** | Will it work with 100x items/entities? |
| **Performance** | Any allocations in update loops? |
| **Readability** | Is the code self-documenting? |

**Severity Levels:**
- **CRITICAL**: Breaks game or fundamental architecture
- **HIGH**: Significant debt, limits features
- **MEDIUM**: Modularity violation, coupled systems
- **LOW**: Polish, naming conventions
