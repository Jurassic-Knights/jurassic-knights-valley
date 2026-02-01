// import * as PIXI from 'pixi.js'; // Not used here?
// Entities loaded via injection now
import type { EntityConfig } from '../../types/core';
import { ZoneConfig, ZoneCategory } from '@data/ZoneConfig';

interface PaletteAsset {
    id: string;
    files?: {
        clean?: string;
        approved_original?: string;
        original?: string;
    };
    spriteId?: string;
    [key: string]: unknown;
}

export class AssetPalette {
    private container: HTMLElement;
    private onSelect: (assetId: string, category: string) => void;
    private fetchCategory: (category: string) => Promise<any>;
    private activeCategory: string = 'nodes';
    private cache: Record<string, PaletteAsset[]> = {};
    private activeSubFilter: string = 'all';

    // Zone Mode State
    private mode: 'object' | 'zone' = 'object';
    private activeZoneCategory: ZoneCategory = ZoneCategory.BIOME;

    constructor(
        containerId: string,
        onSelect: (assetId: string, category: string) => void,
        fetchCategory: (category: string) => Promise<any>
    ) {
        const el = document.getElementById(containerId);
        if (!el) {
            throw new Error(`AssetPalette container #${containerId} not found`);
        }
        this.container = el;
        this.onSelect = onSelect;
        this.fetchCategory = fetchCategory;

        // Initial load and render
        this.loadCategory(this.activeCategory).then(() => this.render());
    }

    private async loadCategory(category: string) {
        if (this.cache[category]) return;

        try {
            const data = await this.fetchCategory(category);
            const items: PaletteAsset[] = [];

            // 1. From 'entities' (Source of Truth logic)
            if (data.entities && Array.isArray(data.entities)) {
                items.push(...data.entities);
            }

            // 2. From 'files' (Scanned assets) - deduplicate by ID
            if (data.files) {
                Object.values(data.files).flat().forEach((fileItem: any) => {
                    if (!items.find(i => i.id === fileItem.id)) {
                        items.push(fileItem);
                    }
                });
            }

            // Sort alphabetical
            items.sort((a, b) => a.id.localeCompare(b.id));

            this.cache[category] = items;
        } catch (e) {
            console.error(`[AssetPalette] Failed to load ${category}`, e);
            this.cache[category] = [];
        }
    }

    private async setCategory(cat: string) {
        this.activeCategory = cat;
        this.activeSubFilter = 'all'; // Reset sub-filter
        this.container.innerHTML = '<div style="padding:20px; color:#888; text-align:center;">Loading...</div>';
        await this.loadCategory(cat);
        this.render();
    }

    private setSubFilter(filter: string) {
        this.activeSubFilter = filter;
        this.render(); // Re-render grid and tabs (to update active state)
    }

    public setMode(mode: 'object' | 'zone') {
        this.mode = mode;
        this.render();
    }

    public setZoneCategory(cat: ZoneCategory) {
        this.activeZoneCategory = cat;
        if (this.mode === 'zone') this.render();
    }

    private render() {
        this.container.innerHTML = '';
        this.container.style.display = 'flex';
        this.container.style.flexDirection = 'column';
        this.container.style.height = '100%';
        this.container.style.background = '#1e1e1e'; // Darker bg for palette

        // Grid (Scrollable)
        const gridContainer = document.createElement('div');
        gridContainer.style.flex = '1';
        gridContainer.style.overflowY = 'auto';
        gridContainer.style.padding = '10px';

        if (this.mode === 'object') {
            // Header (Fixed)
            const header = document.createElement('div');
            header.style.padding = '10px';
            header.style.background = '#252526';
            header.style.borderBottom = '1px solid #333';
            header.style.flexShrink = '0';

            this.renderCategoryTabs(header);
            this.renderSubFilters(header);
            this.container.appendChild(header);

            this.renderGrid(gridContainer);
        } else {
            // Zone Mode
            this.renderZoneGrid(gridContainer);
        }

        this.container.appendChild(gridContainer);
    }

    private renderCategoryTabs(parent: HTMLElement) {
        const wrapper = document.createElement('div');
        wrapper.style.display = 'flex';
        wrapper.style.gap = '8px';
        wrapper.style.marginBottom = '12px';
        wrapper.style.flexWrap = 'wrap';

        const categories = ['nodes', 'environment', 'enemies', 'resources', 'props', 'ground'];

        categories.forEach(cat => {
            const btn = document.createElement('button');
            const isActive = this.activeCategory === cat;
            btn.innerText = cat.charAt(0).toUpperCase() + cat.slice(1);

            // Replicating Dashboard Sidebar/Tab look roughly
            btn.style.padding = '6px 12px';
            btn.style.fontSize = '12px';
            btn.style.cursor = 'pointer';
            btn.style.border = isActive ? '1px solid #4caf50' : '1px solid #444';
            btn.style.background = isActive ? 'rgba(76, 175, 80, 0.2)' : '#333';
            btn.style.color = isActive ? '#fff' : '#aaa';
            btn.style.borderRadius = '4px';
            btn.style.fontWeight = isActive ? 'bold' : 'normal';

            btn.onclick = () => this.setCategory(cat);
            wrapper.appendChild(btn);
        });

        parent.appendChild(wrapper);
    }

