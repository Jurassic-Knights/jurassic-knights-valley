/*
 * From https://www.redblobgames.com/maps/mapgen4/
 * Copyright 2018 Red Blob Games
 * License: Apache v2.0
 */

import { createNoise2D } from 'simplex-noise';
import FlatQueue from 'flatqueue';
import { makeRandFloat } from './Prng';
import { clamp } from './geometry';
import type { Mesh } from './types';

interface PrecalculatedNoise {
    noise0_t: Float32Array;
    noise1_t: Float32Array;
    noise2_t: Float32Array;
    noise4_t: Float32Array;
    noise5_t: Float32Array;
    noise6_t: Float32Array;
}

const mountain = { slope: 16 };

function calculateMountainDistance(
    mesh: Mesh,
    t_peaks: number[],
    spacing: number,
    jaggedness: number,
    randFloat: () => number,
    distance_t: Float32Array
): void {
    distance_t.fill(-1);
    const t_queue = t_peaks.slice();
    for (let i = 0; i < t_queue.length; i++) {
        const t_current = t_queue[i];
        for (let j = 0; j < 3; j++) {
            const s = 3 * t_current + j;
            const t_neighbor = mesh.t_outer_s(s);
            if (distance_t[t_neighbor] === -1) {
                const increment = spacing * (1 + jaggedness * (randFloat() - randFloat()));
                distance_t[t_neighbor] = distance_t[t_current] + increment;
                t_queue.push(t_neighbor);
            }
        }
    }
}

function precalculateNoise(randFloat: () => number, mesh: Mesh): PrecalculatedNoise {
    const noise2D = createNoise2D(randFloat);
    const { numTriangles } = mesh;
    const noise0_t = new Float32Array(numTriangles);
    const noise1_t = new Float32Array(numTriangles);
    const noise2_t = new Float32Array(numTriangles);
    const noise4_t = new Float32Array(numTriangles);
    const noise5_t = new Float32Array(numTriangles);
    const noise6_t = new Float32Array(numTriangles);
    for (let t = 0; t < numTriangles; t++) {
        const nx = (mesh.x_of_t(t) - 500) / 500;
        const ny = (mesh.y_of_t(t) - 500) / 500;
        noise0_t[t] = noise2D(nx, ny);
        noise1_t[t] = noise2D(2 * nx + 5, 2 * ny + 5);
        noise2_t[t] = noise2D(4 * nx + 7, 4 * ny + 7);
        noise4_t[t] = noise2D(16 * nx + 15, 16 * ny + 15);
        noise5_t[t] = noise2D(32 * nx + 31, 32 * ny + 31);
        noise6_t[t] = noise2D(64 * nx + 67, 64 * ny + 67);
    }
    return { noise0_t, noise1_t, noise2_t, noise4_t, noise5_t, noise6_t };
}

export interface ElevationParam {
    seed: number;
    island: number;
    noisy_coastlines: number;
    hill_height: number;
    mountain_jagged: number;
    mountain_sharpness: number;
    mountain_folds: number;
    ocean_depth: number;
}

export interface BiomesParam {
    wind_angle_deg: number;
    raininess: number;
    rain_shadow: number;
    evaporation: number;
}

export interface RiversParam {
    lg_min_flow: number;
    lg_river_width: number;
    flow: number;
}

export interface MapConstraints {
    size: number;
    constraints: Float32Array;
}

export default class Mapgen4Map {
    seed = -1;
    spacing!: number;
    precomputed!: PrecalculatedNoise;
    mountainJaggedness = -Infinity;
    windAngleDeg = Infinity;
    elevation_t!: Float32Array;
    elevation_r!: Float32Array;
    humidity_r!: Float32Array;
    moisture_t!: Float32Array;
    rainfall_r!: Float32Array;
    s_downslope_t!: Int32Array;
    t_order!: Int32Array;
    flow_t!: Float32Array;
    flow_s!: Float32Array;
    r_wind_order!: Int32Array;
    wind_sort_r!: Float32Array;
    mountain_distance_t!: Float32Array;

    constructor(
        public mesh: Mesh,
        public t_peaks: number[],
        param: { spacing: number }
    ) {
        this.spacing = param.spacing;
        this.elevation_t = new Float32Array(mesh.numTriangles);
        this.elevation_r = new Float32Array(mesh.numRegions);
        this.humidity_r = new Float32Array(mesh.numRegions);
        this.moisture_t = new Float32Array(mesh.numTriangles);
        this.rainfall_r = new Float32Array(mesh.numRegions);
        this.s_downslope_t = new Int32Array(mesh.numTriangles);
        this.t_order = new Int32Array(mesh.numTriangles);
        this.flow_t = new Float32Array(mesh.numTriangles);
        this.flow_s = new Float32Array(mesh.numSides);
        this.r_wind_order = new Int32Array(mesh.numRegions);
        this.wind_sort_r = new Float32Array(mesh.numRegions);
        this.mountain_distance_t = new Float32Array(mesh.numTriangles);
    }

