/**
 * Config Renderer - Renders the Master Config tab UI
 * 
 * Displays editable config sections with instant auto-save on change.
 */

interface ConfigSection {
    [key: string]: unknown;
}

interface GameConfig {
    Core: ConfigSection;
    Combat: ConfigSection;
    Interaction: ConfigSection;
    Time: ConfigSection;
    Weather: ConfigSection;
    AI: ConfigSection;
    Biome: ConfigSection;
    Spawning: ConfigSection;
    UnlockCosts: number[];
    BodyTypes: Record<string, { scale: number }>;
}

// Section display names and descriptions
const SECTION_META: Record<string, { name: string; description: string }> = {
    Core: { name: 'Core', description: 'Game core settings' },
    Combat: { name: 'Combat', description: 'Combat and weapon settings' },
    Interaction: { name: 'Interaction', description: 'Interaction radii' },
    Time: { name: 'Time', description: 'Day/night cycle settings' },
    AI: { name: 'AI', description: 'Enemy AI behavior' },
    Biome: { name: 'Biome', description: 'Biome and spawning settings' },
    BodyTypes: { name: 'Body Types', description: 'Scale multipliers by body type' }
};

let currentConfig: GameConfig | null = null;

export async function renderConfigView(container: HTMLElement): Promise<void> {
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
                <h2>Master Config</h2>
                <p class="config-description">Edit game settings. Changes save instantly to source files.</p>
                <div class="config-sections"></div>
            </div>
        `;

        const sectionsContainer = container.querySelector('.config-sections')!;

        // Render each section
        for (const [sectionKey, meta] of Object.entries(SECTION_META)) {
            const sectionData = currentConfig[sectionKey as keyof GameConfig];
            if (!sectionData) continue;

            const sectionEl = document.createElement('div');
            sectionEl.className = 'config-section';
            sectionEl.innerHTML = `
                <div class="section-header">
                    <h3>${meta.name}</h3>
                    <span class="section-description">${meta.description}</span>
                </div>
                <div class="section-fields" data-section="${sectionKey}"></div>
            `;

            const fieldsContainer = sectionEl.querySelector('.section-fields')!;

            if (sectionKey === 'BodyTypes') {
                // Special rendering for body types
                for (const [bodyType, data] of Object.entries(sectionData as Record<string, { scale: number }>)) {
                    fieldsContainer.appendChild(createField(sectionKey, bodyType, data.scale, 'number'));
                }
            } else if (typeof sectionData === 'object' && !Array.isArray(sectionData)) {
                // Regular section
                for (const [key, value] of Object.entries(sectionData as ConfigSection)) {
                    if (typeof value === 'object') continue; // Skip nested objects for now
                    const type = typeof value === 'number' ? 'number' : 'text';
                    fieldsContainer.appendChild(createField(sectionKey, key, value, type));
                }
            }

            sectionsContainer.appendChild(sectionEl);
        }

    } catch (error) {
        container.innerHTML = `<div class="error">Error: ${error}</div>`;
    }
}

function createField(section: string, key: string, value: unknown, type: 'number' | 'text'): HTMLElement {
    const field = document.createElement('div');
    field.className = 'config-field';

    const label = document.createElement('label');
    label.textContent = key;
    label.setAttribute('for', `config-${section}-${key}`);

    const input = document.createElement('input');
    input.type = type;
    input.id = `config-${section}-${key}`;
    input.value = String(value);
    input.dataset.section = section;
    input.dataset.key = key;
    input.dataset.originalValue = String(value);

    // Auto-save on change
    input.addEventListener('change', async () => {
        const newValue = type === 'number' ? parseFloat(input.value) : input.value;

        input.classList.add('saving');

        try {
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
                input.dataset.originalValue = String(newValue);
                setTimeout(() => input.classList.remove('saved'), 1000);
            } else {
                input.classList.remove('saving');
                input.classList.add('error');
                console.error('Failed to save:', result.error);
            }
        } catch (error) {
            input.classList.remove('saving');
            input.classList.add('error');
            console.error('Save error:', error);
        }
    });

    field.appendChild(label);
    field.appendChild(input);

    return field;
}
