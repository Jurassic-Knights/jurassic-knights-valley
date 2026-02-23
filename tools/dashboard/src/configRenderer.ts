/**
 * Config Renderer - Renders the Master Config tab UI
 *
 * Displays editable config sections with instant auto-save on change.
 */

interface ConfigSection {
    [key: string]: unknown;
}

interface GameConfig {
    [key: string]: ConfigSection | unknown;
}

// Section display names and descriptions (tunable sections from GameConfig.ts)
const SECTION_META: Record<string, { name: string; description: string }> = {
    // Core
    Hero: { name: 'Hero', description: 'Hero stats (speed, health)' },
    BodyTypes: { name: 'Body Types', description: 'Scale multipliers' },

    // Combat
    Combat: { name: 'Combat', description: 'Combat ranges and damage' },
    WeaponDefaults: { name: 'Weapon Defaults', description: 'Base stats by weapon type' },

    // Entities
    AI: { name: 'AI', description: 'Enemy AI behavior' },
    Spawning: { name: 'Spawning', description: 'Spawn settings' },
    Interaction: { name: 'Interaction', description: 'Interaction radii' },

    // World & Environment
    Time: { name: 'Time', description: 'Day/night cycle' },
    World: { name: 'World', description: 'World generation' },

    // Economy
    PlayerResources: { name: 'Player Resources', description: 'Starting currency and materials' },

    // System
    Audio: { name: 'Audio', description: 'Audio settings' },
    VFX: { name: 'VFX', description: 'Visual effects' },
    UI: { name: 'UI', description: 'User Interface' }
};

let currentConfig: GameConfig | null = null;

const SECTION_ICONS: Record<string, string> = {
    Hero: '🛡️',
    Combat: '⚔️',
    Interaction: '✋',
    AI: '🧠',
    Spawning: '🐣',
    Time: '⏰',
    PlayerResources: '💰',
    BodyTypes: '📏',
    WeaponDefaults: '🔫',
    Audio: '🔊',
    VFX: '✨',
    World: '🌍',
    UI: '🖥️'
};

// Visual grouping for the config page
const CONFIG_GROUPS: Record<string, string[]> = {
    'Core Settings': ['Hero', 'BodyTypes'],
    'Combat & Actions': ['Combat', 'WeaponDefaults'],
    'World & Entities': ['Time', 'World', 'Spawning', 'AI', 'Interaction'],
    'System & Economy': ['PlayerResources', 'Audio', 'VFX', 'UI']
};

