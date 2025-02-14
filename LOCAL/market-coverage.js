// État de l'application
const state = {
    data: [], // Données brutes de APP_DATA
    marketData: {}, // Données agrégées par SKU
    filteredData: [], // Données filtrées pour l'affichage
    currentVendor: null,
    filters: {
        search: '',
        brand: 'all',
        stock: 'all',
        grade: 'all'
    },
    pagination: {
        currentPage: 1,
        itemsPerPage: 25,
        totalPages: 1
    }
};

// Fonctions utilitaires
function formatPrice(price) {
    if (!price) return '-';
    return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    }).format(price);
}

function animateValue(elementId, start, end, duration = 1000) {
    const element = document.getElementById(elementId);
    if (!element) return;

    const startTime = performance.now();
    const updateValue = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        const easeOutQuad = progress * (2 - progress);
        const current = Math.floor(start + (end - start) * easeOutQuad);
        
        if (elementId === 'coverageRate') {
            element.textContent = `${current}%`;
        } else {
            element.textContent = current.toLocaleString('fr-FR');
        }
        
        if (progress < 1) {
            requestAnimationFrame(updateValue);
        }
    };
    
    requestAnimationFrame(updateValue);
}

// Analyse du marché
function aggregateMarketData(products) {
    const marketData = {};
    
    // Premier passage : agréger les données par SKU
    products.forEach(product => {
        const sku = product.sku;
        if (!marketData[sku]) {
            marketData[sku] = {
                sku: sku,
                marque: product.Marque,
                modele: product.Modele,
                couleur: product.Couleur,
                capacite: product.Capacite,
                grades: new Set(),
                totalStock: 0,
                prices: new Map(), // Map vendeur -> prix
                stocks: new Map(), // Map vendeur -> stock
                vendors: new Set(),
                status: product.Status
            };
        }

        const entry = marketData[sku];
        entry.grades.add(product.Grade);
        entry.totalStock += product.Quantity;
        entry.vendors.add(product['Nom vendeur']);
        if (product.Prix > 0) {
            entry.prices.set(product['Nom vendeur'], product.Prix);
        }
        entry.stocks.set(product['Nom vendeur'], product.Quantity);
    });

    // Second passage : calcul des statistiques
    Object.values(marketData).forEach(entry => {
        // Conversion des Sets en Arrays pour faciliter l'utilisation
        entry.grades = Array.from(entry.grades);
        entry.vendors = Array.from(entry.vendors);

        // Calcul du prix moyen (en excluant les prix à 0)
        const validPrices = Array.from(entry.prices.values()).filter(p => p > 0);
        entry.avgPrice = validPrices.length > 0 
            ? validPrices.reduce((a, b) => a + b, 0) / validPrices.length 
            : 0;

        // Prix min et max
        entry.minPrice = validPrices.length > 0 ? Math.min(...validPrices) : 0;
        entry.maxPrice = validPrices.length > 0 ? Math.max(...validPrices) : 0;

        // Stock total et disponibilité
        entry.totalStock = Array.from(entry.stocks.values()).reduce((a, b) => a + b, 0);
        entry.availability = entry.totalStock > 0 ? 'En stock' : 'Rupture';

        // Nombre de vendeurs proposant le produit
        entry.vendorCount = entry.vendors.length;
    });

    return marketData;
}

// Mise à jour des statistiques
function updateStats() {
    const marketDataValues = Object.values(state.marketData);
    const totalRefs = marketDataValues.length;
    const uniqueProducts = new Set(marketDataValues.map(p => p.modele)).size;
    const inStockRefs = marketDataValues.filter(p => p.totalStock > 0).length;
    const coverageRate = Math.round((inStockRefs / totalRefs) * 100);

    animateValue('totalRefs', 0, totalRefs);
    animateValue('inStockRefs', 0, inStockRefs);
    animateValue('missingRefs', 0, totalRefs - inStockRefs);
    animateValue('coverageRate', 0, coverageRate);
}

// État de tri
let sortConfig = {
    column: null,
    direction: 'asc'
};

// Fonction de tri générique
function compareValues(a, b, column, direction = 'asc') {
    let valueA = getValueForSort(a, column);
    let valueB = getValueForSort(b, column);

    // Gestion des valeurs nulles
    if (valueA === null && valueB === null) return 0;
    if (valueA === null) return 1;
    if (valueB === null) return -1;

    // Comparaison
    let comparison = 0;
    if (valueA < valueB) {
        comparison = -1;
    } else if (valueA > valueB) {
        comparison = 1;
    }

    return direction === 'asc' ? comparison : -comparison;
}