    private renderSubFilters(parent: HTMLElement) {
        const assets = this.cache[this.activeCategory] || [];
        const subtypes = this.extractSubtypes(assets);

        if (subtypes.length <= 1) return; // Don't show if only 'All' exists

        const wrapper = document.createElement('div');
        wrapper.style.display = 'flex';
        wrapper.style.gap = '6px';
        wrapper.style.flexWrap = 'wrap'; // Allow wrapping if many tags (e.g. nodes)

        // "All" Button
        this.createFilterPill(wrapper, 'All', 'all');

        subtypes.forEach(sub => {
            if (sub !== 'all') {
                this.createFilterPill(wrapper, sub, sub);
            }
        });

        parent.appendChild(wrapper);
    }

    private createFilterPill(parent: HTMLElement, label: string, value: string) {
        const btn = document.createElement('button');
        const isActive = this.activeSubFilter === value;

        btn.innerText = label;
        btn.style.padding = '2px 8px';
        btn.style.fontSize = '11px';
        btn.style.cursor = 'pointer';
        btn.style.border = isActive ? '1px solid #3498db' : '1px solid #333';
        btn.style.background = isActive ? 'rgba(52, 152, 219, 0.2)' : '#2a2a2a';
        btn.style.color = isActive ? '#3498db' : '#888';
        btn.style.borderRadius = '12px'; // Pill shape
        btn.style.minWidth = '40px';

        btn.onclick = () => this.setSubFilter(value);
        parent.appendChild(btn);
    }

    private extractSubtypes(assets: PaletteAsset[]): string[] {
        const types = new Set<string>();

        assets.forEach(a => {
            let val = '';

            // Logic varies by category
            if (this.activeCategory === 'nodes') {
                val = (a as any).nodeSubtype;
            } else if (this.activeCategory === 'enemies') {
                // For enemies, try Tier first, then maybe family if I had logic.
                // Let's us Tier like dashboard
                const t = (a as any).tier || (a.id.match(/_t(\d)_/)?.[1]);
                if (t) val = `T${t}`;
            } else if (this.activeCategory === 'resources' || this.activeCategory === 'items') {
                val = (a as any).type;
            } else if (this.activeCategory === 'environment') {
                // maybe biome?
                val = (a as any).biome;
            } else if (this.activeCategory === 'ground') {
                // ground_category_material_biome
                const parts = a.id.split('_');
                if (parts.length >= 2) val = parts[1]; // base, overgrown, etc.
            }

            // Cleanup
            if (val) types.add(val);
        });

        // specific sorting: T1, T2... or Alpha
        return Array.from(types).sort();
    }

    private renderZoneGrid(container: HTMLElement) {
        const zones = Object.values(ZoneConfig).filter(z => z.category === this.activeZoneCategory);

        if (zones.length === 0) {
            container.innerHTML = '<div style="color:#666; font-style:italic; text-align:center;">No zones in category</div>';
            return;
        }

        const grid = document.createElement('div');
        grid.style.display = 'grid';
        grid.style.gridTemplateColumns = '1fr'; // List view for zones
        grid.style.gap = '8px';

        zones.forEach(zone => {
            const item = document.createElement('div');
            item.className = 'palette-item';
            // CSS classes handle hover/select if reused, else inline styles:
            item.style.background = '#2a2a2a';
            item.style.border = '1px solid #333';
            item.style.borderRadius = '4px';
            item.style.padding = '8px';
            item.style.display = 'flex';
            item.style.alignItems = 'center';
            item.style.gap = '10px';
            item.style.cursor = 'pointer';

            item.onclick = () => {
                this.highlightItem(item);
                // For zones, we pass zone ID as asset ID, and category is zone category
                // Or maybe keep 'zone' as category argument?
                // The consumer (MapEditorCore) expects (assetId, category)
                this.onSelect(zone.id, 'zone');
            };

            // Color Swatch
            const swatch = document.createElement('div');
            swatch.style.width = '24px';
            swatch.style.height = '24px';
            swatch.style.borderRadius = '4px';
            swatch.style.backgroundColor = '#' + zone.color.toString(16).padStart(6, '0');
            swatch.style.border = '1px solid #000';

            // Name
            const name = document.createElement('div');
            name.innerText = zone.name;
            name.style.fontSize = '12px';
            name.style.fontWeight = 'bold';
            name.style.color = '#ddd';

            item.appendChild(swatch);
            item.appendChild(name);
            grid.appendChild(item);
        });

        container.appendChild(grid);
    }

