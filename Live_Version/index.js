// État de l'application
let state = {
    data: [], // Données brutes
    filteredData: [], // Données filtrées
    metadata: {}, // Métadonnées (vendeurs, marques, etc.)
    filters: {
        vendor: '',
        search: '',
        stockStatus: 'all',
        marque: 'all',
        grade: 'all'
    },
    chartRoot: null // Pour stocker la référence au root React
};

// Fonctions utilitaires
function updateStats() {
    const stats = {
        total: state.filteredData.length,
        inStock: state.filteredData.filter(item => item.Quantite > 0).length,
        outOfStock: state.filteredData.filter(item => item.Quantite === 0).length
    };

    document.getElementById('totalProducts').textContent = stats.total;
    document.getElementById('inStock').textContent = stats.inStock;
    document.getElementById('outOfStock').textContent = stats.outOfStock;
}

function updateChart() {
    if (!state.chartRoot) {
        state.chartRoot = ReactDOM.createRoot(document.getElementById('stockChartContainer'));
    }
    
    state.chartRoot.render(React.createElement(StockChart, { 
        data: state.filteredData 
    }));
}

function applyFilters() {
    let filtered = state.data;

    // Filtre par vendeur
    if (state.filters.vendor && state.filters.vendor !== 'all') {
        filtered = filtered.filter(item => item['Nom vendeur'] === state.filters.vendor);
    }

    // Filtre par statut de stock
    if (state.filters.stockStatus !== 'all') {
        filtered = filtered.filter(item => 
            state.filters.stockStatus === 'inStock' ? item.Quantite > 0 : item.Quantite === 0
        );
    }

    // Filtre par marque
    if (state.filters.marque !== 'all') {
        filtered = filtered.filter(item => item.Marque === state.filters.marque);
    }

    // Filtre par grade
    if (state.filters.grade !== 'all') {
        filtered = filtered.filter(item => item.Grade === state.filters.grade);
    }

    // Filtre par recherche
    if (state.filters.search) {
        const searchLower = state.filters.search.toLowerCase();
        filtered = filtered.filter(item =>
            item.Modele?.toLowerCase().includes(searchLower) ||
            item.sku?.toLowerCase().includes(searchLower) ||
            item.Marque?.toLowerCase().includes(searchLower)
        );
    }

    state.filteredData = filtered;
    renderTable();
    updateStats();
    updateChart(); // Mettre à jour le graphique quand les filtres changent
}

function formatPrice(price) {
    return new Intl.NumberFormat('fr-FR', { 
        style: 'currency', 
        currency: 'EUR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    }).format(price);
}

function getGradeClass(grade) {
    switch (grade) {
        case 'MINT':
            return 'bg-blue-100 text-blue-800';
        case 'VERY_GOOD':
            return 'bg-green-100 text-green-800';
        case 'GOOD':
            return 'bg-yellow-100 text-yellow-800';
        case 'FAIR':
            return 'bg-gray-100 text-gray-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
}

function renderTable() {
    const tbody = document.getElementById('catalogueTable');
    tbody.innerHTML = state.filteredData.slice(0, 100).map((item, index) => `
        <tr class="${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-gray-100">
            <td class="px-6 py-4 whitespace-nowrap text-sm font-mono">${item.sku}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm">${item.Marque}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm">${item.Modele}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm">${item.Couleur}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm">${item.Capacite} Go</td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                    ${getGradeClass(item.Grade)}">
                    ${item.Grade}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                    ${item.Quantite > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                    ${item.Quantite}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm">${formatPrice(item.Prix)}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                    ${item.Status === 'validated' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}">
                    ${item.Status}
                </span>
            </td>
        </tr>
    `).join('');
}

function fillSelect(selectId, options, defaultOption = 'Tous') {
    const select = document.getElementById(selectId);
    const currentValue = select.value;
    
    // Garder seulement l'option "all"
    select.innerHTML = `<option value="all">${defaultOption}</option>`;
    
    // Ajouter les nouvelles options
    options.forEach(option => {
        const element = new Option(option, option);
        select.add(element);
    });
    
    // Restaurer la valeur précédente si elle existe
    if (options.includes(currentValue)) {
        select.value = currentValue;
    }
}

// Point d'entrée : chargement des données
async function loadData() {
    try {
        // Utiliser directement les données de APP_DATA
        state.data = APP_DATA.products;
        state.metadata = APP_DATA.metadata;

        // Remplir les sélecteurs avec les métadonnées
        fillSelect('vendorSelect', state.metadata.vendors, 'Tous les vendeurs');
        fillSelect('marqueFilter', state.metadata.marques, 'Toutes les marques');
        fillSelect('gradeFilter', state.metadata.grades, 'Tous les grades');
        
        // Initialiser les filtres
        applyFilters();

    } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
        document.getElementById('catalogueTable').innerHTML = `
            <tr>
                <td colspan="9" class="px-6 py-4 text-center text-red-600">
                    Erreur lors du chargement des données. Veuillez réessayer plus tard.
                </td>
            </tr>
        `;
    }
}

// Initialisation des event listeners
function initializeEventListeners() {
    // Event listeners pour les filtres
    document.getElementById('vendorSelect').addEventListener('change', (e) => {
        state.filters.vendor = e.target.value;
        applyFilters();
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

    // Event listeners pour le tri des colonnes
    document.querySelectorAll('th[data-sort]').forEach(th => {
        th.addEventListener('click', () => {
            const column = th.dataset.sort;
            sortTable(column);
        });
    });
}

// Fonction de tri du tableau
let currentSort = {
    column: null,
    direction: 'asc'
};

function sortTable(column) {
    if (currentSort.column === column) {
        currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
    } else {
        currentSort.column = column;
        currentSort.direction = 'asc';
    }

    // Mettre à jour les indicateurs visuels de tri
    document.querySelectorAll('th[data-sort]').forEach(th => {
        th.removeAttribute('data-sort-direction');
    });
    document.querySelector(`th[data-sort="${column}"]`).setAttribute('data-sort-direction', currentSort.direction);

    // Trier les données
    state.filteredData.sort((a, b) => {
        let valueA = a[column];
        let valueB = b[column];

        // Gestion spéciale pour les valeurs numériques
        if (column === 'Prix' || column === 'Quantite' || column === 'Capacite') {
            valueA = Number(valueA);
            valueB = Number(valueB);
        }

        if (currentSort.direction === 'asc') {
            return valueA > valueB ? 1 : -1;
        } else {
            return valueA < valueB ? 1 : -1;
        }
    });

    renderTable();
}

// Initialisation de l'application
document.addEventListener('DOMContentLoaded', () => {
    initializeEventListeners();
    loadData();
});