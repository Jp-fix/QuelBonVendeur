// État de l'application
let state = {
    data: [], // Données brutes
    filteredData: [], // Données filtrées
    metadata: {}, // Métadonnées
    filters: {
        marque: 'all',
        stock: 'all',
        search: ''
    },
    productMatrix: {} // Matrice des produits par marque et modèle
};

// Construction de la matrice des produits
function buildProductMatrix() {
    state.productMatrix = {};

    // Initialiser la matrice pour chaque marque
    state.metadata.marques.forEach(marque => {
        state.productMatrix[marque] = {};
    });

    // Remplir la matrice avec les produits existants
    state.filteredData.forEach(product => {
        if (!state.productMatrix[product.Marque]) {
            state.productMatrix[product.Marque] = {};
        }
        
        if (!state.productMatrix[product.Marque][product.Modele]) {
            state.productMatrix[product.Marque][product.Modele] = {
                quantities: {},
                totalQuantity: 0
            };
        }

        // Ajouter les quantités par grade
        if (!state.productMatrix[product.Marque][product.Modele].quantities[product.Grade]) {
            state.productMatrix[product.Marque][product.Modele].quantities[product.Grade] = 0;
        }
        state.productMatrix[product.Marque][product.Modele].quantities[product.Grade] += product.Quantite;
        state.productMatrix[product.Marque][product.Modele].totalQuantity += product.Quantite;
    });
}

// Rendu d'une cellule de produit
function renderProductCell(product) {
    const totalQuantity = product ? product.totalQuantity : 0;
    const cellClass = totalQuantity > 0 ? 'bg-green-100' : 'bg-red-100';
    
    return `
        <div class="p-4 rounded-lg ${cellClass} h-full">
            <div class="font-medium mb-2">${product ? Object.entries(product.quantities).map(([grade, qty]) =>
                `<div class="text-sm">
                    ${grade}: ${qty}
                </div>`
            ).join('') : 'Non disponible'}</div>
            <div class="text-sm text-gray-600">Total: ${totalQuantity}</div>
        </div>
    `;
}

// Rendu de la grille
function renderGrid() {
    const container = document.getElementById('brandSections');
    container.innerHTML = '';

    Object.entries(state.productMatrix).forEach(([marque, models]) => {
        if (state.filters.marque !== 'all' && state.filters.marque !== marque) return;

        const section = document.createElement('div');
        section.className = 'space-y-4';
        
        // En-tête de la section
        section.innerHTML = `
            <h2 class="text-xl font-bold text-gray-800">${marque}</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                ${Object.entries(models).map(([modele, product]) => {
                    // Appliquer les filtres
                    if (state.filters.search && !modele.toLowerCase().includes(state.filters.search.toLowerCase())) {
                        return '';
                    }
                    if (state.filters.stock === 'inStock' && product.totalQuantity === 0) {
                        return '';
                    }
                    if (state.filters.stock === 'outOfStock' && product.totalQuantity > 0) {
                        return '';
                    }

                    return `
                        <div class="flex flex-col">
                            <div class="text-sm font-medium text-gray-600 mb-2">${modele}</div>
                            ${renderProductCell(product)}
                        </div>
                    `;
                }).join('')}
            </div>
        `;

        container.appendChild(section);
    });
}

// Mise à jour des statistiques
function updateStats() {
    let stats = {
        total: 0,
        inStock: 0,
        outOfStock: 0,
        missing: 0
    };

    Object.values(state.productMatrix).forEach(models => {
        Object.values(models).forEach(product => {
            stats.total++;
            if (product.totalQuantity > 0) {
                stats.inStock++;
            } else {
                stats.outOfStock++;
            }
        });
    });

    document.getElementById('totalModels').textContent = stats.total;
    document.getElementById('inStock').textContent = stats.inStock;
    document.getElementById('outOfStock').textContent = stats.outOfStock;
    document.getElementById('missing').textContent = stats.missing;
}

// Application des filtres
function applyFilters() {
    let filtered = state.data;

    // Filtre par recherche
    if (state.filters.search) {
        const searchLower = state.filters.search.toLowerCase();
        filtered = filtered.filter(item =>
            item.Modele.toLowerCase().includes(searchLower) ||
            item.Marque.toLowerCase().includes(searchLower)
        );
    }

    state.filteredData = filtered;
    buildProductMatrix();
    renderGrid();
    updateStats();
}

// Initialisation des sélecteurs
function initializeSelectors() {
    const marqueFilter = document.getElementById('marqueFilter');
    marqueFilter.innerHTML = '<option value="all">Toutes les marques</option>';
    state.metadata.marques.forEach(marque => {
        const option = new Option(marque, marque);
        marqueFilter.add(option);
    });
}

// Initialisation des event listeners
function initializeEventListeners() {
    document.getElementById('marqueFilter').addEventListener('change', (e) => {
        state.filters.marque = e.target.value;
        renderGrid();
    });

    document.getElementById('stockFilter').addEventListener('change', (e) => {
        state.filters.stock = e.target.value;
        renderGrid();
    });

    document.getElementById('searchInput').addEventListener('input', (e) => {
        state.filters.search = e.target.value;
        applyFilters();
    });
}

// Chargement initial des données
async function loadData() {
    try {
        // Utiliser les données de APP_DATA
        state.data = APP_DATA.products;
        state.metadata = APP_DATA.metadata;
        state.filteredData = state.data;

        // Initialiser la vue
        initializeSelectors();
        initializeEventListeners();
        buildProductMatrix();
        renderGrid();
        updateStats();

    } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
        document.getElementById('brandSections').innerHTML = `
            <div class="text-center text-red-600 p-4">
                Erreur lors du chargement des données. Veuillez réessayer plus tard.
            </div>
        `;
    }
}

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', loadData);