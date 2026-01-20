"""
Dashboard API - Shared Utilities
Common paths, helpers, and configuration
"""
import os

# Base paths
TOOLS_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BASE_DIR = os.path.dirname(TOOLS_DIR)
IMAGES_DIR = os.path.join(BASE_DIR, "assets", "images")


def get_status(filename):
    """Determine asset status from filename"""
    if '_declined' in filename:
        return 'declined'
    elif '_approved' in filename or '_final' in filename:
        return 'approved'
    elif '_clean' in filename:
        return 'clean'
    else:
        return 'pending'


def scan_assets():
    """Scan assets folder and return manifest"""
    manifest = {'pending': [], 'approved': [], 'declined': [], 'clean': []}
    
    for folder in os.listdir(IMAGES_DIR):
        folder_path = os.path.join(IMAGES_DIR, folder)
        if not os.path.isdir(folder_path):
            continue
        for file in os.listdir(folder_path):
            if file.endswith('.png'):
                status = get_status(file)
                rel_path = f"{folder}/{file}"
                manifest[status].append({
                    'path': rel_path,
                    'folder': folder,
                    'name': file
                })
    
    return manifest


def get_manifest():
    """Get asset manifest with counts"""
    manifest = scan_assets()
    return {
        'pending': manifest['pending'],
        'approved': manifest['approved'],
        'declined': manifest['declined'],
        'clean': manifest['clean'],
        'counts': {
            'pending': len(manifest['pending']),
            'approved': len(manifest['approved']),
            'declined': len(manifest['declined']),
            'clean': len(manifest['clean'])
        }
    }
