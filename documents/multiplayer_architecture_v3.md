# Multiplayer Architecture & Multi-Hero Plan (v3)

**Version:** 3.2 (Deep-Audit Hardened)
**Goal:** Evolve the game into a Diablo 4–style multiplayer model (offline solo, online persistent world, party of 4, instanced loot) while strictly adhering to our Master Architecture Principles (ECS, Event-Driven, Data-Driven, Zero-Allocation).

---

## 1. Product Model: Persistent World & Party System

- **Offline Mode:** Single-player. Full game loop runs locally. Progress saved to `GameState` → `localStorage`.
- **Online Mode:** Persistent world. The host player is the "world owner" of their instance.
- **Party of 4:** Invite friends into your world. They stay in your world and see your unlocked progression zones.
- **Random Players:** Appear only in non-progression zones (e.g., public combat areas). They unload when entering player-specific progression zones (Home Base).
- **Instanced Loot:** Drops and XP are computed per-player server-side. Server validates loot eligibility based on proximity.
- **Cross-Platform:** Steam, Google Play, Web all connect to the same dedicated server infrastructure.

---

## 2. Alignment with Master Architecture Principles

### ECS & Separation of Data/Logic
- **Entities are IDs / Data:** The `Hero` class gains a `playerId: string` property and an explicit `entityType: string = 'hero'` field. It remains a data container managed by `EntityManager`. The `Game` class does **NOT** track heroes — `EntityManager` is the single source of truth for all entities, including heroes.
- **Systems are Logic:** `HeroSystem`, `InteractionSystem`, and `GameRenderer` query `EntityManager` for hero entities (`entityManager.getByType('hero')`) rather than referencing a global `game.hero` singleton.
- **Components stay pure data:** `playerId`, `isLocal`, `entityType`, stat blocks — all serializable primitives. No methods beyond simple accessors.

### Event-Driven Communication
- **No Direct System Calls:** Input from any client translates to an `Intent` event (e.g., `INPUT_MOVE_INTENT` carrying `{ playerId, dx, dy }`).
- **Single Source of Truth:** `EventBus` payloads always carry `entityId` or `playerId`. In online mode, the server is the final authority for event resolution.
- **Event Namespacing:** Network events use a `NET_` prefix (`NET_STATE_SYNC`, `NET_INPUT_INTENT`, `NET_GRANT_LOOT`) to distinguish from local events.
- **Hot-Path Performance:** `EventBus.emit()` must use a `for` loop (not `forEach`) to avoid closure allocation. High-frequency events like `NET_STATE_SYNC` and movement intents fire at 10-20 Hz per player.

### Data-Driven Design & Performance
- **Zero-Allocation:** Network sync uses `ArrayBuffer` with pre-allocated write buffers. Position updates use a fixed binary format (entity ID + x/y as Float32). No `JSON.stringify` in the hot path.
- **Spatial Partitioning:** Two spatial structures serve distinct purposes:
  - **`EntityManager.Quadtree`** → rendering frustum culling + server-side interest management (network entity culling).
  - **`CollisionSystem.spatialHash`** → collision resolution between entities with physics bodies.
  - Both rebuild each frame. They are intentionally separate because collision requires finer-grained cell bucketing while interest management uses coarser viewport-scale queries.
- **Tick Rate:** Both client and server share the same fixed timestep (`TICK_RATE_MS: 50`, 20 ticks/s from `GameConstants`). Network state is broadcast at a lower rate (10 Hz) to conserve bandwidth, with client-side interpolation filling the gaps.

---

## 3. Network Model Deep Dive

### Authority Model: Authoritative Server + Predictive Clients

```
┌──────────────────────────────────────────────────┐
│                  Server (Node.js)                │
│  ┌──────────────────────────────────────────┐    │
│  │     Headless ECS (same codebase)         │    │
│  │  EntityManager, HeroSystem, CombatCtrl,  │    │
│  │  CollisionSystem, InteractionSystem,     │    │
│  │  EnemyAI, LootSystem                     │    │
│  └──────────────────────────────────────────┘    │
│  ┌──────────────────────────────────────────┐    │
│  │      NetworkServer (WebSocket)           │    │
│  │  - Input validation & rate-limiting      │    │
│  │  - State snapshot & delta compression    │    │
│  │  - Interest management (Quadtree)        │    │
│  │  - Session & connection lifecycle        │    │
│  └──────────────────────────────────────────┘    │
└──────────────────────────────────────────────────┘
         ▲ INPUT_INTENT        │ STATE_SYNC
         │                     ▼
┌──────────────────────────────────────────────────┐
│                  Client (Browser)                │
│  ┌──────────────────────────────────────────┐    │
│  │     Full ECS (prediction layer)          │    │
│  │  - Applies local input immediately       │    │
│  │  - Runs CollisionSystem during predict   │    │
│  │  - Stamps each input with sequence #     │    │
│  │  - Reconciles with collision re-eval     │    │
│  └──────────────────────────────────────────┘    │
│  ┌──────────────────────────────────────────┐    │
│  │     NetworkClient (WebSocket)            │    │
│  │  - Sends INPUT_INTENT with seq number    │    │
│  │  - Receives STATE_SYNC, applies deltas   │    │
│  │  - Entity interpolation for remotes      │    │
│  └──────────────────────────────────────────┘    │
└──────────────────────────────────────────────────┘
```

