from PIL import Image
import os

path = r"c:\Users\Anthony\.gemini\antigravity\scratch\jurassic-knights-valley\assets\images\vfx\fog_cloud.png"

if os.path.exists(path):
    img = Image.open(path)
    print(f"Original size: {img.size}")
    
    if img.size[0] > 256:
        print("Resizing to 256x256 for performance...")
        img = img.resize((256, 256), Image.Resampling.LANCZOS)
        img.save(path)
        print("Saved optimized image.")
    else:
        print("Image is already small enough.")
else:
    print("File not found.")
