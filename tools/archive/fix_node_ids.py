#!/usr/bin/env python3
"""
Rename all descriptive node IDs to tier-based naming convention in nodes.json.
Updates IDs and file paths in place.
"""
import os
import json
import re

# Mapping: old descriptive name -> new tier-based ID
node_mapping = {
    # T1 Grasslands/Basic (starting area)
    'node_berry_bush': 'node_t1_02',
    'node_copper_vein': 'node_t1_03',
    'node_oak_tree': 'node_t1_04',
    'node_riverbank': 'node_t1_05',
    'node_stone_pile': 'node_t1_06',
    'node_tall_grass': 'node_t1_07',
    'node_wild_wheat': 'node_t1_08',
    
    # T2 Transition zones
    'node_ash_tree': 'node_t2_03',
    'node_burrow_nest': 'node_t2_04',
    'node_carcass': 'node_t2_05',
    'node_coal_seam': 'node_t2_06',
    'node_desert_cactus': 'node_t2_07',
    'node_desert_remains': 'node_t2_08',
    'node_desert_rock': 'node_t2_09',
    'node_frozen_ground': 'node_t2_10',
    'node_ice_hole': 'node_t2_11',
    'node_iron_deposit': 'node_t2_12',
    'node_salt_flat': 'node_t2_13',
    'node_salt_formation': 'node_t2_14',
    
    # T3 Dangerous zones
    'node_acacia_tree': 'node_t3_02',
    'node_ash_pile': 'node_t3_03',
    'node_badlands_nest': 'node_t3_04',
    'node_badlands_outcrop': 'node_t3_05',
    'node_sandy_deposit': 'node_t3_06',
    'node_silver_vein': 'node_t3_07',
    'node_sulfur_vent': 'node_t3_08',
    
    # T4 Endgame zones
    'node_deep_vein': 'node_t4_02',
    'node_field_kitchen': 'node_t4_03',
    'node_ironwood_tree': 'node_t4_04',
}

def update_nodes_json():
    """Update nodes.json with new IDs and file paths"""
    nodes_file = 'tools/nodes/nodes.json'
    
    with open(nodes_file, 'r', encoding='utf-8') as f:
        nodes = json.load(f)
    
    updated_count = 0
    for node in nodes:
        old_id = node.get('id', '')
        if old_id in node_mapping:
            new_id = node_mapping[old_id]
            
            # Update ID
            node['id'] = new_id
            
            # Update file paths
            if 'files' in node:
                for key in node['files']:
                    node['files'][key] = node['files'][key].replace(old_id, new_id)
            
            updated_count += 1
            print(f'Updated: {old_id} -> {new_id}')
    
    with open(nodes_file, 'w', encoding='utf-8') as f:
        json.dump(nodes, f, indent=4, ensure_ascii=False)
    
    print(f'\nUpdated {updated_count} nodes in nodes.json')
    return updated_count

def update_asset_manifest():
    """Update asset_manifest.js with new IDs"""
    manifest_file = 'tools/asset_manifest.js'
    
    with open(manifest_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    for old_id, new_id in node_mapping.items():
        content = content.replace(old_id, new_id)
    
    with open(manifest_file, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print('Updated asset_manifest.js')

def update_copy_nodes():
    """Update copy_nodes.py with new IDs"""
    script_file = 'tools/copy_nodes.py'
    
    if not os.path.exists(script_file):
        print('copy_nodes.py not found, skipping')
        return
    
    with open(script_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    for old_id, new_id in node_mapping.items():
        content = content.replace(old_id, new_id)
    
    with open(script_file, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print('Updated copy_nodes.py')

if __name__ == '__main__':
    print('=== Updating Node IDs to Tier-Based Convention ===\n')
    update_nodes_json()
    print()
    update_asset_manifest()
    print()
    update_copy_nodes()
    print('\n=== Complete ===')
    print('\nNote: Image files in assets/images/nodes/ still have old names.')
    print('They will still work since file paths are updated in JSON.')
