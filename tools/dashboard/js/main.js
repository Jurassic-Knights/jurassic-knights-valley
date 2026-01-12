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

    // Load landing page
    loadManifest();
});