### Client-Side Prediction & Server Reconciliation
1. **Client** captures input, stamps it with an incrementing `sequenceNumber`, stores it in a local `pendingInputs[]` buffer, and immediately applies it to the local hero (prediction) — **including collision resolution via `CollisionSystem.move()`**.
2. **Client** sends `{ type: NET_INPUT_INTENT, playerId, seq, dx, dy, actions }` over WebSocket.
3. **Server** receives the input, validates it (rate-limit, range-check). If valid, applies it to the authoritative simulation (including server-side `CollisionSystem`). If **invalid** (speed hack, out-of-range), the server **drops** the input and increments `lastReceivedSeq` without updating `lastValidSeq`.
4. **Server** broadcasts `STATE_SYNC` at 10 Hz containing each player's authoritative position + `lastValidSeq` + `lastReceivedSeq`.
5. **Client** receives `STATE_SYNC`. For the **local hero**:
   - Discard all `pendingInputs` with `seq <= lastReceivedSeq` (both valid and rejected inputs are consumed).
   - Set hero position to the server's authoritative position.
   - **Re-apply** remaining pending inputs through `CollisionSystem.move()` (collision-aware replay). This ensures predicted movement respects walls and obstacles identically to the server.
   - If `lastReceivedSeq > lastValidSeq`, some inputs were rejected — the snap-back IS the correction. No infinite loop because the rejected inputs are discarded.
6. For **remote heroes**: feed position into an interpolation buffer.

### Entity Interpolation (Remote Players)
- Remote entities are rendered at a position interpolated between the two most recent server snapshots.
- Interpolation delay = 1 server tick (100ms at 10 Hz). This means remotes are always rendered ~100ms in the past, which is standard and masks jitter.
- If a snapshot is missing (packet loss), the client **extrapolates** using the last known velocity for up to 200ms, then freezes.

### Binary Protocol Format
All network messages use a compact binary format over WebSocket binary frames. Fixed-size messages (like `INPUT_INTENT`) omit the payload-length field since their size is known from the message type. Variable-size messages (like `STATE_SYNC`) include it.

**Error handling:** Both client and server must validate incoming messages before processing:
- Check message type ID is in the known registry (0x01–0x0D). Unknown types are silently dropped with a warning log.
- For variable-size messages, validate `payloadLen` matches expected field sizes before reading. Truncated or oversized payloads are dropped.
- Never crash on malformed data — log and drop.

**Fixed-size messages (no length prefix needed):**

**Input Intent (Client → Server):**
`[MSG_INPUT:Uint8(1)] [seq:Uint32] [dx:Float32] [dy:Float32] [actionFlags:Uint8]`
= 14 bytes per input. At 20 ticks/s = **280 bytes/s upstream**.

> `seq` uses Uint32 (not Uint16) to avoid overflow. Uint16 overflows in ~54 minutes at 20 inputs/s. Uint32 lasts 2.5 days — safe for any session.

**Variable-size messages (with length prefix):**

**State Sync (Server → Client):**
`[MSG_STATE:Uint8(2)] [payloadLen:Uint16] [tick:Uint32] [entityCount:Uint16] [per-entity: entityId:Uint32 + x:Float32 + y:Float32 + health:Uint16 + stateFlags:Uint8 + skinId:Uint8]`
= 3-byte header + 6-byte frame + ~16 bytes per entity. 20 entities in view at 10 Hz = **~3.3 KB/s downstream**.

> `entityId` uses Uint32 (not Uint16) to support large persistent worlds. Uint16 caps at 65,535 entities — tight with enemies, resources, drops, and projectiles across a persistent map. Uint32 costs +2 bytes/entity but removes the ceiling entirely.

> `skinId:Uint8` carries the hero's selected cosmetic skin index. This is only meaningful for hero entities but is included in the generic per-entity format for simplicity (non-hero entities send 0x00).

**Message type registry:**

