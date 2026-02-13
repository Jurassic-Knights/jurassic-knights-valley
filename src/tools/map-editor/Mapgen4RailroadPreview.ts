/**
 * Mapgen4RailroadPreview — Draw railroad to canvas for preview.
 * One continuous strip polygon per layer; textured via clip + drawImage along the path.
 */

import { AssetLoader } from '@core/AssetLoader';
import { positionToBiome } from './Mapgen4BiomeConfig';
import { buildCellRegions, findRegionAt } from './Mapgen4RegionUtils';
import {
    RAILROAD_TILE_MESH,
    RAILROAD_PLANK_TILE_MESH,
    RAILROAD_PLANK_WIDTH_FACTOR,
    insertGentleCurveWaypoints,
    buildSplineFineSamplesClosed,
    buildSplineFineSamples
} from './Mapgen4SplineUtils';
import type { Mesh } from './mapgen4/types';
import type Mapgen4Map from './mapgen4/map';
import type { RailroadCrossing } from './Mapgen4Param';

const STEPS_PER_SEGMENT = 24;

export function drawRailroadSpline(
    ctx: CanvasRenderingContext2D,
    mesh: Mesh,
    map: Mapgen4Map,
    path: number[],
    crossings: RailroadCrossing[],
    meshSeed: number,
    toCanvas: (x: number, y: number) => { x: number; y: number },
    scale: number,
    tileWidthCanvas: number,
    vpMinX: number,
    vpMaxX: number,
    vpMinY: number,
    vpMaxY: number
): void {
    if (path.length < 2) return;

    const pts = path.map((r) => ({ x: mesh.x_of_r(r), y: mesh.y_of_r(r) }));
    const isClosed = path.length >= 3 && path[0] === path[path.length - 1];
    const rawPoints = isClosed ? pts.slice(0, -1) : pts;
    const points = insertGentleCurveWaypoints(rawPoints, isClosed);

    const samples =
        isClosed && points.length >= 3
            ? buildSplineFineSamplesClosed(points, STEPS_PER_SEGMENT, false)
            : buildSplineFineSamples(points, STEPS_PER_SEGMENT, false);

    if (samples.length < 2) return;

    const cellRegions = buildCellRegions(mesh);
    const getBiome = (x: number, y: number) => {
        const r = findRegionAt(mesh, x, y, cellRegions);
        const elev = map.elevation_r[r] ?? 0;
        return positionToBiome(x, y, meshSeed, elev);
    };

    const getDirtId = (biome: string) => `ground_base_gravel_${biome}_01`;
    const getPlankId = (biome: string, variant: 1 | 2 | 3) =>
        `arch_railtrack_wood_0${variant}_${biome}_clean`;
    const getMetalId = (biome: string) => `arch_railtrack_metal_${biome}_clean`;

    const halfW = RAILROAD_TILE_MESH / 2;

    /** Build left/right edge points for one continuous strip. */
    const buildStripEdges = (widthFactor: number) => {
        const left: { x: number; y: number }[] = [];
        const right: { x: number; y: number }[] = [];
        for (const s of samples) {
            const px = Math.cos(s.angle + Math.PI / 2) * halfW * widthFactor;
            const py = Math.sin(s.angle + Math.PI / 2) * halfW * widthFactor;
            left.push({ x: s.x - px, y: s.y - py });
            right.push({ x: s.x + px, y: s.y + py });
        }
        return { left, right };
    };

    const dirtImg = AssetLoader.getImage(getDirtId('grasslands'));
    const hasTextures = !!(dirtImg?.complete && dirtImg.naturalWidth);

    // Always draw brown base first so railroad is visible even when textures are loading
    const { left, right } = buildStripEdges(1);
    ctx.beginPath();
    const l0 = toCanvas(left[0].x, left[0].y);
    ctx.moveTo(l0.x, l0.y);
    for (let i = 1; i < left.length; i++) {
        const c = toCanvas(left[i].x, left[i].y);
        ctx.lineTo(c.x, c.y);
    }
    for (let i = right.length - 1; i >= 0; i--) {
        const c = toCanvas(right[i].x, right[i].y);
        ctx.lineTo(c.x, c.y);
    }
    ctx.closePath();
    ctx.fillStyle = '#5c4033';
    ctx.fill();

    if (hasTextures) {
        // Quad-by-quad: each segment is one quad with exact strip vertices (left[i], right[i], right[i+1], left[i+1]).
        // Quads share edges so there are no gaps. Texture tiles continuously using cumLen.
        const plankWidthCanvas = tileWidthCanvas * RAILROAD_PLANK_WIDTH_FACTOR;

        const drawTexturedStrip = (
            left: { x: number; y: number }[],
            right: { x: number; y: number }[],
            getImg: (cumLen: number) => HTMLImageElement | null,
            tileLenMesh: number,
            wCanvas: number
        ) => {
            let cumLen = 0;
            for (let i = 0; i < samples.length - 1; i++) {
                const segLen = samples[i + 1].cumLen - samples[i].cumLen;
                const tileCount = Math.max(1, Math.ceil(segLen / tileLenMesh));

                for (let k = 0; k < tileCount; k++) {
                    const t0 = k / tileCount;
                    const t1 = (k + 1) / tileCount;
                    const left0 = {
                        x: left[i].x + t0 * (left[i + 1].x - left[i].x),
                        y: left[i].y + t0 * (left[i + 1].y - left[i].y)
                    };
                    const right0 = {
                        x: right[i].x + t0 * (right[i + 1].x - right[i].x),
                        y: right[i].y + t0 * (right[i + 1].y - right[i].y)
                    };
                    const right1 = {
                        x: right[i].x + t1 * (right[i + 1].x - right[i].x),
                        y: right[i].y + t1 * (right[i + 1].y - right[i].y)
                    };
                    const left1 = {
                        x: left[i].x + t1 * (left[i + 1].x - left[i].x),
                        y: left[i].y + t1 * (left[i + 1].y - left[i].y)
                    };

                    const img = getImg(cumLen);
                    if (!img?.complete || !img.naturalWidth) {
                        cumLen += segLen / tileCount;
                        continue;
                    }

                    const tileLenMeshActual = segLen / tileCount;
                    const lenCanvas = tileLenMeshActual * scale;
                    const midX = (left0.x + right0.x + left1.x + right1.x) / 4;
                    const midY = (left0.y + right0.y + left1.y + right1.y) / 4;
                    const angle = Math.atan2(
                        (left1.y + right1.y) / 2 - (left0.y + right0.y) / 2,
                        (left1.x + right1.x) / 2 - (left0.x + right0.x) / 2
                    );

                    ctx.save();
                    ctx.beginPath();
                    const l0 = toCanvas(left0.x, left0.y);
                    ctx.moveTo(l0.x, l0.y);
                    ctx.lineTo(toCanvas(right0.x, right0.y).x, toCanvas(right0.x, right0.y).y);
                    ctx.lineTo(toCanvas(right1.x, right1.y).x, toCanvas(right1.x, right1.y).y);
                    ctx.lineTo(toCanvas(left1.x, left1.y).x, toCanvas(left1.x, left1.y).y);
                    ctx.closePath();
                    ctx.clip();

                    const midCanvas = toCanvas(midX, midY);
                    ctx.translate(midCanvas.x, midCanvas.y);
                    ctx.rotate(angle);
                    ctx.drawImage(img, 0, 0, img.width, img.height, -lenCanvas / 2, -wCanvas / 2, lenCanvas, wCanvas);
                    ctx.restore();

                    cumLen += tileLenMeshActual;
                }
            }
        };

        drawTexturedStrip(left, right, (cumLen) => {
            const idx = samples.findIndex((s) => s.cumLen >= cumLen);
            const s = samples[Math.min(idx >= 0 ? idx : samples.length - 1, samples.length - 1)];
            return AssetLoader.getImage(getDirtId(getBiome(s.x, s.y)));
        }, RAILROAD_TILE_MESH, tileWidthCanvas);

        const { left: pLeft, right: pRight } = buildStripEdges(RAILROAD_PLANK_WIDTH_FACTOR);
        drawTexturedStrip(pLeft, pRight, (cumLen) => {
            const idx = samples.findIndex((s) => s.cumLen >= cumLen);
            const s = samples[Math.min(idx >= 0 ? idx : samples.length - 1, samples.length - 1)];
            const variant = (Math.floor(cumLen / RAILROAD_PLANK_TILE_MESH) % 3) + 1 as 1 | 2 | 3;
            return AssetLoader.getImage(getPlankId(getBiome(s.x, s.y), variant));
        }, RAILROAD_PLANK_TILE_MESH, plankWidthCanvas);

        drawTexturedStrip(left, right, (cumLen) => {
            const idx = samples.findIndex((s) => s.cumLen >= cumLen);
            const s = samples[Math.min(idx >= 0 ? idx : samples.length - 1, samples.length - 1)];
            return AssetLoader.getImage(getMetalId(getBiome(s.x, s.y)));
        }, RAILROAD_TILE_MESH, tileWidthCanvas);
    }

    for (const cross of crossings) {
        const x = (mesh.x_of_r(cross.r1) + mesh.x_of_r(cross.r2)) / 2;
        const y = (mesh.y_of_r(cross.r1) + mesh.y_of_r(cross.r2)) / 2;
        const c = toCanvas(x, y);
        if (cross.crossesRiver) {
            ctx.fillStyle = '#6b8e9e';
            ctx.strokeStyle = '#4a6b7a';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(c.x, c.y, 5, 0, 2 * Math.PI);
            ctx.fill();
            ctx.stroke();
        } else {
            ctx.fillStyle = '#8b4513';
            ctx.beginPath();
            ctx.arc(c.x, c.y, 4, 0, 2 * Math.PI);
            ctx.fill();
        }
    }
}
