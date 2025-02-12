// Données
const PRICE_TRENDS_DATA = {
    metadata: {
        lastUpdate: "2024-03-11T09:54:54.056Z",
        vendors: ["2GiC", "ATOUTEK", "AVEGOTT", "DRJL"],
        grades: ["MINT", "VERY_GOOD", "GOOD", "FAIR"],
        models: [
            "iPhone 13 Pro", "iPhone 12", "Galaxy S23 Ultra",
            "P30 lite", "iPhone SE 2020", "Galaxy A32 5G"
        ]
    },

    products: [
        {
            id: "IP13P-256-MINT",
            brand: "Apple",
            model: "iPhone 13 Pro",
            capacity: 256,
            grade: "MINT",
            currentPrice: 899,
            history: [
                { date: "2024-02-11", price: 949, volume: 12 },
                { date: "2024-02-18", price: 929, volume: 15 },
                { date: "2024-02-25", price: 919, volume: 10 },
                { date: "2024-03-03", price: 909, volume: 14 },
                { date: "2024-03-10", price: 899, volume: 13 }
            ]
        },
        {
            id: "IP12-128-GOOD",
            brand: "Apple",
            model: "iPhone 12",
            capacity: 128,
            grade: "GOOD",
            currentPrice: 699,
            history: [
                { date: "2024-02-11", price: 679, volume: 8 },
                { date: "2024-02-18", price: 689, volume: 11 },
                { date: "2024-02-25", price: 699, volume: 9 },
                { date: "2024-03-03", price: 699, volume: 12 },
                { date: "2024-03-10", price: 699, volume: 10 }
            ]
        },
        {
            id: "S23U-512-VGOOD",
            brand: "Samsung",
            model: "Galaxy S23 Ultra",
            capacity: 512,
            grade: "VERY_GOOD",
            currentPrice: 1099,
            history: [
                { date: "2024-02-11", price: 1199, volume: 5 },
                { date: "2024-02-18", price: 1169, volume: 7 },
                { date: "2024-02-25", price: 1149, volume: 6 },
                { date: "2024-03-03", price: 1129, volume: 8 },
                { date: "2024-03-10", price: 1099, volume: 9 }
            ]
        }
    ],

    significantChanges: [
        {
            date: "2024-03-10",
            model: "Galaxy S23 Ultra",
            capacity: 512,
            grade: "VERY_GOOD",
            variation: -8.3,
            newPrice: 1099,
            impact: "HIGH"
        },
        {
            date: "2024-03-03",
            model: "iPhone 13 Pro",
            capacity: 256,
            grade: "MINT",
            variation: -5.3,
            newPrice: 909,
            impact: "MODERATE"
        },
        {
            date: "2024-02-18",
            model: "iPhone 12",
            capacity: 128,
            grade: "GOOD",
            variation: 2.9,
            newPrice: 689,
            impact: "LOW"
        }
    ]
};

// Fonctions utilitaires
function formatDate(dateString) {
    const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
    return new Date(dateString).toLocaleDateString('fr-FR', options);
}

// Fonctions principales
function initializeFilters() {
    const modelSelect = document.getElementById('modelFilter');
    const gradeSelect = document.getElementById('gradeFilter');

    // Vider les sélecteurs existants
    modelSelect.innerHTML = '<option value="">Tous les modèles</option>';
    gradeSelect.innerHTML = '<option value="">Tous les grades</option>';

    // Remplir les modèles
    PRICE_TRENDS_DATA.metadata.models.forEach(model => {
        const option = document.createElement('option');
        option.value = model;
        option.textContent = model;
        modelSelect.appendChild(option);
    });

    // Remplir les grades
    PRICE_TRENDS_DATA.metadata.grades.forEach(grade => {
        const option = document.createElement('option');
        option.value = grade;
        option.textContent = grade;
        gradeSelect.appendChild(option);
    });
}

function updateStats() {
    const products = PRICE_TRENDS_DATA.products;
    
    // Prix moyen actuel
    const avgPrice = products.reduce((sum, p) => sum + p.currentPrice, 0) / products.length;
    document.getElementById('avgPrice').textContent = `${avgPrice.toFixed(0)}€`;
    
    // Variation sur la période
    const variations = products.map(p => {
        const oldestPrice = p.history[0].price;
        const currentPrice = p.currentPrice;
        return ((currentPrice - oldestPrice) / oldestPrice) * 100;
    });
    const avgVariation = variations.reduce((a, b) => a + b, 0) / variations.length;
    document.getElementById('priceVariation').textContent = `${avgVariation.toFixed(1)}%`;
    
    // Prix le plus bas
    const lowestPrice = Math.min(...products.map(p => p.currentPrice));
    document.getElementById('lowestPrice').textContent = `${lowestPrice}€`;
}

