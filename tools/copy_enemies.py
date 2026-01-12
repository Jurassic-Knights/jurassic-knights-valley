import shutil
import json
import glob
import os

# Source directory with generated images
src_dir = r"C:\Users\Anthony\.gemini\antigravity\brain\8a63f2ea-809f-4539-b85a-f4c2ae77f9d4"
# Target directory for assets
target_dir = r"c:\Users\Anthony\.gemini\antigravity\scratch\jurassic-knights-valley\assets\images\enemies"

# Mapping of file prefixes to JSON files
mappings = [
    # Herbivores
    {"prefix": "herbivore_t1_02", "json": "tools/enemies/herbivore.json", "id": "herbivore_t1_02"},
    {"prefix": "herbivore_t1_03", "json": "tools/enemies/herbivore.json", "id": "herbivore_t1_03"},
    # Original saurians (declined)
    {"prefix": "saurian_t1_01", "json": "tools/enemies/saurian.json", "id": "saurian_t1_01"},
    {"prefix": "saurian_t2_01", "json": "tools/enemies/saurian.json", "id": "saurian_t2_01"},
    {"prefix": "saurian_t3_01", "json": "tools/enemies/saurian.json", "id": "saurian_t3_01"},
    {"prefix": "saurian_t4_01", "json": "tools/enemies/saurian.json", "id": "saurian_t4_01"},
    # New saurians
    {"prefix": "saurian_t1_02", "json": "tools/enemies/saurian.json", "id": "saurian_t1_02"},
    {"prefix": "saurian_t1_03", "json": "tools/enemies/saurian.json", "id": "saurian_t1_03"},
    {"prefix": "saurian_t2_02", "json": "tools/enemies/saurian.json", "id": "saurian_t2_02"},
    {"prefix": "saurian_t2_03", "json": "tools/enemies/saurian.json", "id": "saurian_t2_03"},
    {"prefix": "saurian_t3_02", "json": "tools/enemies/saurian.json", "id": "saurian_t3_02"},
    {"prefix": "saurian_t3_03", "json": "tools/enemies/saurian.json", "id": "saurian_t3_03"},
    {"prefix": "saurian_t3_04", "json": "tools/enemies/saurian.json", "id": "saurian_t3_04"},
    {"prefix": "saurian_t4_02", "json": "tools/enemies/saurian.json", "id": "saurian_t4_02"},
    # Humans
    {"prefix": "human_t1_03", "json": "tools/enemies/human.json", "id": "human_t1_03"},
    {"prefix": "human_t2_02", "json": "tools/enemies/human.json", "id": "human_t2_02"},
    {"prefix": "human_t2_03", "json": "tools/enemies/human.json", "id": "human_t2_03"},
    {"prefix": "human_t3_02", "json": "tools/enemies/human.json", "id": "human_t3_02"},
    {"prefix": "human_t3_03", "json": "tools/enemies/human.json", "id": "human_t3_03"},
    {"prefix": "human_t4_03", "json": "tools/enemies/human.json", "id": "human_t4_03"},
]

os.makedirs(target_dir, exist_ok=True)
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
    dst_file = os.path.join(target_dir, f"{m['id']}_original.png")
    
    # Copy file
    shutil.copy2(src_file, dst_file)
    print(f"Copied: {m['prefix']} -> {dst_file}")
    copied += 1
    
    # Update JSON
    json_path = m['json']
    with open(json_path, 'r') as f:
        data = json.load(f)
    
    for item in data:
        if item['id'] == m['id']:
            item['status'] = 'pending'
            item['files'] = {"original": f"assets/images/enemies/{m['id']}_original.png"}
            if 'declineNote' in item:
                del item['declineNote']
            break
    
    with open(json_path, 'w') as f:
        json.dump(data, f, indent=4)

print(f"\nCopied {copied} files and updated JSON files.")
