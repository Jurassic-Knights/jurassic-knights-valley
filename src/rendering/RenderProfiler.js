/**
 * RenderProfiler - Performance profiling for render phases
 * 
 * Extracted from GameRenderer.js for modularity.
 * Tracks timing for each render phase and outputs detailed breakdowns.
 * 
 * Owner: Performance Tools
 */

const RenderProfiler = {
    timing: null,

    /**
     * Start detailed render profiling
     */
    start() {
        this.timing = {
            world: 0, vfxBg: 0, entitySort: 0, shadows: 0,
            entities: 0, ambient: 0, fog: 0, vfxFg: 0, envOverlay: 0,
            frames: 0
        };
        console.log('[RenderProfiler] Profiling started...');
        return this.timing;
    },

    /**
     * Stop render profiling and print results
     */
    stop() {
        const t = this.timing;
        if (!t) return;

        console.log('=== RENDER PHASE BREAKDOWN ===');
        console.log(`Frames: ${t.frames}`);
        const phases = [
            ['World', t.world], ['VFX BG', t.vfxBg], ['Entity Sort', t.entitySort],
            ['Shadows', t.shadows], ['Entities', t.entities], ['Ambient', t.ambient],
            ['Fog', t.fog], ['VFX FG', t.vfxFg], ['Env Overlay', t.envOverlay]
        ];
        for (const [name, time] of phases.sort((a, b) => b[1] - a[1])) {
            console.log(`  ${name}: ${time.toFixed(1)}ms (${(time / t.frames).toFixed(2)}ms/frame)`);
        }

        // World sub-phase breakdown
        console.log('--- World Sub-Phases ---');
        const worldPhases = [
            ['Water/BG', t.worldWater || 0],
            ['Islands', t.worldIslands || 0],
            ['Debug', t.worldDebug || 0]
        ];
        for (const [name, time] of worldPhases.sort((a, b) => b[1] - a[1])) {
            console.log(`    ${name}: ${time.toFixed(1)}ms (${(time / t.frames).toFixed(2)}ms/frame)`);
        }

        // Shadow sub-phase breakdown
        console.log('--- Shadow Sub-Phases ---');
        const shadowPhases = [
            ['Clear', t.shadowClear || 0],
            ['Composite', t.shadowComposite || 0],
            ['Hero', t.shadowHero || 0],
            ['Dinosaurs', t.shadowDino || 0],
            ['Resources', t.shadowRes || 0],
            ['Merchants', t.shadowMerch || 0],
            ['Other', t.shadowOther || 0]
        ];
        for (const [name, time] of shadowPhases.sort((a, b) => b[1] - a[1])) {
            console.log(`    ${name}: ${time.toFixed(1)}ms (${(time / t.frames).toFixed(2)}ms/frame)`);
        }

        // Entity sub-phase breakdown
        console.log('--- Entity Sub-Phases ---');
        console.log(`  Total Entities Rendered: ${t.entCount || 0} (${((t.entCount || 0) / t.frames).toFixed(1)}/frame)`);
        const entPhases = [
            ['HomeBase', t.entHomeBase || 0],
            ['Hero', t.entHeroTime || 0],
            ['Dinosaurs', t.entDinoTime || 0],
            ['Resources', t.entResTime || 0],
            ['DroppedItems', t.entDroppedTime || 0, t.entDroppedCount || 0],
            ['Merchants', t.entMerchantTime || 0, t.entMerchantCount || 0],
            ['Other', t.entOtherTime || 0],
            ['UI Overlays', t.entUITime || 0]
        ];
        for (const [name, time, count] of entPhases.sort((a, b) => b[1] - a[1])) {
            const countStr = count ? ` [${count} total]` : '';
            console.log(`    ${name}: ${time.toFixed(1)}ms (${(time / t.frames).toFixed(2)}ms/frame)${countStr}`);
        }

        // Log unknown entity types
        if (t.entOtherTypes && Object.keys(t.entOtherTypes).length > 0) {
            console.log('  Unknown Entity Types:');
            for (const [typeName, count] of Object.entries(t.entOtherTypes)) {
                console.log(`    - ${typeName}: ${count}`);
            }
        }

        console.log('==============================');
        this.timing = null;
    },

    /**
     * Get current timing object (for passing to renderers)
     */
    getTiming() {
        return this.timing;
    }
};

window.RenderProfiler = RenderProfiler;
