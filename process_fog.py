from PIL import Image
import os
import glob

def process_fog(path):
    try:
        print(f"Processing {path}...")
        img = Image.open(path).convert("RGBA")
        datas = img.getdata()
        
        newData = []
        for item in datas:
            # item is (R, G, B, A)
            # Assuming white cloud on black background:
            # Brightness is roughly the alpha we want.
            # We want White (255,255,255) to be Alpha 255
            # Black (0,0,0) to be Alpha 0
            
            # Simple luminance method
            # brightness = (item[0] + item[1] + item[2]) / 3
            
            # Or strict black removal:
            # If pixel is black, make it transparent.
            # But clouds have gradients.
            
            # Better approach for "White on Black":
            # Set RGB to White (255,255,255)
            # Set Alpha to the pixel's original average brightness
            
            avg = int((item[0] + item[1] + item[2]) / 3)
            # Boost alpha slightly to make it more visible?
            # avg = min(255, avg * 1.2) 
            
            newData.append((255, 255, 255, avg))

        img.putdata(newData)
        img.save(path, "PNG")
        print(f"Saved {path}")
    except Exception as e:
        print(f"Error processing {path}: {e}")

# Target directory
target_dir = r"c:/Users/Anthony/.gemini/antigravity/scratch/jurassic-knights-valley/assets/images/vfx"
patterns = ["fog_v2_*.png", "fog_cloud_*.png"]

for pattern in patterns:
    for file in glob.glob(os.path.join(target_dir, pattern)):
        process_fog(file)
