import { fetchCategory, getAssetImage, selectBestImagePath } from './api';
import { ZoneConfig, ZoneCategory } from '../../../src/data/ZoneConfig';
import type { AssetItem } from './state';

interface PaletteAsset {
    id: string;
    name: string;
    path?: string;
    tier?: number;
    biome?: string;
    nodeSubtype?: string;
    sourceFile?: string;
}

interface PaletteFilter {
    tier: string | number;
    biome: string;
    nodeSubtype: string;
}

const TIER_COLORS: Record<string, string> = {
    '1': '#9e9e9e',
    '2': '#4caf50',
    '3': '#2196f3',
    '4': '#9c27b0',
    '5': '#ff9800',
};

const BIOME_COLORS: Record<string, string> = {
    grasslands: '#4caf50',
    tundra: '#3498db',
    desert: '#e67e22',
    badlands: '#c0392b',
    global: '#7f8c8d',
};

const PALETTE_CATEGORY_KEY = 'map-editor-palette-category';

export class AssetPaletteView {
    private container: HTMLElement;
    private onSelect: (id: string, category: string) => void;

    private mode: 'object' | 'zone' | 'ground' | 'manipulation' = 'object';
    private currentCategory: string = 'nodes';
    private currentZoneCategory: string = ZoneCategory.BIOME;
    private selectedAssetId: string | null = null;

    // Filters (same as dashboard tabs)
    private paletteFilter: PaletteFilter = {
        tier: 'all',
        biome: 'all',
        nodeSubtype: 'all',
    };

    // Cache
    private assets: PaletteAsset[] = [];
    private categoryCache = new Map<string, PaletteAsset[]>();

    constructor(containerId: string, onSelect: (id: string, category: string) => void) {
        const el = document.getElementById(containerId);
        if (!el) throw new Error(`Palette container #${containerId} not found`);
        this.container = el;
        this.onSelect = onSelect;

        const stored = localStorage.getItem(PALETTE_CATEGORY_KEY);
        if (stored && ['nodes', 'enemies', 'resources', 'environment', 'items'].includes(stored)) {
            this.currentCategory = stored;
        }

        this.init();
    }

