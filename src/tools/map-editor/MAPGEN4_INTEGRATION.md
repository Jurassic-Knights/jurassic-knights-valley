# Mapgen4 Integration

## How we integrated it

We **did not** import the GitHub repo as a dependency and use it unchanged. We **vendored** (copied) parts of the mapgen4 source into our repo and made **minimal edits** so it runs in our build. All **game-specific** code lives in separate files and does not touch the vendored source.

### Why we can’t use upstream “exactly as-is”

- **Upstream is an app, not a library.** The repo is built to run in the browser with:
    - A **precomputed points file** (`build/points-${spacing}.data`) loaded via `fetch()` in `mesh.ts` (runtime point generation is commented out).
    - A **Web Worker** that runs `Map.assignElevation`, `assignRainfall`, `assignRivers` and then sends **geometry buffers** (quad elements, river geometry) to the **WebGL renderer**. It does **not** expose `elevation_r` or `rainfall_r`.
- We need **elevation and rainfall per region** to rasterize to our tile grid. That data is only available inside the worker and is never sent out. So we either:
    1. **Patch the upstream worker** (e.g. one extra `postMessage` with `elevation_r` / `rainfall_r`) — that would be editing his source, or
    2. **Run the same algorithms ourselves** in our process so we can read the arrays — which is what we did, by vendoring the algo code.

### What lives where

| Location                     | Role                                                                                                                                                                                                                                                      |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`mapgen4/`** (this folder) | **Vendored** mapgen4 algorithm code. Adapted from [redblobgames/mapgen4](https://github.com/redblobgames/mapgen4) (Apache-2.0). Only **import paths and one replacement** were changed; **algorithm logic is unchanged**. See “Vendor adaptations” below. |
| **`Mapgen4Generator.ts`**    | **Our code only.** Builds mesh (via vendored `buildMesh`), runs Map (vendored), then **rasterizes** mesh → 1250×1250 tile grid → `ChunkData` / zones. No edits to mapgen4 source.                                                                         |
| **Dashboard procedural tab** | **Our code only.** UI and dynamic `import()` of `Mapgen4Generator`; no mapgen4 source.                                                                                                                                                                    |

So: **we do not touch the upstream GitHub repo.** We keep a **local vendored copy** with minimal shims; all “our” logic is in `Mapgen4Generator.ts` and the dashboard.

---

## Vendor adaptations (minimal)

Files under `mapgen4/` were copied from upstream and only the following were changed so they run in our stack:

1. **Prng.ts**  
   We added a small **replacement** for `@redblobgames/prng` (same API: `makeRandFloat(seed)` → `() => number`) so we don’t depend on another repo. Upstream algorithm code that calls `makeRandFloat` is unchanged.

2. **Import paths**
    - `mapgen4/map.ts`: `@redblobgames/prng` → our `./Prng`; `./geometry` / `./types` kept as relative.
    - `mapgen4/generate-points.ts`: uses our `./dual-mesh/create`, `./Prng`, and `require('fast-2d-poisson-disk-sampling')` for the build.
    - `mapgen4/buildMesh.ts`: **Our file** that builds the mesh using vendored `choosePoints` + `Delaunator` + `TriangleMesh.addGhostStructure`, and **makeDefaultConstraints()** (our implementation of the painting “constraints” from upstream so we don’t need the painting UI).

3. **Mesh build**  
   Upstream `mesh.ts` uses `fetch('build/points-${param.spacing}.data')`. We don’t ship those files. So we have **buildMesh.ts** (our glue) that calls vendored **choosePoints()** at runtime and then builds the mesh the same way upstream does (Delaunator, addGhostStructure, `is_boundary_t`, `length_s`, `t_peaks`). No change to upstream mesh **logic**, only the source of the point set.

4. **delaunator.d.ts**  
   We added a small type declaration for the `delaunator` package so TypeScript is happy. No change to any mapgen4 code.

No other files in `mapgen4/` were changed; algorithm code (elevation, rainfall, rivers, geometry) is as in upstream.

---

## If you want to avoid any edits to vendored files

To use upstream **exactly as published** with zero edits in our tree you would need either:

1. **Fork + one change upstream:** In the mapgen4 repo (or a fork), add a “library” entry that exports mesh + map data (e.g. worker posts `elevation_r` / `rainfall_r`), then depend on that build from our repo and keep **only** our adapter (e.g. `Mapgen4Generator.ts`) and UI here.
2. **Submodule + patch:** Add mapgen4 as a git submodule, apply a small patch (e.g. worker sends map data), run their build, and have our code only in separate files that call the built worker.
3. **Keep current approach:** Vendored copy with the minimal shims above; our code stays in `Mapgen4Generator.ts` and the dashboard and does not touch the vendored source after the one-time integration.

We currently use (3) so we don’t depend on their build or on maintaining a fork.