| Type ID | Name | Direction | Size |
|---------|------|-----------|------|
| 0x01 | `INPUT_INTENT` | Client → Server | 14 bytes (fixed) |
| 0x02 | `STATE_SYNC` | Server → Client | variable |
| 0x03 | `ENTITY_SPAWNED` | Server → Client | variable |
| 0x04 | `ENTITY_REMOVED` | Server → Client | 5 bytes (fixed, Uint32 entityId) |
| 0x05 | `GRANT_LOOT` | Server → Client | variable |
| 0x06 | `PICKUP_INTENT` | Client → Server | 5 bytes (fixed) |
| 0x07 | `ATTACK_INTENT` | Client → Server | 5 bytes (fixed) |
| 0x08 | `PING` | Client → Server | 9 bytes (fixed) |
| 0x09 | `PONG` | Server → Client | 17 bytes (fixed) |
| 0x0A | `INITIAL_STATE` | Server → Client | variable (chunked, max 50 entities per chunk) |
| 0x0B | `DISCONNECT` | Bidirectional | 1 byte (fixed) |
| 0x0C | `AUTH` | Client → Server | variable |
| 0x0D | `INPUT_REJECTED` | Server → Client | 5 bytes (Uint32 seq) |

### Connection Lifecycle
1. **Connect:** Client opens WebSocket. Server assigns a `sessionId` and `playerId`. Server sends `INITIAL_STATE` in chunks (max 50 entities per message, sent across multiple frames to avoid burst).
2. **Authenticated:** Client provides auth token (Steam/Google Play/JWT). Server validates, loads saved player data, spawns hero entity. Hero's cosmetic skin ID is included in the spawn payload.
3. **Playing:** Normal input/state loop.
4. **Disconnect (graceful):** Client sends `DISCONNECT`. Server removes hero entity, saves progress server-side, notifies other clients via `ENTITY_REMOVED`.
5. **Disconnect (ungraceful):** Server detects no heartbeat for 5s. Hero entity enters "idle" state for 30s (allows reconnect). After 30s, hero despawns and progress saves.
6. **Reconnect:** Client reconnects with `sessionId`. If hero is still alive (within 30s window), client resumes control. Server sends full `INITIAL_STATE`. If hero expired, normal spawn flow.

### Anti-Cheat: Server-Side Validation
- **Movement:** Server validates that movement distance per tick does not exceed `hero.speed * TICK_RATE_MS * 1.1` (10% tolerance for float variance). Violations cause the input to be **dropped** (not applied to simulation). `lastReceivedSeq` increments but `lastValidSeq` does not, signaling the client to discard that input during reconciliation.
- **Combat:** All damage is computed server-side. The client sends `ATTACK_INTENT { targetId }`. Server validates range, cooldowns, and line-of-sight before applying damage.
- **Loot:** Server computes all loot drops. Client never tells the server what loot it received — server pushes `GRANT_LOOT` events.
- **Rate Limiting:** Server tracks input frequency per player. More than 25 inputs/s triggers throttling. More than 50 triggers disconnect.

---

## 4. Per-Player State Model

### The Problem
`GameState` is currently a flat singleton: `{ gold, inventory, unlocks, questId, questProgress }`. In multiplayer, each player has their own gold, inventory, unlocks, and quest progress.

### The Solution: Hero-Owned State + Client-Local GameState

**Player-scoped data lives on the Hero entity:**
- `hero.inventory` (already exists — gold, items)
- `hero.stats` (already exists — health, stamina, level, XP)
- `hero.equipment` (already exists — EquipmentManager)
- `hero.unlocks: string[]` (new — player-specific progression unlocks)
- `hero.questState: { questId, progress }` (new — replaces GameState quest fields)
- `hero.skinId: string` (new — cosmetic skin, replaces `localStorage` heroSelectedSkin)

**`GameState` becomes a local UI cache for the primary local player:**
- `GameState` remains a singleton that the HUD/UI reads from.
- When in online mode, `GameState` is populated by **observing the local hero's data** — not by being the source of truth.
- A `HeroStateSync` listener watches the local hero entity and mirrors its data into `GameState` for UI binding. Example: when `hero.inventory.gold` changes, emit `GOLD_CHANGED` to update the HUD.
- This means UI code doesn't change — it still reads `GameState.get('gold')`.

**Server is the authority for player state in online mode:**
- Server stores each player's `Hero` entity with its full state (inventory, unlocks, quests).
- On connect, server sends the player's saved hero state. On disconnect, server persists hero state to database.
- `EconomySystem`, `CraftingManager`, `ProgressionSystem` all operate on the `Hero` entity's data directly (they already partially do), not on `GameState`.

### Systems Impact

| System | Current Source of Truth | Target Source of Truth |
|--------|------------------------|----------------------|
| `EconomySystem` | `GameState.set('gold', ...)` | `hero.inventory.gold` → emits `GOLD_CHANGED` |
| `CraftingManager` | `GameState.set('gold', ...)` / `GameState.set('forge_unlocked_slots', ...)` | `hero.inventory.gold` / `hero.unlocks` |
| `ProgressionSystem` | `this.game.hero` | `hero.stats` via EntityManager query |
| `Dialogue` | `GameState.set('dialogueText', ...)` | **No change** — dialogue is client-local UI state, not per-player game state |
| HUD/UI | `GameState.get('gold')` etc. | **No change** — HeroStateSync mirrors hero data → GameState |

