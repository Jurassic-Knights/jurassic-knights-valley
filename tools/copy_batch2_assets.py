#!/usr/bin/env python3
"""
Copy generated assets from batch 2 to proper asset folders and update JSON files.
Handles: dinosaurs (2 declined) and props (52 total)
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

def copy_and_update(asset_id, dest_dir, json_path, copied_count):
    """Copy image and update JSON for a single asset."""
    src = find_latest_image(asset_id)
    if not src:
        print(f"  MISSING: {asset_id}")
        return copied_count
    
    os.makedirs(dest_dir, exist_ok=True)
    dest_filename = f"{asset_id}_original.png"
    dest_path = os.path.join(dest_dir, dest_filename)
    shutil.copy2(src, dest_path)
    
    rel_path = dest_path.replace(PROJECT_DIR + os.sep, "").replace("\\", "/")
    
    # Update JSON
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    for item in data:
        if item.get('id') == asset_id:
            item['status'] = 'pending'
            if 'declineNote' in item:
                del item['declineNote']
            if 'files' not in item:
                item['files'] = {}
            item['files']['original'] = rel_path
            break
    
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=4)
    
    print(f"  Copied: {asset_id}")
    return copied_count + 1

def main():
    copied_count = 0
    
    # === DINOSAURS (declined) ===
    print("=== DINOSAURS ===")
    dino_dir = os.path.join(PROJECT_DIR, "assets/images/enemies")
    dino_json = os.path.join(PROJECT_DIR, "tools/enemies/dinosaur.json")
    
    for asset_id in ["dinosaur_t1_02", "dinosaur_t2_02"]:
        copied_count = copy_and_update(asset_id, dino_dir, dino_json, copied_count)
    
    # === PROPS ===
    print("=== PROPS ===")
    prop_dir = os.path.join(PROJECT_DIR, "assets/images/environment/props")
    prop_json = os.path.join(PROJECT_DIR, "tools/environment/props.json")
    
    # All prop asset IDs
    prop_ids = [
        # Barrels
        "prop_barrel_grasslands", "prop_barrel_tundra", "prop_barrel_desert", "prop_barrel_badlands",
        "prop_barrel_water",
        # Crates
        "prop_crate_grasslands", "prop_crate_tundra", "prop_crate_desert", "prop_crate_badlands",
        "prop_crate_medical",
        # Lamps
        "prop_lamp_grasslands", "prop_lamp_tundra", "prop_lamp_desert", "prop_lamp_badlands",
        # Carts
        "prop_cart_grasslands", "prop_cart_tundra", "prop_cart_desert", "prop_cart_badlands",
        # Tents
        "prop_tent_grasslands", "prop_tent_tundra", "prop_tent_desert", "prop_tent_badlands",
        # Debris
        "prop_debris_grasslands", "prop_debris_tundra", "prop_debris_desert", "prop_debris_badlands",
        # Campfires
        "prop_campfire_grasslands", "prop_campfire_tundra", "prop_campfire_desert", "prop_campfire_badlands",
        # Sandbags
        "prop_sandbags_grasslands", "prop_sandbags_tundra", "prop_sandbags_desert", "prop_sandbags_badlands",
        # Statues
        "prop_statue_grasslands", "prop_statue_tundra", "prop_statue_desert", "prop_statue_badlands",
        # Special props
        "prop_anvil_all", "prop_forge_all", "prop_cannon_all", "prop_munitions_all",
        "prop_flagpole_all", "prop_bench_all", "prop_table_all", "prop_rack_weapons",
        "prop_sack_all", "prop_stretcher_all"
    ]
    
    for asset_id in prop_ids:
        copied_count = copy_and_update(asset_id, prop_dir, prop_json, copied_count)
    
    print(f"\n=== SUMMARY ===")
    print(f"Total assets copied: {copied_count}")

if __name__ == "__main__":
    main()
