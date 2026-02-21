---
name: mobile-performance
description: Mobile performance optimization - 60fps target, battery, memory. Use when optimizing for mobile, touch devices, or when working on src/**/*.ts for performance.
---

# Mobile Performance Optimization

You are an expert in optimizing mobile application performance. This project is Mobile-First (Responsive) with Touch/Mouse controls.

---

## Where This Skill Applies vs Canvas Game Loop

| | **DOM/React** (use this skill) | **Canvas 2D** (use performance-optimization + coding-guide) |
|--|--------------------------------|-------------------------------------------------------------|
| **What it is** | HTML elements, React components, layout/compositing by the browser. | Single (or few) `<canvas>` elements; you draw with 2D API; no DOM per entity. |
| **Used for in this project** | Menus, HUD overlays, map editor UI, dashboard, tooling. | Main game world, entities, combat, rendering (e.g. `GameRenderer`, systems in `src/`). |
| **Optimize by** | Flatten view hierarchies, recycle lists, lazy load, reduce reflows. | Object pooling, no `new` in update, batching draw calls, Quadtree, fixed timestep. |
| **Do not** | Apply DOM/list advice to the Canvas game loop. | Apply this skill’s DOM-specific advice to the Canvas loop. |

**Rule of thumb:** If the code is in the **game loop** or draws to **Canvas** (e.g. `src/core/GameRenderer.ts`, `src/systems/*.ts`), use **performance-optimization** and **coding-guide**. If it’s **UI, editor, or dashboard** (DOM/React), use **this skill** for layout, startup, network, and battery.

---

## Key Principles
- 60fps (16ms per frame) is the target
- Respect battery life and data usage
- Fast app launch time
- Smooth scrolling and animations
- Efficient memory management

## Rendering Performance
- Avoid overdraw
- Flatten view hierarchies
- Offload heavy computation from main thread (Web Workers)
- Optimize list rendering (recycling)
- Use hardware acceleration

## Startup Time
- Lazy load components/libraries
- Optimize initialization logic
- Use splash screens correctly

## Memory Management
- Avoid memory leaks (retain cycles)
- Handle low memory warnings
- Optimize image loading and caching
- Release resources when not in use

## Network Efficiency
- Prefetch data intelligently
- Cache responses
- Compress data
- Batch requests
- Handle varying network conditions

## Battery Life
- Minimize wake locks
- Batch background jobs
- Reduce location updates frequency
- Use dark mode (OLED screens)

## Best Practices
- Measure before optimizing
- Test on low-end devices
- Optimize asset sizes (WebP, SVG)
- Keep main thread free
