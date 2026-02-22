/**
 * BiomeManager - Handles world biome boundaries, detection, and roads
 *
 * World Size: 30,000 x 30,000 pixels
 * Biomes: Badlands (N), Grasslands (W), Ironhaven (C), Tundra (E), Desert (SW)
 *
 * Uses polygon boundaries for natural-looking biome shapes.
 */

import { Logger } from '@core/Logger';
import { RoadsData } from '@data/RoadsData';
import { Registry } from '@core/Registry';
import { MathUtils } from '@core/MathUtils';
import { BIOME_POLYGONS } from './BiomePolygons';
import { RoadDef } from '../types/world'; // Re-added RoadDef as it's used

const BiomeManager = {
    BIOME_IDS: {
        OCEAN: 'ocean',
        IRONHAVEN: 'ironhaven',
        GRASSLANDS: 'grasslands',
        DESERT: 'desert',
        BADLANDS: 'badlands',
        TUNDRA: 'tundra'
    },

    BIOMES: BIOME_POLYGONS,

    // Roads data now loaded from RoadsData.js
    get ROADS(): RoadDef[] {
        return (RoadsData?.ROADS || []) as RoadDef[];
    },

    ROAD_SPEED_MULTIPLIER: 1.3,
    WORLD_WIDTH: 30000,
    WORLD_HEIGHT: 30000,
    IRONHAVEN_OFFSET: { x: 10000, y: 10000 },

    init() {
        Logger.info(
            '[BiomeManager] Initialized - World size:',
            this.WORLD_WIDTH,
            'x',
            this.WORLD_HEIGHT
        );
        Logger.info('[BiomeManager] Biomes:', Object.keys(this.BIOMES).join(', '));
    },

    /**
     * Get the biome at a given world position using polygon hit test
     */
    getBiomeAt(x: number, y: number) {
        // Check each biome's polygon (order matters - Ironhaven checked first for priority)
        const priority = ['ironhaven', 'grasslands', 'tundra', 'badlands', 'desert'];
        for (const biomeId of priority) {
            const biome = this.BIOMES[biomeId];
            if (biome.polygon && this.pointInPolygon(x, y, biome.polygon)) {
                return biome;
            }
        }
        return null; // Ocean
    },

    /**
     * Point-in-polygon test using ray casting algorithm
     */
    pointInPolygon(x: number, y: number, polygon: { x: number; y: number }[]) {
        let inside = false;
        const n = polygon.length;

        for (let i = 0, j = n - 1; i < n; j = i++) {
            const xi = polygon[i].x,
                yi = polygon[i].y;
            const xj = polygon[j].x,
                yj = polygon[j].y;

            if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
                inside = !inside;
            }
        }
        return inside;
    },

    getBiomeIdAt(x: number, y: number) {
        const biome = this.getBiomeAt(x, y);
        return biome ? biome.id : this.BIOME_IDS.OCEAN;
    },

    isOnRoad(x: number, y: number) {
        for (const road of this.ROADS) {
            if (this.pointToSplineDistance(x, y, road) <= road.width / 2) {
                return true;
            }
        }
        return false;
    },

    getSpeedMultiplier(x: number, y: number) {
        return this.isOnRoad(x, y) ? this.ROAD_SPEED_MULTIPLIER : 1.0;
    },

    pointToLineDistance(
        px: number,
        py: number,
        from: { x: number; y: number },
        to: { x: number; y: number }
    ) {
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        const lengthSq = dx * dx + dy * dy;

        if (lengthSq === 0) {
            return MathUtils.distance(px, py, from.x, from.y);
        }

        let t = ((px - from.x) * dx + (py - from.y) * dy) / lengthSq;
        // t = Math.max(0, Math.min(1, t));
        t = MathUtils.clamp(t, 0, 1);

        const projX = from.x + t * dx;
        const projY = from.y + t * dy;

        return MathUtils.distance(px, py, projX, projY);
    },

    evaluateBezierTangent(t: number, points: { x: number; y: number }[]) {
        const [p0, p1, p2, p3] = points;
        const mt = 1 - t;
        const mt2 = mt * mt;
        const t2 = t * t;

        // First derivative of cubic Bezier
        const dx = 3 * mt2 * (p1.x - p0.x) + 6 * mt * t * (p2.x - p1.x) + 3 * t2 * (p3.x - p2.x);
        const dy = 3 * mt2 * (p1.y - p0.y) + 6 * mt * t * (p2.y - p1.y) + 3 * t2 * (p3.y - p2.y);
        const len = Math.sqrt(dx * dx + dy * dy) || 1; // Keeping Math.sqrt here for vector normalization as MathUtils doesn't have normalize yet

        return { x: dx / len, y: dy / len };
    },

    isValidPosition(x: number, y: number) {
        return this.getBiomeAt(x, y) !== null;
    },

    ironhavenToWorld(localX: number, localY: number) {
        return {
            x: localX + this.IRONHAVEN_OFFSET.x,
            y: localY + this.IRONHAVEN_OFFSET.y
        };
    },

    worldToIronhaven(worldX: number, worldY: number) {
        return {
            x: worldX - this.IRONHAVEN_OFFSET.x,
            y: worldY - this.IRONHAVEN_OFFSET.y
        };
    },

    getRoads() {
        return this.ROADS;
    },

    /**
     * Get polygon points for a biome (for rendering)
     */
    getBiomePolygon(biomeId: string) {
        return this.BIOMES[biomeId]?.polygon || [];
    },

    // ==================== SPLINE MATH ====================

    /**
     * Evaluate cubic Bezier curve at parameter t (0-1)
     * @param {number} t - Parameter (0 = start, 1 = end)
     * @param {Array} points - Array of 4 control points [{x, y}, ...]
     * @returns {{x: number, y: number}}
     */
    evaluateBezier(t: number, points: { x: number; y: number }[]) {
        const [p0, p1, p2, p3] = points;
        const mt = 1 - t;
        const mt2 = mt * mt;
        const mt3 = mt2 * mt;
        const t2 = t * t;
        const t3 = t2 * t;

        return {
            x: mt3 * p0.x + 3 * mt2 * t * p1.x + 3 * mt * t2 * p2.x + t3 * p3.x,
            y: mt3 * p0.y + 3 * mt2 * t * p1.y + 3 * mt * t2 * p2.y + t3 * p3.y
        };
    },

    /**
     * Get tangent vector at parameter t on Bezier curve
     */

    /**
     * Sample N points along a spline road
     * @param {object} road - Road with .points array
     * @param {number} segments - Number of segments to sample
     * @returns {Array} Array of {x, y, angle} objects
     */
    getSplinePoints(road: RoadDef, segments = 20) {
        const result = [];
        for (let i = 0; i <= segments; i++) {
            const t = i / segments;
            const pos = this.evaluateBezier(t, road.points);
            const tangent = this.evaluateBezierTangent(t, road.points);
            const angle = Math.atan2(tangent.y, tangent.x);
            result.push({ x: pos.x, y: pos.y, angle, t });
        }
        return result;
    },

    /**
     * Calculate minimum distance from point to spline road
     * Uses sampling approach for performance
     */
    pointToSplineDistance(px: number, py: number, road: RoadDef) {
        const samples = 32; // Higher = more accurate but slower
        let minDistSq = Infinity;

        for (let i = 0; i <= samples; i++) {
            const t = i / samples;
            const pos = this.evaluateBezier(t, road.points);
            const dx = px - pos.x;
            const dy = py - pos.y;
            const distSq = dx * dx + dy * dy;
            if (distSq < minDistSq) {
                minDistSq = distSq;
            }
        }

        return Math.sqrt(minDistSq);
    },

    /**
     * Get approximate length of a spline road
     */
    getSplineLength(road: RoadDef) {
        const samples = 20;
        let length = 0;
        let prevPos = this.evaluateBezier(0, road.points);

        for (let i = 1; i <= samples; i++) {
            const t = i / samples;
            const pos = this.evaluateBezier(t, road.points);
            length += Math.sqrt((pos.x - prevPos.x) ** 2 + (pos.y - prevPos.y) ** 2);
            prevPos = pos;
        }

        return length;
    },

    getDebugInfo(x: number, y: number) {
        const biome = this.getBiomeAt(x, y);
        const onRoad = this.isOnRoad(x, y);
        const biomeName = biome ? biome.name : 'Ocean';
        return `Biome: ${biomeName}${onRoad ? ' [ROAD +30%]' : ''}`;
    }
};

if (Registry) Registry.register('BiomeManager', BiomeManager);

export { BiomeManager };
