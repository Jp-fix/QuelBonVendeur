// État de l'application
const state = {
    currentVendor: null,
    vendorData: [],
    allData: [],
    metadata: {}
};

function generateAlerts(vendorData) {
    const alerts = [];
    
    // Alerte sur les ruptures de stock
    const outOfStock = vendorData.filter(p => p.Quantity === 0);
    if (outOfStock.length > 0) {
        alerts.push({
            type: 'warning',
            title: 'Ruptures de stock',
            message: `${outOfStock.length} produits en rupture de stock`,
            details: outOfStock.map(p => `${p.Marque} ${p.Modele}`).slice(0, 3)
        });
    }

    // Alerte sur les prix
    const zeroPrice = vendorData.filter(p => p.Prix === 0 && p.Status === 'validated');
    if (zeroPrice.length > 0) {
        alerts.push({
            type: 'danger',
            title: 'Prix à vérifier',
            message: `${zeroPrice.length} produits ont un prix à 0€`,
            details: zeroPrice.map(p => `${p.Marque} ${p.Modele}`).slice(0, 3)
        });
    }

    // Analyse des grades
    const grades = new Set(vendorData.map(p => p.Grade));
    const missingGrades = ['MINT', 'VERY_GOOD', 'GOOD', 'FAIR'].filter(g => !grades.has(g));
    if (missingGrades.length > 0) {
        alerts.push({
            type: 'info',
            title: 'Gamme incomplète',
            message: `Grades manquants dans votre catalogue : ${missingGrades.join(', ')}`,
            details: ['Une gamme complète peut augmenter vos ventes']
        });
    }

    // Produits à faible stock
    const lowStock = vendorData.filter(p => p.Quantity > 0 && p.Quantity < 3);
    if (lowStock.length > 0) {
        alerts.push({
            type: 'warning',
            title: 'Stocks faibles',
            message: `${lowStock.length} produits en stock faible (< 3 unités)`,
            details: lowStock.map(p => `${p.Marque} ${p.Modele} (${p.Quantity})`).slice(0, 3)
        });
    }

    return alerts;
}

// Fonctions utilitaires
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

function calculatePriceRanges(prices) {
    if (prices.length === 0) return [];
    
    // Définir les tranches de prix
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const range = max - min;
    const numberOfBins = 5;
    const binSize = range / numberOfBins;
    
    // Initialiser les tranches
    const ranges = Array(numberOfBins).fill(0);
    
    // Compter les produits dans chaque tranche
    prices.forEach(price => {
        const binIndex = Math.min(
            Math.floor((price - min) / binSize),
            numberOfBins - 1
        );
        ranges[binIndex]++;
    });
    
    // Formater les résultats
    return ranges.map((count, index) => ({
        range: `${formatPrice(min + (binSize * index))} - ${formatPrice(min + (binSize * (index + 1)))}`,
        count: count,
        percentage: (count / prices.length) * 100
    }));
}

// Fonctions d'analyse des données
function getVendorStats(data) {
    const totalProducts = data.length;
    const inStock = data.filter(item => item.Quantity > 0).length;
    const totalValue = data.reduce((acc, item) => acc + (item.Prix * item.Quantity), 0);
    const avgPrice = data.reduce((acc, item) => acc + item.Prix, 0) / totalProducts;

    return {
        totalProducts,
        inStock,
        outOfStock: totalProducts - inStock,
        stockRate: (inStock / totalProducts) * 100,
        totalValue,
        avgPrice
    };
}

function getGradeDistribution(data) {
    const distribution = data.reduce((acc, item) => {
        acc[item.Grade] = (acc[item.Grade] || 0) + 1;
        return acc;
    }, {});

    const total = data.length;
    return Object.entries(distribution).map(([grade, count]) => ({
        grade,
        count,
        percentage: (count / total) * 100
    }));
}

function getBrandAnalysis(data) {
    const brandCounts = data.reduce((acc, item) => {
        acc[item.Marque] = (acc[item.Marque] || 0) + 1;
        return acc;
    }, {});

    const total = data.length;
    return Object.entries(brandCounts)
        .map(([brand, count]) => ({
            brand,
            count,
            percentage: (count / total) * 100
        }))
        .sort((a, b) => b.count - a.count);
}

