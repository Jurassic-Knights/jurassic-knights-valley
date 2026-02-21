# Dashboard Modular Structure

This directory contains a modular refactored version of the Asset Dashboard.

## Status: **Complete**

The original `asset_dashboard.html` has been refactored into modular components.

## How to Access

- **Game**: `http://localhost:5173/` (default)
- **Dashboard**: `http://localhost:5173/dashboard/` or `http://localhost:5173/tools/dashboard/`

Run `npm run dev` then open the dashboard URL.

## File Structure

```
dashboard/
├── index.html              # Main HTML (100 lines)
├── README.md               # This file
├── css/
│   └── style.css           # All CSS styles (280 lines)
└── js/
    ├── state.js            # Global state & constants (130 lines)
    ├── api.js              # API communication (400 lines)
    ├── modals.js           # Image preview modal (75 lines)
    ├── views.js            # View navigation (190 lines)
    ├── categoryRenderer.js # Category rendering (600 lines)
    ├── lootRenderer.js     # Loot view (stub)
    ├── templates.js        # Templates editor (stub)
    └── main.js             # Initialization (50 lines)
```

## What's Complete
- ✅ CSS extracted to external file
- ✅ State management and constants
- ✅ API communication layer
- ✅ Modal handling
- ✅ View navigation and landing page
- ✅ Category grid rendering (`renderCategoryView`)
- ✅ Asset card creation (`createCategoryCard`)
- ✅ All filter setters
- ✅ Server routes for `/dashboard/`

## What's Stubbed (Optional Future Work)
- Loot view rendering (rarely used)
- Templates editor (rarely used)

## Changes to Original
- Removed broken Sound tab (relied on undefined `SOUND_REGISTRY`)
- Original reduced from 2,602 to 2,539 lines

## Benefits
- **Easier Maintenance**: Smaller, focused files
- **Better AI Comprehension**: Cleaner separation of concerns  
- **Faster Iteration**: Edit specific modules without parsing entire file
- **Parallel Development**: Multiple developers can work on different modules