### Save/Load in Multiplayer

| Mode | Save Target | Load Source |
|------|-------------|-------------|
| **Offline** | `localStorage` keyed by `jurassic_save_${playerId}` | `localStorage` |
| **Online** | Server-side database (on disconnect/auto-save interval) | Server sends hero state on connect |

- `localStorage` keys must be namespaced with `playerId` to prevent collision when multiple accounts use the same browser.
- `heroSelectedSkin` moves from `localStorage` to `hero.skinId` (sent to server, synced to other clients via `ENTITY_SPAWNED` and `STATE_SYNC`).

---

## 5. Implementation Roadmap

### Phase 0: EntityManager Type Key Fix (Prerequisite)
**Goal:** Fix `EntityManager.getByType()` so it works in production builds. Currently it keys on `constructor.name`, which minification breaks.

#### 0.1 EntityManager Migration
- `EntityManager.add()` and `remove()` must key the `entitiesByType` cache on `entity.entityType` (a string field) instead of `entity.constructor.name`.
- If `entity.entityType` is not set, log a warning and fall back to `constructor.name` for backwards compatibility during migration.

#### 0.2 Entity Base Class
- `Entity` base class should require `entityType: string` in its constructor or config.
- All entity subclasses (`Hero`, `Enemy`, `Resource`, `Drop`, `NPC`, `Projectile`, etc.) must set `this.entityType` to a stable string constant (e.g., `'hero'`, `'enemy'`, `'resource'`).
- Define these constants in a central `EntityTypes` enum/object (already referenced in the coding guide).

#### 0.3 Callsite Migration
- All existing `entityManager.getByType('Hero')` calls (which use the class name) must be updated to use the new `entityType` string: `entityManager.getByType('hero')`.

---

### Phase 1: Engine Readiness (Multi-Hero Local)
**Goal:** Remove all single-player assumptions (`game.hero`) from the codebase. Make the engine capable of handling N hero entities through standard ECS queries. No networking yet.

**Key Principle:** The `Game` class must NOT track heroes. `EntityManager` is the single registry. Systems query it.

#### 1.1 Player Identity
- Add `playerId: string` to `HeroConfig` and `Hero` class.
- Add `isLocal: boolean` flag to `Hero` (default `true` for offline mode).
- Add `skinId: string` to `Hero` (migrated from `localStorage` `heroSelectedSkin`).
- Hero entity ID format: `hero_{playerId}` to prevent collisions.
- Store `localPlayerId: string` in `GameState` (not on `Game.ts`).

#### 1.2 Hero Lifecycle (Game.ts)
- `spawnHero(playerId)` creates a `Hero`, sets its `playerId` and `isLocal`, adds it to `EntityManager` via `entityManager.add(hero)`, and emits `HERO_SPAWNED { entityId, playerId }`.
- Remove `this._hero` from `Game.ts`. The `get hero()` accessor becomes a query: `entityManager.getByType('hero').find(h => (h as Hero).isLocal)`.
- This is a **temporary compatibility bridge** — systems should migrate to querying `EntityManager` directly and not rely on `game.hero`.

#### 1.3 Input Routing
- `InputManager` emits `INPUT_MOVE { playerId, dx, dy }` instead of writing to a shared `movement` vector.
- `HeroSystem.update()` iterates all heroes via `entityManager.getByType('hero')`. For each, it checks `hero.isLocal` — only local heroes consume `INPUT_MOVE` events.

#### 1.4 Rendering & Camera
- Remove `GameRenderer.setHero(hero)` method and the `this.hero` field entirely.
- Replace with a per-frame query: `const localHero = entityManager.getByType('hero').find(h => (h as Hero).isLocal)`.
- Update `GameRendererViewport.ViewportState.hero` type from `{ x: number; y: number } | null` to accept the query result (same shape, but sourced from `EntityManager` instead of a cached field).
- Remove `gameRenderer.setHero(hero)` call from `Game.ts` `spawnHero()`.
- The render loop already processes all entities via `EntityManager.queryRect()` — no change needed for rendering multiple heroes.

#### 1.5 Per-Player State Migration
- Move `gold`, `inventory`, `unlocks`, `questState` onto the `Hero` entity.
- Create `HeroStateSync` — a lightweight observer that mirrors the local hero's data into `GameState` for UI binding. Listens for hero property changes and emits `GOLD_CHANGED`, `INVENTORY_UPDATED`, etc.
- Update `EconomySystem` and `CraftingManager` to read/write from `hero.inventory` instead of `GameState.set('gold', ...)`.
- Namespace `localStorage` save keys: `jurassic_save_${playerId}`.

#### 1.6 Systems Migration (game.hero → EntityManager queries)
Each system that currently references `game.hero` must be updated:

