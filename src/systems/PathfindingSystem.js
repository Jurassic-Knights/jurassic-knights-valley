/**
 * PathfindingSystem - A* pathfinding for grid-based navigation
 *
 * Uses the IslandManager's grid system to find paths around obstacles.
 * Enemies use this to intelligently navigate to destinations.
 *
 * Owner: AI Systems
 */

class PathfindingSystem {
    constructor() {
        this.game = null;
        this.gridSize = 64; // Pathfinding grid cell size (finer than zone grid)
        this.pathCache = new Map(); // Cache recent paths
        this.cacheTimeout = GameConstants?.AI?.PATHFINDING_CACHE_TIMEOUT || 2000; // Clear cache after 2 seconds

        // Pre-allocated A* data structures (GC optimization)
        this._openSet = [];
        this._closedSet = new Set();
        this._cameFrom = new Map();
        this._gScore = new Map();
        this._fScore = new Map();

        Logger.info('[PathfindingSystem] Constructed');
    }

    init(game) {
        this.game = game;
        Logger.info('[PathfindingSystem] Initialized');
        return true;
    }

    /**
     * Find a path from start to end using A*
     * @param {number} startX - Start world X
     * @param {number} startY - Start world Y
     * @param {number} endX - End world X
     * @param {number} endY - End world Y
     * @returns {Array<{x: number, y: number}>} Array of waypoints, or empty if no path
     */
    findPath(startX, startY, endX, endY) {
        // Convert to grid coordinates
        const startNode = this.worldToGrid(startX, startY);
        const endNode = this.worldToGrid(endX, endY);

        // Check cache
        const cacheKey = `${startNode.gx},${startNode.gy}-${endNode.gx},${endNode.gy}`;
        const cached = this.pathCache.get(cacheKey);
        if (cached && Date.now() - cached.time < this.cacheTimeout) {
            return cached.path;
        }

        // If start or end is blocked, try to find nearby valid positions
        if (this.isGridBlocked(startNode.gx, startNode.gy)) {
            const valid = this.findNearestValidCell(startNode.gx, startNode.gy);
            if (valid) {
                startNode.gx = valid.gx;
                startNode.gy = valid.gy;
            }
        }
        if (this.isGridBlocked(endNode.gx, endNode.gy)) {
            const valid = this.findNearestValidCell(endNode.gx, endNode.gy);
            if (valid) {
                endNode.gx = valid.gx;
                endNode.gy = valid.gy;
            }
        }

        // Same cell?
        if (startNode.gx === endNode.gx && startNode.gy === endNode.gy) {
            return [{ x: endX, y: endY }];
        }

        // A* algorithm - use pooled data structures (cleared for reuse)
        const openSet = this._openSet;
        const closedSet = this._closedSet;
        const cameFrom = this._cameFrom;
        const gScore = this._gScore;
        const fScore = this._fScore;

        // Clear pooled structures for reuse
        openSet.length = 0;
        closedSet.clear();
        cameFrom.clear();
        gScore.clear();
        fScore.clear();

        const startKey = `${startNode.gx},${startNode.gy}`;
        const endKey = `${endNode.gx},${endNode.gy}`;

        gScore.set(startKey, 0);
        fScore.set(startKey, this.heuristic(startNode, endNode));
        openSet.push({ ...startNode, key: startKey });

        let iterations = 0;
        const maxIterations = GameConstants?.AI?.PATHFINDING_MAX_ITERATIONS || 500; // Prevent infinite loops

        while (openSet.length > 0 && iterations < maxIterations) {
            iterations++;

            // Get node with lowest fScore
            openSet.sort(
                (a, b) => (fScore.get(a.key) || Infinity) - (fScore.get(b.key) || Infinity)
            );
            const current = openSet.shift();

            // Reached goal?
            if (current.key === endKey) {
                const path = this.reconstructPath(cameFrom, current, endX, endY);
                this.pathCache.set(cacheKey, { path, time: Date.now() });
                return path;
            }

            closedSet.add(current.key);

            // Check neighbors (8 directions)
            const neighbors = this.getNeighbors(current.gx, current.gy);

            for (const neighbor of neighbors) {
                const neighborKey = `${neighbor.gx},${neighbor.gy}`;

                if (closedSet.has(neighborKey)) continue;
                if (this.isGridBlocked(neighbor.gx, neighbor.gy)) continue;

                // Diagonal movement cost is higher
                const isDiagonal = neighbor.gx !== current.gx && neighbor.gy !== current.gy;
                const moveCost = isDiagonal ? 1.414 : 1;

                const tentativeG = (gScore.get(current.key) || 0) + moveCost;

                if (tentativeG < (gScore.get(neighborKey) || Infinity)) {
                    cameFrom.set(neighborKey, current);
                    gScore.set(neighborKey, tentativeG);
                    fScore.set(neighborKey, tentativeG + this.heuristic(neighbor, endNode));

                    if (!openSet.find((n) => n.key === neighborKey)) {
                        openSet.push({ ...neighbor, key: neighborKey });
                    }
                }
            }
        }

        // No path found
        this.pathCache.set(cacheKey, { path: [], time: Date.now() });
        return [];
    }

