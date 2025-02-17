// État de l'application
const state = {
    data: [], // Données brutes
    aggregatedData: {}, // Données agrégées par SKU
    filteredData: [], // Données filtrées
    filters: {
        search: '',
        brand: 'all',
        storage: 'all',
        grade: 'all'
    },
    sort: {
        column: null,
        direction: 'asc'
    },
    pagination: {
        currentPage: 1,
        itemsPerPage: 25,
        totalPages: 1
    }
};

// Formatage des prix
function formatPrice(price) {
    return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    }).format(price);
}

// Animation des compteurs
function animateValue(elementId, start, end, duration = 1000) {
    const element = document.getElementById(elementId);
    if (!element) return;

    const startTime = performance.now();
    const updateValue = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        const easeOutQuad = progress * (2 - progress);
        const current = Math.floor(start + (end - start) * easeOutQuad);
        
        element.textContent = current.toLocaleString('fr-FR');
        
        if (progress < 1) {
            requestAnimationFrame(updateValue);
        }
    };
    
    requestAnimationFrame(updateValue);
}

// Agrégation des données par SKU avec tri des vendeurs par prix
function aggregateData(products) {
    const aggregated = {};
    
    products.forEach(product => {
        if (!aggregated[product.sku]) {
            aggregated[product.sku] = {
                sku: product.sku,
                marque: product.Marque,
                modele: product.Modele,
                capacite: product.Capacite,
                couleur: product.Couleur,
                grade: product.Grade,
                totalStock: 0,
                vendeurs: []
            };
        }

        aggregated[product.sku].totalStock += product.Quantity;
        aggregated[product.sku].vendeurs.push({
            nom: product['Nom vendeur'],
            stock: product.Quantity,
            prix: product.Prix
        });
    });

    // Tri des vendeurs par prix pour chaque produit
    Object.values(aggregated).forEach(product => {
        product.vendeurs.sort((a, b) => a.prix - b.prix);
    });

    return aggregated;
}

// Génération d'une ligne de tableau
function generateTableRow(product) {
    const hasStock = product.totalStock > 0;
    const stockClass = hasStock ? 'in-stock' : 'out-of-stock';
    const vendeurs = product.vendeurs.slice(0, 3); // Les 3 meilleurs prix

    // Remplissage avec des vendeurs vides si nécessaire
    while (vendeurs.length < 3) {
        vendeurs.push({ nom: '-', stock: 0, prix: 0 });
    }

    return `
        <tr>
            <td class="text-sm font-mono">${product.sku}</td>
            <td>
                <div class="text-sm font-medium text-gray-900">${product.modele} - ${product.capacite}Go</div>
                ${product.couleur ? `<div class="text-sm text-gray-500">${product.couleur}</div>` : ''}
            </td>
            <td class="text-sm text-gray-500">${product.marque}</td>
            <td>
                <span class="grade-badge">${product.grade}</span>
            </td>
            <td>
                <span class="status-badge ${stockClass}">
                    ${hasStock ? `${product.totalStock} unités` : 'Rupture'}
                </span>
            </td>
            ${vendeurs.map((vendeur, index) => `
                <td>
                    ${vendeur.prix > 0 ? `
                        <div class="price-container">
                            <div class="price-value ${index === 0 ? 'best-price' : ''}">${formatPrice(vendeur.prix)}</div>
                            <div class="vendor-info">${vendeur.nom} (${vendeur.stock})</div>
                        </div>
                    ` : '-'}
                </td>
            `).join('')}
        </tr>
    `;
}

// Mise à jour des stats
function updateStats() {
    const products = Object.values(state.aggregatedData);
    const inStock = products.filter(p => p.totalStock > 0).length;
    const outOfStock = products.length - inStock;

    animateValue('inStockCount', 0, inStock);
    animateValue('outOfStockCount', 0, outOfStock);
}

// Application des filtres
function applyFilters() {
    let filtered = Object.values(state.aggregatedData);

    if (state.filters.search) {
        const searchTerm = state.filters.search.toLowerCase();
        filtered = filtered.filter(product => 
            product.modele.toLowerCase().includes(searchTerm) ||
            product.marque.toLowerCase().includes(searchTerm) ||
            product.sku.toLowerCase().includes(searchTerm)
        );
    }

    if (state.filters.brand !== 'all') {
        filtered = filtered.filter(product => product.marque === state.filters.brand);
    }

    if (state.filters.storage !== 'all') {
        filtered = filtered.filter(product => product.capacite === parseInt(state.filters.storage));
    }

    if (state.filters.grade !== 'all') {
        filtered = filtered.filter(product => product.grade === state.filters.grade);
    }

    state.filteredData = filtered;
    applySort();
    updatePagination();
    renderTable();
}

