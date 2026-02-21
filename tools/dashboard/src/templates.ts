/**
 * Templates View
 * Handles the prompt templates editor view
 */

import { showLandingPage } from './views';

// ============================================
// STATE
// ============================================

let templatesContent = '';
const templateSaveTimer: ReturnType<typeof setTimeout> | null = null;
let templateSections: unknown[] = [];
let assetPromptsJson: Record<string, unknown> = {};

// ============================================
// SHOW TEMPLATES VIEW
// ============================================

export async function showTemplatesView(): Promise<void> {
    const container = document.getElementById('mainContent');
    if (!container) return;

    container.innerHTML = '<div class="loading">Loading templates...</div>';

    try {
        const resp = await fetch('/api/get_prompt_templates', { method: 'POST', body: '{}' });
        const data = await resp.json();
        if (!data.success) {
            container.innerHTML = `<div class="error">Error loading templates: ${data.error}</div>`;
            return;
        }
        templatesContent = data.content;
        templateSections = parseAllTemplateSections(templatesContent);

        // Load asset prompts
        try {
            const jsonResp = await fetch('/api/get_prompts', { method: 'POST', body: '{}' });
            assetPromptsJson = await jsonResp.json();
        } catch {
            assetPromptsJson = {};
        }

        renderTemplatesView();
    } catch (err) {
        container.innerHTML = `<div class="error">Error: ${(err as Error).message}</div>`;
    }
}

// ============================================
// RENDER TEMPLATES VIEW
// ============================================

export function renderTemplatesView(): void {
    const container = document.getElementById('mainContent');
    if (!container) return;

    container.innerHTML = `
        <div style="text-align:center; padding:3rem;">
            <h2>📝 Templates Editor</h2>
            <p style="color:var(--text-dim);">Coming soon in modular version...</p>
            <button data-action="refresh-manifest" class="secondary" style="margin-top:1rem;">← Back</button>
        </div>
    `;
}

// ============================================
// STUB FUNCTIONS
// ============================================

function parseAllTemplateSections(content: string): unknown[] {
    // Stub - full implementation in asset_dashboard.html
    return [];
}

export function onSectionEdit(idx: number): void {
    // Stub
}

export function onPromptEdit(key: string): void {
    // Stub
}

export async function saveAllSections(): Promise<void> {
    // Stub
}

export async function saveAllPrompts(): Promise<void> {
    // Stub
}