    /**
     * Heuristic function (Manhattan distance)
     */
    heuristic(a, b) {
        return Math.abs(a.gx - b.gx) + Math.abs(a.gy - b.gy);
    }

    /**
     * Reconstruct path from A* result
     */
    reconstructPath(cameFrom, current, endX, endY) {
        const path = [];
        let node = current;

        while (node) {
            const worldPos = this.gridToWorld(node.gx, node.gy);
            path.unshift(worldPos);
            node = cameFrom.get(node.key);
        }

        // Add exact destination as final waypoint
        if (path.length > 0) {
            path[path.length - 1] = { x: endX, y: endY };
        }

        // Simplify path - remove redundant waypoints in straight lines
        return this.simplifyPath(path);
    }

    /**
     * Simplify path by removing collinear points
     */
    simplifyPath(path) {
        if (path.length <= 2) return path;

        const simplified = [path[0]];

        for (let i = 1; i < path.length - 1; i++) {
            const prev = simplified[simplified.length - 1];
            const curr = path[i];
            const next = path[i + 1];

            // Check if direction changes
            const dx1 = Math.sign(curr.x - prev.x);
            const dy1 = Math.sign(curr.y - prev.y);
            const dx2 = Math.sign(next.x - curr.x);
            const dy2 = Math.sign(next.y - curr.y);

            if (dx1 !== dx2 || dy1 !== dy2) {
                simplified.push(curr);
            }
        }

        simplified.push(path[path.length - 1]);
        return simplified;
    }

    /**
     * Get valid neighbor cells
     */
    getNeighbors(gx, gy) {
        const neighbors = [];
        const dirs = [
            { dx: 0, dy: -1 }, // N
            { dx: 1, dy: -1 }, // NE
            { dx: 1, dy: 0 }, // E
            { dx: 1, dy: 1 }, // SE
            { dx: 0, dy: 1 }, // S
            { dx: -1, dy: 1 }, // SW
            { dx: -1, dy: 0 }, // W
            { dx: -1, dy: -1 } // NW
        ];

        for (const dir of dirs) {
            const ngx = gx + dir.dx;
            const ngy = gy + dir.dy;

            // For diagonals, ensure both adjacent cells are passable
            if (dir.dx !== 0 && dir.dy !== 0) {
                if (this.isGridBlocked(gx + dir.dx, gy) || this.isGridBlocked(gx, gy + dir.dy)) {
                    continue; // Can't cut corners
                }
            }

            neighbors.push({ gx: ngx, gy: ngy });
        }

        return neighbors;
    }

    /**
     * Check if a grid cell is blocked
     */
    isGridBlocked(gx, gy) {
        const worldPos = this.gridToWorld(gx, gy);
        const im = window.IslandManager;

        if (!im) return false;

        // Check if walkable AND not blocked
        return !im.isWalkable(worldPos.x, worldPos.y) || im.isBlocked(worldPos.x, worldPos.y);
    }

    /**
     * Find nearest valid cell from a blocked position
     */
    findNearestValidCell(gx, gy) {
        for (let radius = 1; radius <= 5; radius++) {
            for (let dx = -radius; dx <= radius; dx++) {
                for (let dy = -radius; dy <= radius; dy++) {
                    if (Math.abs(dx) !== radius && Math.abs(dy) !== radius) continue;

                    const testGx = gx + dx;
                    const testGy = gy + dy;

                    if (!this.isGridBlocked(testGx, testGy)) {
                        return { gx: testGx, gy: testGy };
                    }
                }
            }
        }
        return null;
    }

    /**
     * Convert world coordinates to pathfinding grid
     */
    worldToGrid(x, y) {
        return {
            gx: Math.floor(x / this.gridSize),
            gy: Math.floor(y / this.gridSize)
        };
    }

    /**
     * Convert pathfinding grid to world coordinates (cell center)
     */
    gridToWorld(gx, gy) {
        return {
            x: gx * this.gridSize + this.gridSize / 2,
            y: gy * this.gridSize + this.gridSize / 2
        };
    }

    /**
     * Clear path cache
     */
    clearCache() {
        this.pathCache.clear();
    }
}

// Singleton
window.PathfindingSystem = new PathfindingSystem();
if (window.Registry) Registry.register('PathfindingSystem', window.PathfindingSystem);

// ES6 Module Export
export { PathfindingSystem };
