/**
 * RoadRenderer - Renders spline roads with tiled textures
 * 
 * Stretches a road tile image along Bezier spline curves.
 * Tile size = 128px (1 grid cell)
 * 
 * Owner: Graphics Engineer
 */
class RoadRenderer {
    constructor() {
        this.game = null;
        this.roadTile = null;
        this.tileSize = 128; // 1 grid cell
        this.tileLoaded = false;

        Logger.info('[RoadRenderer] Constructed');
    }

    init(game) {
        this.game = game;
        this.loadRoadTile();
        Logger.info('[RoadRenderer] Initialized');
    }

    /**
     * Load the road tile image
     */
    loadRoadTile() {
        // Check if AssetLoader has a road tile
        if (window.AssetLoader && typeof AssetLoader.getImage === 'function') {
            const tile = AssetLoader.getImage('road_tile');
            if (tile && tile.complete && tile.naturalWidth) {
                this.roadTile = tile;
                this.tileLoaded = true;
                Logger.info('[RoadRenderer] Road tile loaded from AssetLoader');
                return;
            }
        }

        // Create a procedural road tile as fallback
        this.createProceduralTile();
    }

    /**
     * Create a procedural dirt road tile
     */
    createProceduralTile() {
        const size = this.tileSize;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        // Base dirt color
        ctx.fillStyle = '#8B6914';
        ctx.fillRect(0, 0, size, size);

        // Add some texture variation
        for (let i = 0; i < 50; i++) {
            const x = Math.random() * size;
            const y = Math.random() * size;
            const r = 2 + Math.random() * 4;
            const brightness = 0.8 + Math.random() * 0.4;
            ctx.fillStyle = `rgba(${Math.floor(139 * brightness)}, ${Math.floor(105 * brightness)}, ${Math.floor(20 * brightness)}, 0.5)`;
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fill();
        }

        // Add edge shadows
        const edgeGrad = ctx.createLinearGradient(0, 0, size, 0);
        edgeGrad.addColorStop(0, 'rgba(0, 0, 0, 0.3)');
        edgeGrad.addColorStop(0.15, 'rgba(0, 0, 0, 0)');
        edgeGrad.addColorStop(0.85, 'rgba(0, 0, 0, 0)');
        edgeGrad.addColorStop(1, 'rgba(0, 0, 0, 0.3)');
        ctx.fillStyle = edgeGrad;
        ctx.fillRect(0, 0, size, size);

        // Store as image
        this.roadTile = new Image();
        this.roadTile.src = canvas.toDataURL();
        this.tileLoaded = true;

        Logger.info('[RoadRenderer] Procedural road tile created');
    }

    /**
     * Render all roads to the given context
     * @param {CanvasRenderingContext2D} ctx 
     * @param {object} viewport - { x, y, width, height }
     */
    render(ctx, viewport) {
        if (!this.tileLoaded || !window.BiomeManager) return;

        ctx.save();

        for (const road of BiomeManager.ROADS) {
            this.renderSplineRoad(ctx, road, viewport);
        }

        ctx.restore();
    }

    /**
     * Render a single spline road with tiled texture
     */
    renderSplineRoad(ctx, road, viewport) {
        if (!road.points || road.points.length < 4) return;

        // Get the approximate length of the spline
        const length = BiomeManager.getSplineLength(road);
        const tileCount = Math.ceil(length / this.tileSize);

        // Sample points along the spline (one per tile)
        const segmentsPerTile = 1;
        const totalSegments = tileCount * segmentsPerTile;

        for (let i = 0; i < totalSegments; i++) {
            const t = i / totalSegments;
            const tNext = (i + 1) / totalSegments;

            // Get position and tangent at this point
            const pos = BiomeManager.evaluateBezier(t, road.points);
            const tangent = BiomeManager.evaluateBezierTangent(t, road.points);
            const angle = Math.atan2(tangent.y, tangent.x);

            // Skip if outside viewport (with margin)
            const margin = this.tileSize * 2;
            if (pos.x < viewport.x - margin || pos.x > viewport.x + viewport.width + margin ||
                pos.y < viewport.y - margin || pos.y > viewport.y + viewport.height + margin) {
                continue;
            }

            // Calculate tile dimensions
            const tileWidth = this.tileSize;
            const tileHeight = road.width || this.tileSize;

            // Draw the road tile rotated to follow the curve
            ctx.save();
            ctx.translate(pos.x, pos.y);
            ctx.rotate(angle);

            // Draw tile centered on the spline
            ctx.drawImage(
                this.roadTile,
                -tileWidth / 2,
                -tileHeight / 2,
                tileWidth,
                tileHeight
            );

            ctx.restore();
        }
    }

    /**
     * Update (placeholder for animations)
     */
    update(dt) {
        // Could add animated road effects here
    }
}

// Create singleton instance
window.RoadRenderer = new RoadRenderer();
if (window.Registry) Registry.register('RoadRenderer', window.RoadRenderer);
