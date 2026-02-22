const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, 'dashboard/src/mapEditorView.ts');
let content = fs.readFileSync(targetFile, 'utf8');

const target1 = `        if (editorInstance) editorInstance.setMode(mode as 'object' | 'manipulation');
        if (paletteInstance) paletteInstance.setMode(mode as 'object' | 'ground' | 'zone' | 'manipulation');
    };`;

const repl1 = `        if (editorInstance) editorInstance.setMode(mode as 'object' | 'manipulation');
        if (paletteInstance) paletteInstance.setMode(mode as 'object' | 'ground' | 'zone' | 'manipulation');
        
        const zoneControls = document.getElementById('zone-controls');
        if (zoneControls) {
            zoneControls.style.display = mode === 'zone' ? 'block' : 'none';
        }
    };`;

content = content.replace(target1, repl1);

const target2 = `    modes.forEach(mode => {
        const btn = document.getElementById(\`mode-\${mode}\`);
        btn?.addEventListener('click', () => updateModeUI(mode));
    });`;

const repl2 = `    modes.forEach(mode => {
        const btn = document.getElementById(\`mode-\${mode}\`);
        btn?.addEventListener('click', () => updateModeUI(mode));
    });

    const zoneCategorySelect = document.getElementById('zone-category-select') as HTMLSelectElement | null;
    const zoneVisFilters = document.getElementById('zone-visibility-filters');
    
    if (zoneCategorySelect && zoneVisFilters) {
        zoneCategorySelect.innerHTML = ZoneCategories.map((cat: string) => 
            \`<option value="\${cat}">\${cat.toUpperCase()}</option>\`
        ).join('');

        zoneVisFilters.innerHTML = ZoneCategories.map((cat: string) => \`
            <label style="display:flex; align-items:center; gap:6px; cursor:pointer;">
                <input type="checkbox" class="zone-vis-cb" data-category="\${cat}" checked>
                <span style="font-size:11px;">\${cat.toUpperCase()}</span>
            </label>
        \`).join('');

        zoneCategorySelect.addEventListener('change', () => {
            if (paletteInstance) paletteInstance.setCategory(zoneCategorySelect.value);
        });

        const checkboxes = zoneVisFilters.querySelectorAll('.zone-vis-cb') as NodeListOf<HTMLInputElement>;
        checkboxes.forEach(cb => {
            cb.addEventListener('change', async (e) => {
                const target = e.target as HTMLInputElement;
                const cat = target.getAttribute('data-category')!;
                
                const { EditorContext } = await import('../../../src/tools/map-editor/EditorContext');
                const zones = Object.values(ZoneConfig).filter((z: any) => z.category === cat);
                
                if (!target.checked) {
                    zones.forEach((z: any) => EditorContext.hiddenZoneIds.add(z.id));
                } else {
                    zones.forEach((z: any) => EditorContext.hiddenZoneIds.delete(z.id));
                }
                
                if (editorInstance) {
                    editorInstance.getChunkManager()?.refreshZones();
                    editorInstance.invalidateProceduralViewport();
                }
                if (typeof scheduleLivePreview !== 'undefined') scheduleLivePreview();
            });
        });
    }`;

content = content.replace(target2, repl2);

fs.writeFileSync(targetFile, content);
console.log("Patched successfully");
