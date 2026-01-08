# Jurassic Knights: Valley - Master Game Design Document
**Version:** 2.0 (Live Codebase Sync)
**Date:** 2026-01-04

## 1. Core Concept

**Jurassic Knights: Valley** is a top-down exploration and management game set in a "Dino-Trench" world. Players control a Commander (Hero) who gathers resources, manages a squad (abstracted context), and rebuilds a base in a hostile, prehistoric environment.

### Key Pillars
*   **No Magic**: Technology is rugged, industrial, and diesel-punk ("Mud, Steel, and Scales").
*   **Tactical Economy**: Gold is scarce; every bullet and bandage must be crafted or bought.
*   **Grid Exploitation**: The world is a 3x3 grid of unlocked islands.

---

## 2. World Structure (System: `IslandManager`)

The game world is a **3x3 Grid** of floating islands connected by **Bridges**.
*   **Home Outpost (0,0)**: The starting safe zone. Contains the Forge and core infrastructure.
*   **Sectors**: 8 unlockable islands surrounding the home base.
*   **Unlocking**: Sectors are locked by default. Players must spend **Gold** at bridge terminals to access them.
    *   *Mechanism*: Walk onto a bridge to trigger the Unlock UI (`UI_UNLOCK_PROMPT`).
    *   *Costs*: Range from **100g** (Quarry Fields) to **500g** (The Ruins).

### Zone Types
1.  **Resource Zones**: Abundant in static nodes (Trees, Scrap Piles).
2.  **Dinosaur Zones**: High danger, high reward (Primal Meat, Fossil Fuel).

---

## 3. Gameplay Loop (System: `HeroSystem` / `ResourceSystem`)

### Movement & Controls
*   **Input**: WASD / Arrow Keys for movement (`InputSystem`).
*   **Physics**: Simple collision with walls, water, and structures (`IslandManager.isWalkable`).

### Gathering (Auto-Interaction)
*   **Mechanic**: Proximity-based gathering.
*   **Process**:
    1.  Hero approaches a resource node (Tree, Rock, Scrap).
    2.  If within range (`DEFAULT_MINING_RANGE: 125`), Hero automatically attacks.
    3.  Resource takes damage (`DEFAULT_DAMAGE: 10`).
    4.  On deplete, Resource drops items (`DroppedItem`) and plays a VFX (`VFXConfig.RESOURCE.RESPAWN`).

### Combat
*   **Mechanic**: Auto-fire when enemies are in range (`DEFAULT_GUN_RANGE: 450`).
*   **Targets**: Dinosaurs (Priority) > Resources.
*   **Visuals**: Muzzle flashes (`VFXConfig.HERO.MUZZLE_FLASH`) and projectile tracers.

---

## 4. Economy & Resources (System: `EconomySystem`)

### Currencies
*   **Gold**: The universal currency. Used for island unlocks and merchant trades.
*   **Resolve**: (Planned) Stamina mechanic for infantry.

### Raw Resources
| Resource | Source | Classification |
| :--- | :--- | :--- |
| **Wood** | Trees (Dead Woods) | Fuel (Tier 1) |
| **Scrap Metal** | Debris (Scrap Yard) | Material (Tier 1) |
| **Iron Ore** | Nodes (Iron Ridge) | Material (Tier 2) |
| **Fossil Fuel** | Mining / Dino Drops | Fuel (Tier 2) |
| **Primal Meat** | Dinosaur Kills | Trade Commodity |

---

## 5. Crafting (System: `CraftingManager`)

The **Battle Forge** allows raw materials to be converted into valuable goods.

### Mechanics
*   **Slots**: Base has **12** production slots. Slot 1 is free; Slots 2-12 cost **1000g** each to unlock.
*   **Fuel Requirement**: Every recipe requires **Wood** or **Fossil Fuel**.
*   **Real-Time**: Crafting takes time (e.g., 20 seconds). Items must be claimed or auto-deposited.
*   **Visuals**: Crafted items visually "pop" out of the forge (`SpawnManager.spawnCraftedItem`).

### Recipe Registry (Live)
| Item | Inputs | Time | Type |
| :--- | :--- | :--- | :--- |
| **Scrap Plate** | 2 Scrap, 1 Wood | 5s | Trade Good (4g) |
| **Iron Ingot** | 2 Iron, 3 Wood | 20s | Trade Good (15g) |
| **Trench Tool** | 3 Iron, 1 Scrap, 5 Wood | 45s | Equipment |

---

## 6. Entities (System: `SpawnManager`)

### Merchants
*   **Spawn**: Appear on unlocked islands (near bridges).
*   **Interaction**: Proximity triggers generic "Trade" button (`INTERACTION_OPPORTUNITY` event).
*   **Function**: Buy upgrades or sell loot (Implementation pending full UI).

### Dinosaurs
*   **Behavior**: Roam within their island bounds (`DinosaurSystem`).
*   **drops**: Configurable per dino type (default: `primal_meat` or `fossil_fuel`).
*   **Combat**: Attacks Hero if close. Plays "Blood Splatter" VFX on hit.

### Props
*   **Decoration**: Foliage and scattered items spawned procedurally (`SpawnManager.spawnProps`).
*   **Logic**: Validated to not spawn on bridges or inside walls.

---

## 7. Visual Effects (System: `VFXController`)

Centralized configuration in `VFXConfig.js`.
*   **Atomic Library**: Reusable parts like 'Glow', 'Ring', 'Spark'.
*   **Sequences**: Complex events like 'Explosions' or 'Unlock Ceremonies'.
*   **Rendering**: Rendered via `GameRenderer` for proper Z-sorting (Foreground/Background).
