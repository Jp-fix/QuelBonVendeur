// État de l'application
const state = {
    currentVendor: null,
    vendorData: [],
    allData: [],
    metadata: {}
};
// Fonctions d'analyse des données
function getVendorStats(data) {
    const totalProducts = data.length;
    const inStock = data.filter(item => item.Quantity > 0).length;
    const totalValue = data.reduce((acc, item) => acc + (item.Prix * item.Quantity), 0);
    const avgPrice = totalValue / inStock;

    return {
        totalProducts,
        inStock,
        outOfStock: totalProducts - inStock,
        stockRate: (inStock / totalProducts) * 100,
        totalValue,
        avgPrice
    };
}
// Rendu des données (haut de page)
function updateKPIs(stats) {
    document.getElementById('totalProducts').textContent = stats.totalProducts;
    document.getElementById('stockValue').textContent = formatPrice(stats.totalValue);
    document.getElementById('avgPrice').textContent = formatPrice(stats.avgPrice);
    document.getElementById('stockRate').textContent = formatPercent(stats.stockRate);
    document.getElementById('inStock').textContent = stats.inStock;
}
/*
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
}*/

function generateAlerts(vendorData) {
    const alerts = [];
    
    // 1. Analyse des ruptures de stock
    const outOfStock = vendorData.filter(p => p.Quantity === 0);
    const outOfStockPercentage = (outOfStock.length / vendorData.length) * 100;
    
    if (outOfStock.length > 0) {
        alerts.push({
            type: outOfStockPercentage > 20 ? 'danger' : 'warning',
            title: 'Ruptures de stock',
            message: `${outOfStock.length} produits en rupture de stock (${outOfStockPercentage.toFixed(1)}% du catalogue)`,
            details: [
                ...outOfStock.map(p => `${p.Marque} ${p.Modele}`).slice(0, 3),
                outOfStock.length > 3 ? `et ${outOfStock.length - 3} autres produits...` : null
            ].filter(Boolean),
            actions: [
                'Vérifier les délais de réapprovisionnement',
                'Contacter les fournisseurs pour les produits prioritaires',
                'Envisager des alternatives pour les produits les plus demandés'
            ]
        });
    }

    // 2. Analyse des prix et marges
    const zeroPrice = vendorData.filter(p => p.Prix === 0 && p.Status === 'validated');
    const lowMargin = vendorData.filter(p => {
        const margin = p.Prix_reference ? ((p.Prix - p.Prix_reference) / p.Prix_reference) * 100 : null;
        return margin !== null && margin < 5 && p.Status === 'validated';
    });

    if (zeroPrice.length > 0 || lowMargin.length > 0) {
        alerts.push({
            type: 'danger',
            title: 'Analyse des prix',
            message: [
                zeroPrice.length > 0 ? `${zeroPrice.length} produits ont un prix à 0€` : null,
                lowMargin.length > 0 ? `${lowMargin.length} produits ont une marge inférieure à 5%` : null
            ].filter(Boolean).join(' et '),
            details: [
                ...zeroPrice.map(p => `Prix nul : ${p.Marque} ${p.Modele}`).slice(0, 2),
                ...lowMargin.map(p => `Marge faible : ${p.Marque} ${p.Modele}`).slice(0, 2)
            ],
            actions: [
                'Revoir la stratégie de prix pour les produits à marge faible',
                'Vérifier et corriger les prix à 0€',
                'Analyser la compétitivité des prix par rapport au marché'
            ]
        });
    }
    // 3. Analyse de la gamme et des grades
    const gradeDistribution = vendorData.reduce((acc, p) => {
        acc[p.Grade] = (acc[p.Grade] || 0) + 1;
        return acc;
    }, {});

    const expectedGrades = ['MINT', 'VERY_GOOD', 'GOOD', 'FAIR'];
    const missingGrades = expectedGrades.filter(g => !gradeDistribution[g]);
    const unbalancedGrades = Object.entries(gradeDistribution)
        .some(([_, count]) => (count / vendorData.length) > 0.5);

    if (missingGrades.length > 0 || unbalancedGrades) {
        alerts.push({
            type: 'info',
            title: 'Optimisation de la gamme',
            message: [
                missingGrades.length > 0 ? `Grades manquants : ${missingGrades.join(', ')}` : null,
                unbalancedGrades ? 'Distribution déséquilibrée des grades' : null
            ].filter(Boolean).join(' - '),
            details: Object.entries(gradeDistribution)
                .map(([grade, count]) => `${grade}: ${((count / vendorData.length) * 100).toFixed(1)}%`),
            actions: [
                'Diversifier les grades pour couvrir tous les segments de marché',
                'Équilibrer la distribution des grades pour maximiser les ventes',
                'Analyser les performances de vente par grade'
            ]
        });
    }

    // 4. Analyse des stocks faibles et critiques
    const lowStock = vendorData.filter(p => p.Quantity > 0 && p.Quantity < 3);
    const reorderPoint = Math.max(5, Math.ceil(vendorData.length * 0.05)); // 5% du catalogue ou minimum 5 unités
    const stockAlert = vendorData.filter(p => p.Quantity > 0 && p.Quantity <= reorderPoint);

    if (lowStock.length > 0 || stockAlert.length > 0) {
        alerts.push({
            type: lowStock.length > 0 ? 'warning' : 'info',
            title: 'Gestion des stocks',
            message: [
                lowStock.length > 0 ? `${lowStock.length} produits en stock critique (< 3 unités)` : null,
                stockAlert.length > 0 ? `${stockAlert.length} produits sous le point de réapprovisionnement` : null
            ].filter(Boolean).join(' et '),
            details: [
                ...lowStock.map(p => `Critique (${p.Quantity}) : ${p.Marque} ${p.Modele}`).slice(0, 2),
                ...stockAlert
                    .filter(p => p.Quantity >= 3)
                    .map(p => `À surveiller (${p.Quantity}) : ${p.Marque} ${p.Modele}`)
                    .slice(0, 2)
            ],
            actions: [
                'Planifier le réapprovisionnement des produits critiques',
                'Revoir les seuils de réapprovisionnement',
                'Mettre en place des alertes automatiques de stock'
            ]
        });
    }

    // 5. Analyse du statut de validation
    const nonValidated = vendorData.filter(p => p.Status !== 'validated');
    if (nonValidated.length > 0) {
        alerts.push({
            type: 'warning',
            title: 'Validation des produits',
            message: `${nonValidated.length} produits non validés`,
            details: [
                ...nonValidated.map(p => `${p.Marque} ${p.Modele} (${p.Status})`).slice(0, 3),
                nonValidated.length > 3 ? `et ${nonValidated.length - 3} autres produits...` : null
            ].filter(Boolean),
            actions: [
                'Compléter les informations manquantes',
                'Vérifier la conformité des produits',
                'Valider les fiches produits en attente'
            ]
        });
    }

    // Cas où il n'y a aucune alerte
    if (alerts.length === 0) {
        alerts.push({
            type: 'success',
            title: 'Catalogue en bonne santé',
            message: 'Aucune alerte critique à signaler',
            details: [
                'Stocks bien gérés',
                'Prix correctement définis',
                'Gamme de produits équilibrée'
            ],
            actions: [
                'Continuer la surveillance régulière',
                'Maintenir les bonnes pratiques actuelles'
            ]
        });
    }

    return alerts;
}

