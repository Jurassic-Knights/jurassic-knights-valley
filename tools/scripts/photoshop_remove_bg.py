"""
Photoshop Background Removal Script
Processes *_approved_original images through Photoshop.
Outputs as *_clean.png files.

Features:
- Background minimizer thread keeps Photoshop minimized
- Foreground lock prevents focus stealing
- Batch processing - single PS launch for all images
- Native autoCutout API (no external action required)
- Auto-recovery: kills and restarts PS if it hangs
- Skips assets that already have a _clean version
"""
import os
import sys
import subprocess
import glob
import time
import threading
import ctypes

# Configuration
PHOTOSHOP_PATH = r"C:\Program Files\Adobe\Adobe Photoshop 2026\Photoshop.exe"
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
JSX_SCRIPT = os.path.join(SCRIPT_DIR, "run_remove_bg.jsx")
CONFIG_FILE = os.path.join(os.environ.get("TEMP", "/tmp"), "ps_remove_bg_config.txt")

# Timeout settings
STARTUP_GRACE_PERIOD = 45  # Seconds to wait for PS to fully open before checking for stalls
STALL_TIMEOUT = 45  # Seconds without progress before restarting PS

# Global flag to control background minimizer
_keep_minimizing = False

def _minimizer_loop():
    """Background loop that continuously minimizes Photoshop."""
    user32 = ctypes.windll.user32
    
    while _keep_minimizing:
        try:
            hwnd = user32.FindWindowW("Photoshop", None)
            if hwnd:
                user32.ShowWindow(hwnd, 6)  # SW_MINIMIZE
        except:
            pass
        time.sleep(0.1)

def start_minimizer():
    """Start the background minimizer thread."""
    global _keep_minimizing
    _keep_minimizing = True
    thread = threading.Thread(target=_minimizer_loop, daemon=True)
    thread.start()
    return thread

def stop_minimizer():
    """Stop the background minimizer thread."""
    global _keep_minimizing
    _keep_minimizing = False

def kill_photoshop():
    """Kill all Photoshop processes."""
    try:
        subprocess.run(["taskkill", "/f", "/im", "Photoshop.exe"], 
                      capture_output=True, creationflags=subprocess.CREATE_NO_WINDOW)
        time.sleep(2)  # Wait for process to fully terminate
        print("  ! Photoshop terminated")
    except:
        pass

def launch_photoshop():
    """Launch Photoshop with the JSX script."""
    user32 = ctypes.windll.user32
    user32.LockSetForegroundWindow(1)  # LSFW_LOCK
    
    subprocess.Popen([PHOTOSHOP_PATH, "-r", JSX_SCRIPT],
                    creationflags=subprocess.CREATE_NO_WINDOW | subprocess.DETACHED_PROCESS)
    
    time.sleep(0.5)
    user32.LockSetForegroundWindow(2)  # LSFW_UNLOCK
    print("  > Photoshop launched (waiting for startup...)")

def write_config(pairs):
    """Write image pairs to config file."""
    with open(CONFIG_FILE, "w", encoding="utf-8") as f:
        for input_path, output_path in pairs:
            f.write(input_path + "\n")
            f.write(output_path + "\n")

