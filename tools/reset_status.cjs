const fs = require('fs');
const path = require('path');

function getAllFiles(dirPath, arrayOfFiles) {
    if (!fs.existsSync(dirPath)) return arrayOfFiles || [];
    const files = fs.readdirSync(dirPath);
    arrayOfFiles = arrayOfFiles || [];
    files.forEach(function (file) {
        const fullPath = path.join(dirPath, file);
        if (fs.statSync(fullPath).isDirectory()) {
            arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
        } else {
            if (file.endsWith('.ts')) arrayOfFiles.push(fullPath);
        }
    });
    return arrayOfFiles;
}

const dir = 'src/entities/ground';
const files = getAllFiles(dir);
console.log(`Scanning ${files.length} files in ${dir}`);

let updateCount = 0;

files.forEach(file => {
    try {
        let content = fs.readFileSync(file, 'utf8');
        // Regex to match status: 'declined' or "status": "declined" with robust quote handling
        // Captures: 1: key+colon+space, 2: quote char
        const regex = /(["']?status["']?\s*:\s*)(["'])declined\2/g;

        if (regex.test(content)) {
            const newContent = content.replace(regex, '$1$2pending$2');
            fs.writeFileSync(file, newContent);
            console.log(`Reset status for ${path.basename(file)}`);
            updateCount++;
        }
    } catch (err) {
        console.error(`Failed to update ${file}: ${err.message}`);
    }
});

console.log(`Total Updated: ${updateCount}`);
