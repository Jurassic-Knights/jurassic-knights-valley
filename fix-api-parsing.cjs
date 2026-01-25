const fs = require('fs');
const file = 'tools/dashboard/src/api-server.ts';
let content = fs.readFileSync(file, 'utf8');

// Replace the regex line with extractSectionContent call
content = content.replace(
    /const regex = new RegExp\(`\$\{section\}.*?'s'\);/g,
    'const sectionContent = extractSectionContent(content, section);'
);

// Replace match variable references
content = content.replace(/const match = content\.match\(regex\);/g, '');
content = content.replace(/if \(match\) \{/g, 'if (sectionContent) {');
content = content.replace(/match\[1\]/g, 'sectionContent');

fs.writeFileSync(file, content);
console.log('Fixed api-server.ts parsing');
