const fs = require('fs');
const data = JSON.parse(fs.readFileSync('.agent/eslint-report-phase5b.json', 'utf8'));

const results = [];
for (const file of data) {
    if (file.errorCount === 0 && file.warningCount === 0) continue;

    for (const msg of file.messages) {
        if (msg.ruleId === '@typescript-eslint/no-unused-vars' || msg.ruleId === '@typescript-eslint/no-require-imports') {
            const shortName = file.filePath.split(/src[\\/]/)[1] || file.filePath;
            results.push(`${shortName}:${msg.line} - ${msg.message}`);
        }
    }
}

fs.writeFileSync('.agent/eslint-remains.txt', `Found ${results.length} warnings.\n` + results.join('\n'));
console.log('Wrote to .agent/eslint-remains.txt');