function getPriceAnalysis(data) {
    // Filtrer les prix valides (supérieurs à 0)
    const prices = data.map(item => item.Prix).filter(price => price > 0 && !isNaN(price));
    
    // Vérifier si nous avons des prix valides
    if (prices.length === 0) {
        return {
            min: 0,
            max: 0,
            median: 0,
            avg: 0,
            avgMargin: 0,
            promoCount: 0,
            promoPercentage: 0,
            marketPosition: 'N/A',
            priceGap: 0,
            distribution: []
        };
    }

    // Calculer la médiane
    const sortedPrices = [...prices].sort((a, b) => a - b);
    const median = sortedPrices.length % 2 === 0
        ? (sortedPrices[sortedPrices.length / 2 - 1] + sortedPrices[sortedPrices.length / 2]) / 2
        : sortedPrices[Math.floor(sortedPrices.length / 2)];

    // Calculer les promotions
    const promoProducts = data.filter(item => 
        item.Status === 'validated' && 
        item.Prix_reference && 
        item.Prix < item.Prix_reference
    );

    // Calculer les marges
    const margins = data
        .filter(item => item.Prix_reference && item.Prix && item.Prix > 0 && item.Prix_reference > 0)
        .map(item => ((item.Prix - item.Prix_reference) / item.Prix_reference) * 100);

    const avgMargin = margins.length > 0 
        ? margins.reduce((a, b) => a + b, 0) / margins.length 
        : 0;

    // Prix moyen du marché (à adapter selon vos données)
    const marketAvg = state.metadata.marketAvgPrice || prices.reduce((a, b) => a + b, 0) / prices.length;

    // Calculer la distribution des prix
    const distribution = calculatePriceRanges(prices);

    return {
        min: Math.min(...prices),
        max: Math.max(...prices),
        median: median,
        avg: prices.reduce((a, b) => a + b, 0) / prices.length,
        avgMargin: avgMargin,
        promoCount: promoProducts.length,
        promoPercentage: (promoProducts.length / data.length) * 100,
        marketAvg: marketAvg,
        priceGap: marketAvg ? ((prices.reduce((a, b) => a + b, 0) / prices.length - marketAvg) / marketAvg) * 100 : 0,
        distribution: distribution
    };
}

// Fonctions de mise à jour de l'interface
function updateAlerts(alerts) {
    const container = document.getElementById('alerts');
    
    if (alerts.length === 0) {
        container.innerHTML = `
            <div class="alert alert-info">
                <p class="font-medium">Aucune alerte à signaler</p>
                <p class="text-sm">Votre catalogue semble en bonne santé</p>
            </div>
        `;
        return;
    }

    container.innerHTML = alerts.map(alert => `
        <div class="alert alert-${alert.type}">
            <h4 class="font-medium">${alert.title}</h4>
            <p class="text-sm mt-1">${alert.message}</p>
            ${alert.details && alert.details.length > 0 ? `
                <ul class="text-sm mt-2 ml-4 list-disc">
                    ${alert.details.map(detail => `<li>${detail}</li>`).join('')}
                </ul>
            ` : ''}
        </div>
    `).join('');
}

function updateKPIs(stats) {
    document.getElementById('totalProducts').textContent = stats.totalProducts;
    document.getElementById('stockValue').textContent = formatPrice(stats.totalValue);
    document.getElementById('avgPrice').textContent = formatPrice(stats.avgPrice);
    document.getElementById('stockRate').textContent = formatPercent(stats.stockRate);
    document.getElementById('inStock').textContent = stats.inStock;
}

function updateGradeDistribution(distribution) {
    const container = document.getElementById('gradeDistribution');
    container.innerHTML = distribution.map(grade => `
        <div class="flex items-center justify-between">
            <span class="badge ${grade.grade === 'MINT' ? 'badge-premium' : 'badge-standard'}">
                ${grade.grade}
            </span>
            <span class="text-sm font-medium">${formatPercent(grade.percentage)}</span>
        </div>
        <div class="progress-bar">
            <div class="progress-bar-fill progress-bar-fill-success" 
                 style="width: ${grade.percentage}%"></div>
        </div>
    `).join('');
}

function updateBrandAnalysis(brands) {
    const container = document.getElementById('brandTable');
    container.innerHTML = brands.map(brand => `
        <tr>
            <td class="py-2">${brand.brand}</td>
            <td class="text-right">${brand.count}</td>
            <td class="text-right">${formatPercent(brand.percentage)}</td>
        </tr>
    `).join('');
}