// Fonction de mise à jour de l'interface pour les alertes
function updateAlerts(alerts) {
    const container = document.getElementById('alerts');
    
    container.innerHTML = alerts.map(alert => `
        <div class="alert ${getAlertClass(alert.type)} p-4 rounded-lg mb-4">
            <div class="flex items-center mb-2">
                ${getAlertIcon(alert.type)}
                <h4 class="font-medium ml-2">${alert.title}</h4>
            </div>
            <p class="text-sm mb-3">${alert.message}</p>
            ${alert.details && alert.details.length > 0 ? `
                <ul class="text-sm mb-3 ml-4 list-disc">
                    ${alert.details.map(detail => `<li>${detail}</li>`).join('')}
                </ul>
            ` : ''}
            ${alert.actions && alert.actions.length > 0 ? `
                <div class="mt-3 pt-3 border-t border-gray-200">
                    <p class="text-sm font-medium mb-2">Actions recommandées :</p>
                    <ul class="text-sm ml-4 list-circle">
                        ${alert.actions.map(action => `<li>${action}</li>`).join('')}
                    </ul>
                </div>
            ` : ''}
        </div>
    `).join('');
}

// Fonction utilitaire pour les classes CSS des alertes
function getAlertClass(type) {
    switch (type) {
        case 'danger':
            return 'bg-red-50 text-red-700 border-l-4 border-red-500';
        case 'warning':
            return 'bg-yellow-50 text-yellow-700 border-l-4 border-yellow-500';
        case 'info':
            return 'bg-blue-50 text-blue-700 border-l-4 border-blue-500';
        case 'success':
            return 'bg-green-50 text-green-700 border-l-4 border-green-500';
        default:
            return 'bg-gray-50 text-gray-700 border-l-4 border-gray-500';
    }
}

// Fonction utilitaire pour les icônes des alertes
function getAlertIcon(type) {
    const baseClass = 'w-5 h-5';
    switch (type) {
        case 'danger':
            return `<svg class="${baseClass}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>`;
        case 'warning':
            return `<svg class="${baseClass}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
            </svg>`;
        case 'info':
            return `<svg class="${baseClass}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>`;
        case 'success':
            return `<svg class="${baseClass}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>`;
        default:
            return `<svg class="${baseClass}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>`;
    }
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