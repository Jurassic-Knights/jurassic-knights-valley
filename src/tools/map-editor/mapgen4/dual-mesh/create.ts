/*
 * From https://www.redblobgames.com/x/2312-dual-mesh/
 * Copyright 2017, 2023 Red Blob Games
 * License: Apache v2.0
 */

import type { Point } from './index';

type Bounds = { left: number; top: number; width: number; height: number };

export function generateInteriorBoundaryPoints(bounds: Bounds, boundarySpacing: number): Point[] {
    const epsilon = 1e-4;
    const curvature = 1.0;
    const W = Math.ceil((bounds.width - 2 * curvature) / boundarySpacing);
    const H = Math.ceil((bounds.height - 2 * curvature) / boundarySpacing);
    const points: Point[] = [];
    for (let q = 0; q < W; q++) {
        const t = q / W;
        const dx = (bounds.width - 2 * curvature) * t;
        const dy = epsilon + curvature * 4 * (t - 0.5) ** 2;
        points.push(
            [bounds.left + curvature + dx, bounds.top + dy],
            [bounds.left + bounds.width - curvature - dx, bounds.top + bounds.height - dy]
        );
    }
    for (let r = 0; r < H; r++) {
        const t = r / H;
        const dy = (bounds.height - 2 * curvature) * t;
        const dx = epsilon + curvature * 4 * (t - 0.5) ** 2;
        points.push(
            [bounds.left + dx, bounds.top + bounds.height - curvature - dy],
            [bounds.left + bounds.width - dx, bounds.top + curvature + dy]
        );
    }
    return points;
}

export function generateExteriorBoundaryPoints(bounds: Bounds, boundarySpacing: number): Point[] {
    const curvature = 1.0;
    const diagonal = boundarySpacing / Math.sqrt(2);
    const points: Point[] = [];
    const W = Math.ceil((bounds.width - 2 * curvature) / boundarySpacing);
    const H = Math.ceil((bounds.height - 2 * curvature) / boundarySpacing);
    for (let q = 0; q < W; q++) {
        const t = q / W;
        const dx = (bounds.width - 2 * curvature) * t + boundarySpacing / 2;
        points.push(
            [bounds.left + dx, bounds.top - diagonal],
            [bounds.left + bounds.width - dx, bounds.top + bounds.height + diagonal]
        );
    }
    for (let r = 0; r < H; r++) {
        const t = r / H;
        const dy = (bounds.height - 2 * curvature) * t + boundarySpacing / 2;
        points.push(
            [bounds.left - diagonal, bounds.top + bounds.height - dy],
            [bounds.left + bounds.width + diagonal, bounds.top + dy]
        );
    }
    points.push(
        [bounds.left - diagonal, bounds.top - diagonal],
        [bounds.left + bounds.width + diagonal, bounds.top - diagonal],
        [bounds.left - diagonal, bounds.top + bounds.height + diagonal],
        [bounds.left + bounds.width + diagonal, bounds.top + bounds.height + diagonal]
    );
    return points;
}
