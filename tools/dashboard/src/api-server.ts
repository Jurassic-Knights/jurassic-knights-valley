/**
 * Dashboard API - TypeScript/Node.js Implementation
 * 
 * Replaces the Python serve_dashboard.py with pure TypeScript.
 * Runs as Vite middleware for a single unified dev server.
 * 
 * Reads entity data directly from src/entities/{category}/*.ts files.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { ServerResponse } from 'http';
import type { Connect, ViteDevServer } from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE_DIR = path.resolve(__dirname, '../../..');
const TOOLS_DIR = path.resolve(BASE_DIR, 'tools');
const IMAGES_DIR = path.resolve(BASE_DIR, 'assets/images');
const ENTITIES_DIR = path.resolve(BASE_DIR, 'src/entities');
const GAME_CONSTANTS_PATH = path.resolve(BASE_DIR, 'src/data/GameConstants.ts');
const GAME_CONFIG_PATH = path.resolve(BASE_DIR, 'src/data/GameConfig.ts');
const BODY_TYPE_CONFIG_PATH = path.resolve(BASE_DIR, 'src/config/BodyTypeConfig.ts');

// ============================================
// UTILITY FUNCTIONS
// ============================================

function sendJson(res: ServerResponse, data: unknown): void {
    const json = JSON.stringify(data);
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.end(json);
}

function readJsonFile(filepath: string): unknown {
    if (!fs.existsSync(filepath)) return null;
    return JSON.parse(fs.readFileSync(filepath, 'utf-8'));
}

function writeJsonFile(filepath: string, data: unknown): void {
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
}

// ============================================
// TYPESCRIPT ENTITY PARSING
// ============================================

interface EntityData {
    id?: string;
    name?: string;
    status?: string;
    files?: { original?: string; clean?: string };
    _sourceFile?: string;
    imageModifiedTime?: number;
    sourceDescription?: string;
    description?: string;
    [key: string]: unknown;
}

function readTsEntity(filepath: string): EntityData | null {
    try {
        const content = fs.readFileSync(filepath, 'utf-8');

        // Extract JSON object from: export default { ... } satisfies ...
        let match = content.match(/export\s+default\s+(\{[\s\S]*\})\s*satisfies/);
        if (!match) {
            // Try simpler pattern: export default { ... }; (with possible newline before ;)
            match = content.match(/export\s+default\s+(\{[\s\S]*\})\s*;?\s*$/);
        }

        if (!match) return null;

        let jsonStr = match[1];

        // Fix trailing commas for JSON parsing
        jsonStr = jsonStr.replace(/,(\s*[}\]])/g, '$1');

        try {
            return JSON.parse(jsonStr);
        } catch {
            return null;
        }
    } catch {
        return null;
    }
}

function writeTsEntity(filepath: string, entity: EntityData): void {
    // Determine entity type from category
    const relPath = path.relative(ENTITIES_DIR, filepath);
    const category = relPath.split(path.sep)[0];

    const typeMap: Record<string, string> = {
        enemies: 'EnemyEntity',
        bosses: 'BossEntity',
        equipment: 'EquipmentEntity',
        items: 'ItemEntity',
        resources: 'ResourceEntity',
        nodes: 'NodeEntity',
        environment: 'EnvironmentEntity',
        npcs: 'NPCEntity',
        hero: 'HeroEntity',
        ui: 'UIEntity',
    };
    const entityType = typeMap[category] || 'BaseEntity';

    const jsonStr = JSON.stringify(entity, null, 4);
    const tsContent = `/**
 * Entity: ${entity.id || 'unknown'}
 * Auto-generated. Edit in dashboard.
 */
import type { ${entityType} } from '@types/entities';

