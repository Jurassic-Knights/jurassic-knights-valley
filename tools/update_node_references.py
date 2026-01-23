#!/usr/bin/env python3
"""Update manifest.ts and generate new AssetLoader entries"""
import json
import os
import re

# Get all node ts files from directory
nodes_dir = 'src/entities/nodes'
actual_nodes = [f.replace('.ts', '') for f in os.listdir(nodes_dir) if f.endswith('.ts') and f != 'index.ts']

# 1. Update manifest.ts
manifest_path = 'src/entities/manifest.ts'
with open(manifest_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Extract the JSON portion from the TypeScript file
match = re.search(r'export const ENTITY_MANIFEST: EntityManifest = (\{[\s\S]*\});', content)
if match:
    manifest = json.loads(match.group(1))
    manifest['nodes'] = sorted(actual_nodes)
    
    # Rebuild the TypeScript file
    ts_content = '''/**
 * Entity Manifest - List of entity IDs by category
 */

export interface EntityManifest {
    enemies: string[];
    bosses: string[];
    nodes: string[];
    resources: string[];
    items: string[];
    equipment: string[];
    npcs: string[];
    environment: string[];
    hero: string[];
}

export const ENTITY_MANIFEST: EntityManifest = ''' + json.dumps(manifest, indent=2) + ';\n'
    
    with open(manifest_path, 'w', encoding='utf-8') as f:
        f.write(ts_content)
    print(f'Updated manifest.ts with {len(actual_nodes)} nodes')
else:
    print('ERROR: Could not parse manifest.ts')

# 2. Generate new AssetLoader entries
print('\n// New AssetLoader node entries:')
for node_id in sorted(actual_nodes):
    print(f'                "{node_id}": {{ "path": "images/nodes/{node_id}_original.png" }},')
