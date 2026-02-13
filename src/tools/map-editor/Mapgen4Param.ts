/**
 * Mapgen4Param — Parameter types for mapgen4 generation.
 */

import type { ElevationParam, BiomesParam, RiversParam } from './mapgen4/map';
import type { TownSite } from './TownGenerator';
import type { RoadSegment } from './RoadGenerator';
import type { RailroadCrossing } from './RailroadGenerator';

export type { TownSite, RoadSegment, RailroadCrossing };

export interface TownsParam {
    enabled: boolean;
    numTowns: number;
    minSpacing: number;
    townRadius: number;
    defaultZoneId: string;
    elevationMin: number;
    elevationMax: number;
    rainfallMin: number;
    rainfallMax: number;
    seed?: number;
}

export interface RoadsParam {
    enabled: boolean;
    baseWidth: number;
    shortcutsPerTown: number;
    riverCrossingCost: number;
    seed?: number;
    coverageGridSize: number;
    slopeWeight: number;
    waypointCurviness?: number;
}

export interface RailroadsParam {
    enabled: boolean;
    slopeWeight: number;
    turnWeight?: number;
    /** Cost multiplier when crossing rivers (>1 = prefer land). Bridges added at river crossings. */
    riverCrossingCost?: number;
    seed?: number;
}

export interface Mapgen4Param {
    spacing: number;
    mountainSpacing: number;
    meshSeed: number;
    elevation: ElevationParam;
    biomes: BiomesParam;
    rivers: RiversParam;
    towns?: TownsParam;
    roads?: RoadsParam;
    railroads?: RailroadsParam;
}
