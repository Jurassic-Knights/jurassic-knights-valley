/**
 * BiomeManager - Handles world biome boundaries, detection, and roads
 *
 * World Size: 30,000 x 30,000 pixels
 * Biomes: Badlands (N), Grasslands (W), Ironhaven (C), Tundra (E), Desert (SW)
 *
 * Uses polygon boundaries for natural-looking biome shapes.
 */

// Ambient declarations for global dependencies
declare const Logger: any;
declare const RoadsData: any;
declare const Registry: any;

const BiomeManager = {
    // Biome IDs
    BIOME_IDS: {
        OCEAN: 'ocean',
        IRONHAVEN: 'ironhaven',
        GRASSLANDS: 'grasslands',
        DESERT: 'desert',
        BADLANDS: 'badlands',
        TUNDRA: 'tundra'
    },

    // Biome definitions with polygon boundaries (clockwise points)
    BIOMES: {
        ironhaven: {
            id: 'ironhaven',
            name: 'Ironhaven',
            description: 'The central fortress city with floating islands',
            color: '#8B4513',
            tier: 0,
            // Roughly rectangular but with organic edges
            polygon: [
                { x: 10500, y: 10200 },
                { x: 19200, y: 10000 },
                { x: 19800, y: 11000 },
                { x: 20000, y: 15000 },
                { x: 19500, y: 19000 },
                { x: 19000, y: 19800 },
                { x: 15000, y: 20200 },
                { x: 11000, y: 19800 },
                { x: 10200, y: 19000 },
                { x: 10000, y: 15000 },
                { x: 10200, y: 11000 }
            ]
        },
        grasslands: {
            id: 'grasslands',
            name: 'Grasslands',
            description: 'Lush green plains with docile herbivores',
            color: '#4CAF50',
            tier: 1,
            // Western region with rolling edges
            polygon: [
                { x: 500, y: 8000 },
                { x: 3000, y: 7500 },
                { x: 6000, y: 9000 },
                { x: 8000, y: 10000 },
                { x: 10000, y: 11000 },
                { x: 10200, y: 15000 },
                { x: 10000, y: 19000 },
                { x: 8000, y: 20500 },
                { x: 4000, y: 21000 },
                { x: 1500, y: 20000 },
                { x: 500, y: 17000 },
                { x: 1000, y: 13000 }
            ]
        },
        tundra: {
            id: 'tundra',
            name: 'Tundra',
            description: 'Frozen wasteland with Frost Raptors',
            color: '#B3E5FC',
            tier: 3,
            // Eastern frozen region with jagged ice edges
            polygon: [
                { x: 20000, y: 11000 },
                { x: 22000, y: 9000 },
                { x: 25000, y: 8500 },
                { x: 28000, y: 10000 },
                { x: 29500, y: 14000 },
                { x: 29000, y: 18000 },
                { x: 27000, y: 22000 },
                { x: 24000, y: 24000 },
                { x: 21000, y: 23000 },
                { x: 19500, y: 20000 },
                { x: 20000, y: 16000 }
            ]
        },
        badlands: {
            id: 'badlands',
            name: 'Badlands',
            description: 'Volcanic region with lava flows and aggressive predators',
            color: '#BF360C',
            tier: 4,
            // Northern volcanic region with craggy edges
            polygon: [
                { x: 4000, y: 500 },
                { x: 10000, y: 1000 },
                { x: 15000, y: 500 },
                { x: 20000, y: 1500 },
                { x: 24000, y: 3000 },
                { x: 25000, y: 6000 },
                { x: 23000, y: 8000 },
                { x: 20000, y: 10000 },
                { x: 15000, y: 10200 },
                { x: 10000, y: 10000 },
                { x: 6000, y: 9000 },
                { x: 3000, y: 6000 },
                { x: 2000, y: 3000 }
            ]
        },
        desert: {
            id: 'desert',
            name: 'Desert',
            description: 'Arid sands with Desert Stalkers and Saurians',
            color: '#FFB74D',
            tier: 2,
            // Southwestern sandy region with dune-like edges
            polygon: [
                { x: 500, y: 21000 },
                { x: 4000, y: 21500 },
                { x: 8000, y: 21000 },
                { x: 11000, y: 20000 },
                { x: 14000, y: 21000 },
                { x: 16000, y: 23000 },
                { x: 15000, y: 26000 },
                { x: 12000, y: 28000 },
                { x: 8000, y: 29000 },
                { x: 4000, y: 28500 },
                { x: 1500, y: 27000 },
                { x: 500, y: 24000 }
            ]
        }
    },

    // Roads data now loaded from RoadsData.js
    get ROADS() {
        return RoadsData?.ROADS || [];
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
    getBiomeAt(x, y) {
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
    pointInPolygon(x, y, polygon) {
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

    getBiomeIdAt(x, y) {
        const biome = this.getBiomeAt(x, y);
        return biome ? biome.id : this.BIOME_IDS.OCEAN;
    },

    isOnRoad(x, y) {
        for (const road of this.ROADS) {
            if (this.pointToSplineDistance(x, y, road) <= road.width / 2) {
                return true;
            }
        }
        return false;
    },

    getSpeedMultiplier(x, y) {
        return this.isOnRoad(x, y) ? this.ROAD_SPEED_MULTIPLIER : 1.0;
    },

    pointToLineDistance(px, py, from, to) {
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        const lengthSq = dx * dx + dy * dy;

        if (lengthSq === 0) {
            return Math.sqrt((px - from.x) ** 2 + (py - from.y) ** 2);
        }

        let t = ((px - from.x) * dx + (py - from.y) * dy) / lengthSq;
        t = Math.max(0, Math.min(1, t));

        const projX = from.x + t * dx;
        const projY = from.y + t * dy;

        return Math.sqrt((px - projX) ** 2 + (py - projY) ** 2);
    },

    isValidPosition(x, y) {
        return this.getBiomeAt(x, y) !== null;
    },

    ironhavenToWorld(localX, localY) {
        return {
            x: localX + this.IRONHAVEN_OFFSET.x,
            y: localY + this.IRONHAVEN_OFFSET.y
        };
    },

    worldToIronhaven(worldX, worldY) {
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
    getBiomePolygon(biomeId) {
        return this.BIOMES[biomeId]?.polygon || [];
    },

    // ==================== SPLINE MATH ====================

    /**
     * Evaluate cubic Bezier curve at parameter t (0-1)
     * @param {number} t - Parameter (0 = start, 1 = end)
     * @param {Array} points - Array of 4 control points [{x, y}, ...]
     * @returns {{x: number, y: number}}
     */
    evaluateBezier(t, points) {
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
    evaluateBezierTangent(t, points) {
        const [p0, p1, p2, p3] = points;
        const mt = 1 - t;
        const mt2 = mt * mt;
        const t2 = t * t;

        // First derivative of cubic Bezier
        const dx = 3 * mt2 * (p1.x - p0.x) + 6 * mt * t * (p2.x - p1.x) + 3 * t2 * (p3.x - p2.x);
        const dy = 3 * mt2 * (p1.y - p0.y) + 6 * mt * t * (p2.y - p1.y) + 3 * t2 * (p3.y - p2.y);
        const len = Math.sqrt(dx * dx + dy * dy) || 1;

        return { x: dx / len, y: dy / len };
    },

    /**
     * Sample N points along a spline road
     * @param {object} road - Road with .points array
     * @param {number} segments - Number of segments to sample
     * @returns {Array} Array of {x, y, angle} objects
     */
    getSplinePoints(road, segments = 20) {
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
    pointToSplineDistance(px, py, road) {
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
    getSplineLength(road) {
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

    getDebugInfo(x, y) {
        const biome = this.getBiomeAt(x, y);
        const onRoad = this.isOnRoad(x, y);
        const biomeName = biome ? biome.name : 'Ocean';
        return `Biome: ${biomeName}${onRoad ? ' [ROAD +30%]' : ''}`;
    }
};

if (Registry) Registry.register('BiomeManager', BiomeManager);

export { BiomeManager };
