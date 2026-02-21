import fs from 'fs';
import path from 'path';

const loaderFile = fs.readFileSync('./src/core/AssetLoader.ts', 'utf-8');

function getAllFiles(dirPath, arrayOfFiles) {
    const files = fs.readdirSync(dirPath);
    arrayOfFiles = arrayOfFiles || [];
    files.forEach(function (file) {
        if (fs.statSync(dirPath + "/" + file).isDirectory()) {
            arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
        } else {
            arrayOfFiles.push(path.join(dirPath, "/", file).replace(/\\/g, '/'));
        }
    });
    return arrayOfFiles;
}

const allImages = getAllFiles('./assets/images');
const orphans = [];
allImages.forEach(img => {
    const basename = path.basename(img);
    if (!loaderFile.includes(basename)) {
        orphans.push(img);
    }
});

console.log(`Total images in assets/images: ${allImages.length}`);
console.log(`Found ${orphans.length} orphan images.`);
if (orphans.length > 0) {
    console.log("First 20 orphans:");
    console.log(orphans.slice(0, 20));
}
