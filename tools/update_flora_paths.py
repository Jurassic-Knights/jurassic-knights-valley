#!/usr/bin/env python3
"""
Update flora.json with file paths for all flora assets.
"""
import json
import os
import glob

PROJECT_DIR = r"c:\Users\Anthony\.gemini\antigravity\scratch\jurassic-knights-valley"
FLORA_JSON = os.path.join(PROJECT_DIR, "tools/environment/flora.json")
FLORA_DIR = os.path.join(PROJECT_DIR, "assets/images/environment/flora")

def main():
    # Load flora.json
    with open(FLORA_JSON, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # Get all flora image files
    image_files = glob.glob(os.path.join(FLORA_DIR, "*_original.png"))
    
    # Build a map of asset_id -> file path
    file_map = {}
    for img_path in image_files:
        basename = os.path.basename(img_path)
        # Remove _original.png suffix to get asset_id
        asset_id = basename.replace("_original.png", "")
        rel_path = f"assets/images/environment/flora/{basename}"
        file_map[asset_id] = rel_path
    
    # Update each flora entry
    updated_count = 0
    for item in data:
        asset_id = item.get('id')
        if asset_id in file_map:
            if 'files' not in item:
                item['files'] = {}
            item['files']['original'] = file_map[asset_id]
            item['status'] = 'pending'
            print(f"Updated: {asset_id} -> {file_map[asset_id]}")
            updated_count += 1
    
    # Save updated JSON
    with open(FLORA_JSON, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=4)
    
    print(f"\n=== SUMMARY ===")
    print(f"Total flora entries: {len(data)}")
    print(f"Updated with paths: {updated_count}")
    print(f"Image files found: {len(image_files)}")

if __name__ == "__main__":
    main()
