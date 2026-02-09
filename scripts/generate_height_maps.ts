import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

// ESM dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ASSETS_DIR = path.resolve(__dirname, '../assets/images/ground');
const OUTPUT_SUFFIX = '_height';

/**
 * Height Map Generator
 * 
 * Logic:
 * 1. Read all _clean.png and _original.png files in assets/images/ground
 * 2. Convert to Grayscale (Luminance)
 * 3. Invert? No, we decided: "Darker pixels (cracks) fill up first".
 *    - In blend logic: `if (height < threshold) draw_overlay`
 *    - If threshold increases from 0 to 1:
 *    - Height 0 (Black) gets covered first.
 *    - Height 1 (White) gets covered last.
 *    - So Black = Deep/Cracks. White = High/Tips.
 *    - Standard accessible luminance is High=White.
 *    - Stoneshard style: Cracks are dark. Stones are light.
 *    - So direct Luminance is perfect.
 * 4. Save as [filename]_height.png
 */

async function main() {
    console.log(`[HeightGen] Scanning ${ASSETS_DIR}...`);

    if (!fs.existsSync(ASSETS_DIR)) {
        console.error(`[HeightGen] Directory not found: ${ASSETS_DIR}`);
        return;
    }

    const files = fs.readdirSync(ASSETS_DIR);
    const groundImages = files.filter(f =>
        (f.endsWith('_clean.png') || f.endsWith('_original.png')) &&
        !f.includes('_height.png') &&
        !f.includes('_splat.png')
    );

    console.log(`[HeightGen] Found ${groundImages.length} ground textures.`);

    for (const file of groundImages) {
        const filePath = path.join(ASSETS_DIR, file);

        // Determine output name
        // ground_grass_01_clean.png -> ground_grass_01_clean_height.png?
        // Or strip suffix?
        // Usually we want a stable ID. 
        // Let's just append _height to the base name before extension.
        const ext = path.extname(file);
        const baseName = path.basename(file, ext);

        // Skip if height map already exists and is newer? 
        // For now, force regen to ensure latest logic.
        const outName = `${baseName}${OUTPUT_SUFFIX}.png`;
        const outPath = path.join(ASSETS_DIR, outName);

        try {
            // Processing pipeline
            // 1. Grayscale
            // 2. Normalize? (Ensure full 0-255 range for best blend depth)

            console.log(`[HeightGen] Processing ${file} -> ${outName}`);

            await sharp(filePath)
                .grayscale() // Convert to luminance 
                .normalize() // Stretch contrast to full 0-255 range (Crucial for good blending)
                .toFile(outPath);

        } catch (e) {
            console.error(`[HeightGen] Failed to process ${file}:`, e);
        }
    }

    console.log('[HeightGen] Done.');
}

main();