function updatePriceAnalysis(prices) {
    // Mise à jour des prix
    document.getElementById('minPrice').textContent = formatPrice(prices.min || 0);
    document.getElementById('maxPrice').textContent = formatPrice(prices.max || 0);
    document.getElementById('medianPrice').textContent = formatPrice(prices.median || 0);
    document.getElementById('avgMargin').textContent = formatPercent(prices.avgMargin || 0);
    
    // Mise à jour des promotions
    const promoText = prices.promoCount > 0 
        ? `${prices.promoCount} (${formatPercent(prices.promoPercentage)})`
        : "Aucune promotion";
    document.getElementById('promoCount').textContent = promoText;

    // Mise à jour de la position sur le marché
    const marketPosition = prices.priceGap > 0 ? 'Premium' : 'Compétitif';
    document.getElementById('marketPosition').textContent = marketPosition;
    
    const priceGapText = Math.abs(prices.priceGap) > 0 
        ? `${formatPercent(Math.abs(prices.priceGap))} ${prices.priceGap > 0 ? 'au-dessus' : 'en-dessous'} du marché`
        : 'Dans la moyenne du marché';
    document.getElementById('priceGap').textContent = priceGapText;

    // Mise à jour de la distribution des prix
    const distributionContainer = document.getElementById('priceRangeChart');
    if (prices.distribution && prices.distribution.length > 0) {
        distributionContainer.innerHTML = prices.distribution.map(range => `
            <div class="mb-2">
                <div class="flex justify-between text-sm text-gray-600">
                    <span>${range.range}</span>
                    <span>${range.count} produits</span>
                </div>
                <div class="relative pt-1">
                    <div class="overflow-hidden h-2 text-xs flex rounded bg-gray-200">
                        <div 
                            class="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500"
                            style="width: ${range.percentage}%">
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    } else {
        distributionContainer.innerHTML = '<p class="text-gray-500 text-sm">Aucune donnée disponible pour la distribution des prix</p>';
    }
}

function updateCriticalProducts(products) {
    const container = document.getElementById('criticalProducts');
    container.innerHTML = products.map(product => `
        <tr>
            <td class="px-6 py-4">
                <div class="font-medium">${product.Marque} ${product.Modele}</div>
                <div class="text-sm text-gray-500">${product.sku}</div>
            </td>
            <td class="px-6 py-4">
                <span class="quantity-badge ${product.Quantity > 0 ? 'quantity-in-stock' : 'quantity-out-of-stock'}">
                    ${product.Quantity}
                </span>
            </td>
            <td class="px-6 py-4">${formatPrice(product.Prix)}</td>
            <td class="px-6 py-4">
                <span class="badge ${product.Status === 'validated' ? 'badge-premium' : 'badge-standard'}">
                    ${product.Status}
                </span>
            </td>
            <td class="px-6 py-4">
                <span class="recommendation ${product.Quantity === 0 ? 'recommendation-urgent' : 'recommendation-warning'}">
                    ${product.Quantity === 0 ? 'Réapprovisionnement urgent' : 'Stock faible'}
                </span>
            </td>
        </tr>
    `).join('');
}
// Fonction principale de mise à jour
function updateVendorDetails(vendorName) {
    // Ajouter des logs pour debug
    console.log('Updating vendor details for:', vendorName);
    
    state.currentVendor = vendorName;
    state.vendorData = state.allData.filter(item => item['Nom vendeur'] === vendorName);
    
    console.log('Filtered vendor data:', state.vendorData);

    try {
        const stats = getVendorStats(state.vendorData);
        const gradeDistribution = getGradeDistribution(state.vendorData);
        const brandAnalysis = getBrandAnalysis(state.vendorData);
        const priceAnalysis = getPriceAnalysis(state.vendorData);
        const criticalProducts = getCriticalProducts(state.vendorData);
        const alerts = generateAlerts(state.vendorData);

        console.log('Generated data:', { stats, priceAnalysis });

        updateAlerts(alerts);
        updateKPIs(stats);
        updateGradeDistribution(gradeDistribution);
        updateBrandAnalysis(brandAnalysis);
        updatePriceAnalysis(priceAnalysis);
        updateCriticalProducts(criticalProducts);
    } catch (error) {
        console.error('Error in updateVendorDetails:', error);
    }
}
function getCriticalProducts(data) {
    return data.filter(product => 
        (product.Quantity === 0 || product.Quantity < 3) && 
        product.Status === 'validated'
    ).sort((a, b) => a.Quantity - b.Quantity);
}
// Initialisation de l'application
function initializeVendorSelect() {
    const vendorSelect = document.getElementById('vendorSelect');
    const vendors = [...new Set(state.allData.map(item => item['Nom vendeur']))].sort();
    
    vendorSelect.innerHTML = `
        <option value="">Sélectionner un vendeur</option>
        ${vendors.map(vendor => `<option value="${vendor}">${vendor}</option>`).join('')}
    `;

    vendorSelect.addEventListener('change', (e) => {
        if (e.target.value) {
            updateVendorDetails(e.target.value);
        }
    });
}

// Modifier l'initialisation pour ajouter plus de logs
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded');
    console.log('APP_DATA available:', typeof APP_DATA !== 'undefined');
    
    if (typeof APP_DATA !== 'undefined' && APP_DATA.products) {
        console.log('Initializing with data:', APP_DATA);
        state.allData = APP_DATA.products;
        state.metadata = APP_DATA.metadata || {};
        initializeVendorSelect();
    } else {
        console.error('Erreur: données non disponibles');
    }
});