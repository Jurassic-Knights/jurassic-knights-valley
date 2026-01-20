#!/usr/bin/env python3
"""Generate AssetLoader entries for node assets"""
import os
import json

# Generate AssetLoader entries for all node images
nodes_dir = 'assets/images/nodes'
entries = []

for f in sorted(os.listdir(nodes_dir)):
    if f.endswith('_original.png') and not '_consumed_' in f:
        node_id = f.replace('_original.png', '')
        path = f'images/nodes/{node_id}_original.png'
        entries.append(f'"{node_id}": {{ "path": "{path}" }}')
        
        # Check for consumed version
        consumed = node_id + '_consumed_original.png'
        if os.path.exists(os.path.join(nodes_dir, consumed)):
            entries.append(f'"{node_id}_consumed": {{ "path": "images/nodes/{consumed}" }}')

print('// Node assets for AssetLoader:')
for e in entries:
    print(f'                {e},')
