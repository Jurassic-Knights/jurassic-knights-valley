import { Logger } from '../Logger';
import { MapEditorConfig } from '../../tools/map-editor/MapEditorConfig';

// Import Worker using Vite/Webpack syntax
import GroundWorker from '../../workers/GroundRenderWorker?worker';

export interface BlendAssets {
    base: Uint8ClampedArray;
    overlay: Uint8ClampedArray;
    heightMap: Uint8ClampedArray;
    noise: Uint8ClampedArray;
    // Layer Dimensions (Crucial for mixed resolution assets)
    baseWidth?: number;
    overlayWidth?: number;
    heightWidth?: number;
    noiseWidth?: number;
    width: number;  // Fallback / legacy
    height: number;
}

export interface BlendConfig {
    thresholdBias: number; // 0.0 - 1.0
    noiseScale: number;    // Multiplier
    tileX?: number; // For World Space Mapping
    tileY?: number;
}

interface WorkerJob {
    resolve: (bitmap: ImageBitmap) => void;
    reject: (err: unknown) => void;
}

export class GroundBlendRenderer {
    private worker: Worker;
    private jobs: Map<number, WorkerJob>;
    private jobIdCounter: number = 0;

    constructor() {
        this.worker = new GroundWorker();
        this.jobs = new Map();

        this.worker.onmessage = (e) => {
            const { jobId, success, buffer, error } = e.data;
            const job = this.jobs.get(jobId);
            if (job) {
                if (success) {
                    // Create ImageBitmap from buffer
                    const size = MapEditorConfig.TILE_SIZE;
                    const arr = new Uint8ClampedArray(buffer);
                    const imgData = new ImageData(arr, size, size);
                    createImageBitmap(imgData).then(job.resolve).catch(job.reject);
                } else {
                    job.reject(new Error(error));
                }
                this.jobs.delete(jobId);
            }
        };
    }

    /**
     * Extracts ImageData from an Image Source (Once)
     */
    public static extractData(img: HTMLImageElement | HTMLCanvasElement): Uint8ClampedArray {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Context failure');
        ctx.drawImage(img, 0, 0);
        return ctx.getImageData(0, 0, img.width, img.height).data;
    }

    /**
     * Generate a composite tile via Web Worker
     */
    public async generateTile(
        splatWeights: Uint8ClampedArray | number,
        assets: BlendAssets,
        config: BlendConfig = { thresholdBias: 0.1, noiseScale: 0.2 }
    ): Promise<ImageBitmap> {
        return new Promise((resolve, reject) => {
            const id = this.jobIdCounter++;
            this.jobs.set(id, { resolve, reject });

            // Copy buffers to avoid transfer neutering the source cache?
            // If we transfer, the cache in GroundSystem becomes empty!
            // WE MUST NOT TRANSFER THE ASSET BUFFERS.
            // We only copy them. Structured Clone is automatic for ArrayBuffers in postMessage (copy).
            // This might still be heavy (4 x 4KB copies per tile). 
            // 4KB is tiny. Copying is fine.

            this.worker.postMessage({
                jobId: id,
                width: assets.width,
                height: assets.height,
                splatWeights,
                // Explicitly slice (copy) the buffers to prevent any risk of detachment
                // This ensures the main thread cache remains valid for other tiles.
                baseBuffer: assets.base.buffer.slice(0),
                overlayBuffer: assets.overlay.buffer.slice(0),
                heightBuffer: assets.heightMap.buffer.slice(0),
                noiseBuffer: assets.noise.buffer.slice(0),
                config,
                // Pass Dimensions
                baseWidth: assets.baseWidth,
                overlayWidth: assets.overlayWidth,
                heightWidth: assets.heightWidth,
                noiseWidth: assets.noiseWidth,
                noiseWidth: assets.noiseWidth,
                tileX: config.tileX,
                tileY: config.tileY,
                tileSize: MapEditorConfig.TILE_SIZE
            });
        });
    }

    public destroy() {
        this.worker.terminate();
    }
}