// Tri des données
function applySort() {
    if (!state.sort.column) return;

    state.filteredData.sort((a, b) => {
        let valueA, valueB;

        switch (state.sort.column) {
            case 'prix':
                valueA = a.vendeurs[0]?.prix || Infinity;
                valueB = b.vendeurs[0]?.prix || Infinity;
                break;
            case 'stock':
                valueA = a.totalStock;
                valueB = b.totalStock;
                break;
            default:
                valueA = a[state.sort.column];
                valueB = b[state.sort.column];
        }

        if (state.sort.direction === 'asc') {
            return valueA > valueB ? 1 : -1;
        } else {
            return valueA < valueB ? 1 : -1;
        }
    });
}

// Rendu du tableau
function renderTable() {
    const start = (state.pagination.currentPage - 1) * state.pagination.itemsPerPage;
    const end = start + state.pagination.itemsPerPage;
    const paginatedData = state.filteredData.slice(start, end);

    document.getElementById('productsTable').innerHTML = 
        paginatedData.map(generateTableRow).join('');

    // Mise à jour des infos de pagination
    document.getElementById('startIndex').textContent = start + 1;
    document.getElementById('endIndex').textContent = Math.min(end, state.filteredData.length);
    document.getElementById('totalItems').textContent = state.filteredData.length;
}

// Mise à jour de la pagination
function updatePagination() {
    state.pagination.totalPages = Math.ceil(
        state.filteredData.length / state.pagination.itemsPerPage
    );
    
    const prevBtns = document.querySelectorAll('.btn-pagination:first-child');
    const nextBtns = document.querySelectorAll('.btn-pagination:last-child');
    
    prevBtns.forEach(btn => {
        btn.disabled = state.pagination.currentPage === 1;
    });
    
    nextBtns.forEach(btn => {
        btn.disabled = state.pagination.currentPage === state.pagination.totalPages;
    });
}

// Initialisation des filtres
function initializeFilters() {
    const products = Object.values(state.aggregatedData);

    // Remplissage des marques
    const brands = [...new Set(products.map(p => p.marque))].sort();
    const brandSelect = document.getElementById('brandFilter');
    brandSelect.innerHTML = `
        <option value="all">Toutes les marques</option>
        ${brands.map(brand => `<option value="${brand}">${brand}</option>`).join('')}
    `;

    // Remplissage des capacités
    const storages = [...new Set(products.map(p => p.capacite))].sort((a, b) => a - b);
    const storageSelect = document.getElementById('storageFilter');
    storageSelect.innerHTML = `
        <option value="all">Toutes les capacités</option>
        ${storages.map(storage => `<option value="${storage}">${storage} Go</option>`).join('')}
    `;

    // Event listeners
    document.getElementById('searchInput').addEventListener('input', e => {
        state.filters.search = e.target.value;
        applyFilters();
    });

    document.getElementById('brandFilter').addEventListener('change', e => {
        state.filters.brand = e.target.value;
        applyFilters();
    });

    document.getElementById('storageFilter').addEventListener('change', e => {
        state.filters.storage = e.target.value;
        applyFilters();
    });

    document.getElementById('gradeFilter').addEventListener('change', e => {
        state.filters.grade = e.target.value;
        applyFilters();
    });

    // Pagination
    document.querySelectorAll('.btn-pagination').forEach(btn => {
        btn.addEventListener('click', e => {
            if (btn.textContent.includes('Précédent') && state.pagination.currentPage > 1) {
                state.pagination.currentPage--;
            } else if (btn.textContent.includes('Suivant') && 
                      state.pagination.currentPage < state.pagination.totalPages) {
                state.pagination.currentPage++;
            }
            renderTable();
            updatePagination();
        });
    });

    // Items par page
    document.getElementById('itemsPerPage').addEventListener('change', e => {
        state.pagination.itemsPerPage = parseInt(e.target.value);
        state.pagination.currentPage = 1;
        applyFilters();
    });

    // Tri des colonnes
    document.querySelectorAll('th[data-sort]').forEach(th => {
        th.addEventListener('click', () => {
            const column = th.dataset.sort;
            if (state.sort.column === column) {
                state.sort.direction = state.sort.direction === 'asc' ? 'desc' : 'asc';
            } else {
                state.sort.column = column;
                state.sort.direction = 'asc';
            }
            
            // Mise à jour des indicateurs visuels de tri
            document.querySelectorAll('th[data-sort]').forEach(header => {
                header.removeAttribute('data-direction');
            });
            th.setAttribute('data-direction', state.sort.direction);
            
            applySort();
            renderTable();
        });
    });
}

// Chargement initial
async function loadData() {
    try {
        if (typeof APP_DATA !== 'undefined' && APP_DATA.products) {
            state.data = APP_DATA.products;
            state.aggregatedData = aggregateData(state.data);
            state.filteredData = Object.values(state.aggregatedData);
            
            updateStats();
            initializeFilters();
            applyFilters();
        } else {
            throw new Error('Données non disponibles');
        }
    } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
        document.getElementById('productsTable').innerHTML = `
            <tr>
                <td colspan="8" class="px-4 py-8 text-center text-red-600">
                    <p class="font-medium">Erreur lors du chargement des données</p>
                    <p class="text-sm mt-1">${error.message}</p>
                </td>
            </tr>
        `;
    }
}

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', loadData);