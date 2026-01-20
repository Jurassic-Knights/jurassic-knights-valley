#!/usr/bin/env python3
"""Update manifest.json and generate new AssetLoader entries"""
import json
import os

# Get all node json files from directory
nodes_dir = 'src/entities/nodes'
actual_nodes = [f.replace('.json', '') for f in os.listdir(nodes_dir) if f.endswith('.json')]

# 1. Update manifest.json
with open('src/entities/manifest.json', 'r') as f:
    manifest = json.load(f)

manifest['nodes'] = sorted(actual_nodes)

with open('src/entities/manifest.json', 'w') as f:
    json.dump(manifest, f, indent=2)
print(f'Updated manifest.json with {len(actual_nodes)} nodes')

# 2. Generate new AssetLoader entries
print('\n// New AssetLoader node entries:')
for node_id in sorted(actual_nodes):
    print(f'                "{node_id}": {{ "path": "images/nodes/{node_id}_original.png" }},')
