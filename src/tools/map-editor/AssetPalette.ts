
import { EntityLoader, EntityRegistry } from '@entities/EntityLoader';
import { AssetLoader } from '@core/AssetLoader';
import { Logger } from '@core/Logger';

export class AssetPalette {
    private container: HTMLElement;
    private onSelect: (assetId: string, category: string) => void;
    private activeCategory: string = 'nodes';

    constructor(containerId: string, onSelect: (assetId: string, category: string) => void) {
        const el = document.getElementById(containerId);
        if (!el) {
            throw new Error(`AssetPalette container #${containerId} not found`);
        }
        this.container = el;
        this.onSelect = onSelect;

        this.init();
    }

    private async init() {
        // Ensure entities are loaded
        if (!EntityLoader.loaded) {
            await EntityLoader.init();
        }

        this.render();
    }

    private render() {
        this.container.innerHTML = '';

        // 1. Category Tabs
        const tabs = document.createElement('div');
        tabs.className = 'palette-tabs';
        tabs.style.display = 'flex';
        tabs.style.gap = '5px';
        tabs.style.marginBottom = '10px';
        tabs.style.flexWrap = 'wrap';

        const categories = ['nodes', 'environment', 'enemies', 'resources'];

        categories.forEach(cat => {
            const btn = document.createElement('button');
            btn.innerText = cat.charAt(0).toUpperCase() + cat.slice(1);
            btn.className = `filter-btn secondary ${this.activeCategory === cat ? 'active' : ''}`;
            btn.style.padding = '4px 8px';
            btn.style.fontSize = '12px';
            btn.onclick = () => {
                this.activeCategory = cat;
                this.render(); // Re-render content
            };
            tabs.appendChild(btn);
        });

        this.container.appendChild(tabs);

        // 2. Asset Grid
        const grid = document.createElement('div');
        grid.style.display = 'grid';
        grid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(64px, 1fr))';
        grid.style.gap = '8px';

        const assets = this.getAssetsByCategory(this.activeCategory);

        if (assets.length === 0) {
            grid.innerHTML = '<div style="color:#666; font-style:italic; grid-column:1/-1;">No assets found</div>';
        }

        assets.forEach(asset => {
            const item = document.createElement('div');
            item.className = 'palette-item';
            item.style.border = '1px solid #444';
            item.style.borderRadius = '4px';
            item.style.padding = '4px';
            item.style.cursor = 'pointer';
            item.style.textAlign = 'center';
            item.style.background = '#333';
            item.onclick = () => {
                this.highlightItem(item);
                this.onSelect(asset.id, this.activeCategory);
            };

            // Image
            // Try explicit file property first, then internal logic
            const imgPath = (asset.files && (asset.files.clean || asset.files.approved_original || asset.files.original))
                ? AssetLoader.basePath + (asset.files.clean || asset.files.approved_original || asset.files.original).replace('assets/', '')
                : (AssetLoader.getImagePath(asset.id) || AssetLoader.getImagePath(asset.spriteId));

            if (imgPath) {
                const img = document.createElement('img');
                img.src = imgPath;
                img.style.width = '48px';
                img.style.height = '48px';
                img.style.objectFit = 'contain';

                // Fallback for broken images
                img.onerror = () => {
                    img.src = '/assets/images/PH.png'; // Force absolute path to PH
                    img.style.opacity = '0.5'; // Dim broken assets
                };

                item.appendChild(img);
            } else {
                // No path found at all
                const ph = document.createElement('div');
                ph.style.width = '48px';
                ph.style.height = '48px';
                ph.style.background = '#222';
                ph.style.display = 'flex';
                ph.style.alignItems = 'center';
                ph.style.justifyContent = 'center';
                ph.innerText = '?';
                item.appendChild(ph);
            }

            // Label
            const label = document.createElement('div');
            label.innerText = asset.id.replace(this.activeCategory + '_', '').substring(0, 10);
            label.style.fontSize = '10px';
            label.style.overflow = 'hidden';
            label.style.textOverflow = 'ellipsis';
            label.style.marginTop = '4px';
            label.title = asset.id; // Tooltip
            item.appendChild(label);

            grid.appendChild(item);
        });

        this.container.appendChild(grid);
    }

    private highlightItem(selectedElement: HTMLElement) {
        // Clear previous selection
        const prev = this.container.querySelectorAll('.palette-item.selected');
        prev.forEach(el => {
            (el as HTMLElement).style.borderColor = '#444';
            (el as HTMLElement).style.background = '#333';
            el.classList.remove('selected');
        });

        // Highlight new
        selectedElement.classList.add('selected');
        selectedElement.style.borderColor = '#00ff00';
        selectedElement.style.background = '#444';
    }

    private getAssetsByCategory(category: string): any[] {
        if (!EntityRegistry[category]) return [];
        return Object.values(EntityRegistry[category]);
    }
}
