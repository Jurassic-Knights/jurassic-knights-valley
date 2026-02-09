---
description: How to conduct a performance audit to improve FPS and optimize the game
---

# Performance Audit Workflow

**Goal**: Analyze codebase for performance issues. Report findings ONLY - do NOT fix anything until user approves.

## 1. Scope Definition
1. Identify target directories (default: `src/`)
2. Prioritize: Render loops > Update loops > Init code

## 2. Static Code Analysis

### Phase A: Render Pipeline
Read ALL lines of these files:
- `src/core/GameRenderer.js`
- `src/systems/*Renderer.js`  
- `src/core/VFXController.js`

**Detect:**
- `new` keyword inside render/draw functions
- Missing viewport culling (drawing without bounds check)
- Redundant `save()`/`restore()` calls
- String concatenation in hot paths
- `console.log` in render loops

### Phase B: Update Loops
Read ALL lines of:
- `src/core/Game.js`
- `src/systems/*System.js`

**Detect:**
- O(N²) loops (nested entity iteration)
- Array allocations in update (`[]`, `.map()`, `.filter()`, spread)
- Object allocations (`{}`, `new`)
- DOM queries (`getElementById`, `querySelector`)
- Repeated property lookups (not cached)

### Phase C: Entity/Spatial
Read:
- `src/core/EntityManager.js`
- `src/core/Quadtree.js`

**Detect:**
- Full entity list iteration when Quadtree could be used
- Missing spatial partitioning for proximity/collision

### Phase D: Assets
Read:
- `src/core/AssetLoader.ts`

**Detect:**
- Large image dimensions (>2048px)
- Missing caching
- Synchronous loading patterns

## 3. Severity Classification

| Level | Symbol | Meaning |
|-------|--------|---------|
| CRITICAL | 🔴 | Causes stuttering, GC spikes, freezes |
| HIGH | 🟠 | Significant FPS impact |  
| MEDIUM | 🟡 | Wasted cycles, inefficient |
| LOW | 🟢 | Minor, polish-level |

## 4. Output Artifact

Create `performance_audit.md` in brain folder with:

```markdown
# Performance Audit Report
Date: [Date]

## Executive Summary
[2-3 sentence overview of findings]

## Findings by Severity

### 🔴 CRITICAL
| File | Lines | Issue | Recommended Fix |
|------|-------|-------|-----------------|

### 🟠 HIGH
...

### 🟡 MEDIUM
...

### 🟢 LOW
...

## Prioritized Action Items
1. [Most impactful fix]
2. [Second priority]
...
```

## 5. User Review Gate

**STOP after creating audit report.**

Ask user to review findings before implementing ANY fixes.
User must explicitly approve which items to fix.

## 6. Common Patterns to Find

```javascript
// BAD: Allocation in loop
for (const e of entities) {
    const pos = { x: e.x, y: e.y }; // Creates object every frame
}

// BAD: O(N²)
for (const a of entities) {
    for (const b of entities) { // N² checks
        if (a.collidesWith(b)) ...
    }
}

// BAD: Drawing off-screen
ctx.drawImage(img, x, y); // No bounds check

// BAD: DOM in hot path
const el = document.getElementById('score'); // Query every frame
```

---

## 7. Best Practices Checklist

### Rendering
- [ ] **Viewport culling**: Only draw entities within visible bounds
- [ ] **Batch similar draws**: Group same-texture sprites to reduce state changes
- [ ] **Minimize save/restore**: Only use when transform/style actually changes
- [ ] **Use integer coordinates**: `Math.round(x)` for crisp pixel rendering
- [ ] **Cache expensive calculations**: Shadows, gradients, paths
- [ ] **Dirty rectangles**: Only redraw changed regions (advanced)

### Memory / GC
- [ ] **Object pooling**: Reuse particles, bullets, VFX objects
- [ ] **Pre-allocate arrays**: `new Array(size)` if size is known
- [ ] **Avoid closures in loops**: Create functions outside hot paths
- [ ] **Use primitives**: Numbers instead of wrapper objects
- [ ] **Clear references**: Set to `null` when done (large objects)

### Loops & Iteration
- [ ] **Cache array length**: `const len = arr.length; for (let i = 0; i < len; i++)`
- [ ] **Early exit**: Break/return as soon as condition is met
- [ ] **Avoid `.forEach()`**: Regular `for` loops are faster
- [ ] **Reduce iterations**: Use spatial partitioning (Quadtree/Grid)
- [ ] **Throttle expensive ops**: Don't check collision every frame if not needed

### Canvas Specific
- [ ] **Use `willReadFrequently`**: If calling `getImageData` often
- [ ] **Offscreen canvas**: For complex static elements
- [ ] **Avoid `createPattern` in loops**: Cache patterns
- [ ] **Use `drawImage` regions**: Draw sprite sheet sections, not full images
- [ ] **Disable image smoothing**: `ctx.imageSmoothingEnabled = false` for pixel art

### Architecture
- [ ] **Fixed timestep**: Decouple update rate from render rate
- [ ] **System priority**: Process critical systems first
- [ ] **Lazy initialization**: Don't create until needed
- [ ] **Event debouncing**: Throttle rapid-fire events
- [ ] **Web Workers**: Offload heavy computation (pathfinding, AI)

### Debug-Only Code
- [ ] **Remove console.log**: Or wrap in `if (DEBUG)` checks
- [ ] **Disable debug rendering**: Grid overlays, collision boxes in production
- [ ] **Comment out profiling**: Performance.now() calls add overhead