    private renderGrid(container: HTMLElement) {
        const assets = this.cache[this.activeCategory] || [];

        // Filter!
        const filtered = assets.filter(a => {
            if (this.activeSubFilter === 'all') return true;

            // Reuse extraction logic check? Or simpler
            if (this.activeCategory === 'nodes') return (a as any).nodeSubtype === this.activeSubFilter;
            if (this.activeCategory === 'enemies') {
                const t = (a as any).tier || (a.id.match(/_t(\d)_/)?.[1]);
                return `T${t}` === this.activeSubFilter;
            }
            if (this.activeCategory === 'resources') return (a as any).type === this.activeSubFilter;
            if (this.activeCategory === 'environment') return (a as any).biome === this.activeSubFilter;
            if (this.activeCategory === 'ground') {
                const parts = a.id.split('_');
                return parts.length >= 2 && parts[1] === this.activeSubFilter;
            }
            return true;
        });

        if (filtered.length === 0) {
            container.innerHTML = '<div style="color:#666; font-style:italic; text-align:center; padding-top:20px;">No assets match filter</div>';
            return;
        }

        const grid = document.createElement('div');
        grid.style.display = 'grid';
        grid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(80px, 1fr))'; // Slightly larger for labels
        grid.style.gap = '8px';

        filtered.forEach((asset: PaletteAsset) => {
            const item = document.createElement('div');
            item.className = 'palette-item';
            // Mini-Card Style
            item.style.background = '#2a2a2a';
            item.style.border = '1px solid #333';
            item.style.borderRadius = '6px';
            item.style.padding = '6px';
            item.style.display = 'flex';
            item.style.flexDirection = 'column';
            item.style.alignItems = 'center';
            item.style.cursor = 'pointer';
            item.style.transition = 'all 0.1s';

            item.onmouseenter = () => { item.style.background = '#333'; item.style.borderColor = '#555'; };
            item.onmouseleave = () => { if (!item.classList.contains('selected')) { item.style.background = '#2a2a2a'; item.style.borderColor = '#333'; } };

            item.onclick = () => {
                this.highlightItem(item);
                this.onSelect(asset.id, this.activeCategory);
            };

            // Image
            // Use simple heuristic for Dashboard (assuming /images/ path works)
            let imgPath = '';
            if (asset.files && (asset.files.clean || asset.files.approved_original || asset.files.original)) {
                const f = asset.files.clean || asset.files.approved_original || asset.files.original;
                const rel = f!.replace(/^(assets\/)?images\//, '');
                imgPath = `/images/${rel}`;
            }

            if (imgPath) {
                const img = document.createElement('img');
                img.src = imgPath;
                img.style.width = '48px';
                img.style.height = '48px';
                img.style.objectFit = 'contain';
                img.style.marginBottom = '6px';

                img.onerror = () => {
                    img.src = '/images/PH.png';
                    img.style.opacity = '0.3';
                };
                item.appendChild(img);
            } else {
                const ph = document.createElement('div');
                ph.style.width = '48px';
                ph.style.height = '48px';
                ph.style.background = '#222';
                ph.style.borderRadius = '4px';
                ph.style.marginBottom = '6px';
                ph.style.display = 'flex';
                ph.style.alignItems = 'center';
                ph.style.justifyContent = 'center';
                ph.style.color = '#444';
                ph.innerText = '?';
                item.appendChild(ph);
            }

            // Label
            const label = document.createElement('div');
            const cleanName = asset.id
                .replace(this.activeCategory + '_', '')
                .replace(/^node_/, '')
                .replace(/^enemy_/, '')
                .replace(/_t\d_/, '_') // remove tier from middle
                .replace(/_/g, ' ');

            label.innerText = cleanName;
            label.style.fontSize = '10px';
            label.style.color = '#ccc';
            label.style.textAlign = 'center';
            label.style.lineHeight = '1.2';
            label.style.maxHeight = '2.4em'; // 2 lines
            label.style.overflow = 'hidden';
            label.style.width = '100%';

            item.title = asset.id; // Full ID on hover
            item.appendChild(label);

            grid.appendChild(item);
        });

        container.appendChild(grid);
    }

    private highlightItem(selectedElement: HTMLElement) {
        // Clear previous selection
        const prev = this.container.querySelectorAll('.palette-item.selected');
        prev.forEach(el => {
            (el as HTMLElement).style.borderColor = '#333';
            (el as HTMLElement).style.background = '#2a2a2a';
            el.classList.remove('selected');
        });

        // Highlight new
        selectedElement.classList.add('selected');
        selectedElement.style.borderColor = '#4caf50';
        selectedElement.style.background = '#333';
    }
}
