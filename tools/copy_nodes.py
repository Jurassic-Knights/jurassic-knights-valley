#!/usr/bin/env python3
"""
Copy generated node assets from artifacts to proper asset folders and update JSON files.
Also handles the 4 flora _all assets that need paths set.
"""
import os
import shutil
import json
import glob

ARTIFACTS_DIR = r"C:\Users\Anthony\.gemini\antigravity\brain\8a63f2ea-809f-4539-b85a-f4c2ae77f9d4"
PROJECT_DIR = r"c:\Users\Anthony\.gemini\antigravity\scratch\jurassic-knights-valley"

def find_latest_image(prefix):
    """Find the most recent image file matching the prefix."""
    pattern = os.path.join(ARTIFACTS_DIR, f"{prefix}_*.png")
    files = glob.glob(pattern)
    if not files:
        return None
    return max(files, key=os.path.getmtime)

def main():
    copied_count = 0
    
    # === NODES ===
    print("=== NODES (base only, skipping consumed until base approved) ===")
    node_dir = os.path.join(PROJECT_DIR, "assets/images/nodes")
    node_json = os.path.join(PROJECT_DIR, "tools/nodes/nodes.json")
    
    # Base node IDs (29 total)
    base_node_ids = [
        "node_acacia_tree", "node_ash_pile", "node_ash_tree", "node_badlands_nest",
        "node_badlands_outcrop", "node_berry_bush", "node_burrow_nest", "node_carcass",
        "node_coal_seam", "node_copper_vein", "node_deep_vein", "node_desert_cactus",
        "node_desert_remains", "node_desert_rock", "node_field_kitchen", "node_frozen_ground",
        "node_ice_hole", "node_iron_deposit", "node_ironwood_tree", "node_oak_tree",
        "node_riverbank", "node_salt_flat", "node_salt_formation", "node_sandy_deposit",
        "node_silver_vein", "node_stone_pile", "node_sulfur_vent", "node_tall_grass",
        "node_wild_wheat"
    ]
    
    # Consumed versions generated before user feedback
    consumed_ids = [
        "node_acacia_tree_consumed", "node_ash_pile_consumed", "node_ash_tree_consumed",
        "node_badlands_nest_consumed", "node_badlands_outcrop_consumed", "node_berry_bush_consumed"
    ]
    
    # Read JSON
    with open(node_json, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    os.makedirs(node_dir, exist_ok=True)
    
    # Process base nodes
    for asset_id in base_node_ids:
        src = find_latest_image(asset_id)
        if not src:
            print(f"  MISSING: {asset_id}")
            continue
        
        dest_filename = f"{asset_id}_original.png"
        dest_path = os.path.join(node_dir, dest_filename)
        shutil.copy2(src, dest_path)
        
        rel_path = dest_path.replace(PROJECT_DIR + os.sep, "").replace("\\", "/")
        
        # Update JSON
        for item in data:
            if item.get('id') == asset_id:
                item['status'] = 'pending'
                if 'declineNote' in item:
                    del item['declineNote']
                if 'files' not in item:
                    item['files'] = {}
                item['files']['original'] = rel_path
                break
        
        print(f"  Copied: {asset_id}")
        copied_count += 1
    
    # Process consumed versions (ones that were generated before feedback)
    for asset_id in consumed_ids:
        src = find_latest_image(asset_id)
        if not src:
            print(f"  MISSING: {asset_id}")
            continue
        
        # consumed filename format
        dest_filename = f"{asset_id}_original.png"
        dest_path = os.path.join(node_dir, dest_filename)
        shutil.copy2(src, dest_path)
        
        rel_path = dest_path.replace(PROJECT_DIR + os.sep, "").replace("\\", "/")
        
        # Get the base node ID (strip _consumed suffix)
        base_id = asset_id.replace("_consumed", "")
        
        # Update JSON - look for the base node and update consumedStatus and consumed file
        for item in data:
            if item.get('id') == base_id:
                item['consumedStatus'] = 'pending'
                if 'consumedDeclineNote' in item:
                    del item['consumedDeclineNote']
                if 'files' not in item:
                    item['files'] = {}
                item['files']['consumed_original'] = rel_path
                break
        
        print(f"  Copied: {asset_id}")
        copied_count += 1
    
    with open(node_json, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=4)
    
    print(f"\n=== SUMMARY ===")
    print(f"Total nodes copied: {copied_count}")

if __name__ == "__main__":
    main()