export async function renderConfigView(container: HTMLElement): Promise<void> {
    // Inject Styles locally to avoid touching global CSS for now
    const styleId = 'config-page-styles';
    if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
            .config-container {
                padding: 10px;
                width: 100%;
                box-sizing: border-box;
                margin: 0 auto;
                max-width: 100%; /* Utilize full width */
            }
            .config-header-block {
                margin-bottom: 24px;
                border-bottom: 1px solid #333;
                padding-bottom: 16px;
            }
            
            .config-nav {
                display: flex;
                flex-wrap: wrap;
                gap: 12px;
                margin-bottom: 24px;
                position: sticky;
                top: 0;
                background: #111;
                padding: 12px 0;
                z-index: 100;
                border-bottom: 1px solid #333;
            }
            .nav-btn {
                background: #252525;
                border: 1px solid #444;
                color: #ccc;
                padding: 8px 16px;
                border-radius: 20px;
                cursor: pointer;
                font-size: 0.9rem;
                font-weight: 600;
                transition: all 0.2s;
            }
            .nav-btn:hover {
                background: #333;
                border-color: #666;
                color: #fff;
            }
            .nav-btn.active {
                background: var(--accent-cyan);
                border-color: var(--accent-cyan);
                color: #000;
            }

            /* Group Layout */
            .config-group {
                margin-bottom: 32px;
                scroll-margin-top: 80px; /* Offset for sticky nav */
            }
            .config-group-title {
                font-size: 1.2rem;
                color: var(--accent-cyan);
                border-bottom: 1px solid #333;
                padding-bottom: 8px;
                margin-bottom: 16px;
                text-transform: uppercase;
                letter-spacing: 1px;
                font-weight: 700;
                display: flex;
                align-items: center;
            }
            .config-group-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(450px, 1fr)); /* Wider cards */
                gap: 24px;
                align-items: start;
            }

            /* Responsive tweaks for grid */
            @media (max-width: 500px) {
                .config-group-grid {
                     grid-template-columns: 1fr;
                }
            }

            .config-card {
                background: #1e1e1e;
                border: 1px solid #333;
                border-radius: 8px;
                overflow: hidden;
                box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                transition: transform 0.1s, border-color 0.1s;
                height: 100%; /* Match height in row */
            }
            .config-card:hover {
                border-color: #555;
            }
            
            .card-header {
                background: #252525;
                padding: 10px 14px;
                border-bottom: 1px solid #333;
                display: flex;
                justify-content: space-between;
                align-items: center;
                gap: 8px;
            }
            .card-title {
                font-size: 1.05rem;
                font-weight: 700;
                color: #fff;
                display: flex;
                align-items: center;
                gap: 8px;
                white-space: nowrap;
            }
            .card-actions {
                display: flex;
                gap: 4px;
                opacity: 0.6;
            }
            .config-card:hover .card-actions {
                opacity: 1;
            }
            
            .btn-mini {
                background: #333;
                border: 1px solid #444;
                color: #ccc;
                cursor: pointer;
                font-size: 0.9rem;
                padding: 4px 8px;
                border-radius: 4px;
            }
            .btn-mini:hover {
                background: #444;
                color: #fff;
            }

            .card-content {
                padding: 16px;
            }

            .input-group {
                margin-bottom: 12px;
                display: flex;
                flex-direction: column;
                gap: 4px;
                width: 100%; /* Ensure input group fills container */
                border-bottom: 1px solid #222; /* Subtle separator */
                padding-bottom: 8px;
            }
            .input-group:last-child {
                border-bottom: none;
                padding-bottom: 0;
                margin-bottom: 0;
            }

            .input-label {
                font-size: 0.75rem;
                color: #aaa;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            .config-input {
                background: #0a0a0a;
                border: 1px solid #444;
                color: #fff;
                padding: 8px 10px;
                border-radius: 4px;
                font-family: 'Consolas', 'Monaco', monospace;
                font-size: 0.9rem;
                width: 100%;
                box-sizing: border-box; 
                min-width: 0; 
            }
            .config-input:focus {
                outline: none;
                border-color: var(--accent-cyan);
                background: #000;
            }
            .config-input.saved {
                border-color: #4caf50;
            }

            /* Weapon Styling Overrides */
            .weapon-group {
                margin-top: 12px;
                padding-top: 12px;
                border-top: 1px solid #333;
                background: rgba(0,0,0,0.2);
                padding: 10px;
                border-radius: 6px;
            }
            .weapon-group-title {
                font-size: 0.85rem;
                color: var(--accent-cyan);
                margin-bottom: 8px;
                font-weight: bold;
                text-transform: uppercase;
            }

            .weapon-grid-container {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                gap: 12px;
            }
            .weapon-card {
                background: rgba(0,0,0,0.3);
                border: 1px solid #333;
                border-radius: 6px;
                padding: 10px;
            }
            .weapon-header {
                font-size: 0.85rem;
                font-weight: 700;
                color: var(--accent-cyan);
                margin-bottom: 8px;
                text-transform: uppercase;
                border-bottom: 1px solid #333;
                padding-bottom: 4px;
            }
            .stat-row {
                display: flex;
                gap: 6px;
            }

            .body-type-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
                gap: 12px;
            }

            .input-group.compact {
                border-bottom: none;
                padding-bottom: 0;
            }
            .input-group.compact .config-input {
                padding: 6px 8px;
                font-size: 0.85rem;
            }
        `;
        document.head.appendChild(style);
    }

    container.innerHTML = '<div class="loading">Loading config...</div>';

    try {
        const response = await fetch('/api/config');
        currentConfig = await response.json();

        if (!currentConfig) {
            container.innerHTML = '<div class="error">Failed to load config</div>';
            return;
        }

        container.innerHTML = `
            <div class="config-container">
                <div class="config-header-block">
                    <h2 style="margin:0;">Master Config</h2>
                    <p style="margin:4px 0 0; color:#888; font-size:0.9rem;">
                        Game settings. Changes apply immediately to the active session.
                    </p>
                </div>
                <div class="config-nav">
                    <!-- Nav buttons will be injected here -->
                </div>
                <div id="config-groups-root"></div>
            </div>
        `;

        const navEl = container.querySelector('.config-nav')!;
        const rootEl = container.querySelector('#config-groups-root')!;

        // Track rendered sections to catch orphans
        const renderedSections = new Set<string>();

        // Render Groups
        for (const [groupTitle, sectionKeys] of Object.entries(CONFIG_GROUPS)) {
            // Check if group has any valid data
            const validKeys = sectionKeys.filter(
                (key) =>
                    currentConfig?.[key] && Object.keys(currentConfig[key] as object).length > 0
            );
            if (validKeys.length === 0) continue;

            const groupId = 'group-' + groupTitle.replace(/\s+/g, '-').toLowerCase();

            // Nav Button
            const navBtn = document.createElement('button');
            navBtn.className = 'nav-btn';
            navBtn.textContent = groupTitle;
            navBtn.onclick = () => {
                const target = document.getElementById(groupId);
                if (target) {
                    // Update active state
                    navEl.querySelectorAll('.nav-btn').forEach((b) => b.classList.remove('active'));
                    navBtn.classList.add('active');
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            };
            navEl.appendChild(navBtn);

            const groupEl = document.createElement('div');
            groupEl.className = 'config-group';
            groupEl.id = groupId;
            groupEl.innerHTML = `
                <div class="config-group-title">${groupTitle}</div>
                <div class="config-group-grid"></div>
            `;
            const gridEl = groupEl.querySelector('.config-group-grid')! as HTMLElement;

            for (const sectionKey of validKeys) {
                renderSectionCard(sectionKey, currentConfig[sectionKey] as Record<string, unknown>, gridEl);
                renderedSections.add(sectionKey);
            }

            rootEl.appendChild(groupEl);
        }

        // Render Orphans (any section in config but not in a group)
        const allSections = Object.keys(currentConfig) as Array<string>;
        const orphans = allSections.filter(
            (key) =>
                !renderedSections.has(key) &&
                currentConfig?.[key] &&
                Object.keys(currentConfig[key] as object).length > 0
        );

        if (orphans.length > 0) {
            const groupId = 'group-other';

            // Nav Button for Other
            const navBtn = document.createElement('button');
            navBtn.className = 'nav-btn';
            navBtn.textContent = 'Other';
            navBtn.onclick = () => {
                const target = document.getElementById(groupId);
                if (target) {
                    navEl.querySelectorAll('.nav-btn').forEach((b) => b.classList.remove('active'));
                    navBtn.classList.add('active');
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            };
            navEl.appendChild(navBtn);

            const groupEl = document.createElement('div');
            groupEl.className = 'config-group';
            groupEl.id = groupId;
            groupEl.innerHTML = `
                <div class="config-group-title">Other Settings</div>
                <div class="config-group-grid"></div>
            `;
            const gridEl = groupEl.querySelector('.config-group-grid')! as HTMLElement;

            for (const sectionKey of orphans) {
                renderSectionCard(sectionKey, currentConfig[sectionKey] as Record<string, unknown>, gridEl);
            }
            rootEl.appendChild(groupEl);
        }

        // Highlight first nav button by default if exists
        if (navEl.firstElementChild) {
            navEl.firstElementChild.classList.add('active');
        }

        // Event Listeners for Card Actions (Reset/Save)
        container.querySelectorAll('.btn-reset').forEach((btn) => {
            btn.addEventListener('click', async () => {
                const section = (btn as HTMLElement).dataset.section;
                if (!confirm(`Reset ${section} to default values?`)) return;

                const response = await fetch('/api/reset_config_section', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ section })
                });
                const result = await response.json();
                if (result.success) renderConfigView(container);
                else alert('Reset failed: ' + result.error);
            });
        });

        container.querySelectorAll('.btn-save-defaults').forEach((btn) => {
            btn.addEventListener('click', async () => {
                const section = (btn as HTMLElement).dataset.section;
                if (!confirm(`Overwrite defaults for ${section}? This is permanent.`)) return;

                const response = await fetch('/api/save_config_defaults', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ section })
                });
                const result = await response.json();
                if (result.success) alert('Defaults saved!');
                else alert('Save failed: ' + result.error);
            });
        });
    } catch (error) {
        container.innerHTML = `<div class="error">Error: ${error}</div>`;
    }
}

function renderSectionCard(
    sectionKey: string,
    sectionData: Record<string, unknown>,
    container: HTMLElement
) {
    const meta = SECTION_META[sectionKey] || {
        name: formatLabel(sectionKey),
        description: `Settings for ${sectionKey}`
    };
    const icon = SECTION_ICONS[sectionKey] || '⚙️';

    const card = document.createElement('div');
    card.className = 'config-card';

    // Configs that profit from full width
    if (sectionKey === 'WeaponDefaults' || sectionKey === 'BodyTypes') {
        card.style.gridColumn = '1 / -1'; // Span full row
    }

    card.innerHTML = `
        <div class="card-header">
            <div class="card-title">
                <span>${icon}</span>
                <span>${meta.name}</span>
            </div>
            <div class="card-actions">
                <button class="btn-mini btn-reset" data-section="${sectionKey}" title="Reset to Defaults">↺</button>
                <button class="btn-mini btn-save-defaults" data-section="${sectionKey}" title="Save as New Defaults">💾</button>
            </div>
        </div>
        <div class="card-content" data-section="${sectionKey}"></div>
    `;

    const contentEl = card.querySelector('.card-content')!;

    if (sectionKey === 'BodyTypes') {
        contentEl.classList.add('body-type-grid');
        for (const [bodyType, data] of Object.entries(
            sectionData as Record<string, { scale: number }>
        )) {
            contentEl.appendChild(
                createField(sectionKey, bodyType, data.scale, 'number', formatLabel(bodyType))
            );
        }
    } else if (sectionKey === 'WeaponDefaults') {
        contentEl.classList.add('weapon-grid-container');

        for (const [weaponType, stats] of Object.entries(
            sectionData as Record<string, { range: number; damage: number; attackSpeed: number }>
        )) {
            const weaponCard = document.createElement('div');
            weaponCard.className = 'weapon-card';

            weaponCard.innerHTML = `<div class="weapon-header">${formatLabel(weaponType)}</div>`;

            const row = document.createElement('div');
            row.className = 'stat-row';

            const f1 = createField(
                sectionKey,
                `${weaponType}.range`,
                stats.range,
                'number',
                'Range'
            );
            const f2 = createField(
                sectionKey,
                `${weaponType}.damage`,
                stats.damage,
                'number',
                'Dmg'
            );
            const f3 = createField(
                sectionKey,
                `${weaponType}.attackSpeed`,
                stats.attackSpeed,
                'number',
                'Spd'
            );

            f1.classList.add('compact');
            f1.style.flex = '1';
            f2.classList.add('compact');
            f2.style.flex = '1';
            f3.classList.add('compact');
            f3.style.flex = '1';

            row.appendChild(f1);
            row.appendChild(f2);
            row.appendChild(f3);
            weaponCard.appendChild(row);
            contentEl.appendChild(weaponCard);
        }
    } else if (typeof sectionData === 'object' && !Array.isArray(sectionData)) {
        for (const [key, value] of Object.entries(sectionData as ConfigSection)) {
            if (typeof value === 'object') continue;
            const type = typeof value === 'number' ? 'number' : 'text';
            contentEl.appendChild(createField(sectionKey, key, value, type, formatLabel(key)));
        }
    }

    container.appendChild(card);
}

function formatLabel(key: string): string {
    // 1. Replace underscores/dots with spaces
    // 2. Insert space before TitleCase (e.g. movementSpeed -> movement Speed)
    // 3. Capitalize first letter
    let label = key.replace(/[_.]/g, ' ');
    label = label.replace(/([A-Z])/g, ' $1').trim();
    return label.charAt(0).toUpperCase() + label.slice(1);
}

function createField(
    section: string,
    key: string,
    value: unknown,
    type: 'number' | 'text',
    labelOverride?: string
): HTMLElement {
    const group = document.createElement('div');
    group.className = 'input-group';

    const label = document.createElement('label');
    label.className = 'input-label';
    label.textContent = labelOverride || formatLabel(key);

    const input = document.createElement('input');
    input.type = type;
    input.className = 'config-input';
    input.value = String(value);
    input.dataset.section = section;
    input.dataset.key = key;

    // Auto-save logic
    input.addEventListener('change', async () => {
        const newValue = type === 'number' ? parseFloat(input.value) : input.value;
        input.classList.add('saving');

        try {
            // Auto-expand category if it's collapsed
            const container = input.closest('.config-card'); // Find the card containing this input
            if (container) {
                const parent = container.closest('.category-section') as HTMLElement;
                if (parent) {
                    const content = parent.querySelector('.category-content') as HTMLElement;
                    if (content && content.style.display === 'none') {
                        // Expand it
                        // toggleCategory(parent); // We can't access toggleCategory easily if valid scope issues, so replicate logic or verify if exposed
                        // Actually just simulate click on header
                        const header = parent.querySelector('.category-header') as HTMLElement;
                        if (header) header.click();
                    }
                }
            }

            const response = await fetch('/api/update_config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    section: input.dataset.section,
                    key: input.dataset.key,
                    value: newValue
                })
            });

            const result = await response.json();

            if (result.success) {
                input.classList.remove('saving');
                input.classList.add('saved');
                setTimeout(() => input.classList.remove('saved'), 1000);

                if (typeof BroadcastChannel !== 'undefined') {
                    const configChannel = new BroadcastChannel('game-config-updates');
                    configChannel.postMessage({
                        type: 'CONFIG_UPDATE',
                        section: input.dataset.section,
                        key: input.dataset.key,
                        value: newValue
                    });
                    configChannel.close();
                }
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            input.classList.remove('saving');
            input.classList.add('error');
            console.error('Save error:', error);
        }
    });

    group.appendChild(label);
    group.appendChild(input);
    return group;
}