    assignTriangleElevation(elevationParam: ElevationParam, constraints: MapConstraints): void {
        const { mesh, elevation_t, mountain_distance_t, precomputed } = this;
        const { numTriangles, numSolidTriangles } = mesh;
        const C = constraints.constraints;
        const size = constraints.size;

        function constraintAt(x: number, y: number): number {
            x = clamp(x * (size - 1), 0, size - 2);
            y = clamp(y * (size - 1), 0, size - 2);
            const xInt = Math.floor(x);
            const yInt = Math.floor(y);
            const xFrac = x - xInt;
            const yFrac = y - yInt;
            const p = size * yInt + xInt;
            const e00 = C[p];
            const e01 = C[p + 1];
            const e10 = C[p + size];
            const e11 = C[p + size + 1];
            return (
                (e00 * (1 - xFrac) + e01 * xFrac) * (1 - yFrac) +
                (e10 * (1 - xFrac) + e11 * xFrac) * yFrac
            );
        }

        for (let t = 0; t < numSolidTriangles; t++) {
            let e = constraintAt(mesh.x_of_t(t) / 1000, mesh.y_of_t(t) / 1000);
            e +=
                elevationParam.noisy_coastlines *
                (1 - e * e * e * e) *
                (precomputed.noise4_t[t] +
                    precomputed.noise5_t[t] / 2 +
                    precomputed.noise6_t[t] / 4);
            this.elevation_t[t] = e;
        }

        const mountain_slope = mountain.slope;
        const mountain_sharpness = Math.pow(2, elevationParam.mountain_sharpness);
        const { noise0_t, noise1_t, noise2_t, noise4_t } = precomputed;
        for (let t = 0; t < numTriangles; t++) {
            let e = this.elevation_t[t];
            if (e > 0) {
                const noisiness = 1.0 - 0.5 * (1 + noise0_t[t]);
                let eh =
                    (1 + noisiness * noise4_t[t] + (1 - noisiness) * noise2_t[t]) *
                    elevationParam.hill_height;
                if (eh < 0.01) eh = 0.01;
                let em = 1 - (mountain_slope / mountain_sharpness) * mountain_distance_t[t];
                if (em < 0.01) em = 0.01;
                const weight = e * e;
                e = (1 - weight) * eh + weight * em;
            } else {
                e *= elevationParam.ocean_depth + noise1_t[t];
            }
            if (e < -1.0) e = -1.0;
            if (e > 1.0) e = 1.0;
            this.elevation_t[t] = e;
        }
    }

    assignRegionElevation(): void {
        const { mesh, elevation_t, elevation_r } = this;
        const { _s_of_r, _halfedges } = mesh;
        for (let r = 0; r < mesh.numRegions; r++) {
            let count = 0;
            let e = 0;
            let water = false;
            let s_incoming = _s_of_r[r];
            const s0 = s_incoming;
            do {
                const t = (s_incoming / 3) | 0;
                e += elevation_t[t];
                water = water || elevation_t[t] < 0.0;
                const s_outgoing = mesh.s_next_s(s_incoming);
                s_incoming = _halfedges[s_outgoing];
                count++;
            } while (s_incoming !== s0);
            e /= count;
            if (water && e >= 0) e = -0.001;
            elevation_r[r] = e;
        }
    }

    assignElevation(elevationParam: ElevationParam, constraints: MapConstraints): void {
        if (
            this.seed !== elevationParam.seed ||
            this.mountainJaggedness !== elevationParam.mountain_jagged
        ) {
            this.mountainJaggedness = elevationParam.mountain_jagged;
            calculateMountainDistance(
                this.mesh,
                this.t_peaks,
                this.spacing,
                this.mountainJaggedness,
                makeRandFloat(elevationParam.seed),
                this.mountain_distance_t
            );
        }
        if (this.seed !== elevationParam.seed) {
            this.seed = elevationParam.seed;
            this.precomputed = precalculateNoise(makeRandFloat(elevationParam.seed), this.mesh);
        }
        this.assignTriangleElevation(elevationParam, constraints);
        this.assignRegionElevation();
    }

