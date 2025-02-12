// État de l'application
let state = {
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
    chartRoot: null, // Pour stocker la référence au root React
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

// Fonctions utilitaires
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

// Fonction de mise à jour des statistiques
function updateStats() {
    // Utiliser les données filtrées par vendeur pour les statistiques
    let dataToAnalyze = state.vendorFilteredData;

    const stats = {
        total: dataToAnalyze.length,
        inStock: dataToAnalyze.filter(item => item.Quantity > 0).length,
        outOfStock: dataToAnalyze.filter(item => item.Quantity === 0).length,
        avgPrice: dataToAnalyze.reduce((acc, item) => acc + item.Prix, 0) / dataToAnalyze.length || 0
    };

    // Mettre à jour l'interface
    document.getElementById('totalProducts').textContent = stats.total;
    document.getElementById('inStock').textContent = stats.inStock;
    document.getElementById('outOfStock').textContent = stats.outOfStock;

    // Mettre à jour le graphique si la fonction existe
    if (typeof updateChart === 'function') {
        updateChart();
    }
}

// Fonction d'application des filtres
function applyFilters() {
    let filtered = state.data;

    // Filtre par vendeur - plus prioritaire
    if (state.filters.vendor && state.filters.vendor !== 'all') {
        filtered = filtered.filter(item => item['Nom vendeur'] === state.filters.vendor);
    }
    
    // Garder une copie des données filtrées par vendeur pour les statistiques
    state.vendorFilteredData = [...filtered];

    // Filtre par statut de stock
    if (state.filters.stockStatus !== 'all') {
        filtered = filtered.filter(item => 
            state.filters.stockStatus === 'inStock' ? item.Quantity > 0 : item.Quantity === 0
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
    state.pagination.currentPage = 1; // Réinitialiser à la première page
    
    renderTable();
    updateStats();
    updatePaginationInfo();
}

// Fonction de tri du tableau
function sortTable(column) {
    if (state.sort.column === column) {
        state.sort.direction = state.sort.direction === 'asc' ? 'desc' : 'asc';
    } else {
        state.sort.column = column;
        state.sort.direction = 'asc';
    }

    // Mise à jour des indicateurs visuels de tri
    document.querySelectorAll('th[data-sort]').forEach(th => {
        th.removeAttribute('data-sort-direction');
    });
    document.querySelector(`th[data-sort="${column}"]`).setAttribute('data-sort-direction', state.sort.direction);

    // Trier les données
    state.filteredData.sort((a, b) => {
        let valueA = a[column];
        let valueB = b[column];

        // Gestion spéciale pour les valeurs numériques
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

// Fonction de rendu du tableau
function renderTable() {
    const startIndex = (state.pagination.currentPage - 1) * state.pagination.itemsPerPage;
    const endIndex = startIndex + state.pagination.itemsPerPage;
    const paginatedData = state.filteredData.slice(startIndex, endIndex);
    
    const tbody = document.getElementById('catalogueTable');
    tbody.innerHTML = paginatedData.map((item, index) => `
        <tr class="${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-gray-100">
            <td class="px-6 py-4 whitespace-nowrap text-sm font-mono">${item.sku}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm">${item.Marque}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm">${item.Modele}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm">${item.Couleur || ''}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm">${item.Capacite} Go</td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                    ${getGradeClass(item.Grade)}">
                    ${item.Grade}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                    ${item.Quantity > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                    ${item.Quantity}
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

// Fonctions de pagination
function updatePaginationInfo() {
    state.pagination.totalPages = Math.ceil(state.filteredData.length / state.pagination.itemsPerPage);
    
    document.getElementById('currentPage').textContent = state.pagination.currentPage;
    document.getElementById('totalPages').textContent = state.pagination.totalPages;
    
    // Mettre à jour l'état des boutons
    document.getElementById('prevPage').disabled = state.pagination.currentPage === 1;
    document.getElementById('nextPage').disabled = state.pagination.currentPage === state.pagination.totalPages;
}

function initializePaginationListeners() {
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
        state.pagination.currentPage = 1; // Retour à la première page
        renderTable();
        updatePaginationInfo();
    });
}

// Fonction de remplissage des sélecteurs
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

// Initialisation des écouteurs d'événements
function initializeEventListeners() {
    // Event listener pour le sélecteur de vendeur
    document.getElementById('vendorSelect').addEventListener('change', (e) => {
        state.filters.vendor = e.target.value;
        applyFilters();
        
        // Mettre à jour l'URL avec le vendeur sélectionné
        const url = new URL(window.location);
        if (e.target.value && e.target.value !== 'all') {
            url.searchParams.set('vendor', e.target.value);
        } else {
            url.searchParams.delete('vendor');
        }
        window.history.pushState({}, '', url);
    });

    // Event listener pour la recherche
    document.getElementById('searchInput').addEventListener('input', (e) => {
        state.filters.search = e.target.value;
        applyFilters();
    });

    // Event listener pour le filtre de stock
    document.getElementById('stockStatusFilter').addEventListener('change', (e) => {
        state.filters.stockStatus = e.target.value;
        applyFilters();
    });

    // Event listener pour le filtre de marque
    document.getElementById('marqueFilter').addEventListener('change', (e) => {
        state.filters.marque = e.target.value;
        applyFilters();
    });

    // Event listener pour le filtre de grade
    document.getElementById('gradeFilter').addEventListener('change', (e) => {
        state.filters.grade = e.target.value;
        applyFilters();
    });

    // Event listeners pour le tri des colonnes
    document.querySelectorAll('th[data-sort]').forEach(th => {
        th.addEventListener('click', () => {
            sortTable(th.dataset.sort);
        });
    });
}

// Chargement initial des données
async function loadData() {
    try {
        if (typeof APP_DATA !== 'undefined' && APP_DATA.products) {
            // Initialiser avec toutes les données
            state.data = APP_DATA.products;
            state.filteredData = state.data;
            state.vendorFilteredData = state.data;
            state.metadata = APP_DATA.metadata || {};

            // Remplir les sélecteurs avec les métadonnées
            if (state.metadata.vendors) {
                fillSelect('vendorSelect', state.metadata.vendors, 'Tous les vendeurs');
            }
            if (state.metadata.marques) {
                fillSelect('marqueFilter', state.metadata.marques, 'Toutes les marques');
            }
            if (state.metadata.grades) {
                fillSelect('gradeFilter', state.metadata.grades, 'Tous les grades');
            }

            // Vérifier si un vendeur est spécifié dans l'URL
            const urlParams = new URLSearchParams(window.location.search);
            const vendorFromUrl = urlParams.get('vendor');
            if (vendorFromUrl) {
                document.getElementById('vendorSelect').value = vendorFromUrl;
                state.filters.vendor = vendorFromUrl;
                applyFilters();
            }
            
            // Initialiser l'interface
            renderTable();
            updateStats();
            initializePaginationListeners();
        } else {
            throw new Error('Données non disponibles');
        }
    } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
        document.getElementById('catalogueTable').innerHTML = `
            <tr>
                <td colspan="9" class="px-6 py-4 text-center text-red-600">
                    Erreur lors du chargement des données ${error.message}
                </td>
            </tr>
        `;
    }
}

// Initialisation de l'application
document.addEventListener('DOMContentLoaded', () => {
    initializeEventListeners();
    loadData();
});