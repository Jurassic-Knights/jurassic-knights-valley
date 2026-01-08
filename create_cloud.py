
import random
import math
import struct

def generate_cloud_texture(width, height, filename):
    # Create a simple RGBA buffer (flat list of bytes)
    # 4 bytes per pixel: R, G, B, A
    buffer = bytearray(width * height * 4)

    center_x = width / 2
    center_y = height / 2
    max_dist = width / 2

    for y in range(height):
        for x in range(width):
            # Distance from center (0 to 1)
            dx = x - center_x
            dy = y - center_y
            dist = math.sqrt(dx*dx + dy*dy)
            normalized_dist = min(1.0, dist / max_dist)
            
            # Base gradients
            # Core is dense, edges fade
            alpha = (1.0 - normalized_dist)
            alpha = max(0, alpha)
            
            # Simple noise approximation (random fuzz)
            # Real Perlin noise is better but complex to implement without libs.
            # We'll use localized random stacking.
            noise = random.random() * 0.2
            
            # Combine
            final_alpha = alpha * alpha * (0.8 + noise) # Quadratic falloff
            
            # Clamp
            final_alpha = min(1.0, max(0.0, final_alpha))
            
            # Convert to byte (0-255)
            alpha_byte = int(final_alpha * 255)
            
            # Color: White/Grey smoke
            # R, G, B, A
            idx = (y * width + x) * 4
            buffer[idx] = 220     # R
            buffer[idx+1] = 220   # G
            buffer[idx+2] = 230   # B (bluish tint)
            buffer[idx+3] = alpha_byte # A

    # Function to write PNG manually (Uncompressed - extremely simple format)
    # Actually, writing raw PNG chunks without zlib is hard because IDAT requires compression.
    # So we will try to use PIL if available, else standard fallback? 
    # For constraints, let's assume standard python libs.
    # We can write a PAM/PPM (Netpbm) file? Browsers don't support it.
    # We MUST usually use PIL.
    
    try:
        from PIL import Image
        img = Image.frombytes('RGBA', (width, height), bytes(buffer))
        img.save(filename)
        print(f"Start Forging: Generated {filename}")
    except ImportError:
        print("PIL not installed. Trying to use pure python PNG writer (simplified).")
        # Fallback is tough. 
        # Plan B: Just verify if user environment has PIL. Most do.
        exit(1)

if __name__ == "__main__":
    import os
    os.makedirs('assets/images/vfx', exist_ok=True)
    generate_cloud_texture(256, 256, 'assets/images/vfx/fog_cloud.png')
