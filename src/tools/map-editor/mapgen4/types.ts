/*
 * From https://www.redblobgames.com/maps/mapgen4/
 * License: Apache v2.0
 */
import type { TriangleMesh } from './dual-mesh/index';

export type Mesh = TriangleMesh & {
    is_boundary_t: Int8Array;
    length_s: Float32Array;
};