    assignRainfall(biomesParam: BiomesParam): void {
        const { mesh, r_wind_order, wind_sort_r, humidity_r, rainfall_r, elevation_r } = this;
        const { _s_of_r, _halfedges } = mesh;

        if (biomesParam.wind_angle_deg !== this.windAngleDeg) {
            this.windAngleDeg = biomesParam.wind_angle_deg;
            const windAngleRad = (Math.PI / 180) * this.windAngleDeg;
            const windAngleVec = [Math.cos(windAngleRad), Math.sin(windAngleRad)];
            for (let r = 0; r < mesh.numRegions; r++) {
                r_wind_order[r] = r;
                wind_sort_r[r] =
                    mesh.x_of_r(r) * windAngleVec[0] + mesh.y_of_r(r) * windAngleVec[1];
            }
            r_wind_order.sort((r1, r2) => wind_sort_r[r1] - wind_sort_r[r2]);
        }

        for (let i = 0; i < r_wind_order.length; i++) {
            const r = r_wind_order[i];
            let count = 0;
            let sum = 0.0;
            let s_incoming = _s_of_r[r];
            const s0 = s_incoming;
            do {
                const r_neighbor = mesh.r_begin_s(s_incoming);
                if (wind_sort_r[r_neighbor] < wind_sort_r[r]) {
                    count++;
                    sum += humidity_r[r_neighbor];
                }
                const s_outgoing = mesh.s_next_s(s_incoming);
                s_incoming = _halfedges[s_outgoing];
            } while (s_incoming !== s0);

            let humidity = 0.0;
            let rainfall = 0.0;
            if (count > 0) {
                humidity = sum / count;
                rainfall += biomesParam.raininess * humidity;
            }
            if (mesh.is_boundary_r(r)) humidity = 1.0;
            if (elevation_r[r] < 0.0) {
                const evaporation = biomesParam.evaporation * -elevation_r[r];
                humidity += evaporation;
            }
            if (humidity > 1.0 - elevation_r[r]) {
                const orographicRainfall =
                    biomesParam.rain_shadow * (humidity - (1.0 - elevation_r[r]));
                rainfall += biomesParam.raininess * orographicRainfall;
                humidity -= orographicRainfall;
            }
            rainfall_r[r] = rainfall;
            humidity_r[r] = humidity;
        }
    }

    assignRivers(riversParam: RiversParam): void {
        const {
            mesh,
            moisture_t,
            rainfall_r,
            elevation_t,
            s_downslope_t,
            t_order,
            flow_t,
            flow_s
        } = this;
        assignDownslope(mesh, elevation_t, s_downslope_t, t_order);
        assignMoisture(mesh, rainfall_r, moisture_t);
        assignFlow(
            mesh,
            riversParam,
            t_order,
            elevation_t,
            moisture_t,
            s_downslope_t,
            flow_t,
            flow_s
        );
    }
}

const queue = new FlatQueue<number>();

function assignDownslope(
    mesh: Mesh,
    elevation_t: Float32Array,
    s_downslope_t: Int32Array,
    t_order: Int32Array
): void {
    const { numTriangles } = mesh;
    let queue_in = 0;
    s_downslope_t.fill(-999);
    for (let t = 0; t < numTriangles; t++) {
        if (elevation_t[t] < -0.1) {
            let s_best = -1;
            let e_best = elevation_t[t];
            for (let j = 0; j < 3; j++) {
                const s = 3 * t + j;
                const e = elevation_t[mesh.t_outer_s(s)];
                if (e < e_best) {
                    e_best = e;
                    s_best = s;
                }
            }
            t_order[queue_in++] = t;
            s_downslope_t[t] = s_best;
            queue.push(t, elevation_t[t]);
        }
    }
    for (let queue_out = 0; queue_out < numTriangles; queue_out++) {
        const t_current = queue.pop()!;
        for (let j = 0; j < 3; j++) {
            const s = 3 * t_current + j;
            const t_neighbor = mesh.t_outer_s(s);
            if (s_downslope_t[t_neighbor] === -999) {
                s_downslope_t[t_neighbor] = mesh.s_opposite_s(s);
                t_order[queue_in++] = t_neighbor;
                queue.push(t_neighbor, elevation_t[t_neighbor]);
            }
        }
    }
}

function assignMoisture(mesh: Mesh, rainfall_r: Float32Array, moisture_t: Float32Array): void {
    const { numTriangles } = mesh;
    for (let t = 0; t < numTriangles; t++) {
        let moisture = 0.0;
        for (let i = 0; i < 3; i++) {
            const s = 3 * t + i;
            const r = mesh.r_begin_s(s);
            moisture += rainfall_r[r] / 3;
        }
        moisture_t[t] = moisture;
    }
}

function assignFlow(
    mesh: Mesh,
    riversParam: RiversParam,
    t_order: Int32Array,
    elevation_t: Float32Array,
    moisture_t: Float32Array,
    s_downslope_t: Int32Array,
    flow_t: Float32Array,
    flow_s: Float32Array
): void {
    const { numTriangles, _halfedges } = mesh;
    flow_s.fill(0);
    for (let t = 0; t < numTriangles; t++) {
        if (elevation_t[t] >= 0.0) {
            flow_t[t] = riversParam.flow * moisture_t[t] * moisture_t[t];
        } else {
            flow_t[t] = 0;
        }
    }
    for (let i = t_order.length - 1; i >= 0; i--) {
        const t_tributary = t_order[i];
        const s_flow = s_downslope_t[t_tributary];
        if (s_flow >= 0) {
            const t_trunk = (_halfedges[s_flow] / 3) | 0;
            flow_t[t_trunk] += flow_t[t_tributary];
            flow_s[s_flow] += flow_t[t_tributary];
            if (
                elevation_t[t_trunk] > elevation_t[t_tributary] &&
                elevation_t[t_tributary] >= 0.0
            ) {
                elevation_t[t_trunk] = elevation_t[t_tributary];
            }
        }
    }
}
