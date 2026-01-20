
import os
import glob
import sys

# Directories to process
folders = [
    r"assets/images/resources",
    r"assets/images/dinosaurs",
    r"assets/images/characters",
    r"assets/images/items"
]

base_dir = os.getcwd()

print(f"Base Directory: {base_dir}")

for folder in folders:
    full_path = os.path.join(base_dir, folder)
    if not os.path.exists(full_path):
        print(f"Skipping {folder} (not found)")
        continue
        
    print(f"Scanning {folder}...")
    
    # Get all potential image files
    files = glob.glob(os.path.join(full_path, "*"))
    
    count = 0
    for f in files:
        if not os.path.isfile(f):
            continue
            
        basename = os.path.basename(f)
        name, ext = os.path.splitext(basename)
        ext = ext.lower()
        
        if ext not in ['.png', '.jpg', '.jpeg']:
            continue
            
        if name.endswith("_clean") or name.endswith("_original"):
            continue
            
        # Check if this looks like a source file that has a corresponding clean version
        # OR just a source file. 
        # Strategy: Rename ALL non-suffixed images to _original
        
        new_name = f"{name}_original{ext}"
        new_path = os.path.join(full_path, new_name)
        
        print(f"  Renaming {basename} -> {new_name}")
        try:
            os.rename(f, new_path)
            count += 1
        except Exception as e:
            print(f"  Error renaming {basename}: {e}")

    print(f"  Renamed {count} files in {folder}")
