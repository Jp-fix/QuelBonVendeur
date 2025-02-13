// État de l'application
const state = {
    data: [], // Données brutes
    filteredData: [], // Données filtrées
    pagination: {
        currentPage: 1,
        itemsPerPage: 25
    },
    sort: {
        column: null,
        direction: 'asc'
    },
    filters: {
        search: '',
        stock: 'all',
        marque: 'all',
        grade: 'all'
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
    const baseClass = "badge";
    switch (grade) {
        case 'MINT': return `${baseClass} badge-premium`;
        case 'VERY_GOOD': return `${baseClass} bg-green-100 text-green-800`;
        case 'GOOD': return `${baseClass} bg-yellow-100 text-yellow-800`;
        case 'FAIR': return `${baseClass} badge-standard`;
        default: return `${baseClass} badge-standard`;
    }
}

// Fonctions de mise à jour des statistiques
function updateStats() {
    const inStockCount = state.filteredData.filter(item => item.Quantity > 0).length;
    const outOfStockCount = state.filteredData.filter(item => item.Quantity === 0).length;
    const averagePrice = state.filteredData.reduce((acc, curr) => acc + curr.Prix, 0) / state.filteredData.length;

    document.getElementById('totalProducts').textContent = state.filteredData.length;
    document.getElementById('inStock').textContent = inStockCount;
    document.getElementById('outOfStock').textContent = outOfStockCount;
    document.getElementById('averagePrice').textContent = formatPrice(averagePrice);
}

// Fonctions de filtrage
function applyFilters() {
    let filtered = state.data;

    // Filtre de recherche
    if (state.filters.search) {
        const searchTerm = state.filters.search.toLowerCase();
        filtered = filtered.filter(item => 
            item.sku?.toLowerCase().includes(searchTerm) ||
            item.Marque?.toLowerCase().includes(searchTerm) ||
            item.Modele?.toLowerCase().includes(searchTerm) ||
            item.Couleur?.toLowerCase().includes(searchTerm)
        );
    }

    // Filtre de stock
    if (state.filters.stock !== 'all') {
        filtered = filtered.filter(item => 
            state.filters.stock === 'inStock' ? item.Quantity > 0 : item.Quantity === 0
        );
    }

    // Filtre de marque
    if (state.filters.marque !== 'all') {
        filtered = filtered.filter(item => item.Marque === state.filters.marque);
    }

    // Filtre de grade
    if (state.filters.grade !== 'all') {
        filtered = filtered.filter(item => item.Grade === state.filters.grade);
    }

    state.filteredData = filtered;
    updateTable();
    updateStats();
    updatePagination();
}

// Fonctions de tri
function sortData(column) {
    const direction = state.sort.column === column && state.sort.direction === 'asc' ? 'desc' : 'asc';
    
    state.filteredData.sort((a, b) => {
        let valueA = a[column];
        let valueB = b[column];

        // Gestion spéciale pour les valeurs numériques
        if (column === 'Prix' || column === 'Quantity' || column === 'Capacite') {
            valueA = Number(valueA);
            valueB = Number(valueB);
        }

        if (direction === 'asc') {
            return valueA > valueB ? 1 : -1;
        } else {
            return valueA < valueB ? 1 : -1;
        }
    });

    state.sort.column = column;
    state.sort.direction = direction;

    // Mise à jour des indicateurs visuels de tri
    document.querySelectorAll('th[data-sort]').forEach(th => {
        th.removeAttribute('data-sort-direction');
    });
    document.querySelector(`th[data-sort="${column}"]`).setAttribute('data-sort-direction', direction);

    updateTable();
}

// Fonctions de pagination
function updatePagination() {
    const totalPages = Math.ceil(state.filteredData.length / state.pagination.itemsPerPage);
    document.getElementById('currentPage').textContent = state.pagination.currentPage;
    document.getElementById('totalPages').textContent = totalPages;
    document.getElementById('prevPage').disabled = state.pagination.currentPage === 1;
    document.getElementById('nextPage').disabled = state.pagination.currentPage === totalPages;
}

// Génération du tableau
function updateTable() {
    const start = (state.pagination.currentPage - 1) * state.pagination.itemsPerPage;
    const end = start + state.pagination.itemsPerPage;
    const paginatedData = state.filteredData.slice(start, end);

    const tbody = document.getElementById('catalogTable');
    tbody.innerHTML = paginatedData.map((item, index) => `
        <tr class="${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-gray-100">
            <td class="px-6 py-4 whitespace-nowrap text-sm font-mono">${item.sku}</td>
            <td class="px-6 py-4 whitespace-nowrap">${item.Marque}</td>
            <td class="px-6 py-4 whitespace-nowrap">${item.Modele}</td>
            <td class="px-6 py-4 whitespace-nowrap">${item.Couleur}</td>
            <td class="px-6 py-4 whitespace-nowrap">${item.Capacite} Go</td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="${getGradeClass(item.Grade)}">${item.Grade}</span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="quantity-badge ${item.Quantity > 0 ? 'quantity-in-stock' : 'quantity-out-of-stock'}">
                    ${item.Quantity}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">${formatPrice(item.Prix)}</td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="badge ${item.Status === 'validated' ? 'badge-premium' : 'badge-standard'}">
                    ${item.Status}
                </span>
            </td>
        </tr>
    `).join('');
}

// Initialisation des filtres
function initializeFilters() {
    // Remplir le filtre des marques
    const marques = [...new Set(state.data.map(item => item.Marque))].sort();
    const marqueFilter = document.getElementById('marqueFilter');
    marqueFilter.innerHTML = '<option value="all">Toutes les marques</option>' +
        marques.map(marque => `<option value="${marque}">${marque}</option>`).join('');

    // Remplir le filtre des grades
    const grades = [...new Set(state.data.map(item => item.Grade))].sort();
    const gradeFilter = document.getElementById('gradeFilter');
    gradeFilter.innerHTML = '<option value="all">Tous les grades</option>' +
        grades.map(grade => `<option value="${grade}">${grade}</option>`).join('');
}

// Initialisation des événements
function initializeEventListeners() {
    // Événements de filtrage
    document.getElementById('searchInput').addEventListener('input', e => {
        state.filters.search = e.target.value;
        applyFilters();
    });

    document.getElementById('stockFilter').addEventListener('change', e => {
        state.filters.stock = e.target.value;
        applyFilters();
    });

    document.getElementById('marqueFilter').addEventListener('change', e => {
        state.filters.marque = e.target.value;
        applyFilters();
    });

    document.getElementById('gradeFilter').addEventListener('change', e => {
        state.filters.grade = e.target.value;
        applyFilters();
    });

    // Événements de tri
    document.querySelectorAll('th[data-sort]').forEach(th => {
        th.addEventListener('click', () => {
            sortData(th.dataset.sort);
        });
    });

    // Événements de pagination
    document.getElementById('prevPage').addEventListener('click', () => {
        if (state.pagination.currentPage > 1) {
            state.pagination.currentPage--;
            updateTable();
            updatePagination();
        }
    });

    document.getElementById('nextPage').addEventListener('click', () => {
        const totalPages = Math.ceil(state.filteredData.length / state.pagination.itemsPerPage);
        if (state.pagination.currentPage < totalPages) {
            state.pagination.currentPage++;
            updateTable();
            updatePagination();
        }
    });

    document.getElementById('itemsPerPage').addEventListener('change', e => {
        state.pagination.itemsPerPage = parseInt(e.target.value);
        state.pagination.currentPage = 1;
        updateTable();
        updatePagination();
    });
}

// Initialisation de l'application
document.addEventListener('DOMContentLoaded', () => {
    // Charger les données
    if (typeof APP_DATA !== 'undefined' && APP_DATA.products) {
        state.data = APP_DATA.products;
        state.filteredData = state.data;
        
        // Initialiser l'interface
        initializeFilters();
        initializeEventListeners();
        updateTable();
        updateStats();
        updatePagination();
    } else {
        console.error('Erreur: données non disponibles');
        document.getElementById('catalogTable').innerHTML = `
            <tr>
                <td colspan="9" class="px-6 py-4 text-center text-red-600">
                    Erreur: impossible de charger les données
                </td>
            </tr>
        `;
    }
});