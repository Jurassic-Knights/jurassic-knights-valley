# Vendored: redblobgames/mapgen4

Algorithm code in this folder is from **[redblobgames/mapgen4](https://github.com/redblobgames/mapgen4)** (Apache-2.0).

**Do not edit these files** when changing game behavior. All integration and rasterization lives in:

- `../Mapgen4Generator.ts` (our code)

## What is vendored vs ours

| File                                        | Source   | Notes                                                                                        |
| ------------------------------------------- | -------- | -------------------------------------------------------------------------------------------- |
| `dual-mesh/index.ts`, `dual-mesh/create.ts` | Upstream | Copy; import paths unchanged.                                                                |
| `map.ts`, `geometry.ts`, `types.ts`         | Upstream | Copy; imports switched to our Prng and local paths.                                          |
| `generate-points.ts`                        | Upstream | Copy; uses our Prng and ESM import of `fast-2d-poisson-disk-sampling`.                       |
| `Prng.ts`                                   | **Ours** | Replacement for `@redblobgames/prng` (same API).                                             |
| `buildMesh.ts`                              | **Ours** | Builds mesh from `choosePoints()` + Delaunator; `makeDefaultConstraints()` for headless use. |
| `delaunator.d.ts`                           | **Ours** | Type declaration for the delaunator package.                                                 |

Algorithm logic in `map.ts`, `geometry.ts`, `dual-mesh/*`, and `generate-points.ts` is unchanged from upstream.
