/**
 * Dashboard Modal Module
 * Image preview and comparison functionality
 */

let isComparisonMode = false;
let currentModalAsset = null;

function openModal(imgPath, name, status) {
    currentModalAsset = { path: imgPath, name, status };
    const modal = document.getElementById('imageModal');
    const modalImg = document.getElementById('modalImage');
    const modalInfo = document.getElementById('modalInfo');

    modalImg.src = imgPath;
    modalInfo.textContent = name + ' (' + status + ')';
    modal.classList.add('active');

    // Reset comparison mode
    isComparisonMode = false;
    document.getElementById('modalImage').style.display = 'block';
    document.getElementById('comparisonView').style.display = 'none';
    document.getElementById('toggleComparison').textContent = '📊 Compare';
}

function toggleComparisonView() {
    if (!currentModalAsset) return;

    isComparisonMode = !isComparisonMode;
    const singleImg = document.getElementById('modalImage');
    const comparison = document.getElementById('comparisonView');

    if (isComparisonMode) {
        singleImg.style.display = 'none';
        comparison.style.display = 'flex';

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

        document.getElementById('compareOriginal').src = originalPath;
        document.getElementById('compareClean').src = cleanPath;
        document.getElementById('toggleComparison').textContent = '🖼️ Single';
    } else {
        singleImg.style.display = 'block';
        comparison.style.display = 'none';
        document.getElementById('toggleComparison').textContent = '📊 Compare';
    }
}

function closeModal() {
    document.getElementById('imageModal').classList.remove('active');
    isComparisonMode = false;
}

// Templates modal (if needed separately)
function closeTemplatesModal() {
    // Templates view uses main content, not a modal
    showLandingPage();
}

// Keyboard handler for modal
function initModalKeyboard() {
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeModal();
        }
    });
}
