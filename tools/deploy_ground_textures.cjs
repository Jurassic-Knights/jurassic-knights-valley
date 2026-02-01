const fs = require('fs');
const path = require('path');

const SOURCE_DIR = 'C:\\Users\\Anthony\\.gemini\\antigravity\\brain\\caea7d4e-be54-4adf-93ca-70327f0e799a';
const DEST_DIR = 'C:\\Users\\Anthony\\.gemini\\antigravity\\scratch\\jurassic-knights-valley\\assets\\images\\ground';

if (!fs.existsSync(DEST_DIR)) {
    console.error(`Destination directory does not exist: ${DEST_DIR}`);
    process.exit(1);
}

const files = fs.readdirSync(SOURCE_DIR);
let count = 0;

console.log(`Scanning ${SOURCE_DIR} for ground textures...`);

files.forEach(file => {
    // Match pattern: ground_..._TIMESTAMP.png
    // Example: ground_base_dirt_desert_01_1769922970575.png
    // We want to extract "ground_base_dirt_desert_01"

    if (!file.endsWith('.png') || !file.startsWith('ground_')) return;

    // Regex to find the timestamp suffix (13 digits usually)
    const match = file.match(/^(ground_.*)_(\d{13})\.png$/);

    if (match) {
        const baseName = match[1];
        const newFileName = `${baseName}_original.png`;
        const sourcePath = path.join(SOURCE_DIR, file);
        const destPath = path.join(DEST_DIR, newFileName);

        // Copy file
        fs.copyFileSync(sourcePath, destPath);
        console.log(`Deployed: ${newFileName}`);
        count++;
    }
});

console.log(`\nDeployment Complete. ${count} images deployed.`);
