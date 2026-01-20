/**
 * Dashboard Main Entry Point
 * Initialization and event binding
 */

// Audio context for sound preview
let audioCtx = null;
let masterGain = null;

function initAudio() {
    if (audioCtx) return;
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0.7;
    masterGain.connect(audioCtx.destination);
    if (window.ProceduralSFX) {
        ProceduralSFX.init(audioCtx, masterGain);
    }
}

function playSound(id) {
    initAudio();
    console.log('[Dashboard] Playing sound:', id);
    if (window.ProceduralSFX) {
        ProceduralSFX.play(id);
    } else {
        console.warn('ProceduralSFX not loaded');
    }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    // Set up filter button listeners
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            renderAssets();
        });
    });

    // Keyboard handler for modal
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeModal();
        }
    });

    // Sync SFX regeneration queue from localStorage to server on load
    if (sfxRegenerationQueue && sfxRegenerationQueue.length > 0) {
        console.log(`[Dashboard] Syncing ${sfxRegenerationQueue.length} SFX queue items to server...`);
        saveRegenerationQueueToFile();
    }

    // Load landing page
    loadManifest();

    // Start live polling for entity changes
    startLivePolling();
});

// Live polling system for auto-refresh (state is in state.js)
function startLivePolling() {
    // Poll every 1.5 seconds for faster response
    window.pollingInterval = setInterval(async () => {
        if (!window.currentViewCategory) {
            return; // No category set, skip silently
        }

        try {
            // Add cache-buster to prevent browser/server caching
            const response = await fetch('/api/get_category?_=' + Date.now(), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Cache-Control': 'no-cache'
                },
                body: JSON.stringify({ category: window.currentViewCategory })
            });
            const data = await response.json();

            // Hash FULL entity JSON to detect any changes
            const entities = data.entities || [];
            const newHash = JSON.stringify(entities);

            if (window.lastDataHash !== null && newHash !== window.lastDataHash) {
                console.log('[LiveSync] Entity data changed! Refreshing view...');
                categoryData = data;
                renderCategoryView();
            }
            window.lastDataHash = newHash;
        } catch (e) {
            // Ignore polling errors
        }
    }, 1500);
    console.log('[LiveSync] Started polling every 1.5s');
}

function stopLivePolling() {
    if (window.pollingInterval) {
        clearInterval(window.pollingInterval);
        window.pollingInterval = null;
        console.log('[LiveSync] Stopped polling');
    }
}


