#!/usr/bin/env python3
"""
Copy generated weapon assets from artifacts to proper asset folders and update JSON files.
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
    
    # === WEAPONS ===
    print("=== WEAPONS ===")
    weapon_dir = os.path.join(PROJECT_DIR, "assets/images/equipment/weapons")
    weapon_json = os.path.join(PROJECT_DIR, "tools/equipment/weapon.json")
    
    weapon_ids = [
        "weapon_t1_01", "weapon_t1_02", "weapon_t2_03", "weapon_t2_04", "weapon_t2_05",
        "weapon_t3_06", "weapon_t1_07", "weapon_t2_08", "weapon_t3_09", "weapon_t4_10",
        "weapon_t1_11", "weapon_t2_12", "weapon_t2_13", "weapon_t3_14", "weapon_t3_15",
        "weapon_t2_16", "weapon_t2_17", "weapon_t3_18", "weapon_t3_19", "weapon_t4_20",
        "weapon_t1_21", "weapon_t2_22", "weapon_t3_23"
    ]
    
    for asset_id in weapon_ids:
        copied_count = copy_and_update(asset_id, weapon_dir, weapon_json, copied_count)
    
    print(f"\n=== SUMMARY ===")
    print(f"Total weapons copied: {copied_count}")

if __name__ == "__main__":
    main()
