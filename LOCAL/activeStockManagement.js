// État de l'application
const state = {
    data: {
        marketCoverage: {
            current: 85,
            trend: 8,
            total: 2450,
            target: 2880
        },
        modelIds: {
            active: 1764,
            total: 2450,
            pending: 686
        },
        skus: {
            matched: 3245,
            totalPartner: 4500,
            trend: 15
        },
        evolution: {
            percentage: 8.5,
            progression: 275
        },
        activeModelIds: {
            count: 1890,
            total: 2450,
            percentage: 77
        },
        missingSkus: {
            count: 215,
            label: 'À matcher'
        }
    },
    filters: {
        vendor: 'all',
        search: '',
        stockStatus: 'all',
        brand: 'all',
        grade: 'all'
    }
};

// Fonctions de formatage
function formatNumber(number) {
    return new Intl.NumberFormat('fr-FR').format(number);
}

function formatPercent(number) {
    return new Intl.NumberFormat('fr-FR', {
        style: 'percent',
        minimumFractionDigits: 1,
        maximumFractionDigits: 1
    }).format(number / 100);
}

// Animation des valeurs numériques
function animateValue(elementId, start, end, duration = 1000) {
    const element = document.getElementById(elementId);
    if (!element) return;

    const startTime = performance.now();
    const updateValue = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Fonction d'easing quadratique
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
    // Couverture du Marché
    animateValue('marketCoverage', 0, state.data.marketCoverage.current);
    updateElement('marketCoverageTrend', `+${state.data.marketCoverage.trend}%`);
    updateElement('modelIdRatio', 
        `${formatNumber(state.data.marketCoverage.total)} / ${formatNumber(state.data.marketCoverage.target)}`
    );

    // ModelID Utilisés
    animateValue('activeModelIds', 0, state.data.modelIds.active);
    updateElement('activeModelIdsCount', `${formatNumber(state.data.modelIds.active)} actifs`);
    updateElement('modelIdUsageRatio', 
        `${formatNumber(state.data.modelIds.active)} / ${formatNumber(state.data.modelIds.total)}`
    );

    // ModelID en Attente
    const pendingPercentage = (state.data.modelIds.pending / state.data.modelIds.total) * 100;
    animateValue('pendingModelIds', 0, pendingPercentage);
    updateElement('pendingModelIdsCount', `${formatNumber(state.data.modelIds.pending)} à activer`);
    updateElement('pendingModelIdsRatio', 
        `${formatNumber(state.data.modelIds.pending)} / ${formatNumber(state.data.modelIds.total)}`
    );

    // SKUs Matchés
    animateValue('matchedSkus', 0, state.data.skus.matched);
    updateElement('matchedSkusTrend', `+${state.data.skus.trend}%`);
    updateElement('skusRatio', 
        `${formatNumber(state.data.skus.matched)} / ${formatNumber(state.data.skus.totalPartner)}`
    );

    // Evolution Partenaires
    updateElement('evolutionPercentage', `+${state.data.evolution.percentage}%`);
    updateElement('evolutionProgression', `+${formatNumber(state.data.evolution.progression)} SKUs`);

    // ModelIDs avec SKU Actif
    animateValue('activeModelIdsWithSku', 0, state.data.activeModelIds.count);
    updateElement('activeModelIdsPercentage', `${state.data.activeModelIds.percentage}%`);
    updateElement('activeModelIdsCoverage', 
        `${formatNumber(state.data.activeModelIds.count)} / ${formatNumber(state.data.activeModelIds.total)}`
    );

    // SKUs Manquants
    animateValue('missingSkus', 0, state.data.missingSkus.count);
    updateElement('missingSkusLabel', state.data.missingSkus.label);
    updateElement('missingSkusCount', `${formatNumber(state.data.missingSkus.count)} produits`);
}

// Fonction utilitaire pour mettre à jour un élément
function updateElement(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = value;
    }
}

// Mise à jour des barres de progression
function updateProgressBars() {
    // Calcul des pourcentages pour les barres de progression
    const progressBars = {
        'marketCoverageBar': (state.data.marketCoverage.total / state.data.marketCoverage.target) * 100,
        'modelIdUsageBar': (state.data.modelIds.active / state.data.modelIds.total) * 100,
        'pendingModelIdsBar': (state.data.modelIds.pending / state.data.modelIds.total) * 100,
        'matchedSkusBar': (state.data.skus.matched / state.data.skus.totalPartner) * 100,
        'evolutionBar': 80, // Valeur fixe pour l'exemple
        'activeModelIdsBar': (state.data.activeModelIds.count / state.data.activeModelIds.total) * 100,
        'missingSkusBar': 25 // Valeur fixe pour l'exemple
    };

    // Mise à jour des barres de progression
    Object.entries(progressBars).forEach(([id, percentage]) => {
        const bar = document.getElementById(id);
        if (bar) {
            bar.style.width = `${percentage}%`;
        }
    });
}

// Gestion des filtres
function initializeFilters() {
    const filterIds = ['searchInput', 'stockStatusFilter', 'brandFilter', 'gradeFilter'];
    
    filterIds.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('change', (e) => {
                state.filters[id.replace('Filter', '').toLowerCase()] = e.target.value;
                updateDisplay();
            });
        }
    });

    // Gestion spéciale pour l'input de recherche
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            state.filters.search = e.target.value;
            updateDisplay();
        });
    }
}

// Mise à jour de la date de dernière mise à jour
function updateLastUpdate() {
    const lastUpdateElement = document.getElementById('lastUpdate');
    if (lastUpdateElement) {
        const now = new Date();
        lastUpdateElement.textContent = now.toLocaleString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
}

// Fonction principale de mise à jour de l'affichage
function updateDisplay() {
    updateKPIs();
    updateProgressBars();
    updateLastUpdate();
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

// Export pour les tests
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        state,
        formatNumber,
        formatPercent,
        animateValue,
        updateKPIs,
        updateDisplay
    };
}