function createSimpleChart() {
    const canvas = document.getElementById('priceChart');
    const ctx = canvas.getContext('2d');
    const padding = 40;
    const width = canvas.width;
    const height = canvas.height;

    // Préparation des données
    const products = PRICE_TRENDS_DATA.products;
    const allDates = products[0].history.map(h => new Date(h.date));
    const allPrices = products.reduce((acc, product) => {
        return acc.concat(product.history.map(h => h.price));
    }, []);

    // Calcul des échelles
    const minPrice = Math.min(...allPrices);
    const maxPrice = Math.max(...allPrices);
    const priceRange = maxPrice - minPrice;
    
    const minDate = new Date(Math.min(...allDates));
    const maxDate = new Date(Math.max(...allDates));
    const timeRange = maxDate - minDate;

    // Fonctions de conversion coordonnées
    function scaleX(date) {
        return padding + (new Date(date) - minDate) * (width - 2 * padding) / timeRange;
    }

    function scaleY(price) {
        return height - padding - (price - minPrice) * (height - 2 * padding) / priceRange;
    }

    // Effacer et préparer le canvas
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, width, height);

    // Dessiner les axes
    ctx.beginPath();
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 1;
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding);
    ctx.moveTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.stroke();

    // Graduations et labels prix
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    const priceStep = priceRange / 5;
    for (let i = 0; i <= 5; i++) {
        const price = minPrice + (priceStep * i);
        const y = scaleY(price);
        
        ctx.beginPath();
        ctx.moveTo(padding - 5, y);
        ctx.lineTo(padding, y);
        ctx.stroke();
        
        ctx.fillStyle = '#666';
        ctx.fillText(`${Math.round(price)}€`, padding - 10, y);
    }

    // Graduations et labels dates
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    const dateStep = timeRange / 4;
    for (let i = 0; i <= 4; i++) {
        const date = new Date(minDate.getTime() + (dateStep * i));
        const x = scaleX(date);
        
        ctx.beginPath();
        ctx.moveTo(x, height - padding);
        ctx.lineTo(x, height - padding + 5);
        ctx.stroke();
        
        ctx.fillStyle = '#666';
        ctx.fillText(date.toLocaleDateString('fr-FR'), x, height - padding + 10);
    }

    // Tracer les courbes de prix
    const colors = ['#FF6384', '#36A2EB', '#FFCE56'];
    products.forEach((product, index) => {
        ctx.beginPath();
        ctx.strokeStyle = colors[index % colors.length];
        ctx.lineWidth = 2;

        product.history.forEach((point, i) => {
            const x = scaleX(point.date);
            const y = scaleY(point.price);
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        ctx.stroke();

        // Légende
        const legendY = padding + (index * 20);
        ctx.fillStyle = colors[index % colors.length];
        ctx.fillRect(width - padding + 10, legendY, 20, 10);
        ctx.fillStyle = '#666';
        ctx.textAlign = 'left';
        ctx.fillText(`${product.model} ${product.capacity}GB`, width - padding + 35, legendY + 5);
    });
}

function updateVariationsTable() {
    const tbody = document.getElementById('variationsTable');
    tbody.innerHTML = '';
    
    const sortedChanges = [...PRICE_TRENDS_DATA.significantChanges].sort((a, b) => 
        new Date(b.date) - new Date(a.date)
    );
    
    sortedChanges.forEach(change => {
        const variationClass = change.variation < 0 ? 'text-red-600' : 'text-green-600';
        const impactClass = {
            'LOW': 'text-yellow-600',
            'MODERATE': 'text-orange-600',
            'HIGH': 'text-red-600'
        }[change.impact] || 'text-gray-600';

        const row = `
            <tr class="hover:bg-gray-50">
                <td class="px-6 py-4">${formatDate(change.date)}</td>
                <td class="px-6 py-4">
                    ${change.model} ${change.capacity}
                    <span class="text-gray-500 text-sm">(${change.grade})</span>
                </td>
                <td class="px-6 py-4 ${variationClass} font-medium">
                    ${change.variation > 0 ? '+' : ''}${change.variation}%
                </td>
                <td class="px-6 py-4">${change.newPrice}€</td>
                <td class="px-6 py-4">
                    <span class="px-2 py-1 rounded-full text-sm font-medium ${impactClass} bg-opacity-10">
                        ${change.impact}
                    </span>
                </td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}

function filterData() {
    const modelFilter = document.getElementById('modelFilter').value;
    const gradeFilter = document.getElementById('gradeFilter').value;
    const periodFilter = parseInt(document.getElementById('periodFilter').value);

    updateStats();
    createSimpleChart();
    updateVariationsTable();
}

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    initializeFilters();
    updateStats();
    createSimpleChart();
    updateVariationsTable();
    
    // Écouteurs d'événements pour les filtres
    ['modelFilter', 'gradeFilter', 'periodFilter'].forEach(filterId => {
        document.getElementById(filterId).addEventListener('change', filterData);
    });
});