    private init() {
        // Initial Fetch
        this.fetchAssets(this.currentCategory);

        // Event Delegation
        this.container.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;

            // Asset card click
            const assetCard = target.closest('[data-asset-id]');
            if (assetCard) {
                const id = assetCard.getAttribute('data-asset-id')!;
                const cat = assetCard.getAttribute('data-category')!;
                this.selectedAssetId = id;
                this.render();
                this.onSelect(id, cat);
            }

            // Tab click
            const tab = target.closest('.palette-tab');
            if (tab) {
                const cat = tab.getAttribute('data-cat');
                if (cat) this.setCategory(cat);
            }

            // Filter pill click
            const filterBtn = target.closest('[data-palette-filter]');
            if (filterBtn) {
                const filterType = filterBtn.getAttribute('data-palette-filter')!;
                const value = filterBtn.getAttribute('data-value')!;
                this.applyPaletteFilter(filterType as keyof PaletteFilter, value);
            }
        });
    }

    private applyPaletteFilter(key: keyof PaletteFilter, value: string): void {
        const current = this.paletteFilter[key];
        this.paletteFilter[key] = String(current) === value ? 'all' : value;
        this.render();
    }

    public setMode(mode: 'object' | 'zone' | 'ground' | 'manipulation') {
        this.mode = mode;
        this.render();
    }

    public setCategory(category: string) {
        if (this.mode === 'zone') {
            this.currentZoneCategory = category;
        } else {
            this.currentCategory = category;
            this.paletteFilter = { tier: 'all', biome: 'all', nodeSubtype: 'all' };
            try {
                localStorage.setItem(PALETTE_CATEGORY_KEY, category);
            } catch {
                /* ignore */
            }
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

            const toPaletteAsset = (e: AssetItem, sourceFile?: string): PaletteAsset => {
                const displayPath = selectBestImagePath(e.files);
                const tier = e.tier ?? (e.id?.match(/_t(\d)_/)?.[1] ? parseInt(e.id.match(/_t(\d)_/)![1]) : undefined);
                return {
                    id: e.id,
                    name: e.name || e.id,
                    path: displayPath,
                    tier,
                    biome: e.biome,
                    nodeSubtype: e.nodeSubtype,
                    sourceFile: sourceFile ?? e.sourceFile,
                };
            };

            if (data.entities) {
                (data.entities as AssetItem[]).forEach((e) => list.push(toPaletteAsset(e)));
            } else if (data.files) {
                for (const [fileKey, items] of Object.entries(data.files)) {
                    (items as AssetItem[]).forEach((e) => list.push(toPaletteAsset(e, fileKey)));
                }
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
        } else if (this.mode === 'ground') {
            this.renderGround();
        } else if (this.mode === 'manipulation') {
            this.container.innerHTML =
                '<p style="padding:12px; color:#aaa; font-size:12px; line-height:1.4;">Drag towns and stations to move them to another polygon.</p>';
        } else {
            this.renderObjects();
        }
    }

    private renderObjects() {
        const categories = ['nodes', 'enemies', 'resources', 'environment', 'items'];
        let html =
            '<div class="palette-tabs" style="display:flex; flex-wrap:wrap; gap:4px; margin-bottom:8px; padding-bottom:4px;">';
        categories.forEach((cat) => {
            const isActive = this.currentCategory === cat;
            const bg = isActive ? '#444' : '#2d2d2d';
            const color = isActive ? '#fff' : '#888';
            html += `<button class="palette-tab" data-cat="${cat}" style="padding:4px 8px; border:1px solid #444; background:${bg}; color:${color}; cursor:pointer; font-size:10px; border-radius:4px; white-space:nowrap;">${cat.toUpperCase()}</button>`;
        });
        html += '</div>';

        if (!this.assets.length) {
            html += '<div class="empty">No assets in this category</div>';
            this.container.innerHTML = html;
            return;
        }

        // Filter UI (same as dashboard: Tier, Biome, Type)
        html += this.renderPaletteFilters();
        html += '<div style="margin-bottom:8px;"></div>';

        // Apply filters
        const filtered = this.getFilteredAssets();

        if (!filtered.length) {
            html += `<div class="empty" style="padding:8px; color:#888; font-size:11px;">No assets match filters (${this.assets.length} total)</div>`;
            this.container.innerHTML = html;
            return;
        }

        // Grid
        html += '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(80px, 1fr)); gap: 8px; padding: 10px;">';
        filtered.forEach((asset) => {
            const imgPath = asset.path ? `/images/${asset.path}` : getAssetImage(asset.id);
            const isActive = asset.id === this.selectedAssetId;
            const activeStyle = isActive
                ? 'border: 2px solid #3498db; background: rgba(52, 152, 219, 0.2);'
                : '';

            html += `
                <div class="card" 
                     data-asset-id="${asset.id}" 
                     data-category="${this.currentCategory}"
                     style="padding: 4px; cursor: pointer; display: flex; flex-direction: column; align-items: center; border-radius: 4px; ${activeStyle}">
                    <img src="${imgPath}" style="width: 64px; height: 64px; object-fit: contain; image-rendering: pixelated;">
                    <div style="font-size: 10px; text-align: center; margin-top: 4px; word-break: break-all; line-height: 1.1;">
                        ${this.escapeHtml(asset.name)}
                    </div>
                </div>
            `;
        });
        html += '</div>';
        this.container.innerHTML = html;
    }

    private getFilteredAssets(): PaletteAsset[] {
        let items = this.assets;
        if (this.paletteFilter.tier !== 'all') {
            items = items.filter(
                (i) => String(i.tier ?? (i.id.match(/_t(\d)_/)?.[1]) ?? 0) === String(this.paletteFilter.tier)
            );
        }
        if (this.paletteFilter.biome !== 'all') {
            items = items.filter((i) => i.biome === this.paletteFilter.biome);
        }
        if (this.paletteFilter.nodeSubtype !== 'all') {
            items = items.filter(
                (i) => i.nodeSubtype === this.paletteFilter.nodeSubtype || i.sourceFile === this.paletteFilter.nodeSubtype
            );
        }
        return items;
    }

    private renderPaletteFilters(): string {
        const all = this.assets;
        let html = '<div class="palette-filters">';

        // Tier (skip if no items have tier)
        const hasTiers = all.some(
            (i) => i.tier != null || (i.id && /_t\d_/.test(i.id))
        );
        if (hasTiers) {
            html += '<div class="filter-module">';
            html += '<div class="module-label" style="font-size:9px; color:#888; margin-bottom:4px;">TIER</div>';
            html += '<div class="module-content">';
            ['all', '1', '2', '3', '4', '5'].forEach((t) => {
                const label = t === 'all' ? 'All' : `T${t}`;
                const isActive = String(this.paletteFilter.tier) === t;
                const color = t === 'all' ? undefined : TIER_COLORS[t];
                html += this.filterPillHtml('tier', t, label, isActive, color);
            });
            html += '</div></div>';
        }

        // Biome
        const biomes = [...new Set(all.map((i) => i.biome).filter((b): b is string => !!b && b !== 'all'))];
        if (biomes.length > 0) {
            html += '<div class="filter-module">';
            html += '<div class="module-label" style="font-size:9px; color:#888; margin-bottom:4px;">BIOME</div>';
            html += '<div class="module-content">';
            html += this.filterPillHtml('biome', 'all', 'All', this.paletteFilter.biome === 'all');
            biomes.sort().forEach((b) => {
                const color = BIOME_COLORS[b.toLowerCase()];
                html += this.filterPillHtml('biome', b, b, this.paletteFilter.biome === b, color);
            });
            html += '</div></div>';
        }

        // Type (nodeSubtype or sourceFile)
        const subtypes = [...new Set(all.map((i) => i.nodeSubtype ?? i.sourceFile).filter((s): s is string => !!s))];
        if (subtypes.length > 0) {
            html += '<div class="filter-module">';
            html += '<div class="module-label" style="font-size:9px; color:#888; margin-bottom:4px;">TYPE</div>';
            html += '<div class="module-content">';
            html += this.filterPillHtml('nodeSubtype', 'all', 'All', this.paletteFilter.nodeSubtype === 'all');
            subtypes.sort().forEach((s) => {
                const label = s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ');
                html += this.filterPillHtml('nodeSubtype', s, label, this.paletteFilter.nodeSubtype === s, '#e67e22');
            });
            html += '</div></div>';
        }

        html += '</div>';
        return html;
    }

    private filterPillHtml(
        filterKey: string,
        value: string,
        text: string,
        isActive: boolean,
        color?: string
    ): string {
        const base =
            'padding:2px 6px; font-size:9px; border-radius:4px; cursor:pointer; border:1px solid #444; background:transparent;';
        const activeStyle = isActive
            ? color
                ? `background:${color}; color:#fff; border-color:${color};`
                : 'background:#555; color:#fff;'
            : color
                ? `color:${color}; border-color:${color}66;`
                : 'color:#888;';
        return `<button data-palette-filter="${filterKey}" data-value="${this.escapeHtml(value)}" class="filter-pill ${isActive ? 'active' : ''}" style="${base}${activeStyle}">${this.escapeHtml(text)}</button>`;
    }

    private escapeHtml(str: string): string {
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    private renderGround() {
        const html = `
            <div style="padding:12px; color:#888; font-size:12px; line-height:1.5;">
                <p style="margin-bottom:8px;"><strong>Ground Brush</strong></p>
                <p style="margin-bottom:8px;">Use the brush to paint ground blend. Ground texture is determined by the Zone (biome).</p>
                <p style="margin-bottom:8px;">• <strong>Click/drag</strong> to paint</p>
                <p>• <strong>Shift+click</strong> to erase</p>
            </div>
        `;
        this.container.innerHTML = html;
    }

    private renderZones() {
        let html =
            '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 8px; padding: 10px;">';

        // Filter ZoneConfig by currentZoneCategory
        const zones = Object.values(ZoneConfig).filter(
            (z) => z.category === this.currentZoneCategory
        );

        zones.forEach((z) => {
            // Hex color to rgba for style
            // ZoneConfig colors are typically hex strings or numbers.
            // Assuming hex string or number.
            const color =
                typeof z.color === 'number' ? '#' + z.color.toString(16).padStart(6, '0') : z.color;
            const isActive = z.id === this.selectedAssetId;
            const activeClass = isActive ? 'active' : '';
            const activeStyle = isActive
                ? 'border: 2px solid #3498db; background: rgba(52, 152, 219, 0.2);'
                : '';

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
