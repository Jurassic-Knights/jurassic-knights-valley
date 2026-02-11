/*
 * From https://www.redblobgames.com/maps/mapgen4/
 * Copyright 2023 Red Blob Games
 * License: Apache-2.0
 */

import type { Point } from './dual-mesh/index';
import { generateExteriorBoundaryPoints, generateInteriorBoundaryPoints } from './dual-mesh/create';
import { makeRandFloat } from './Prng';

// ESM import (Vite bundles CJS package for browser)
import FastPoissonDiskSampling from 'fast-2d-poisson-disk-sampling';

export type { Point };

export interface PointsData {
    points: Point[];
    numExteriorBoundaryPoints: number;
    numInteriorBoundaryPoints: number;
    numMountainPoints: number;
}

export function choosePoints(seed: number, spacing: number, mountainSpacing: number): PointsData {
    const boundarySpacing = spacing * Math.sqrt(2);
    const bounds = { left: 0, top: 0, width: 1000, height: 1000 };
    const interiorBoundaryPoints = generateInteriorBoundaryPoints(bounds, boundarySpacing);
    const exteriorBoundaryPoints = generateExteriorBoundaryPoints(bounds, boundarySpacing);

    const rng = makeRandFloat(seed);
    const mountainPointsGenerator = new FastPoissonDiskSampling(
        {
            shape: [bounds.width, bounds.height],
            radius: mountainSpacing,
            tries: 30
        },
        rng
    );
    for (const p of interiorBoundaryPoints) {
        if (!mountainPointsGenerator.addPoint(p)) {
            throw new Error('mountain point did not get added');
        }
    }
    const interiorPoints: Point[] = mountainPointsGenerator.fill();

    const numMountainPoints = interiorPoints.length - interiorBoundaryPoints.length;

    const generator = new FastPoissonDiskSampling(
        {
            shape: [bounds.width, bounds.height],
            radius: spacing,
            tries: 6
        },
        rng
    );
    for (const p of interiorPoints) {
        if (!generator.addPoint(p)) {
            throw new Error('point did not get added');
        }
    }
    const allInterior = generator.fill();

    return {
        points: exteriorBoundaryPoints.concat(allInterior),
        numExteriorBoundaryPoints: exteriorBoundaryPoints.length,
        numInteriorBoundaryPoints: interiorBoundaryPoints.length,
        numMountainPoints
    };
}
