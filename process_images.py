import os
import time
from pathlib import Path
from rembg import remove
from PIL import Image

# Configuration
ASSETS_DIR = Path('assets')
EXTENSIONS = {'.jpg', '.jpeg', '.png', '.webp'}

def process_image(file_path):
    """
    Remove background from image and save as PNG.
    """
    try:
        # Avoid processing output files (if we used a suffix)
        # But here we assume direct conversion: name.jpg -> name.png
        
        # If input is already PNG, we might be re-processing an output if we aren't careful.
        # Simple heuristic: If it has "processed" or is in a specific folder?
        # For now: We stick to the request "Whenever a new image... is found".
        # We will skip if a sibling .png exists and is newer than the source .jpg/.webp
        
        if file_path.suffix.lower() != '.png':
            target_path = file_path.with_suffix('.png')
            if target_path.exists() and target_path.stat().st_mtime > file_path.stat().st_mtime:
                # print(f"Skipping {file_path.name} (Target up to date)")
                return
        else:
            # If it's a PNG, check if it's already transparent? 
            # rembg converts to transparent.
            # We'll rely on the user providing 'raw' images or non-pngs usually.
            # If they provide PNGs with white bg, we'll process them to a temp or overwrite?
            # Overwriting is dangerous.
            # Let's assume input is usually cleaning up assets.
            # We will generate `_clean.png` for PNG inputs to avoid loops.
            if '_clean' in file_path.name:
                return
            target_path = file_path.with_name(f"{file_path.stem}_clean.png")
            
        print(f"[Processing] {file_path.name}...")

        # Process
        with open(file_path, 'rb') as i:
            input_data = i.read()
            output_data = remove(input_data)
            
        with open(target_path, 'wb') as o:
            o.write(output_data)
            
        print(f"  -> Saved to {target_path.name}")
        
    except Exception as e:
        print(f"[Error] Failed to process {file_path}: {e}")

def main():
    print(f"--- Background Removal Tool ---")
    print(f"Scanning {ASSETS_DIR.resolve()} for images...")
    
    if not ASSETS_DIR.exists():
        print(f"Directory {ASSETS_DIR} not found!")
        return

    count = 0
    for root, dirs, files in os.walk(ASSETS_DIR):
        for file in files:
            file_path = Path(root) / file
            
            # Filter extensions
            if file_path.suffix.lower() not in EXTENSIONS:
                continue
                
            # Skip likely generated files to avoid loops/dups if simple naming
            if '_clean' in file_path.name:
                continue

            # Logic: If it's a JPG/WEBP, we definitely process it to PNG.
            # If it's a PNG, we verify if we should (maybe manual trigger?).
            # For this automation, we'll process everything that doesn't look like a result.
            
            process_image(file_path)
            count += 1
            
    print(f"--- Scan Complete. Processed/Checked {count} files. ---")

if __name__ == "__main__":
    main()
