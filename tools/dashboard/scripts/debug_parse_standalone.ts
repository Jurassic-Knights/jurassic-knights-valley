
import fs from 'fs';
import path from 'path';

const filepath = 'c:/Users/Anthony/.gemini/antigravity/scratch/jurassic-knights-valley/src/entities/nodes/node_mining_t1_01.ts';

function readTsEntity(filepath: string) {
    try {
        const content = fs.readFileSync(filepath, 'utf-8');
        console.log(`Reading file: ${filepath}`);

        let match = content.match(/export\s+default\s+(\{[\s\S]*\})\s*satisfies/);
        if (!match) {
            match = content.match(/export\s+default\s+(\{[\s\S]*\})\s*;?\s*$/);
        }

        if (!match) {
            console.log("No match found!");
            return null;
        }

        const jsonStr = match[1];
        console.log("Captured JSON string length:", jsonStr.length);
        // console.log("JSON String Snippet:", jsonStr.substring(0, 200));

        try {
            const parseFn = new Function(`return ${jsonStr};`);
            const parsed = parseFn();
            return parsed;
        } catch (e) {
            console.error("Parse error:", e);
            return null;
        }
    } catch (e) {
        console.error("Read error:", e);
        return null;
    }
}

const entity = readTsEntity(filepath);
console.log("Parsed Entity:", JSON.stringify(entity, null, 2));
console.log("Biome Field:", entity?.biome);