| System | Current | Target |
|--------|---------|--------|
| `HeroSystem` | `this.hero = game.hero` | `entityManager.getByType('hero')` loop |
| `HeroVisualsSystem` | `this.hero = game.hero` | Query `EntityManager` for local hero |
| `CombatController` | `this.game.hero` | Query `EntityManager` for local hero |
| `InteractionSystem` | `this.game.hero` | Loop all local heroes for pickup/magnetize |
| `RestSystem` | `this.game.hero` | Query `EntityManager` for local hero |
| `ProgressionSystem` | `this.game.hero` | Event-driven (`HERO_XP_GAINED { playerId }`) |
| `EnemyAI` | `game.hero` target | `entityManager.getByType('hero')` → nearest |
| `HUD/UI` | Hardcoded to `game.hero` | Bind to `GameState` (populated by `HeroStateSync`) |
| `GameRenderer` | `this.hero` field + `setHero()` | Per-frame `EntityManager` query (see 1.4) |
| `HeroRenderer` | `localStorage.getItem('heroSelectedSkin')` | `hero.skinId` field |

#### 1.7 State Serialization Prep
- Add `serialize(): object` and `static deserialize(data): Hero` to the `Hero` class. This is needed for both save/load AND future network sync.
- All hero state that needs to be synchronized must be in serializable component data (position, health, stamina, equipment, inventory, unlocks, questState, skinId). No closures, no DOM refs.

---

### Phase 2: Network Stack & Authoritative Server
**Goal:** Add the network layer. Dedicated server runs headless ECS as authority. Clients predict locally and reconcile.

#### 2.1 Shared Code Package
- Extract all simulation code (ECS core, systems, entity definitions, `GameConstants`) into a shared package importable by both client and server.
- The shared package must have **zero DOM dependencies**. The following files require extraction or environment gating:

| File | DOM Usage | Strategy |
|------|-----------|----------|
| `GameRenderer.ts` | `document.getElementById`, canvas | **Client-only** — exclude from server bundle |
| `GameRendererViewport.ts` | `HTMLCanvasElement`, `parentElement` | **Client-only** — exclude from server bundle |
| `GameRendererLayers.ts` | Canvas context | **Client-only** — exclude from server bundle |
| `InputManager.ts` | `addEventListener`, `ontouchstart`, DOM | **Client-only** — exclude from server bundle |
| `DOMUtils.ts` | Entire file is DOM utilities | **Client-only** — exclude from server bundle |
| `PlatformManager.ts` | `window`, `navigator` detection | **Client-only** — exclude from server bundle |
| `Game.ts` | `document.getElementById('loading')` | **Gate** behind `typeof document !== 'undefined'` |
| `AssetLoader.ts` | `Image()` constructor, DOM | **Client-only** — server doesn't load images |
| `SpriteLoader.ts` | Canvas for spritesheet slicing | **Client-only** — exclude from server bundle |
| All `src/ui/*` | DOM manipulation | **Client-only** — exclude from server bundle |
| All `src/rendering/*` | Canvas context | **Client-only** — exclude from server bundle |
| All `src/vfx/*` | Canvas context | **Client-only** — exclude from server bundle |

- `CollisionSystem` is **shared** — runs on both client (for prediction) and server (for authoritative resolution).
- `EventBus.emit()` must be refactored from `forEach` to a `for` loop before Phase 2 to avoid allocation in the high-frequency network event path.
- Use TypeScript path aliases (already configured in Vite) to keep import paths clean.
- Server entry point only imports shared systems + server-specific systems.

#### 2.2 Dedicated Server
- Node.js process running the shared ECS in headless mode.
- Uses `ws` (WebSocket library) for connections.
- Runs the same fixed-timestep loop (`setInterval` at `TICK_RATE_MS`) without rendering.
- Holds the authoritative `EntityManager`, all systems except rendering/UI/VFX/audio.
- Server-specific systems: `NetworkServer`, `SessionManager`, `InputValidator`, `LootAuthority`.
- Server persists player hero state (inventory, unlocks, quests, cosmetics) to database on disconnect and at auto-save intervals.

#### 2.3 Client Network Layer
- `NetworkClient` system: manages WebSocket connection, serializes outgoing `INPUT_INTENT`, deserializes incoming `STATE_SYNC`. Implements the `IAuthority` interface (see Phase 3).
- `PredictionSystem`: maintains `pendingInputs[]` buffer, handles collision-aware reconciliation on state sync. **Only active when `IAuthority` is remote** (online mode). Reconciliation re-applies pending inputs through `CollisionSystem.move()` to ensure wall collision parity with the server.
- `InterpolationSystem`: maintains position buffers for remote entities, computes interpolated positions each render frame. **Only active when remote entities exist** (online mode).
- `NetworkClient` emits standard `EventBus` events locally (`NET_STATE_SYNC`, `NET_CONNECTED`, `NET_DISCONNECTED`) — other systems react through the event bus, not direct calls.