// Fonction pour obtenir la valeur de tri selon la colonne
function getValueForSort(product, column) {
    switch(column) {
        case 'sku':
            return product.sku.toLowerCase();
        case 'marque':
            return product.marque.toLowerCase();
        case 'modele':
            return product.modele.toLowerCase();
        case 'capacite':
            return product.capacite || 0;
        case 'totalStock':
            return product.totalStock;
        case 'avgPrice':
            return product.avgPrice || 0;
        case 'grade':
            // Ordre personnalisé pour les grades
            const gradeOrder = { 'MINT': 0, 'VERY_GOOD': 1, 'GOOD': 2, 'FAIR': 3 };
            return Math.min(...product.grades.map(g => gradeOrder[g] || 999));
        default:
            return product[column];
    }
}

// Application des filtres
function applyFilters() {
    let filtered = Object.values(state.marketData);

    // Filtre de recherche
    if (state.filters.search) {
        const searchTerm = state.filters.search.toLowerCase();
        filtered = filtered.filter(product => 
            product.sku.toLowerCase().includes(searchTerm) ||
            product.marque.toLowerCase().includes(searchTerm) ||
            product.modele.toLowerCase().includes(searchTerm) ||
            product.couleur?.toLowerCase().includes(searchTerm)
        );
    }

    // Filtre par marque
    if (state.filters.brand !== 'all') {
        filtered = filtered.filter(product => 
            product.marque === state.filters.brand
        );
    }

    // Filtre par état de stock
    if (state.filters.stock !== 'all') {
        filtered = filtered.filter(product => {
            const vendorStock = state.currentVendor ? 
                (product.stocks.get(state.currentVendor) || 0) : 
                product.totalStock;

            switch (state.filters.stock) {
                case 'inStock':
                    return vendorStock > 0;
                case 'outOfStock':
                    return vendorStock === 0;
                case 'missing':
                    return product.totalStock > 0 && vendorStock === 0;
                default:
                    return true;
            }
        });
    }

    // Filtre par grade
    if (state.filters.grade !== 'all') {
        filtered = filtered.filter(product => 
            product.grades.includes(state.filters.grade)
        );
    }

    // Application du tri si configuré
    if (sortConfig.column) {
        filtered.sort((a, b) => compareValues(a, b, sortConfig.column, sortConfig.direction));
    }

    state.filteredData = filtered;
    updatePagination();
    renderTable();
}

// Rendu du tableau
function renderTable() {
    const start = (state.pagination.currentPage - 1) * state.pagination.itemsPerPage;
    const end = start + state.pagination.itemsPerPage;
    const paginatedData = state.filteredData.slice(start, end);

    const tbody = document.getElementById('marketTable');
    tbody.innerHTML = paginatedData.map(product => `
        <tr class="hover:bg-gray-50">
            <td class="px-6 py-4 whitespace-nowrap text-sm font-mono">${product.sku}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm">${product.marque}</td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">${product.modele}</div>
                <div class="text-sm text-gray-500">${product.couleur || ''} ${product.capacite ? `${product.capacite}Go` : ''}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex flex-wrap gap-1">
                    ${product.grades.map(grade => `
                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            ${grade}
                        </span>
                    `).join('')}
                </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm">
                ${formatPrice(product.avgPrice)}
                ${product.minPrice !== product.maxPrice ? 
                    `<div class="text-xs text-gray-500">
                        ${formatPrice(product.minPrice)} - ${formatPrice(product.maxPrice)}
                    </div>` : 
                    ''}
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                    ${product.totalStock > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                    ${product.totalStock}
                </span>
                <div class="text-xs text-gray-500">${product.vendorCount} vendeur(s)</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm">
                ${product.vendors.map(vendor => `
                    <div class="text-xs ${state.currentVendor === vendor ? 'font-bold' : ''}">
                        ${vendor}: ${product.stocks.get(vendor) || 0}
                    </div>
                `).join('')}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm">
                ${product.vendors.map(vendor => {
                    const price = product.prices.get(vendor);
                    if (!price) return '';
                    const diff = product.avgPrice ? ((price - product.avgPrice) / product.avgPrice * 100).toFixed(1) : 0;
                    const diffClass = diff > 0 ? 'text-red-600' : 'text-green-600';
                    return `
                        <div class="text-xs ${state.currentVendor === vendor ? 'font-bold' : ''}">
                            ${formatPrice(price)}
                            <span class="${diffClass}">${diff > 0 ? '+' : ''}${diff}%</span>
                        </div>
                    `;
                }).join('')}
            </td>
        </tr>
    `).join('');
}

// Gestion de la pagination
function updatePagination() {
    state.pagination.totalPages = Math.ceil(state.filteredData.length / state.pagination.itemsPerPage);
    
    document.getElementById('startIndex').textContent = 
        ((state.pagination.currentPage - 1) * state.pagination.itemsPerPage + 1).toLocaleString();
    document.getElementById('endIndex').textContent = 
        Math.min(state.pagination.currentPage * state.pagination.itemsPerPage, state.filteredData.length).toLocaleString();
    document.getElementById('totalItems').textContent = 
        state.filteredData.length.toLocaleString();

    // Mise à jour des boutons de pagination
    const prevButtons = document.querySelectorAll('.btn-pagination:first-child');
    const nextButtons = document.querySelectorAll('.btn-pagination:last-child');
    
    prevButtons.forEach(btn => {
        btn.disabled = state.pagination.currentPage === 1;
    });
    
    nextButtons.forEach(btn => {
        btn.disabled = state.pagination.currentPage === state.pagination.totalPages;
    });
}

