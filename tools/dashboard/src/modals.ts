/**
 * Dashboard Modal Module
 * Image preview and comparison functionality
 */

// ============================================
// TYPES
// ============================================

interface ModalAsset {
    path: string;
    name: string;
    status: string;
}

// ============================================
// STATE
// ============================================

let isComparisonMode = false;
let currentModalAsset: ModalAsset | null = null;

// ============================================
// FUNCTIONS
// ============================================

export function openModal(imgPath: string, name: string, status: string): void {
    currentModalAsset = { path: imgPath, name, status };
    const modal = document.getElementById('imageModal');
    const modalImg = document.getElementById('modalImage') as HTMLImageElement | null;
    const modalInfo = document.getElementById('modalInfo');

    if (modalImg) modalImg.src = imgPath;
    if (modalInfo) modalInfo.textContent = `${name} (${status})`;
    if (modal) modal.classList.add('active');

    // Reset comparison mode
    isComparisonMode = false;
    const singleImg = document.getElementById('modalImage');
    const comparisonView = document.getElementById('comparisonView');
    const toggleBtn = document.getElementById('toggleComparison');

    if (singleImg) singleImg.style.display = 'block';
    if (comparisonView) comparisonView.style.display = 'none';
    if (toggleBtn) toggleBtn.textContent = '📊 Compare';
}

export function toggleComparisonView(): void {
    if (!currentModalAsset) return;

    isComparisonMode = !isComparisonMode;
    const singleImg = document.getElementById('modalImage');
    const comparison = document.getElementById('comparisonView');
    const toggleBtn = document.getElementById('toggleComparison');

    if (isComparisonMode) {
        if (singleImg) singleImg.style.display = 'none';
        if (comparison) comparison.style.display = 'flex';

        // Determine original/clean paths
        let originalPath = currentModalAsset.path;
        let cleanPath = currentModalAsset.path;

        if (currentModalAsset.path.includes('_original')) {
            originalPath = currentModalAsset.path;
            cleanPath = currentModalAsset.path.replace('_original', '_clean');
        } else if (currentModalAsset.path.includes('_clean')) {
            cleanPath = currentModalAsset.path;
            originalPath = currentModalAsset.path.replace('_clean', '_original');
        } else if (currentModalAsset.path.includes('_approved')) {
            originalPath = currentModalAsset.path;
            cleanPath = currentModalAsset.path.replace('_approved', '_clean');
        }

        const compareOriginal = document.getElementById('compareOriginal') as HTMLImageElement | null;
        const compareClean = document.getElementById('compareClean') as HTMLImageElement | null;

        if (compareOriginal) compareOriginal.src = originalPath;
        if (compareClean) compareClean.src = cleanPath;
        if (toggleBtn) toggleBtn.textContent = '🖼️ Single';
    } else {
        if (singleImg) singleImg.style.display = 'block';
        if (comparison) comparison.style.display = 'none';
        if (toggleBtn) toggleBtn.textContent = '📊 Compare';
    }
}

export function closeModal(): void {
    const modal = document.getElementById('imageModal');
    if (modal) modal.classList.remove('active');
    isComparisonMode = false;
}

export function closeTemplatesModal(): void {
    // Templates view uses main content, not a modal
    // Import showLandingPage dynamically to avoid circular dependency
    import('./views').then(({ showLandingPage }) => {
        showLandingPage();
    });
}

export function initModalKeyboard(): void {
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeModal();
        }
    });
}
