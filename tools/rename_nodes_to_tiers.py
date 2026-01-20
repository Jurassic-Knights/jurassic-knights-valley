#!/usr/bin/env python3
"""
Rename all descriptive node files to tier-based naming convention.
node_oak_tree.json -> node_t1_02.json, etc.
Also updates the JSON content, image files, manifest, and AssetLoader.
"""
import os
import json
import shutil

# Current tier-based nodes that already exist
existing_tier_nodes = ['node_t1_01', 'node_t2_01', 'node_t2_02', 'node_t3_01', 'node_t4_01']

# Mapping: old descriptive name -> (tier, biome category)
# Group by biome/tier for logical organization
node_mapping = {
    # T1 Grasslands/Basic (starting area)
    'node_oak_tree': 'node_t1_02',
    'node_berry_bush': 'node_t1_03',
    'node_stone_pile': 'node_t1_04',
    'node_tall_grass': 'node_t1_05',
    'node_wild_wheat': 'node_t1_06',
    
    # T2 Transition zones
    'node_ash_tree': 'node_t2_03',
    'node_ash_pile': 'node_t2_04',
    'node_iron_deposit': 'node_t2_05',
    'node_copper_vein': 'node_t2_06',
    'node_coal_seam': 'node_t2_07',
    'node_riverbank': 'node_t2_08',
    
    # T2 Desert/Arid
    'node_desert_cactus': 'node_t2_09',
    'node_desert_rock': 'node_t2_10',
    'node_sandy_deposit': 'node_t2_11',
    'node_salt_flat': 'node_t2_12',
    
    # T3 Dangerous zones
    'node_ironwood_tree': 'node_t3_02',
    'node_acacia_tree': 'node_t3_03',
    'node_silver_vein': 'node_t3_04',
    'node_deep_vein': 'node_t3_05',
    'node_carcass': 'node_t3_06',
    'node_burrow_nest': 'node_t3_07',
    'node_sulfur_vent': 'node_t3_08',
    
    # T3 Tundra/Cold
    'node_frozen_ground': 'node_t3_09',
    'node_ice_hole': 'node_t3_10',
    
    # T3 Desert advanced
    'node_desert_remains': 'node_t3_11',
    'node_salt_formation': 'node_t3_12',
    
    # T4 Endgame zones
    'node_badlands_nest': 'node_t4_02',
    'node_badlands_outcrop': 'node_t4_03',
    'node_field_kitchen': 'node_t4_04',
}

nodes_dir = 'src/entities/nodes'
images_dir = 'assets/images/nodes'

def rename_node(old_id, new_id):
    """Rename a node: JSON file, update internal data, rename image files"""
    old_json = os.path.join(nodes_dir, f'{old_id}.json')
    new_json = os.path.join(nodes_dir, f'{new_id}.json')
    
    # 1. Update and rename JSON file
    if os.path.exists(old_json):
        with open(old_json, 'r') as f:
            data = json.load(f)
        
        # Update ID and sprite
        data['id'] = new_id
        data['sprite'] = new_id
        
        # Update file paths
        if 'files' in data:
            for key in data['files']:
                data['files'][key] = data['files'][key].replace(old_id, new_id)
        
        # Write to new file
        with open(new_json, 'w') as f:
            json.dump(data, f, indent=2)
        
        # Remove old file
        os.remove(old_json)
        print(f'JSON: {old_id}.json -> {new_id}.json')
    
    # 2. Rename image files
    for suffix in ['_original.png', '_consumed_original.png', '_clean.png', '_consumed_clean.png']:
        old_img = os.path.join(images_dir, f'{old_id}{suffix}')
        new_img = os.path.join(images_dir, f'{new_id}{suffix}')
        if os.path.exists(old_img):
            os.rename(old_img, new_img)
            print(f'IMG: {old_id}{suffix} -> {new_id}{suffix}')

# Execute renaming
for old_id, new_id in node_mapping.items():
    rename_node(old_id, new_id)

print(f'\nRenamed {len(node_mapping)} nodes to tier-based convention.')
print('\nNow update:')
print('1. manifest.json - Replace old node IDs with new ones')
print('2. AssetLoader.js - Update asset entries')
print('3. WorldData.js - Use new node IDs')
