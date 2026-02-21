# Multiplayer Architecture & Multi-Hero Plan (v2)

**Version:** 2.0 (Gemini 3.1 AI Revision)
**Goal:** Evolve the game into a Diablo 4–style multiplayer model (offline solo, online persistent world, party of 4, instanced loot) while strictly adhering to the Master Architecture Principles (ECS, Event-Driven, Data-Driven).

---

## 1. Product Model: Persistent World & Party System

- **Offline Mode:** Single-player. Progress saved locally.
- **Online Mode:** Persistent world. You are the "world owner" of your instance.
- **Party of 4:** Invite friends into your world. They stay in your world and see your unlocked progression zones.
- **Random Players:** Appear only in non-progression zones (e.g., public combat areas). They load out when entering player-specific progression zones (Home Base).
- **Instanced Loot:** Drops and XP are instantiated per player. Server computes loot eligibility based on range; no shared loot stealing.
- **Cross-Platform:** Steam, Google Play, Web all connect to the same dedicated server.

---

## 2. Alignment with Master Architecture Principles

### ECS & Separation of Data/Logic
- **Entities are IDs/Data:** The `Hero` class will be stripped of single-player assumptions. It will act as a component container with a `playerId`.
- **Systems are Logic:** `HeroSystem`, `InteractionSystem`, and `GameRenderer` will process a *collection* of heroes rather than a `game.hero` singleton.

### Event-Driven Communication
- **No Direct System Calls:** Input from any client translates to an `Intent` event (e.g., `INPUT_MOVE_INTENT` with `playerId`).
- **Single Source of Truth:** `EventBus` payloads must carry `entityId` or `playerId`. The server is the ultimate source of truth for these events.

### Data-Driven Design & Performance
- **Zero-Allocation:** Network sync will use ArrayBuffers or pooled objects to prevent garbage collection spikes during high-frequency positional updates.
- **Spatial Partitioning:** The existing Quadtree will be used server-side to cull state updates (only sync what a player can see).

---

## 3. Implementation roadmap

### Phase 1: Engine Readiness (Multi-Hero Local)
**Goal:** Remove all single-player assumptions (`game.hero`) from the codebase. Make state serializable and input player-specific.

1. **Player Identity:**
   - Add `playerId` to `Hero` configuration.
   - Replace `game.hero` with `game.heroes = new Map<string, Hero>()`.
   - Maintain a list of `localPlayerIds` to identify which heroes the local client controls.

2. **Input Routing:**
   - Update `InputSystem` to emit inputs with `playerId`.
   - `HeroSystem` iterates over `game.heroes`, applying inputs only to the hero matching the event's `playerId`.

3. **Rendering & Camera:**
   - `GameRenderer` updates its viewport to follow the centroid of `localPlayerIds` (or just the primary local hero).
   - Render all heroes in `game.heroes`, not just `game.hero`.

4. **Systems Update:**
   - `InteractionSystem`: Loot collection must evaluate against all heroes.
   - `EnemyAI`: Target acquisition must evaluate the closest hero from the `game.heroes` map, not a hardcoded `game.hero`.
   - `HUD/UI`: Bind health, stamina, and inventory UI to the primary `localPlayerId`.

### Phase 2: Network Topology & Authority
**Goal:** Add the network stack. Dedicated Server (Authority) + Dumb Clients.

1. **Dedicated Server:**
   - Node.js WebSocket server running the exact same ECS logic in headless mode.
   - Server holds the true state of `game.heroes` and `entityManager`.
   
2. **Client-Server Loop:**
   - **Client:** Emits `INPUT_MOVE_INTENT` -> Sends via WebSocket to Server. Predicts movement locally.
   - **Server:** Validates input, applies movement, broadcasts `STATE_SYNC` back to all clients.
   - **Client:** Reconciles local state with server state (snapping/interpolating).

3. **Instanced Loot:**
   - Server handles `ENEMY_DIED`. Calculates range to all player IDs.
   - Server emits `GRANT_LOOT` specifically to eligible client connections. Clients render their own drops.

### Phase 3: Split-Screen / Couch Co-op (Optional)
**Goal:** Multiple gamepads controlling multiple local heroes on the same screen.

- Map Gamepad 0 -> `localPlayerId_1`.
- Map Gamepad 1 -> `localPlayerId_2`.
- `GameRenderer` expands viewport to encompass both heroes, or initiates true split-screen.

---

## 4. Phase 1 Implementation Plan

This implementation plan outlines the first set of concrete codebase changes required to begin transitioning the game to a multi-hero, multiplayer-ready state.

### Core Engine
The `Game` singleton needs to manage a collection of heroes instead of just one.
#### [MODIFY] [Game.ts](file:///c:/Users/Anthony/.gemini/antigravity/scratch/jurassic-knights-valley/src/core/Game.ts)
- Add `heroes: Map<string, Hero> = new Map()`.
- Add `localPrimaryHeroId: string | null = null`.
- Keep `get hero()` getter for temporary backwards compatibility while we migrate other systems, returning `this.heroes.get(this.localPrimaryHeroId)`.
- Update `spawnHero()` to accept a `playerId`, generate a unique entity ID (e.g., `hero_${playerId}`), and add it to the map.

#### [MODIFY] [core.d.ts](file:///c:/Users/Anthony/.gemini/antigravity/scratch/jurassic-knights-valley/src/types/core.d.ts)
- Update `IGame` interface to reflect the new `heroes` map and `localPrimaryHeroId`, while keeping the `hero` getter for compatibility.

### Hero & Gameplay
The hero entity must be aware of its identity so inputs can be routed correctly.
#### [MODIFY] [Hero.ts](file:///c:/Users/Anthony/.gemini/antigravity/scratch/jurassic-knights-valley/src/gameplay/Hero.ts)
- Add `playerId: string` to the `HeroConfig` and class properties.
- Ensure the ECS `id` is constructed using the `playerId` to prevent collisions.

#### [MODIFY] [HeroSystem.ts](file:///c:/Users/Anthony/.gemini/antigravity/scratch/jurassic-knights-valley/src/systems/HeroSystem.ts)
- Update `update(dt)` to iterate over all heroes in `this.game.heroes.values()`.
- Ensure inputs bound to `INPUT_MOVE` only apply to heroes marked as local (checking against `game.localPrimaryHeroId`).

### Rendering & Interaction
Visuals and collision/interaction logic must process all heroes.
#### [MODIFY] [GameRenderer.ts](file:///c:/Users/Anthony/.gemini/antigravity/scratch/jurassic-knights-valley/src/core/GameRenderer.ts)
- Replace `this.hero` with a reference to the primary local hero for camera centering.
- Ensure rendering loops process all entities of type `EntityTypes.HERO`, not just the global `game.hero`.

#### [MODIFY] [InteractionSystem.ts](file:///c:/Users/Anthony/.gemini/antigravity/scratch/jurassic-knights-valley/src/systems/InteractionSystem.ts)
- Update auto-magnetize and pickup logic to loop over all local heroes (for now, the primary local hero) when calculating distances instead of relying on `game.hero`.

