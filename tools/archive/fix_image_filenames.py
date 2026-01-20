#!/usr/bin/env python3
"""
Rename image files to match the updated entity IDs.
Uses the same mappings from fix_entity_indices.py to rename actual image files.
"""
import os
import glob

# Mapping: old ID -> new ID (same as fix_entity_indices.py)
id_mappings = {
    # Items
    'bone_t2_02': 'bone_t2_01',
    'bone_t3_03': 'bone_t3_01',
    'bone_t4_04': 'bone_t4_01',
    'leather_t2_02': 'leather_t2_01',
    'leather_t3_03': 'leather_t3_01',
    'leather_t4_04': 'leather_t4_01',
    'mechanical_t2_02': 'mechanical_t2_01',
    'mechanical_t2_03': 'mechanical_t2_02',
    'mechanical_t3_04': 'mechanical_t3_01',
    'mechanical_t4_05': 'mechanical_t4_01',
    'metal_t2_02': 'metal_t2_01',
    'metal_t3_03': 'metal_t3_01',
    'metal_t4_04': 'metal_t4_01',
    'wood_t2_02': 'wood_t2_01',
    'wood_t3_03': 'wood_t3_01',
    'wood_t4_04': 'wood_t4_01',
    
    # Resources - food
    'food_t2_04': 'food_t2_01',
    'food_t2_05': 'food_t2_02',
    'food_t2_06': 'food_t2_03',
    'food_t2_07': 'food_t2_04',
    'food_t2_08': 'food_t2_05',
    'food_t3_09': 'food_t3_01',
    'food_t3_10': 'food_t3_02',
    'food_t3_11': 'food_t3_03',
    'food_t4_12': 'food_t4_01',
    
    # Resources - minerals
    'minerals_t2_04': 'minerals_t2_01',
    'minerals_t2_05': 'minerals_t2_02',
    'minerals_t2_06': 'minerals_t2_03',
    'minerals_t2_07': 'minerals_t2_04',
    'minerals_t2_09': 'minerals_t2_05',
    'minerals_t3_08': 'minerals_t3_01',
    'minerals_t3_10': 'minerals_t3_02',
    'minerals_t3_11': 'minerals_t3_03',
    'minerals_t3_13': 'minerals_t3_04',
    'minerals_t4_12': 'minerals_t4_01',
    
    # Resources - salvage
    'salvage_t1_03': 'salvage_t1_02',
    'salvage_t2_02': 'salvage_t2_01',
    'salvage_t2_04': 'salvage_t2_02',
    'salvage_t2_05': 'salvage_t2_03',
    'salvage_t3_06': 'salvage_t3_01',
    
    # Resources - scraps
    'scraps_t2_04': 'scraps_t2_01',
    'scraps_t2_05': 'scraps_t2_02',
    'scraps_t2_06': 'scraps_t2_03',
    'scraps_t2_07': 'scraps_t2_04',
    'scraps_t2_09': 'scraps_t2_05',
    'scraps_t2_10': 'scraps_t2_06',
    'scraps_t3_08': 'scraps_t3_01',
    'scraps_t3_11': 'scraps_t3_02',
    'scraps_t3_12': 'scraps_t3_03',
    'scraps_t3_13': 'scraps_t3_04',
    'scraps_t4_14': 'scraps_t4_01',
    
    # Equipment - chest
    'chest_t2_03': 'chest_t2_01',
    'chest_t2_04': 'chest_t2_02',
    'chest_t2_05': 'chest_t2_03',
    'chest_t2_06': 'chest_t2_04',
    'chest_t4_07': 'chest_t4_01',
    
    # Equipment - feet
    'feet_t2_03': 'feet_t2_01',
    'feet_t2_04': 'feet_t2_02',
    'feet_t2_05': 'feet_t2_03',
    'feet_t3_06': 'feet_t3_01',
    
    # Equipment - hands
    'hands_t2_03': 'hands_t2_01',
    'hands_t2_04': 'hands_t2_02',
    'hands_t2_05': 'hands_t2_03',
    'hands_t3_06': 'hands_t3_01',
    
    # Equipment - head
    'head_t2_03': 'head_t2_01',
    'head_t2_04': 'head_t2_02',
    'head_t2_05': 'head_t2_03',
    'head_t2_06': 'head_t2_04',
    'head_t3_07': 'head_t3_01',
    
    # Equipment - legs
    'legs_t2_03': 'legs_t2_01',
    'legs_t2_04': 'legs_t2_02',
    'legs_t2_05': 'legs_t2_03',
    'legs_t3_06': 'legs_t3_01',
    
    # Equipment - tool
    'tool_t2_02': 'tool_t2_01',
    'tool_t3_03': 'tool_t3_01',
    'tool_t4_04': 'tool_t4_01',
    
    # Equipment - weapon
    'weapon_t1_07': 'weapon_t1_03',
    'weapon_t1_11': 'weapon_t1_04',
    'weapon_t1_21': 'weapon_t1_05',
    'weapon_t2_03': 'weapon_t2_01',
    'weapon_t2_04': 'weapon_t2_02',
    'weapon_t2_05': 'weapon_t2_03',
    'weapon_t2_08': 'weapon_t2_04',
    'weapon_t2_12': 'weapon_t2_05',
    'weapon_t2_13': 'weapon_t2_06',
    'weapon_t2_16': 'weapon_t2_07',
    'weapon_t2_17': 'weapon_t2_08',
    'weapon_t2_22': 'weapon_t2_09',
    'weapon_t3_06': 'weapon_t3_01',
    'weapon_t3_09': 'weapon_t3_02',
    'weapon_t3_14': 'weapon_t3_03',
    'weapon_t3_15': 'weapon_t3_04',
    'weapon_t3_18': 'weapon_t3_05',
    'weapon_t3_19': 'weapon_t3_06',
    'weapon_t3_23': 'weapon_t3_07',
    'weapon_t4_10': 'weapon_t4_01',
    'weapon_t4_20': 'weapon_t4_02',
}

# Image directories to search
image_dirs = [
    'assets/images/items',
    'assets/images/resources',
    'assets/images/equipment',
]

def rename_images():
    renamed_count = 0
    
    for dir_path in image_dirs:
        if not os.path.exists(dir_path):
            print(f"Directory not found: {dir_path}")
            continue
        
        for old_id, new_id in id_mappings.items():
            # Find files with old ID
            pattern = os.path.join(dir_path, f"{old_id}*")
            for old_file in glob.glob(pattern):
                # Create new filename
                new_file = old_file.replace(old_id, new_id)
                
                if old_file != new_file and os.path.exists(old_file):
                    if os.path.exists(new_file):
                        print(f"SKIP (target exists): {old_file}")
                    else:
                        os.rename(old_file, new_file)
                        print(f"Renamed: {os.path.basename(old_file)} -> {os.path.basename(new_file)}")
                        renamed_count += 1
    
    print(f"\n=== Renamed {renamed_count} image files ===")

if __name__ == '__main__':
    print("=== Renaming Image Files to Match Updated Entity IDs ===\n")
    rename_images()
