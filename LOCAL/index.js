// État de l'application
const state = {
    data: [], // Données brutes
    filteredData: [], // Données filtrées
    vendorFilteredData: [], // Données filtrées par vendeur uniquement
    metadata: {}, // Métadonnées (vendeurs, marques, etc.)
    filters: {
        vendor: 'all',
        search: '',
        stockStatus: 'all',
        marque: 'all',
        grade: 'all'
    },
    chartData: {
        period: 'month',
        data: []
    },
    pagination: {
        currentPage: 1,
        itemsPerPage: 25,
        totalPages: 1
    },
    sort: {
        column: null,
        direction: 'asc'
    }
};

// Fonctions d'animation des valeurs
function animateValue(elementId, start, end, duration = 1000) {
    const element = document.getElementById(elementId);
    const startTime = performance.now();
    
    function updateValue(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Fonction d'easing pour une animation plus naturelle
        const easeOutQuad = progress * (2 - progress);
        const current = Math.floor(start + (end - start) * easeOutQuad);
        
        element.textContent = current.toLocaleString('fr-FR');
        
        if (progress < 1) {
            requestAnimationFrame(updateValue);
        }
    }
    
    requestAnimationFrame(updateValue);
}

// Fonction de formatage
function formatPrice(price) {
    return new Intl.NumberFormat('fr-FR', { 
        style: 'currency', 
        currency: 'EUR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    }).format(price);
}

function formatPercent(value) {
    return new Intl.NumberFormat('fr-FR', {
        style: 'percent',
        minimumFractionDigits: 1,
        maximumFractionDigits: 1
    }).format(value / 100);
}

// Classes de style pour les différents grades
function getGradeClass(grade) {
    const classes = {
        'MINT': 'bg-blue-100 text-blue-800',
        'VERY_GOOD': 'bg-green-100 text-green-800',
        'GOOD': 'bg-yellow-100 text-yellow-800',
        'FAIR': 'bg-gray-100 text-gray-800'
    };
    return classes[grade] || 'bg-gray-100 text-gray-800';
}

// Mise à jour des statistiques
function updateStats() {
    const dataToAnalyze = state.vendorFilteredData;
    const total = dataToAnalyze.length;
    const inStock = dataToAnalyze.filter(item => item.Quantity > 0).length;
    const outOfStock = total - inStock;
    
    // Calcul des tendances (à adapter selon vos besoins)
    const previousTotal = total * 0.95; // Exemple: +5% par rapport au mois dernier
    const totalTrend = ((total - previousTotal) / previousTotal) * 100;
    
    // Animation des valeurs
    animateValue('totalProducts', 0, total);
    animateValue('inStock', 0, inStock);
    animateValue('outOfStock', 0, outOfStock);
    
    // Mise à jour des pourcentages
    document.getElementById('stockRate').textContent = `${formatPercent(inStock/total)} du catalogue`;
    document.getElementById('outOfStockRate').textContent = `${formatPercent(outOfStock/total)} du catalogue`;
    
    // Mise à jour des tendances
    updateTrendIndicator('totalTrend', totalTrend);
    
    // Mise à jour de la date
    document.getElementById('lastUpdate').textContent = new Date().toLocaleString('fr-FR');
    
    // Mise à jour du graphique
    updateChart();
}

// Mise à jour des indicateurs de tendance
function updateTrendIndicator(elementId, trend) {
    const element = document.getElementById(elementId);
    let trendClass, trendIcon, trendText;
    
    if (trend > 0) {
        trendClass = 'text-green-600';
        trendIcon = '<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>';
        trendText = `+${trend.toFixed(1)}% vs. mois dernier`;
    } else if (trend < 0) {
        trendClass = 'text-red-600';
        trendIcon = '<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 17h8m0 0v-8m0 8l-8-8-4 4-6-6"/></svg>';
        trendText = `${trend.toFixed(1)}% vs. mois dernier`;
    } else {
        trendClass = 'text-gray-600';
        trendIcon = '<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14"/></svg>';
        trendText = 'Stable vs. mois dernier';
    }
    
    element.className = `flex items-center gap-1 ${trendClass}`;
    element.innerHTML = `${trendIcon} <span>${trendText}</span>`;
}

// Fonction de mise à jour du graphique
function updateChart() {
    const chartContainer = document.getElementById('stockChartContainer');
    // Implémentez ici votre logique de graphique avec la bibliothèque de votre choix
}

// Application des filtres
function applyFilters() {
    let filtered = state.data;

    // Filtre par vendeur
    if (state.filters.vendor && state.filters.vendor !== 'all') {
        filtered = filtered.filter(item => item['Nom vendeur'] === state.filters.vendor);
    }
    
    state.vendorFilteredData = [...filtered];

    // Autres filtres
    if (state.filters.stockStatus !== 'all') {
        filtered = filtered.filter(item => 
            state.filters.stockStatus === 'inStock' ? item.Quantity > 0 : item.Quantity === 0
        );
    }

    if (state.filters.marque !== 'all') {
        filtered = filtered.filter(item => item.Marque === state.filters.marque);
    }

    if (state.filters.grade !== 'all') {
        filtered = filtered.filter(item => item.Grade === state.filters.grade);
    }

    if (state.filters.search) {
        const searchLower = state.filters.search.toLowerCase();
        filtered = filtered.filter(item =>
            (item.Modele?.toLowerCase().includes(searchLower) ||
             item.sku?.toLowerCase().includes(searchLower) ||
             item.Marque?.toLowerCase().includes(searchLower))
        );
    }

    state.filteredData = filtered;
    state.pagination.currentPage = 1;
    
    renderTable();
    updateStats();
    updatePaginationInfo();
}

// Fonction de tri
function sortTable(column) {
    if (state.sort.column === column) {
        state.sort.direction = state.sort.direction === 'asc' ? 'desc' : 'asc';
    } else {
        state.sort.column = column;
        state.sort.direction = 'asc';
    }

    // Mise à jour des indicateurs visuels
    document.querySelectorAll('th[data-sort]').forEach(th => {
        th.removeAttribute('data-sort-direction');
        th.querySelector('.sort-icon').className = 'sort-icon';
    });
    
    const th = document.querySelector(`th[data-sort="${column}"]`);
    th.setAttribute('data-sort-direction', state.sort.direction);
    th.querySelector('.sort-icon').className = `sort-icon ${state.sort.direction}`;

    // Tri des données
    state.filteredData.sort((a, b) => {
        let valueA = a[column];
        let valueB = b[column];

        if (column === 'Prix' || column === 'Quantity' || column === 'Capacite') {
            valueA = Number(valueA);
            valueB = Number(valueB);
        }

        if (state.sort.direction === 'asc') {
            return valueA > valueB ? 1 : -1;
        } else {
            return valueA < valueB ? 1 : -1;
        }
    });

    renderTable();
}

// Rendu du tableau
function renderTable() {
    const startIndex = (state.pagination.currentPage - 1) * state.pagination.itemsPerPage;
    const endIndex = startIndex + state.pagination.itemsPerPage;
    const paginatedData = state.filteredData.slice(startIndex, endIndex);
    
    const tbody = document.getElementById('catalogueTable');
    tbody.innerHTML = paginatedData.map((item, index) => `
        <tr class="table-row hover:bg-gray-50 transition-colors">
            <td class="table-cell px-6 py-4 whitespace-nowrap text-sm font-mono">${item.sku}</td>
            <td class="table-cell px-6 py-4 whitespace-nowrap text-sm">${item.Marque}</td>
            <td class="table-cell px-6 py-4 whitespace-nowrap text-sm">${item.Modele}</td>
            <td class="table-cell px-6 py-4 whitespace-nowrap text-sm">${item.Couleur || ''}</td>
            <td class="table-cell px-6 py-4 whitespace-nowrap text-sm">${item.Capacite} Go</td>
            <td class="table-cell px-6 py-4 whitespace-nowrap">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                    ${getGradeClass(item.Grade)}">
                    ${item.Grade}
                </span>
            </td>
            <td class="table-cell px-6 py-4 whitespace-nowrap">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                    ${item.Quantity > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                    ${item.Quantity}
                </span>
            </td>
            <td class="table-cell px-6 py-4 whitespace-nowrap text-sm">${formatPrice(item.Prix)}</td>
            <td class="table-cell px-6 py-4 whitespace-nowrap">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                    ${item.Status === 'validated' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}">
                    ${item.Status}
                </span>
            </td>
        </tr>
    `).join('');
}

// Pagination
function updatePaginationInfo() {
    state.pagination.totalPages = Math.ceil(state.filteredData.length / state.pagination.itemsPerPage);
    
    document.getElementById('currentPage').textContent = state.pagination.currentPage;
    document.getElementById('totalPages').textContent = state.pagination.totalPages;
    
    // Mise à jour des boutons
    document.getElementById('prevPage').disabled = state.pagination.currentPage === 1;
    document.getElementById('nextPage').disabled = state.pagination.currentPage === state.pagination.totalPages;
}

// Initialisation des éléments de l'interface
function initializeUI() {
    // Remplissage des sélecteurs
    const fillSelect = (selectId, options, defaultOption = 'Tous') => {
        const select = document.getElementById(selectId);
        const currentValue = select.value;
        
        select.innerHTML = `<option value="all">${defaultOption}</option>`;
        options.forEach(option => {
            const element = new Option(option, option);
            select.add(element);
        });
        
        if (options.includes(currentValue)) {
            select.value = currentValue;
        }
    };

    // Event listeners
    document.getElementById('vendorSelect').addEventListener('change', (e) => {
        state.filters.vendor = e.target.value;
        applyFilters();
        updateURL();
    });

    document.getElementById('searchInput').addEventListener('input', (e) => {
        state.filters.search = e.target.value;
        applyFilters();
    });

    document.getElementById('stockStatusFilter').addEventListener('change', (e) => {
        state.filters.stockStatus = e.target.value;
        applyFilters();
    });

    document.getElementById('marqueFilter').addEventListener('change', (e) => {
        state.filters.marque = e.target.value;
        applyFilters();
    });

    document.getElementById('gradeFilter').addEventListener('change', (e) => {
        state.filters.grade = e.target.value;
        applyFilters();
    });

    // Pagination
    document.getElementById('prevPage').addEventListener('click', () => {
        if (state.pagination.currentPage > 1) {
            state.pagination.currentPage--;
            renderTable();
            updatePaginationInfo();
        }
    });

    document.getElementById('nextPage').addEventListener('click', () => {
        if (state.pagination.currentPage < state.pagination.totalPages) {
            state.pagination.currentPage++;
            renderTable();
            updatePaginationInfo();
        }
    });

    document.getElementById('itemsPerPage').addEventListener('change', (e) => {
        state.pagination.itemsPerPage = parseInt(e.target.value);
        state.pagination.currentPage = 1;
        renderTable();
        updatePaginationInfo();
    });

    // Tri des colonnes
    document.querySelectorAll('th[data-sort]').forEach(th => {
        th.addEventListener('click', () => {
            sortTable(th.dataset.sort);
        });
    });
// Période du graphique
document.getElementById('chartPeriod').addEventListener('change', (e) => {
    state.chartData.period = e.target.value;
    updateChart();
});
}

// Mise à jour de l'URL avec les filtres
function updateURL() {
const url = new URL(window.location);

if (state.filters.vendor && state.filters.vendor !== 'all') {
    url.searchParams.set('vendor', state.filters.vendor);
} else {
    url.searchParams.delete('vendor');
}

window.history.pushState({}, '', url);
}

// Chargement initial des données
async function loadData() {
try {
    if (typeof APP_DATA !== 'undefined' && APP_DATA.products) {
        // Initialisation des données
        state.data = APP_DATA.products;
        state.filteredData = state.data;
        state.vendorFilteredData = state.data;
        state.metadata = APP_DATA.metadata || {};

        // Remplissage des sélecteurs avec les métadonnées
        if (state.metadata.vendors) {
            fillSelect('vendorSelect', state.metadata.vendors, 'Tous les vendeurs');
        }
        if (state.metadata.marques) {
            fillSelect('marqueFilter', state.metadata.marques, 'Toutes les marques');
        }
        if (state.metadata.grades) {
            fillSelect('gradeFilter', state.metadata.grades, 'Tous les grades');
        }

        // Vérification des paramètres URL
        const urlParams = new URLSearchParams(window.location.search);
        const vendorFromUrl = urlParams.get('vendor');
        if (vendorFromUrl) {
            document.getElementById('vendorSelect').value = vendorFromUrl;
            state.filters.vendor = vendorFromUrl;
        }

        // Initialisation du graphique avec les données historiques
        if (APP_DATA.historicalData) {
            state.chartData.data = APP_DATA.historicalData;
        }

        // Initialisation de l'interface
        applyFilters();
        updateStats();
        updateChart();
        updatePaginationInfo();

        // Animation d'entrée des cartes de statistiques
        document.querySelectorAll('.stats-card').forEach((card, index) => {
            setTimeout(() => {
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, index * 100);
        });

    } else {
        throw new Error('Données non disponibles');
    }
} catch (error) {
    console.error('Erreur lors du chargement des données:', error);
    
    // Affichage de l'erreur dans le tableau
    document.getElementById('catalogueTable').innerHTML = `
        <tr>
            <td colspan="9" class="px-6 py-4 text-center">
                <div class="flex flex-col items-center justify-center text-red-600">
                    <svg class="w-8 h-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                    </svg>
                    <p class="font-medium">Erreur lors du chargement des données</p>
                    <p class="text-sm mt-1">${error.message}</p>
                </div>
            </td>
        </tr>
    `;

    // Désactivation des filtres
    document.querySelectorAll('.filter-input').forEach(input => {
        input.disabled = true;
    });
}
}

// Fonction utilitaire pour remplir les sélecteurs
function fillSelect(selectId, options, defaultOption = 'Tous') {
const select = document.getElementById(selectId);
const currentValue = select.value;

select.innerHTML = `<option value="all">${defaultOption}</option>`;
options.forEach(option => {
    const element = new Option(option, option);
    select.add(element);
});

if (options.includes(currentValue)) {
    select.value = currentValue;
}
}

// Fonction pour le graphique (à adapter selon votre bibliothèque de graphiques)
function createStockChart(data) {
// Implémentez ici votre logique de création de graphique
// Exemple avec une bibliothèque comme Chart.js ou Recharts
}

// Gestionnaire de redimensionnement pour le graphique
function handleResize() {
if (state.chartInstance) {
    updateChart();
}
}

// Écouteurs d'événements de la fenêtre
//window.addEventListener('resize', _.debounce(handleResize, 250));

// Initialisation de l'application
document.addEventListener('DOMContentLoaded', () => {
// Initialisation des composants UI
initializeUI();

// Chargement des données
loadData();

// Animation des cartes au chargement
document.querySelectorAll('.stats-card').forEach(card => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
});
});