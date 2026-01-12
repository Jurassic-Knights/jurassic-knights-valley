import shutil
import json
import glob
import os

# Source directory with generated images
src_dir = r"C:\Users\Anthony\.gemini\antigravity\brain\8a63f2ea-809f-4539-b85a-f4c2ae77f9d4"
base_dir = r"c:\Users\Anthony\.gemini\antigravity\scratch\jurassic-knights-valley"

# All 7 successfully generated assets
mappings = [
    {"prefix": "human_t2_02", "json": "tools/enemies/human.json", "folder": "enemies"},
    {"prefix": "saurian_t1_01", "json": "tools/enemies/saurian.json", "folder": "enemies"},
    {"prefix": "saurian_t1_02", "json": "tools/enemies/saurian.json", "folder": "enemies"},
    {"prefix": "saurian_t2_02", "json": "tools/enemies/saurian.json", "folder": "enemies"},
    {"prefix": "saurian_t3_03", "json": "tools/enemies/saurian.json", "folder": "enemies"},
    {"prefix": "saurian_t3_04", "json": "tools/enemies/saurian.json", "folder": "enemies"},
    {"prefix": "saurian_t4_02", "json": "tools/enemies/saurian.json", "folder": "enemies"},
]

copied = 0

for m in mappings:
    # Find the generated file (has timestamp suffix)
    pattern = os.path.join(src_dir, f"{m['prefix']}_*.png")
    files = glob.glob(pattern)
    if not files:
        print(f"WARNING: No file found for {m['prefix']}")
        continue
    
    # Use the most recent file
    src_file = max(files, key=os.path.getmtime)
    target_dir = os.path.join(base_dir, "assets", "images", m['folder'])
    os.makedirs(target_dir, exist_ok=True)
    dst_file = os.path.join(target_dir, f"{m['prefix']}_original.png")
    
    # Copy file
    shutil.copy2(src_file, dst_file)
    print(f"Copied: {m['prefix']} -> {dst_file}")
    copied += 1
    
    # Update JSON - ONLY status and files, NOT sourceDescription
    json_path = os.path.join(base_dir, m['json'])
    with open(json_path, 'r') as f:
        data = json.load(f)
    
    for item in data:
        if item['id'] == m['prefix']:
            item['status'] = 'pending'
            item['files'] = {"original": f"assets/images/{m['folder']}/{m['prefix']}_original.png"}
            # Clear declineNote since we addressed it
            if 'declineNote' in item:
                del item['declineNote']
            # DO NOT overwrite sourceDescription - keep user's version
            print(f"  Updated status -> pending, cleared declineNote")
            break
    
    with open(json_path, 'w') as f:
        json.dump(data, f, indent=4)

print(f"\nCopied {copied} files and updated JSON files (status/files only, kept sourceDescriptions).")
