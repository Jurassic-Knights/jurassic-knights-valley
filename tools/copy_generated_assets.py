#!/usr/bin/env python3
"""
Copy generated assets from artifacts directory to proper asset folders
and update JSON files with new paths and pending status.
"""
import os
import shutil
import json
import glob

# Artifacts directory where images were generated
ARTIFACTS_DIR = r"C:\Users\Anthony\.gemini\antigravity\brain\8a63f2ea-809f-4539-b85a-f4c2ae77f9d4"
PROJECT_DIR = r"c:\Users\Anthony\.gemini\antigravity\scratch\jurassic-knights-valley"

# Mapping of asset prefixes to destination directories and JSON files
ASSET_MAPPING = {
    # Enemies
    "herbivore_t1_02": ("assets/images/enemies", "tools/enemies/herbivore.json"),
    "herbivore_t1_03": ("assets/images/enemies", "tools/enemies/herbivore.json"),
    "saurian_t1_01": ("assets/images/enemies", "tools/enemies/saurian.json"),
    "saurian_t2_01": ("assets/images/enemies", "tools/enemies/saurian.json"),
    "saurian_t3_01": ("assets/images/enemies", "tools/enemies/saurian.json"),
    "saurian_t4_01": ("assets/images/enemies", "tools/enemies/saurian.json"),
    "dinosaur_t3_02": ("assets/images/enemies", "tools/enemies/dinosaur.json"),
    "dinosaur_t4_01": ("assets/images/enemies", "tools/enemies/dinosaur.json"),
    # Flora (these go to environment/flora)
    "flora_": ("assets/images/environment/flora", "tools/environment/flora.json"),
}

def find_latest_image(prefix):
    """Find the most recent image file matching the prefix."""
    pattern = os.path.join(ARTIFACTS_DIR, f"{prefix}*.png")
    files = glob.glob(pattern)
    if not files:
        return None
    # Sort by modification time, get newest
    return max(files, key=os.path.getmtime)

def copy_image(src_path, dest_dir, asset_id):
    """Copy image to destination with _original.png suffix."""
    os.makedirs(dest_dir, exist_ok=True)
    dest_filename = f"{asset_id}_original.png"
    dest_path = os.path.join(dest_dir, dest_filename)
    shutil.copy2(src_path, dest_path)
    print(f"Copied: {os.path.basename(src_path)} -> {dest_path}")
    return dest_path

def update_json_status(json_path, asset_id, files_path):
    """Update the JSON file to set status to pending and add files path."""
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    for item in data:
        if item.get('id') == asset_id:
            item['status'] = 'pending'
            if 'declineNote' in item:
                del item['declineNote']
            # Add files object if not present
            if 'files' not in item:
                item['files'] = {}
            item['files']['original'] = files_path
            print(f"Updated JSON: {asset_id} -> pending, path: {files_path}")
            break
    
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=4)

def main():
    copied_count = 0
    
    # Process enemy assets (exact match)
    enemy_assets = [
        "herbivore_t1_02", "herbivore_t1_03",
        "saurian_t1_01", "saurian_t2_01", "saurian_t3_01", "saurian_t4_01",
        "dinosaur_t3_02", "dinosaur_t4_01"
    ]
    
    for asset_id in enemy_assets:
        src = find_latest_image(asset_id)
        if src:
            dest_dir, json_file = ASSET_MAPPING[asset_id]
            dest_full = os.path.join(PROJECT_DIR, dest_dir)
            json_full = os.path.join(PROJECT_DIR, json_file)
            
            dest_path = copy_image(src, dest_full, asset_id)
            rel_path = dest_path.replace(PROJECT_DIR + os.sep, "").replace("\\", "/")
            update_json_status(json_full, asset_id, rel_path)
            copied_count += 1
    
    # Process flora assets (prefix match)
    flora_dir = os.path.join(PROJECT_DIR, "assets/images/environment/flora")
    os.makedirs(flora_dir, exist_ok=True)
    
    flora_files = glob.glob(os.path.join(ARTIFACTS_DIR, "flora_*.png"))
    for src in flora_files:
        basename = os.path.basename(src)
        # Extract asset ID (remove timestamp)
        parts = basename.replace(".png", "").rsplit("_", 1)
        if len(parts) == 2 and parts[1].isdigit():
            asset_id = parts[0]
        else:
            asset_id = basename.replace(".png", "")
        
        dest_filename = f"{asset_id}_original.png"
        dest_path = os.path.join(flora_dir, dest_filename)
        shutil.copy2(src, dest_path)
        print(f"Copied flora: {basename} -> {dest_path}")
        copied_count += 1
    
    print(f"\n=== SUMMARY ===")
    print(f"Total assets copied: {copied_count}")
    print(f"Enemy assets: {len(enemy_assets)}")
    print(f"Flora assets: {len(flora_files)}")

if __name__ == "__main__":
    main()