#### 2.4 Instanced Loot System
- Server handles `ENEMY_DIED { entityId, killerPlayerId }`.
- Server computes loot table roll, iterates all players within `LOOT_RANGE` of the dead enemy, and emits `GRANT_LOOT { playerId, items[] }` to eligible connections.
- Client receives `GRANT_LOOT` and spawns local-only drop entities (visual only, no authority).
- Loot pickup sends `PICKUP_INTENT { playerId, lootId }` to server. Server validates proximity and grants the item to the hero entity's inventory.

#### 2.5 World Synchronization
- **Static world data** (map, biomes, zones, roads) is NOT synced per-tick. It is loaded by the client on connect from the same map JSON the server uses.
- **Dynamic entities** (heroes, enemies, drops, projectiles) are synced via `STATE_SYNC` deltas.
- **Spawning:** Only the server spawns enemies/resources. It emits `ENTITY_SPAWNED { config }` to clients. Clients create a visual-only proxy entity.
- **Enemy AI:** Runs exclusively on the server. Clients receive position/state updates and interpolate.

#### 2.6 Clock Synchronization
- Client performs a simple NTP-like handshake on connect: sends `PING { clientTime }`, server responds `PONG { clientTime, serverTime }`. Client computes round-trip and offset.
- This offset is used to correctly timestamp interpolation buffers so remote entity positions are rendered at the right moment relative to the server timeline.

---

### Phase 3: Offline/Online Parity & Mode Switching
**Goal:** Ensure seamless transition between offline and online modes without code duplication.

#### 3.1 IAuthority Interface
Both `NetworkClient` (online) and `LocalAuthority` (offline) implement a shared `IAuthority` interface:

```typescript
interface IAuthority {
    readonly isRemote: boolean;
    sendIntent(intent: InputIntent): void;
    onStateSync(callback: (state: StateSnapshot) => void): void;
    connect(): Promise<void>;
    disconnect(): void;
}
```

- Systems that need to send inputs or receive state always go through `IAuthority`, never directly through WebSocket.
- The active authority is registered in `Registry` as `'Authority'`. Systems retrieve it via `Registry.get<IAuthority>('Authority')`.

#### 3.2 LocalAuthority (Offline Shim)
- `sendIntent()` applies the input directly to the local ECS simulation (no network round-trip), including `CollisionSystem.move()`.
- `onStateSync()` is a no-op — local state IS the authoritative state.
- `isRemote = false`.
- When `isRemote === false`:
  - `PredictionSystem` is **disabled** (no pending buffer, no reconciliation — inputs are already authoritative).
  - `InterpolationSystem` is **disabled** (no remote entities to interpolate).
  - All game logic runs exactly as it does today in single-player.

#### 3.3 NetworkClient Authority (Online)
- `sendIntent()` serializes the input to binary, sends over WebSocket, AND applies locally through `CollisionSystem.move()` (prediction).
- `onStateSync()` triggers collision-aware reconciliation via `PredictionSystem`.
- `isRemote = true`.
- When `isRemote === true`:
  - `PredictionSystem` is **active** — buffers inputs, reconciles on server state with collision replay.
  - `InterpolationSystem` is **active** — interpolates remote entity positions.

#### 3.4 Mode Switching Flow
- **Offline → Online:** `LocalAuthority` is unregistered from `Registry`. `NetworkClient` connects, authenticates, receives `INITIAL_STATE`, and registers itself as `'Authority'`. Local hero state is sent to server for validation. `PredictionSystem` and `InterpolationSystem` activate. `GameState` switches from localStorage-authoritative to hero-entity-authoritative (mirrored by `HeroStateSync`).
- **Online → Offline:** `NetworkClient` disconnects and is unregistered. `LocalAuthority` registers as `'Authority'`. `PredictionSystem` and `InterpolationSystem` deactivate. Hero state is saved to `localStorage`. Game continues with local state as-is.

#### 3.5 Host Migration (Future)
- If the world owner disconnects, the server persists world state. Players are returned to lobby.
- True host migration (promoting a client to authority) is a v2 concern and intentionally deferred.

---

## 6. Phase 0+1 Implementation Plan (Detailed)

This section outlines the concrete file modifications for Phase 0 + Phase 1. No new packages or network code — purely refactoring the engine for multi-hero support.

### Phase 0: EntityManager Type Key Fix

#### [MODIFY] [EntityManager.ts](file:///c:/Users/Anthony/.gemini/antigravity/scratch/jurassic-knights-valley/src/core/EntityManager.ts)
- In `add()`: change type key from `entity.constructor.name` to `entity.entityType`. If `entity.entityType` is undefined, log a deprecation warning and fall back to `constructor.name`.
- In `remove()`: same change — key on `entity.entityType`.

#### [MODIFY] [Entity.ts](file:///c:/Users/Anthony/.gemini/antigravity/scratch/jurassic-knights-valley/src/core/Entity.ts)
- Add `entityType: string` as a required constructor parameter or config field.
- Base `Entity` class stores `this.entityType = config.entityType`.