// Initialisation des filtres et du tri
function initializeFilters() {
    const marketDataValues = Object.values(state.marketData);
    
    // Initialisation du tri des colonnes
    document.querySelectorAll('th[data-sort]').forEach(th => {
        th.addEventListener('click', () => {
            const column = th.dataset.sort;
            
            // Mise à jour de la configuration de tri
            if (sortConfig.column === column) {
                sortConfig.direction = sortConfig.direction === 'asc' ? 'desc' : 'asc';
            } else {
                sortConfig = { column, direction: 'asc' };
            }

            // Mise à jour des indicateurs visuels
            document.querySelectorAll('th[data-sort]').forEach(header => {
                header.classList.remove('sort-asc', 'sort-desc');
                const icon = header.querySelector('.sort-icon');
                if (icon) icon.textContent = '↕';
            });

            th.classList.add(`sort-${sortConfig.direction}`);
            const icon = th.querySelector('.sort-icon');
            if (icon) icon.textContent = sortConfig.direction === 'asc' ? '↑' : '↓';

            applyFilters();
        });
    });

    // Remplissage des sélecteurs avec les métadonnées de APP_DATA
    if (APP_DATA.metadata) {
        // Marques
        const brandSelect = document.getElementById('brandFilter');
        brandSelect.innerHTML = `
            <option value="all">Toutes les marques</option>
            ${APP_DATA.metadata.marques.map(brand => 
                `<option value="${brand}">${brand}</option>`
            ).join('')}
        `;

        // Grades
        const gradeSelect = document.getElementById('gradeFilter');
        gradeSelect.innerHTML = `
            <option value="all">Tous les grades</option>
            ${APP_DATA.metadata.grades.map(grade => 
                `<option value="${grade}">${grade}</option>`
            ).join('')}
        `;
    }

    // Event listeners avec debounce pour la recherche
    let searchTimeout;
    document.getElementById('searchInput').addEventListener('input', e => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            state.filters.search = e.target.value;
            state.pagination.currentPage = 1; // Retour à la première page
            applyFilters();
        }, 300);
    });

    document.getElementById('brandFilter').addEventListener('change', e => {
        state.filters.brand = e.target.value;
        state.pagination.currentPage = 1;
        applyFilters();
    });

    document.getElementById('stockFilter').addEventListener('change', e => {
        state.filters.stock = e.target.value;
        state.pagination.currentPage = 1;
        applyFilters();
    });

    document.getElementById('gradeFilter').addEventListener('change', e => {
        state.filters.grade = e.target.value;
        state.pagination.currentPage = 1;
        applyFilters();
    });

    // Pagination
    document.getElementById('itemsPerPage').addEventListener('change', e => {
        state.pagination.itemsPerPage = parseInt(e.target.value);
        state.pagination.currentPage = 1;
        applyFilters();
    });

    document.querySelectorAll('.btn-pagination').forEach(btn => {
        btn.addEventListener('click', e => {
            if (btn.textContent === 'Précédent' && state.pagination.currentPage > 1) {
                state.pagination.currentPage--;
            } else if (btn.textContent === 'Suivant' && state.pagination.currentPage < state.pagination.totalPages) {
                state.pagination.currentPage++;
            }
            renderTable();
            updatePagination();
        });
    });

    // Remplissage du sélecteur de vendeurs si disponible
    const vendorSelect = document.getElementById('vendorSelect');
    if (vendorSelect && APP_DATA.metadata?.vendors) {
        vendorSelect.innerHTML = `
            <option value="all">Tous les vendeurs</option>
            ${APP_DATA.metadata.vendors.map(vendor => 
                `<option value="${vendor}">${vendor}</option>`
            ).join('')}
        `;
        
        vendorSelect.addEventListener('change', e => {
            state.currentVendor = e.target.value === 'all' ? null : e.target.value;
            applyFilters();
        });
    }
}

// Initialisation de la page
document.addEventListener('DOMContentLoaded', () => {
    if (typeof APP_DATA !== 'undefined' && APP_DATA.products) {
        state.data = APP_DATA.products;
        state.marketData = aggregateMarketData(state.data);
        state.filteredData = Object.values(state.marketData);

        // Initialisation de l'interface
        initializeFilters();
        updateStats();
        applyFilters();
    } else {
        console.error('Données non disponibles');
        document.getElementById('marketTable').innerHTML = `
            <tr>
                <td colspan="8" class="px-6 py-4 text-center text-red-600">
                    <div class="font-medium">Erreur de chargement des données</div>
                    <div class="text-sm">Veuillez réessayer ultérieurement</div>
                </td>
            </tr>
        `;
    }
});