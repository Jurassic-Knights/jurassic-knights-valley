import argparse
import os
import sys
import torch
import numpy as np
from PIL import Image
from transformers import pipeline

def make_height(image_path, output_path, model_id="depth-anything/Depth-Anything-V2-Small-hf", device=None):
    """
    Generates a depth/height map from an image using Depth Anything V2.
    """
    print(f"Processing Height: {image_path}")
    
    # 1. Setup Device
    if device is None:
        device = 0 if torch.cuda.is_available() else -1
        device_str = "cuda" if device == 0 else "cpu"
    else:
        device_str = device
        device = 0 if device == "cuda" else -1

    print(f"Using device: {device_str}")

    # 2. Load Model
    # pipe = pipeline(task="depth-estimation", model=model_id, device=device)
    # Note: Depth Anything V2 structure might require specific handling or latest transformers.
    # Fallback to standard depth-estimation pipeline.
    try:
        pipe = pipeline(task="depth-estimation", model=model_id, device=device)
    except Exception as e:
        print(f"Error loading model {model_id}: {e}")
        print("Ensuring you have the latest 'transformers'.")
        return

    # 3. Load Image
    try:
        image = Image.open(image_path).convert("RGB")
    except Exception as e:
        print(f"Error loading image: {e}")
        return

    # 4. Inference
    print("Estimating depth...")
    result = pipe(image)
    depth_image = result["depth"]

    # 5. Conversion to Grayscale and Numpy
    if depth_image.mode != "L":
        depth_image = depth_image.convert("L")
    
    depth_arr = np.array(depth_image).astype(np.float32)

    # 6. Remove Tilt (Plane Fitting)
    # Depth Anything often adds a gradient (bottom=near, top=far). We subtract the best-fit plane.
    print("Flattening global gradient (removing tilt)...")
    
    h, w = depth_arr.shape
    X, Y = np.meshgrid(np.arange(w), np.arange(h))
    
    # Flatten arrays for regression: z = a*x + b*y + c
    A = np.c_[X.flatten(), Y.flatten(), np.ones(w*h)]
    C, _, _, _ = np.linalg.lstsq(A, depth_arr.flatten(), rcond=None)
    
    # Calculate the plane
    plane = C[0]*X + C[1]*Y + C[2]
    
    # Subtract plane from depth
    flat_depth = depth_arr - plane
    
    # Normalize to 0-255
    flat_depth -= flat_depth.min()
    if flat_depth.max() > 0:
        flat_depth /= flat_depth.max()
    flat_depth *= 255.0
    
    final_image = Image.fromarray(flat_depth.astype(np.uint8))

    # 7. Save
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    final_image.save(output_path)
    print(f"Saved height map to: {output_path}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate a height/depth map using AI (Depth Anything V2).")
    parser.add_argument("input", help="Path to input image")
    parser.add_argument("--output", help="Path to output image (optional, defaults to input_height.png)")
    parser.add_argument("--model", default="depth-anything/Depth-Anything-V2-Small-hf", help="HuggingFace model ID")
    
    args = parser.parse_args()
    
    output_path = args.output
    if not output_path:
        base, ext = os.path.splitext(args.input)
        # Appends _height to the existing filename (e.g. name_original -> name_original_height)
        output_path = f"{base}_height{ext}"
        
    make_height(args.input, output_path, model_id=args.model)
