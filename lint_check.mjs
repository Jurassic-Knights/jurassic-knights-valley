import { execSync } from 'child_process';
import fs from 'fs';

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
    let outputStr = '';
    files.forEach(f => {
        const relPath = f.filePath.replace(/\\/g, '/').split('jurassic-knights-valley/')[1];
        outputStr += `${relPath} - ${f.warningCount} warnings\n`;
        f.messages.forEach(m => {
            outputStr += `  Line ${m.line}: ${m.message}\n`;
        });
    });
    fs.writeFileSync('lint_out_safe.txt', outputStr);
    console.log('Wrote to lint_out_safe.txt');
} catch (e) {
    console.error('Error parsing JSON:', e);
}