def batch_process(input_folder):
    """Batch process all *_approved_original images in a folder."""
    # Find approved images
    images = glob.glob(os.path.join(input_folder, "*_approved_original.png"))
    images += glob.glob(os.path.join(input_folder, "*_approved_original.jpg"))
    
    # Fallback to legacy naming
    if not images:
        images = glob.glob(os.path.join(input_folder, "*_approved.png"))
        images += glob.glob(os.path.join(input_folder, "*_approved.jpg"))
        if images:
            print("Note: Using legacy *_approved files")
    
    print(f"Found {len(images)} approved images")
    
    if not images:
        print("No approved images found. Approve assets in the dashboard first.")
        return
    
    # Build list of input/output pairs, SKIP if clean already exists
    all_pairs = []
    skipped = 0
    for img_path in images:
        basename = os.path.basename(img_path)
        clean_name = basename.replace("_approved_original", "_clean").replace("_approved", "_clean")
        clean_name = os.path.splitext(clean_name)[0] + ".png"
        out_path = os.path.join(input_folder, clean_name)
        
        # Skip if clean version already exists
        if os.path.exists(out_path):
            skipped += 1
            continue
            
        all_pairs.append((os.path.abspath(img_path).replace("\\", "/"),
                         os.path.abspath(out_path).replace("\\", "/")))
    
    if skipped > 0:
        print(f"Skipped {skipped} images (clean version already exists)")
    
    if not all_pairs:
        print("All images already have clean versions.")
        return
    
    print(f"Processing {len(all_pairs)} images...")
    
    # Start background minimizer
    print("Starting background minimizer...")
    start_minimizer()
    
    try:
        # Track remaining pairs
        remaining_pairs = list(all_pairs)
        completed = set()
        restart_count = 0
        max_restarts = 3
        
        while remaining_pairs and restart_count <= max_restarts:
            # Write remaining pairs to config
            write_config(remaining_pairs)
            
            print(f"Launching Photoshop ({len(remaining_pairs)} images remaining)...")
            launch_photoshop()
            
            # Wait for Photoshop to fully start before monitoring
            startup_wait = STARTUP_GRACE_PERIOD
            print(f"  > Waiting {startup_wait}s for Photoshop startup...")
            for i in range(startup_wait):
                time.sleep(1)
                # Check for early completions during startup
                for input_path, output_path in remaining_pairs[:]:
                    out_check = output_path.replace("/", "\\")
                    if out_check not in completed and os.path.exists(out_check):
                        completed.add(out_check)
                        remaining_pairs.remove((input_path, output_path))
                        print(f"  > Saved: {os.path.basename(output_path)}")
                        # Rename approved to final
                        input_native = input_path.replace("/", "\\")
                        final_path = input_native.replace("_approved_original", "_final_original")
                        if os.path.exists(input_native) and "_approved_original" in input_native:
                            os.rename(input_native, final_path)
                            print(f"  > Renamed to final: {os.path.basename(final_path)}")
                
                if not remaining_pairs:
                    break
            
            if not remaining_pairs:
                break
            
            # Now monitor for progress with stall detection
            last_progress_time = time.time()
            last_completed_count = len(completed)
            
            while True:
                time.sleep(1)
                
                # Check for new completions
                for input_path, output_path in remaining_pairs[:]:
                    out_check = output_path.replace("/", "\\")
                    if out_check not in completed and os.path.exists(out_check):
                        completed.add(out_check)
                        remaining_pairs.remove((input_path, output_path))
                        print(f"  > Saved: {os.path.basename(output_path)}")
                        last_progress_time = time.time()
                        # Rename approved to final
                        input_native = input_path.replace("/", "\\")
                        final_path = input_native.replace("_approved_original", "_final_original")
                        if os.path.exists(input_native) and "_approved_original" in input_native:
                            os.rename(input_native, final_path)
                            print(f"  > Renamed to final: {os.path.basename(final_path)}")
                
                # Check if all done
                if not remaining_pairs:
                    break
                
                # Check for stall
                if len(completed) > last_completed_count:
                    last_completed_count = len(completed)
                    last_progress_time = time.time()
                elif time.time() - last_progress_time > STALL_TIMEOUT:
                    print(f"  ! No progress for {STALL_TIMEOUT}s - restarting Photoshop...")
                    kill_photoshop()
                    restart_count += 1
                    time.sleep(3)
                    break  # Exit inner loop to restart
        
        if restart_count > max_restarts and remaining_pairs:
            print(f"\n! Max restarts ({max_restarts}) reached. {len(remaining_pairs)} images failed.")
        
        print(f"\nCompleted: {len(completed)}/{len(all_pairs)} images processed")
        
    finally:
        stop_minimizer()
        # Clean up - kill PS at end
        kill_photoshop()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python photoshop_remove_bg.py <folder>")
        print("Example: python photoshop_remove_bg.py assets/images/dinosaurs")
        sys.exit(1)
    
    batch_process(sys.argv[1])