#### [MODIFY] All entity subclasses
- `Hero.ts`: `this.entityType = 'hero'`
- All enemy entities: `this.entityType = 'enemy'`
- All resource entities: `this.entityType = 'resource'`
- All drop entities: `this.entityType = 'drop'`
- All NPC entities: `this.entityType = 'npc'`

#### [MODIFY] [EventBus.ts](file:///c:/Users/Anthony/.gemini/antigravity/scratch/jurassic-knights-valley/src/core/EventBus.ts)
- Replace `forEach` in `emit()` with a `for` loop to avoid closure allocation in the hot path.

### Phase 1: Engine Multi-Hero Refactoring

#### [MODIFY] [Game.ts](file:///c:/Users/Anthony/.gemini/antigravity/scratch/jurassic-knights-valley/src/core/Game.ts)
- Remove `private _hero: Hero | null = null` field.
- Update `spawnHero()` to accept `playerId?: string` (defaults to `'local_player'`). Set `hero.playerId` and `hero.isLocal = true`. Do not store hero on `Game` — only in `EntityManager`.
- Remove `gameRenderer.setHero(hero)` call.
- Add a compatibility getter `get hero()` that queries `entityManager.getByType('hero').find(h => (h as Hero).isLocal)`. Add a `@deprecated` JSDoc tag.
- Emit `HERO_SPAWNED` event after adding to `EntityManager`.

#### [MODIFY] [core.d.ts](file:///c:/Users/Anthony/.gemini/antigravity/scratch/jurassic-knights-valley/src/types/core.d.ts)
- Update `IGame` interface: remove hardcoded `hero` property, add `readonly hero: IEntity | null` as `@deprecated` compatibility accessor.

#### [MODIFY] [Hero.ts](file:///c:/Users/Anthony/.gemini/antigravity/scratch/jurassic-knights-valley/src/gameplay/Hero.ts)
- Add `playerId: string`, `isLocal: boolean`, and `skinId: string` to `HeroConfig` and class fields.
- Default `playerId = 'local_player'`, `isLocal = true`, `skinId = 'hero_t1_01'`.
- Set `this.entityType = 'hero'`.
- Entity ID construction: `this.id = config.id ?? 'hero_' + config.playerId`.
- Add `unlocks: string[]` and `questState: { questId: string | null, progress: number }` to hero data.

#### [NEW] HeroStateSync.ts
- Lightweight observer that watches the local hero entity and mirrors its data into `GameState`.
- Listens for changes to `hero.inventory.gold`, `hero.stats`, etc. and emits the corresponding `EventBus` events (`GOLD_CHANGED`, `INVENTORY_UPDATED`).
- UI continues to read from `GameState` — no HUD changes needed.

#### [MODIFY] [GameRenderer.ts](file:///c:/Users/Anthony/.gemini/antigravity/scratch/jurassic-knights-valley/src/core/GameRenderer.ts)
- Remove `hero: null as IEntity | null` field.
- Remove `setHero(hero: IEntity)` method.
- Add a private helper: `_getLocalHero(): IEntity | null` that queries `entityManager.getByType('hero').find(h => (h as Hero).isLocal)`.
- Update `updateViewport()` and `updateCamera()` to call `_getLocalHero()` for the hero position.
- Update `render()` to pass `_getLocalHero()` into `renderGameLayers()` instead of `this.hero`.

#### [MODIFY] [GameRendererViewport.ts](file:///c:/Users/Anthony/.gemini/antigravity/scratch/jurassic-knights-valley/src/core/GameRendererViewport.ts)
- No structural change needed — `ViewportState.hero` is already typed as `{ x: number; y: number } | null` which accepts any entity with `x`/`y`.

#### [MODIFY] [HeroSystem.ts](file:///c:/Users/Anthony/.gemini/antigravity/scratch/jurassic-knights-valley/src/systems/HeroSystem.ts)
- Remove `this.hero = game.hero as Hero` from `init()` and the re-assignment in `update()`.
- `update(dt)` queries `entityManager.getByType('hero')` and iterates. Only processes input for heroes where `hero.isLocal === true`.

#### [MODIFY] [HeroVisualsSystem.ts](file:///c:/Users/Anthony/.gemini/antigravity/scratch/jurassic-knights-valley/src/systems/HeroVisualsSystem.ts)
- Same pattern: query `EntityManager` instead of caching `game.hero`.

#### [MODIFY] [CombatController.ts](file:///c:/Users/Anthony/.gemini/antigravity/scratch/jurassic-knights-valley/src/systems/CombatController.ts)
- Replace `this.game.hero` with `EntityManager` query for local hero.

