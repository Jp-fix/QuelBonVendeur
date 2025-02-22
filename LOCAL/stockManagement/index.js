// État de l'application
const state = {
    data: {
        marketCoverage: {
            total: 2450,
            target: 2880,
            percentage: 85
        },
        productStock: {
            matched: 3245,
            total: 4500,
            percentage: 72
        },
        modelIds: {
            active: 1764,
            total: 2450,
            percentage: 72
        },
        skusMatched: {
            total: 3245,
            target: 4500,
            percentage: 72
        },
        evolution: {
            percentage: 8.5,
            increase: 275
        },
        pendingModelIds: {
            count: 686,
            total: 2450,
            percentage: 28
        },
        missingSkus: {
            count: 215,
            total: 3245
        },
        unmatchedSkus: {
            count: 312,
            total: 3245,
            percentage: 9.6
        }
    },
    filters: {
        search: '',
        stock: 'all',
        brand: 'all',
        grade: 'all'
    },
    pagination: {
        currentPage: 1,
        itemsPerPage: 10,
        totalPages: 1
    }
};

// Fonctions utilitaires
function formatNumber(number) {
    return new Intl.NumberFormat('fr-FR').format(number);
}

function formatPercent(number) {
    return new Intl.NumberFormat('fr-FR', {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1
    }).format(number) + '%';
}

// Animation des valeurs numériques
function animateValue(elementId, start, end, duration = 1000) {
    const element = document.getElementById(elementId);
    if (!element) return;

    const startTime = performance.now();
    const updateValue = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        const easeOutQuad = progress * (2 - progress);
        const current = Math.floor(start + (end - start) * easeOutQuad);
        
        element.textContent = formatNumber(current);
        
        if (progress < 1) {
            requestAnimationFrame(updateValue);
        }
    };
    
    requestAnimationFrame(updateValue);
}

// Mise à jour des KPIs
function updateKPIs() {
    // Mise à jour des valeurs des KPIs
    const data = state.data;
    
    // Couverture du marché
    document.querySelector('[data-kpi="marketCoverage"]').textContent = 
        formatPercent(data.marketCoverage.percentage);
    
    // ProductStock
    document.querySelector('[data-kpi="productStock"]').textContent = 
        formatNumber(data.productStock.matched);
    
    // Model ID Actifs
    document.querySelector('[data-kpi="activeModelIds"]').textContent = 
        formatPercent(data.modelIds.percentage);
    
    // SKUs Matchés
    document.querySelector('[data-kpi="skusMatched"]').textContent = 
        formatPercent(data.skusMatched.percentage);
}

// Mise à jour des barres de progression
function updateProgressBars() {
    const data = state.data;
    
    // Mise à jour des barres de progression
    const progressBars = {
        'marketCoverage': data.marketCoverage.percentage,
        'productStock': (data.productStock.matched / data.productStock.total) * 100,
        'activeModelIds': data.modelIds.percentage,
        'skusMatched': data.skusMatched.percentage,
        'evolution': data.evolution.percentage,
        'pendingModelIds': data.pendingModelIds.percentage,
        'missingSkus': (data.missingSkus.count / data.missingSkus.total) * 100,
        'unmatchedSkus': data.unmatchedSkus.percentage
    };

    Object.entries(progressBars).forEach(([id, percentage]) => {
        const progressBar = document.querySelector(`[data-progress="${id}"]`);
        if (progressBar) {
            progressBar.style.width = `${percentage}%`;
        }
    });
}

// Initialisation des filtres
function initializeFilters() {
    const filterInputs = document.querySelectorAll('.filter-input');
    filterInputs.forEach(input => {
        input.addEventListener('change', (e) => {
            state.filters[e.target.id] = e.target.value;
            updateDisplay();
        });
    });
}

// Mise à jour de l'affichage
function updateDisplay() {
    updateKPIs();
    updateProgressBars();
}

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
    // Initialisation des filtres
    initializeFilters();
    
    // Première mise à jour de l'affichage
    updateDisplay();
    
    // Animation des cartes au chargement
    document.querySelectorAll('.bg-white').forEach((card, index) => {
        setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 100);
    });

    // Mise à jour périodique
    setInterval(updateDisplay, 300000); // Mise à jour toutes les 5 minutes
});