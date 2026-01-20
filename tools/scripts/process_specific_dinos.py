
import os
import sys

# Import the processing function from the main script
# (Assuming scripts/ is in path or we append it)
sys.path.append(os.getcwd())
try:
    from scripts.photoshop_remove_bg import process_image
except ImportError:
    # Fallback if running from scripts dir
    from photoshop_remove_bg import process_image

BASE_DIR = os.path.join(os.getcwd(), "assets", "images", "dinosaurs")

targets = [
    "dino_spinosaurus_base_original.png"
]

print(f"Redoing extraction for {len(targets)} specific dinosaurs...")

for target in targets:
    input_path = os.path.join(BASE_DIR, target)
    if not os.path.exists(input_path):
        print(f"Error: Could not find {input_path}")
        continue
        
    # Construct output path (replace _original with _clean)
    clean_name = target.replace("_original", "_clean")
    output_path = os.path.join(BASE_DIR, clean_name)
    
    print(f"Processing {target}...")
    success = process_image(input_path, output_path)
    
    if success:
        print(f"  > Successfully updated {clean_name}")
    else:
        print(f"  > FAILED: {target}")

print("Batch Redo Complete.")