#### [MODIFY] [InteractionSystem.ts](file:///c:/Users/Anthony/.gemini/antigravity/scratch/jurassic-knights-valley/src/systems/InteractionSystem.ts)
- Pickup and magnetize loops must iterate all local heroes.
- For each local hero, check proximity to loot entities.

#### [MODIFY] [RestSystem.ts](file:///c:/Users/Anthony/.gemini/antigravity/scratch/jurassic-knights-valley/src/systems/RestSystem.ts)
- Replace `this.game.hero` with `EntityManager` query.

#### [MODIFY] [EconomySystem.ts](file:///c:/Users/Anthony/.gemini/antigravity/scratch/jurassic-knights-valley/src/systems/EconomySystem.ts)
- Replace `GameState.set('gold', ...)` with `hero.inventory.gold = ...`. `HeroStateSync` handles the UI update.

#### [MODIFY] [CraftingManager.ts](file:///c:/Users/Anthony/.gemini/antigravity/scratch/jurassic-knights-valley/src/gameplay/CraftingManager.ts)
- Replace `GameState.set('gold', ...)` and `GameState.set('forge_unlocked_slots', ...)` with hero entity data.

#### [MODIFY] [HeroRenderer.ts](file:///c:/Users/Anthony/.gemini/antigravity/scratch/jurassic-knights-valley/src/rendering/HeroRenderer.ts)
- Replace `localStorage.getItem('heroSelectedSkin')` with `hero.skinId`.

#### [MODIFY] [HeroSkinSelector.ts](file:///c:/Users/Anthony/.gemini/antigravity/scratch/jurassic-knights-valley/src/ui/HeroSkinSelector.ts)
- Replace `localStorage.setItem('heroSelectedSkin', ...)` with `hero.skinId = ...`.

#### [MODIFY] [State.ts](file:///c:/Users/Anthony/.gemini/antigravity/scratch/jurassic-knights-valley/src/core/State.ts)
- Namespace `localStorage` save key with `playerId`: `jurassic_save_${playerId}`.

#### [MODIFY] Enemy AI files
- Target acquisition must query `entityManager.getByType('hero')` and select the **nearest** hero, not a hardcoded singleton.

---

## 7. Verification Plan

### Phase 0 Verification
- **Build test:** Run `npm run build` (production). Verify no minification-related breakage — entities are still queryable by `entityType`.
- **Runtime test:** `entityManager.getByType('hero')` returns the hero entity correctly in both dev and prod builds.
- **EventBus test:** Confirm `emit()` uses `for` loop, no `forEach`.

### Phase 1 Verification
- **Smoke Test:** Game boots, hero spawns, all existing gameplay works identically. No `game.hero` references remain outside the compatibility getter.
- **grep audit:** `grep -r "game\.hero" src/` should return ONLY the `@deprecated` getter in `Game.ts` and its type definition.
- **grep audit:** `grep -r "setHero" src/` should return zero results.
- **grep audit:** `grep -r "localStorage.getItem('heroSelectedSkin')" src/` should return zero results.
- **Multi-hero local test:** Manually spawn a second hero via console (`entityManager.add(new Hero({ playerId: 'test_p2', isLocal: false, x: 500, y: 500 }))`). Verify it renders, enemies target the nearest hero, and the camera still follows the local hero.
- **Economy test:** Buy/sell items, verify gold changes reflect in HUD via HeroStateSync. Verify gold is stored on hero entity, not in GameState directly.
- **Save/load test:** Verify localStorage key is `jurassic_save_local_player` (not hardcoded).
- **No regressions:** All existing systems (combat, loot, crafting, progression, UI) continue to function for the primary local hero.

### Phase 2 Verification
- Server starts headless, client connects, hero appears on both sides.
- **Collision parity test:** Place hero next to a wall. Move into wall with 200ms simulated latency. Verify prediction doesn't clip through walls. Verify reconciliation doesn't teleport hero through walls.
- Intentional 200ms latency — verify prediction feels smooth and reconciliation doesn't cause teleporting.
- Two clients connected: verify they see each other with correct skins, combat interacts correctly, loot is instanced.
- Disconnect test: client drops connection, hero idles for 30s, then despawns.
- **Binary validation test:** Send malformed binary message (truncated, wrong type). Verify server/client logs warning and doesn't crash.
- **Seq overflow test:** Fast-forward sequence counter past Uint32 boundary — verify wrap-around handling.
- **INITIAL_STATE chunking test:** Join a crowded area (100+ entities). Verify state arrives in chunks, no single-frame bandwidth spike.

### Phase 3 Verification
- Offline → Online: start game offline, then connect to server. Hero state transfers seamlessly. `PredictionSystem` and `InterpolationSystem` activate. Gold/inventory reflects correctly.
- Online → Offline: disconnect from server. Game continues locally without interruption. `PredictionSystem` and `InterpolationSystem` deactivate. Hero state saves to localStorage.
- Verify `Registry.get('Authority')` always returns a valid `IAuthority` in both modes.