export default ${jsonStr} satisfies ${entityType};
`;

    fs.writeFileSync(filepath, tsContent);
}

function findEntityFile(category: string, itemId: string): string | null {
    const catDir = path.join(ENTITIES_DIR, category);
    if (!fs.existsSync(catDir)) return null;

    // Direct path
    const directPath = path.join(catDir, `${itemId}.ts`);
    if (fs.existsSync(directPath)) return directPath;

    // Try with enemy_ prefix
    if (category === 'enemies' || category === 'bosses') {
        const prefixedPath = path.join(catDir, `enemy_${itemId}.ts`);
        if (fs.existsSync(prefixedPath)) return prefixedPath;
    }

    // Search all files recursively
    const searchDir = (dir: string): string | null => {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                const found = searchDir(fullPath);
                if (found) return found;
            } else if (entry.name.endsWith('.ts') && entry.name !== 'index.ts') {
                const entity = readTsEntity(fullPath);
                if (entity && entity.id === itemId) {
                    return fullPath;
                }
            }
        }
        return null;
    };

    return searchDir(catDir);
}

// ============================================
// CATEGORY HANDLERS
// ============================================

const CATEGORIES = ['enemies', 'bosses', 'npcs', 'equipment', 'items', 'resources', 'environment', 'nodes', 'ui', 'hero'];

function getManifest(): { categories: Record<string, { name: string; count: number }> } {
    const categories: Record<string, { name: string; count: number }> = {};

    for (const cat of CATEGORIES) {
        const catDir = path.join(ENTITIES_DIR, cat);
        let count = 0;

        if (fs.existsSync(catDir)) {
            const countFiles = (dir: string): number => {
                let c = 0;
                const entries = fs.readdirSync(dir, { withFileTypes: true });
                for (const entry of entries) {
                    if (entry.isDirectory()) {
                        c += countFiles(path.join(dir, entry.name));
                    } else if (entry.name.endsWith('.ts') && entry.name !== 'index.ts') {
                        c++;
                    }
                }
                return c;
            };
            count = countFiles(catDir);
        }

        categories[cat] = {
            name: cat.charAt(0).toUpperCase() + cat.slice(1),
            count
        };
    }

    return { categories };
}

function getCategoryData(category: string): { files: Record<string, EntityData[]>; category: string; entities: EntityData[] } {
    if (!category) {
        return { files: {}, category: category || 'unknown', entities: [] };
    }
    const catDir = path.join(ENTITIES_DIR, category);

    if (!fs.existsSync(catDir)) {
        return { files: {}, category, entities: [] };
    }

    const entities: EntityData[] = [];

    const collectEntities = (dir: string): void => {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                collectEntities(fullPath);
            } else if (entry.name.endsWith('.ts') && entry.name !== 'index.ts') {
                const entity = readTsEntity(fullPath);
                if (entity) {
                    if (!entity.status) entity.status = 'pending';
                    entity._sourceFile = entry.name.replace('.ts', '');

                    // Get image modified time
                    const filesDict = entity.files || {};
                    const originalPath = filesDict.original || filesDict.clean || '';
                    if (originalPath) {
                        let absPath = originalPath;
                        if (originalPath.startsWith('assets/') || originalPath.startsWith('images/')) {
                            absPath = path.join(BASE_DIR, originalPath);
                        } else {
                            absPath = path.join(BASE_DIR, 'assets', originalPath);
                        }
                        if (fs.existsSync(absPath)) {
                            entity.imageModifiedTime = Math.floor(fs.statSync(absPath).mtimeMs);
                        } else {
                            entity.imageModifiedTime = 0;
                        }
                    } else {
                        entity.imageModifiedTime = 0;
                    }

                    // Fallback for sourceDescription
                    if (!entity.sourceDescription) {
                        entity.sourceDescription = (entity.description as string) || (entity.name as string) || '';
                    }

                    entities.push(entity);
                }
            }
        }
    };

    collectEntities(catDir);

    // Group by sourceFile for backward compatibility
    const files: Record<string, EntityData[]> = {};
    for (const entity of entities) {
        injectImplicitData(entity, category);
        const sourceFile = (entity.sourceFile as string) || category;
        if (!files[sourceFile]) files[sourceFile] = [];
        files[sourceFile].push(entity);
    }

    return { files, category, entities };
}

function injectImplicitData(entity: EntityData, category: string) {
    if (!entity.sfx) entity.sfx = {};
    const sfx = entity.sfx as Record<string, string>;

    // Nodes: mine, break, respawn
    if (category === 'nodes') {
        const id = entity.id || 'unknown';
        if (!sfx.mine) sfx.mine = `sfx_mine_${id}`;
        if (!sfx.break) sfx.break = `sfx_resource_break_${id}`;
        if (!sfx.respawn) sfx.respawn = `sfx_respawn_${id}`;
    }

    // Items/Resources: pickup, drop
    if (category === 'items' || category === 'resources') {
        if (!sfx.pickup) sfx.pickup = 'sfx_resource_collect'; // Generic fallback
        if (!sfx.drop) sfx.drop = 'sfx_item_drop_light';
    }

    // Equipment: equip, use
    if (category === 'equipment') {
        const isWeapon = entity.slot === 'weapon' || (entity.id && (entity.id as string).includes('tool'));
        if (!sfx.equip) sfx.equip = isWeapon ? 'sfx_equip_weapon' : 'sfx_equip_armor';

        if (isWeapon && !sfx.use) {
            // Check for specific weapon type if available
            const weaponType = (entity.weaponType as string) || 'sword';
            sfx.use = `sfx_weapon_swing`; // Generic or specific based on type?
            // Actually game uses sfx_hero_swing usually, but individual weapons might want overrides
            // Let's suggest specific convention
            if (!sfx.use) sfx.use = `sfx_weapon_swing_${weaponType}`;
        }
    }

    // NPCs: greet, buy
    if (category === 'npcs') {
        if (!sfx.greet) sfx.greet = 'sfx_npc_greet';
        if (!sfx.buy) sfx.buy = 'sfx_npc_buy';
    }
}

function updateCategoryStatus(
    category: string,
    _file: string,
    id: string,
    status: string,
    note?: string
): { success: boolean; message?: string; error?: string } {
    const entityPath = findEntityFile(category, id);
    if (!entityPath) {
        return { success: false, error: `Entity not found: ${id}` };
    }

    const entity = readTsEntity(entityPath);
    if (!entity) {
        return { success: false, error: `Could not parse entity: ${id}` };
    }

    entity.status = status;
    if (note) {
        entity.declineNote = note;
    } else if (status !== 'declined' && entity.declineNote) {
        delete entity.declineNote;
    }

    writeTsEntity(entityPath, entity);
    console.log(`[API] Updated ${id} status = ${status}`);
    return { success: true, message: `Updated ${id} to ${status}` };
}

function updateEntity(
    category: string,
    _file: string,
    id: string,
    updates: Record<string, unknown>
): { success: boolean; message?: string; error?: string } {
    const entityPath = findEntityFile(category, id);
    if (!entityPath) {
        return { success: false, error: `Entity not found: ${id}` };
    }

    const entity = readTsEntity(entityPath);
    if (!entity) {
        return { success: false, error: `Could not parse entity: ${id}` };
    }

    for (const [field, value] of Object.entries(updates)) {
        if (field.includes('.')) {
            const [parent, child] = field.split('.', 2);
            if (!entity[parent]) entity[parent] = {};
            (entity[parent] as Record<string, unknown>)[child] = value;
        } else if (value === null && field in entity) {
            delete entity[field];
        } else {
            entity[field] = value;
        }
    }

    writeTsEntity(entityPath, entity);
    console.log(`[API] Updated ${id}: ${Object.keys(updates).join(', ')}`);
    return { success: true, message: `Updated ${id}` };
}

// ============================================
// SFX QUEUE HANDLERS
// ============================================

function getSfxQueue(): { queue: unknown[]; lastUpdated: string | null } {
    const queueFile = path.join(TOOLS_DIR, 'sfx_regeneration_queue.json');
    const data = readJsonFile(queueFile) as { queue: unknown[]; lastUpdated: string } | null;
    return data || { queue: [], lastUpdated: null };
}

function saveSfxQueue(queue: unknown[]): { success: boolean; message: string } {
    const queueFile = path.join(TOOLS_DIR, 'sfx_regeneration_queue.json');
    const data = {
        queue,
        lastUpdated: new Date().toISOString(),
        note: 'SFX marked for regeneration',
    };
    writeJsonFile(queueFile, data);
    return { success: true, message: `Saved ${queue.length} items` };
}

// ============================================
// NOTES & PROMPTS HANDLERS
// ============================================

function getNotes(): Record<string, string> {
    const notesFile = path.join(TOOLS_DIR, 'decline_notes.json');
    return (readJsonFile(notesFile) as Record<string, string>) || {};
}

function saveNotes(assetName: string, notes: string): { success: boolean } {
    const notesFile = path.join(TOOLS_DIR, 'decline_notes.json');
    const existing = getNotes();
    existing[assetName] = notes;
    writeJsonFile(notesFile, existing);
    return { success: true };
}

function getPrompts(): Record<string, unknown> {
    const promptsFile = path.join(TOOLS_DIR, 'asset_prompts.json');
    return (readJsonFile(promptsFile) as Record<string, unknown>) || {};
}

function savePrompts(prompts: Record<string, unknown>): { success: boolean } {
    const promptsFile = path.join(TOOLS_DIR, 'asset_prompts.json');
    writeJsonFile(promptsFile, prompts);
    return { success: true };
}

// ============================================
// CONFIG HANDLERS
// ============================================

interface ConfigSection {
    [key: string]: unknown;
}

interface GameConfig {
    Core: ConfigSection;
    Hero: ConfigSection;
    Combat: ConfigSection;
    Interaction: ConfigSection;
    Time: ConfigSection;
    Weather: ConfigSection;
    AI: ConfigSection;
    Biome: ConfigSection;
    Spawning: ConfigSection;
    UnlockCosts: number[];
    BodyTypes: Record<string, { scale: number }>;
    WeaponDefaults: Record<string, { range: number; damage: number; attackSpeed: number }>;
    PlayerResources: ConfigSection;
}

function extractSectionContent(content: string, section: string): string | null {
    const sectionStart = content.indexOf(`${section}:`);
    if (sectionStart === -1) return null;
    const openBrace = content.indexOf('{', sectionStart);
    if (openBrace === -1) return null;
    let depth = 1, pos = openBrace + 1;
    while (depth > 0 && pos < content.length) {
        if (content[pos] === '{') depth++;
        else if (content[pos] === '}') depth--;
        pos++;
    }
    if (depth !== 0) return null;
    return content.substring(openBrace + 1, pos - 1);
}

function parseGameConfig(): Partial<GameConfig> {
    if (!fs.existsSync(GAME_CONFIG_PATH)) return {};
    const content = fs.readFileSync(GAME_CONFIG_PATH, 'utf-8');
    const result: Partial<GameConfig> = {};

    // Extract each section from GameConfig.ts (tunable values only)
    const sections = ['Hero', 'Combat', 'Interaction', 'AI', 'Spawning', 'Time', 'BodyTypes', 'WeaponDefaults', 'PlayerResources'];

    for (const section of sections) {
        const sectionContent = extractSectionContent(content, section);

        if (sectionContent) {
            try {
                // Convert to valid JSON
                let jsonStr = '{' + sectionContent + '}';
                // Remove comments
                jsonStr = jsonStr.replace(/\/\/.*$/gm, '');
                // Add quotes to keys
                jsonStr = jsonStr.replace(/(\w+):/g, '"$1":');
                // Remove trailing commas
                jsonStr = jsonStr.replace(/,(\s*[}\]])/g, '$1');
                result[section as keyof GameConfig] = JSON.parse(jsonStr);
            } catch {
                console.log(`[Config] Failed to parse section: ${section}`);
            }
        }
    }

    return result;
}

function parseBodyTypeConfig(): Record<string, { scale: number }> {
    if (!fs.existsSync(BODY_TYPE_CONFIG_PATH)) return {};

    const content = fs.readFileSync(BODY_TYPE_CONFIG_PATH, 'utf-8');
    const result: Record<string, { scale: number }> = {};

    // Match: bodyType: { scale: number }
    const matches = content.matchAll(/(\w+):\s*\{\s*scale:\s*([\d.]+)\s*\}/g);
    for (const match of matches) {
        result[match[1]] = { scale: parseFloat(match[2]) };
    }

    return result;
}

function getConfig(): GameConfig {
    const config = parseGameConfig();

    return {
        Core: {},
        Hero: config.Hero || {},
        Combat: config.Combat || {},
        Interaction: config.Interaction || {},
        Time: config.Time || {},
        Weather: {},
        AI: config.AI || {},
        Biome: {},
        Spawning: config.Spawning || {},
        UnlockCosts: [],
        BodyTypes: config.BodyTypes || {},
        WeaponDefaults: config.WeaponDefaults || {},
        PlayerResources: config.PlayerResources || {}
    };
}

function updateConfigValue(
    section: string,
    key: string,
    value: unknown
): { success: boolean; message?: string; error?: string } {
    console.log(`[Config] updateConfigValue called: section='${section}', key='${key}', value='${value}'`);
    try {
        if (section === 'BodyTypes') {
            // Update BodyTypeConfig.ts
            let content = fs.readFileSync(BODY_TYPE_CONFIG_PATH, 'utf-8');
            const regex = new RegExp(`(${key}:\\s*\\{\\s*scale:\\s*)([\\d.]+)(\\s*\\})`, 'g');
            content = content.replace(regex, `$1${value}$3`);
            fs.writeFileSync(BODY_TYPE_CONFIG_PATH, content);
            console.log(`[Config] Updated BodyTypes.${key} = ${value}`);
        } else if (section === 'WeaponDefaults') {
            // Handle nested weapon keys like 'sword.range'
            let content = fs.readFileSync(GAME_CONFIG_PATH, 'utf-8');
            const [weaponType, stat] = key.split('.');
            const keyRegex = new RegExp(`(${weaponType}:\\s*\\{[^}]*${stat}:\\s*)([\\d.]+)`, 'g');
            content = content.replace(keyRegex, `$1${value}`);
            fs.writeFileSync(GAME_CONFIG_PATH, content);
            console.log(`[Config] Updated WeaponDefaults.${key} = ${value}`);
        } else {
            // Update GameConfig.ts
            let content = fs.readFileSync(GAME_CONFIG_PATH, 'utf-8');

            // Match the key within the section
            const keyRegex = new RegExp(`(${key}:\\s*)([^,\\n]+)`, 'g');
            content = content.replace(keyRegex, `$1${value}`);

            fs.writeFileSync(GAME_CONFIG_PATH, content);
            console.log(`[Config] Updated ${section}.${key} = ${value}`);
        }

        return { success: true, message: `Updated ${section}.${key}` };
    } catch (error) {
        return { success: false, error: String(error) };
    }
}

function resetConfigSection(section: string): { success: boolean; message?: string; error?: string } {
    console.log(`[Config] Resetting section: ${section}`);
    try {
        let content = fs.readFileSync(GAME_CONFIG_PATH, 'utf-8');

        // Find the section in DEFAULTS and copy values to the live config
        const defaultsMatch = content.match(new RegExp(`DEFAULTS\\s*=\\s*\\{[\\s\\S]*?${section}:\\s*\\{([^}]+)\\}`));
        if (!defaultsMatch) {
            return { success: false, error: `Section ${section} not found in DEFAULTS` };
        }

        // Parse default values
        const defaultContent = defaultsMatch[1];
        const keyValuePairs = defaultContent.matchAll(/(\w+):\s*([^,\n]+)/g);

        for (const match of keyValuePairs) {
            const key = match[1];
            const defaultValue = match[2].trim();
            // Update live section with default value
            const keyRegex = new RegExp(`(${section}:[\\s\\S]*?${key}:\\s*)([^,\\n]+)`, 'g');
            content = content.replace(keyRegex, `$1${defaultValue}`);
        }

        fs.writeFileSync(GAME_CONFIG_PATH, content);
        return { success: true, message: `Reset ${section} to defaults` };
    } catch (error) {
        return { success: false, error: String(error) };
    }
}

function saveConfigDefaults(section: string): { success: boolean; message?: string; error?: string } {
    console.log(`[Config] Saving ${section} as new defaults`);
    try {
        let content = fs.readFileSync(GAME_CONFIG_PATH, 'utf-8');

        // Find current values in the live section
        const sectionContent = extractSectionContent(content, section);
        if (!sectionContent) {
            return { success: false, error: `Section ${section} not found` };
        }

        // Parse current values and update DEFAULTS
        const keyValuePairs = sectionContent.matchAll(/(\w+):\s*([^,\n}]+)/g);

        for (const match of keyValuePairs) {
            const key = match[1];
            const currentValue = match[2].trim();
            // Update DEFAULTS section with current value
            const defaultKeyRegex = new RegExp(`(DEFAULTS\\s*=[\\s\\S]*?${section}:[\\s\\S]*?${key}:\\s*)([^,\\n}]+)`, 'g');
            content = content.replace(defaultKeyRegex, `$1${currentValue}`);
        }

        fs.writeFileSync(GAME_CONFIG_PATH, content);
        return { success: true, message: `Saved ${section} as new defaults` };
    } catch (error) {
        return { success: false, error: String(error) };
    }
}

// ============================================
// ASSET SYNC
// ============================================

function syncAssetsToGame(): { success: boolean; message: string } {
    console.log('[API] Sync assets to game requested');
    return { success: true, message: 'Asset sync initiated' };
}

// ============================================
// VITE MIDDLEWARE PLUGIN
// ============================================

async function parseBody(req: Connect.IncomingMessage): Promise<Record<string, unknown>> {
    return new Promise((resolve) => {
        let body = '';
        req.on('data', (chunk) => (body += chunk));
        req.on('end', () => {
            try {
                resolve(body ? JSON.parse(body) : {});
            } catch {
                resolve({});
            }
        });
    });
}

export function dashboardApiPlugin() {
    return {
        name: 'dashboard-api',
        configureServer(server: ViteDevServer) {
            // Handle API routes
            server.middlewares.use(async (req, res, next) => {
                const url = req.url || '';

                // Only handle /api/* routes
                if (!url.startsWith('/api')) {
                    return next();
                }

                console.log(`[API] ${req.method} ${url}`);

                try {
                    // GET endpoints
                    if (req.method === 'GET') {
                        if (url === '/api/manifest') {
                            return sendJson(res, getManifest());
                        }
                        if (url === '/api/get_sfx_queue') {
                            return sendJson(res, getSfxQueue());
                        }
                        if (url === '/api/get_notes') {
                            return sendJson(res, getNotes());
                        }
                        if (url === '/api/get_prompts') {
                            return sendJson(res, getPrompts());
                        }
                        if (url === '/api/config') {
                            return sendJson(res, getConfig());
                        }
                    }

                    // POST endpoints
                    if (req.method === 'POST') {
                        const data = await parseBody(req);
                        const apiPath = url.split('?')[0];

                        if (apiPath === '/api/get_category') {
                            return sendJson(res, getCategoryData(data.category as string));
                        }
                        if (apiPath === '/api/update_category_status') {
                            return sendJson(res, updateCategoryStatus(
                                data.category as string,
                                data.file as string,
                                data.id as string,
                                data.status as string,
                                data.note as string | undefined
                            ));
                        }
                        if (apiPath === '/api/update_entity') {
                            return sendJson(res, updateEntity(
                                data.category as string,
                                data.file as string,
                                data.id as string,
                                data.updates as Record<string, unknown>
                            ));
                        }
                        if (apiPath === '/api/save_sfx_regen_queue') {
                            return sendJson(res, saveSfxQueue(data.queue as unknown[]));
                        }
                        if (apiPath === '/api/save_notes') {
                            return sendJson(res, saveNotes(data.assetName as string, data.notes as string));
                        }
                        if (apiPath === '/api/save_prompts') {
                            return sendJson(res, savePrompts(data));
                        }
                        if (apiPath === '/api/sync_assets' || apiPath === '/api/sync_to_game') {
                            return sendJson(res, syncAssetsToGame());
                        }
                        if (apiPath === '/api/get_all_categories') {
                            const result: Record<string, unknown> = {};
                            for (const cat of CATEGORIES) {
                                result[cat] = getCategoryData(cat);
                            }
                            return sendJson(res, result);
                        }
                        if (apiPath === '/api/update_config') {
                            return sendJson(res, updateConfigValue(
                                data.section as string,
                                data.key as string,
                                data.value
                            ));
                        }
                        if (apiPath === '/api/reset_config_section') {
                            return sendJson(res, resetConfigSection(data.section as string));
                        }
                        if (apiPath === '/api/save_config_defaults') {
                            return sendJson(res, saveConfigDefaults(data.section as string));
                        }
                    }

                    // OPTIONS for CORS
                    if (req.method === 'OPTIONS') {
                        res.setHeader('Access-Control-Allow-Origin', '*');
                        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
                        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
                        res.statusCode = 204;
                        return res.end();
                    }

                    // Not found
                    res.statusCode = 404;
                    return sendJson(res, { error: 'Not found' });

                } catch (error) {
                    console.error('[API] Error:', error);
                    res.statusCode = 500;
                    return sendJson(res, { success: false, error: String(error) });
                }
            });

            // Serve images from assets/images
            server.middlewares.use('/images', (req, res, next) => {
                const imagePath = path.join(IMAGES_DIR, req.url || '');
                if (fs.existsSync(imagePath)) {
                    const ext = path.extname(imagePath).toLowerCase();
                    const mimeTypes: Record<string, string> = {
                        '.png': 'image/png',
                        '.jpg': 'image/jpeg',
                        '.jpeg': 'image/jpeg',
                        '.gif': 'image/gif',
                        '.webp': 'image/webp',
                    };
                    res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream');
                    fs.createReadStream(imagePath).pipe(res);
                } else {
                    next();
                }
            });
        },
    };
}
