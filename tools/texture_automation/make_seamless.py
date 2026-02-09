import argparse
import os
import sys
import numpy as np
from PIL import Image, ImageFilter
import torch
from diffusers import StableDiffusionXLInpaintPipeline, FluxInpaintPipeline

def make_seamless(image_path, output_path, prompt, model_id="diffusers/stable-diffusion-xl-1.0-inpainting-0.1", model_type="sdxl", overlap_percentage=0.25, steps=30, strength=0.70, gpu_strategy="offload", debug=False, **kwargs):
    """
    Converts an image into a seamless texture using Shift+Inpaint method.
    Supports SDXL and Flux.
    """
    
    print(f"Processing: {image_path}")
    print(f"Model ID: {model_id} ({model_type})")
    
    # 1. Load Image
    try:
        image = Image.open(image_path).convert("RGB")
    except Exception as e:
        print(f"Error loading image: {e}")
        return

    width, height = image.size
    print(f"Original Resolution: {width}x{height}")

    # SDXL prefers 1024x1024. Flux is flexible but 1024 is good.
    # We still ensure multiples of 8 for VAE.
    proc_width = (width // 8) * 8
    proc_height = (height // 8) * 8
    
    if proc_width != width or proc_height != height:
        print(f"Resizing for processing (VAE requirement): {proc_width}x{proc_height}")
        image = image.resize((proc_width, proc_height), Image.LANCZOS)
    
    # 2. Shift Image (Roll) to center the seams
    img_arr = np.array(image)
    y_roll = proc_height // 2
    x_roll = proc_width // 2
    
    shifted_arr = np.roll(img_arr, y_roll, axis=0)
    shifted_arr = np.roll(shifted_arr, x_roll, axis=1)
    shifted_image = Image.fromarray(shifted_arr)
    
    # 3. Create Gradient Mask (Linear Falloff for smoother blending)
    # Instead of binary mask + blur, we create a mathematical linear gradient
    mask = Image.new("L", (proc_width, proc_height), 0)
    img_mask_arr = np.array(mask).astype(float)
    
    mask_w = int(proc_width * overlap_percentage)
    mask_h = int(proc_height * overlap_percentage)
    
    # -- Vertical Strip Gradient --
    # 0 at edges of mask_w, 255 at center
    x_center = proc_width // 2
    x_start = x_center - (mask_w // 2)
    x_end = x_center + (mask_w // 2)
    
    # Create 1D gradient
    grad_len = x_end - x_start
    if grad_len > 0:
        # 0 -> 1 -> 0 triangle
        grad = np.linspace(0, 1, grad_len // 2)
        grad = np.concatenate((grad, grad[::-1]))
        
        # Ensure exact fit
        if len(grad) < grad_len:
            grad = np.pad(grad, (0, grad_len - len(grad)), 'edge')
        elif len(grad) > grad_len:
             grad = grad[:grad_len]
             
        # Broadcast to 2D
        grad_2d = np.tile(grad, (proc_height, 1))
        
        # Add to mask (using maximum to overlap nicely)
        current_crop = img_mask_arr[:, x_start:x_end]
        img_mask_arr[:, x_start:x_end] = np.maximum(current_crop, grad_2d * 255)

    # -- Horizontal Strip Gradient --
    y_center = proc_height // 2
    y_start = y_center - (mask_h // 2)
    y_end = y_center + (mask_h // 2)

    grad_len_y = y_end - y_start
    if grad_len_y > 0:
        grad_y = np.linspace(0, 1, grad_len_y // 2)
        grad_y = np.concatenate((grad_y, grad_y[::-1]))
        
        if len(grad_y) < grad_len_y:
            grad_y = np.pad(grad_y, (0, grad_len_y - len(grad_y)), 'edge')
        elif len(grad_y) > grad_len_y:
             grad_y = grad_y[:grad_len_y]

        # Broadcast (transpose for vertical vector)
        grad_2d_y = np.tile(grad_y, (proc_width, 1)).T
        
        # Add to mask
        current_crop_y = img_mask_arr[y_start:y_end, :]
        img_mask_arr[y_start:y_end, :] = np.maximum(current_crop_y, grad_2d_y * 255)
    
    mask_image = Image.fromarray(img_mask_arr.astype(np.uint8))
    
    # 1px radius was requested, now 0px requested for absolute sharpness
    # mask_image = mask_image.filter(ImageFilter.GaussianBlur(radius=1))
    print(f"Skipping blur for gradient mask (radius=0)")

    if debug:
        debug_mask_path = output_path.replace(".png", "_debug_mask.png")
        debug_shifted_path = output_path.replace(".png", "_debug_shifted.png")
        mask_image.save(debug_mask_path)
        shifted_image.save(debug_shifted_path)
        print(f"Debug: Saved mask to {debug_mask_path}")

    # 4. Load AI Model
    print(f"Loading AI Model ({model_type.upper()})...")
    
    if torch.cuda.is_available():
        device = "cuda"
    else:
        print("WARNING: CUDA not found. Process will be slow (CPU mode).")
        device = "cpu"
        
    print(f"Using device: {device}")
    
    pipe = None
    try:
        if model_type.lower() == "flux":
             # Flux
            pipe = FluxInpaintPipeline.from_pretrained(
                model_id,
                torch_dtype=torch.float16, # Fallback to float16 for Windows/Torch compatibility
                use_safetensors=True
            )
        else:
             # SDXL
            pipe = StableDiffusionXLInpaintPipeline.from_pretrained(
                model_id,
                torch_dtype=torch.float16 if device == "cuda" else torch.float32,
                use_safetensors=True,
                variant="fp16"
            )

        if device == "cuda":
            if gpu_strategy == "offload":
                print("Enabling CPU Offload (Saves VRAM, slightly slower)...")
                pipe.enable_model_cpu_offload()
            else:
                print("Using Full GPU (Fastest, requires high VRAM)...")
                pipe.to(device) 
        else:
            pipe.to(device)
            
        # 4b. Load LoRA if provided (SDXL only for now)
        if kwargs.get("lora_path") and model_type.lower() == "sdxl":
            print(f"Loading LoRA: {kwargs.get('lora_path')}")
            pipe.load_lora_weights(kwargs.get("lora_path"))
            print(f"Fusing LoRA with scale: {kwargs.get('lora_scale', 1.0)}")
            pipe.fuse_lora(lora_scale=kwargs.get("lora_scale", 1.0))
            
    except Exception as e:
        print(f"Failed to load model: {e}")
        return

    # 5. Inpaint
    print("Inpainting seams...")
    
    # Inpainting call varies slightly by pipeline, but diffusers tries to unify args.
    # Flux typically needs stricter guidance or different params if using Dev.
    
    # Common args
    gen_args = {
        "prompt": prompt,
        "image": shifted_image,
        "mask_image": mask_image,
        "num_inference_steps": steps,
        "strength": strength, 
        "height": proc_height,
        "width": proc_width,
    }
    
    if model_type.lower() == "sdxl":
        gen_args["guidance_scale"] = 7.5
    elif model_type.lower() == "flux":
        gen_args["guidance_scale"] = 3.5 # Flux handles guidance differently (often lower is better or 3.5 is default)
        # Flux Dev/Schnell might default to good values, but 3.5 is safe start.

    inpainted = pipe(**gen_args).images[0]

    # --- COLOR MATCHING STEP ---
    # The AI output (VAE) often has a slightly different color profile/gamma than the raw pixel art.
    # We force the inpainted area to match the mean/std of the original image to hide the seam.
    print("Matching color statistics...")
    original_arr = np.array(shifted_image).astype(np.float32)
    inpainted_arr = np.array(inpainted).astype(np.float32)
    
    # Calculate stats for the non-masked areas (reference) vs masked input
    # Actually, simpler is global matching: transfer statistics of original -> inpainted
    # This works because the content should be similar.
    
    def match_stats(source, target):
        # Matches the statistics of source to target
        # source: the image to modify (inpainted)
        # target: the reference image (original)
        s_mean = np.mean(source, axis=(0,1))
        s_std = np.std(source, axis=(0,1))
        t_mean = np.mean(target, axis=(0,1))
        t_std = np.std(target, axis=(0,1))
        
        # Normalize source
        source = (source - s_mean) / (s_std + 1e-5)
        # Scale to target
        source = (source * t_std) + t_mean
        return np.clip(source, 0, 255)

    matched_arr = match_stats(inpainted_arr, original_arr)
    inpainted_matched = Image.fromarray(matched_arr.astype(np.uint8))

    # COMPOSITING STEP: Ensure we strictly preserve non-masked areas
    result = Image.composite(inpainted_matched, shifted_image, mask_image)
    
    # 6. Shift Back (Un-roll)
    res_arr = np.array(result)
    res_arr = np.roll(res_arr, -y_roll, axis=0) # Negative roll to go back
    res_arr = np.roll(res_arr, -x_roll, axis=1)
    
    final_image = Image.fromarray(res_arr)
    
    # 7. Resize back to original if needed
    if proc_width != width or proc_height != height:
        final_image = final_image.resize((width, height), Image.LANCZOS)
    
    # 8. Save
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    final_image.save(output_path)
    print(f"Saved seamless texture to: {output_path}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Make a texture seamless using Stable Diffusion SDXL or Flux Inpainting.")
    parser.add_argument("input", help="Path to input image")
    parser.add_argument("--output", help="Path to output image")
    parser.add_argument("--prompt", required=True, help="Text prompt describing the texture")
    parser.add_argument("--model", default="diffusers/stable-diffusion-xl-1.0-inpainting-0.1", help="HuggingFace model ID")
    parser.add_argument("--model_type", default="sdxl", choices=["sdxl", "flux"], help="Type of model: 'sdxl' or 'flux'")
    parser.add_argument("--gpu_strategy", default="offload", choices=["offload", "full"], help="GPU memory strategy: 'offload' (save VRAM) or 'full' (fastest, requires 24GB+ VRAM for Flux)")
    parser.add_argument("--steps", type=int, default=30, help="Inference steps (Use 4 for Flux Schnell)")
    parser.add_argument("--strength", type=float, default=0.70, help="Inpainting strength")
    parser.add_argument("--lora", help="Path to LoRA .safetensors file (SDXL only)")
    parser.add_argument("--lora_scale", type=float, default=1.0, help="LoRA strength scale")
    parser.add_argument("--debug", action="store_true", help="Save debug images (mask, shifted)")
    
    args = parser.parse_args()
    
    # Auto-detect flux model ID if model_type is flux but default model is still sdxl
    model_id = args.model
    if args.model_type == "flux" and model_id == "diffusers/stable-diffusion-xl-1.0-inpainting-0.1":
        model_id = "black-forest-labs/FLUX.1-dev"
    
    output_path = args.output
    if not output_path:
        output_path = args.input
        print(f"No output path provided. Overwriting input file: {output_path}")
        
    make_seamless(args.input, output_path, args.prompt, model_id, model_type=args.model_type, strength=args.strength, steps=args.steps, gpu_strategy=args.gpu_strategy, debug=args.debug, lora_path=args.lora, lora_scale=args.lora_scale)
