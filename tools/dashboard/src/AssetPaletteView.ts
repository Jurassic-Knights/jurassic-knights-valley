import { fetchCategory, getAssetImage } from './api';
import { ZoneConfig, ZoneCategory } from '../../../src/data/ZoneConfig';

interface PaletteAsset {
    id: string;
    name: string;
    path?: string;
}

export class AssetPaletteView {
    private container: HTMLElement;
    private onSelect: (id: string, category: string) => void;

    private mode: 'object' | 'zone' | 'ground' = 'object';
    private currentCategory: string = 'nodes';
    private currentZoneCategory: string = ZoneCategory.BIOME;
    private selectedAssetId: string | null = null;

    // Cache
    private assets: PaletteAsset[] = [];
    private loadedCategories = new Set<string>();
    private categoryCache = new Map<string, PaletteAsset[]>();

    constructor(containerId: string, onSelect: (id: string, category: string) => void) {
        const el = document.getElementById(containerId);
        if (!el) throw new Error(`Palette container #${containerId} not found`);
        this.container = el;
        this.onSelect = onSelect;

        this.init();
    }

    private init() {
        // Initial Fetch
        this.fetchAssets(this.currentCategory);

        // Event Delegation
        this.container.addEventListener('click', (e) => {
            const target = (e.target as HTMLElement).closest('[data-asset-id]');
            if (target) {
                const id = target.getAttribute('data-asset-id')!;
                const cat = target.getAttribute('data-category')!;

                this.selectedAssetId = id;
                this.render(); // Re-render to update active state

                this.onSelect(id, cat);
            }

            // Tab Click
            const tab = (e.target as HTMLElement).closest('.palette-tab');
            if (tab) {
                const cat = tab.getAttribute('data-cat');
                if (cat) this.setCategory(cat);
            }
        });
    }

    public setMode(mode: 'object' | 'zone' | 'ground') {
        this.mode = mode;
        this.render();
    }

    public setCategory(category: string) {
        if (this.mode === 'zone') {
            this.currentZoneCategory = category;
        } else {
            this.currentCategory = category;
            this.fetchAssets(category);
        }
        this.render();
    }

    private async fetchAssets(category: string) {
        if (this.categoryCache.has(category)) {
            this.assets = this.categoryCache.get(category)!;
            this.render();
            return;
        }

        this.container.innerHTML = '<div class="loading">Loading assets...</div>';

        try {
            const data = await fetchCategory(category);
            const list: PaletteAsset[] = [];

            if (data.entities) {
                data.entities.forEach((e: { id: string; [key: string]: unknown }) => {
                    // Extract path if available in entity definition, or rely on lookup later
                    // Entities usually don't have paths, they reference files.
                    // But if data contains file info, use it.
                    list.push({ id: e.id, name: e.name || e.id });
                });
            } else if (data.files) {
                Object.values(data.files).flat().forEach((f: { path?: string; id?: string; [key: string]: unknown }) => {
                    // Extract path from file object
                    const cleanPath = f.files?.clean || f.files?.original;
                    const displayPath = cleanPath ? cleanPath.replace(/^(assets\/)?images\//, '') : undefined;
                    list.push({ id: f.id, name: f.name || f.id, path: displayPath });
                });
            }

            this.categoryCache.set(category, list);
            this.assets = list;
            this.render();

        } catch (e) {
            this.container.innerHTML = `<div class="error">Failed to load ${category}</div>`;
            console.error(e);
        }
    }

    private render() {
        if (this.mode === 'zone') {
            this.renderZones();
        } else {
            this.renderObjects();
        }
    }

    private renderObjects() {
        // Render Tabs
        const categories = ['nodes', 'enemies', 'resources', 'environment', 'items'];
        let html = '<div class="palette-tabs" style="display:flex; gap:4px; margin-bottom:8px; overflow-x:auto; padding-bottom:4px;">';
        categories.forEach(cat => {
            const isActive = this.currentCategory === cat;
            const bg = isActive ? '#444' : '#2d2d2d';
            const color = isActive ? '#fff' : '#888';
            html += `<button class="palette-tab" data-cat="${cat}" style="padding:4px 8px; border:1px solid #444; background:${bg}; color:${color}; cursor:pointer; font-size:10px; border-radius:4px; white-space:nowrap;">${cat.toUpperCase()}</button>`;
        });
        html += '</div>';

        // Event listener for tabs? 
        // We need to attach it in init or after render. 
        // InnerHTML replaces elements, so listeners are lost.
        // Better: Bind click on container and delegate.

        if (!this.assets.length) {
            html += '<div class="empty">No assets in this category</div>';
            this.container.innerHTML = html;
            return;
        }

        // Grid Layout matching Dashboard Cards
        html += '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(80px, 1fr)); gap: 8px; padding: 10px;">';

        this.assets.forEach(asset => {
            const imgPath = asset.path ? `/images/${asset.path}` : getAssetImage(asset.id);
            const isActive = asset.id === this.selectedAssetId;
            const activeClass = isActive ? 'active' : '';
            const activeStyle = isActive ? 'border: 2px solid #3498db; background: rgba(52, 152, 219, 0.2);' : '';

            html += `
                <div class="card ${activeClass}" 
                     data-asset-id="${asset.id}" 
                     data-category="${this.currentCategory}"
                     style="padding: 4px; cursor: pointer; display: flex; flex-direction: column; align-items: center; border-radius: 4px; ${activeStyle}">
                    <img src="${imgPath}" style="width: 64px; height: 64px; object-fit: contain; image-rendering: pixelated;">
                    <div style="font-size: 10px; text-align: center; margin-top: 4px; word-break: break-all; line-height: 1.1;">
                        ${asset.name}
                    </div>
                </div>
            `;
        });

        html += '</div>';
        this.container.innerHTML = html;
    }

    private renderZones() {
        let html = '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 8px; padding: 10px;">';

        // Filter ZoneConfig by currentZoneCategory
        const zones = Object.values(ZoneConfig).filter(z => z.category === this.currentZoneCategory);

        zones.forEach(z => {
            // Hex color to rgba for style
            // ZoneConfig colors are typically hex strings or numbers. 
            // Assuming hex string or number.
            const color = typeof z.color === 'number' ? '#' + z.color.toString(16).padStart(6, '0') : z.color;
            const isActive = z.id === this.selectedAssetId;
            const activeClass = isActive ? 'active' : '';
            const activeStyle = isActive ? 'border: 2px solid #3498db; background: rgba(52, 152, 219, 0.2);' : '';

            html += `
                <div class="card ${activeClass}" 
                     data-asset-id="${z.id}" 
                     data-category="zone"
                     style="padding: 8px; cursor: pointer; display: flex; gap: 8px; align-items: center; border-radius: 4px; ${activeStyle}">
                    <div style="width: 24px; height: 24px; background: ${color}; border: 1px solid #fff;"></div>
                    <div style="font-size: 11px; font-weight: bold;">${z.name}</div>
                </div>
            `;
        });

        html += '</div>';
        this.container.innerHTML = html;
    }
}
