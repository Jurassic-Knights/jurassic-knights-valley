# Seamless Texture Generator (Local AI)

This tool automates the creation of seamless tileable textures using your local GPU and Stable Diffusion.

## Prerequisites

1.  **Python 3.10+** installed.
2.  **NVIDIA GPU** with at least 8GB VRAM (recommended for Inpainting models).
3.  **HuggingFace Token** (Optional, but sometimes needed for accessing certain models manually, though `runwayml` is public).

## Setup

1.  Open a terminal in this folder:
    ```powershell
    cd tools/texture_automation
    ```

2.  Create a virtual environment (recommended):
    ```powershell
    python -m venv venv
    .\venv\Scripts\activate
    ```

3.  Install dependencies:
    ```powershell
    pip install -r requirements.txt
    ```

    *Note: If you have issues with Torch/CUDA, install PyTorch specifically for your CUDA version from [pytorch.org](https://pytorch.org).*

## Usage

Run the script providing your input image and a prompt describing it:

```powershell
python make_seamless.py "C:\path\to\your\texture.png" --prompt "ground texture of dirt and grass, high fidelity pixel art"
```

### Options

*   `--output`: Specify output path.
*   `--model`: Change the HuggingFace model ID (default: `diffusers/stable-diffusion-xl-1.0-inpainting-0.1`).
*   `--strength`: Adjust inpainting strength (default: 0.55). Lower values preserve more structure.

## How it Works

1.  **Offsets** the image so the edges meet in the center.
2.  **Masks** the central cross where the seams are (with increased blur for SDXL).
3.  **Inpaints** the masked area using **SDXL Inpainting**.
4.  **Composites** the result to strictly preserve the original pixels outside the seam area.
5.  **Restores** the image offset to return it to the original alignment.
