const { execSync } = require('child_process');
const fs = require('fs');

try {
    execSync('npx eslint "src/**/*.{ts,js}" -f json > lint_utf8.json', { stdio: 'pipe' });
} catch (e) {
    // Expected to fail if there are lint errors
}

if (!fs.existsSync('lint_utf8.json')) {
    console.log('Failed to generate lint_utf8.json');
    process.exit(1);
}

try {
    const data = JSON.parse(fs.readFileSync('lint_utf8.json', 'utf8'));
    const files = data.filter(d => d.warningCount > 0);
    files.forEach(f => {
        const relPath = f.filePath.replace(/\\/g, '/').split('jurassic-knights-valley/')[1];
        console.log(`${relPath} - ${f.warningCount} warnings`);
        f.messages.forEach(m => console.log(`  Line ${m.line}: ${m.message}`));
    });
} catch (e) {
    console.error('Error parsing JSON:', e);
}
