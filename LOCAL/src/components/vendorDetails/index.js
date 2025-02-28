import { APP_DATA as fullData } from "../../data/data.js"



// Selection du vendeur via le dropDown menu
window.currentVendor = ""
const menuSelection = document.getElementById("vendorSelect")
window.percentage = 0

function vendorSelection() {
    const vendorsArr = fullData.metadata.vendors
    for (let i = 0; i < vendorsArr.length; i++) {
        let vendors = vendorsArr[i]
        let el = document.createElement("option")
        el.textContent = vendors
        el.value = vendors
        menuSelection.appendChild(el)
    }
    menuSelection.addEventListener("change", getSelectedVendor)
}
vendorSelection();

function getSelectedVendor() {
    window.currentVendor = menuSelection.value
    catalogueVendeurKPI()
    valeurCatalogueVendeurKPI()
    getBestPriceProductCount()
    const getDateOfNow = new Date()
    document.getElementById("lastUpdate").textContent = getDateOfNow.toLocaleString()
    initSortableTable()
}


// Ajout des KPI dans la section en haut de page - Catalogue Vendeur
function catalogueVendeurKPI(){
    if(!window.currentVendor || window.currentVendor === "default" ){
        console.log("Aucun vendeur selectionné")
    return
}
const dataSource = fullData.products
const vendorProduct = dataSource.filter((product) => product["Nom vendeur"] === window.currentVendor).length
document.getElementById("totalProducts").textContent = vendorProduct
}
/* console.log(fullData.forEach((products) => {
    console.log(products)
})) */

// Ajout des KPI dans la section en haut de page - Valeur du catalogue
function valeurCatalogueVendeurKPI(){
    if(!window.currentVendor || window.currentVendor === "default" ){
        console.log("Aucun vendeur selectionné")
    return
}
const vendorProductsInStock = fullData.products.filter(product => 
    product["Nom vendeur"] === window.currentVendor && 
    product.Quantity > 0
);

const totalStockValue = vendorProductsInStock.reduce((sum, item) => sum + ((item.Prix) *item.Quantity), 0)
//mise en forme
const roundedValue = Math.round(totalStockValue);
const formattedValue = roundedValue.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " €";
document.getElementById('stockValue').textContent = formattedValue;

function availableStockPercentage(){
    const dataSource = fullData.products
    const vendorProduct = dataSource.filter((product) => product["Nom vendeur"] === window.currentVendor).length
    const percentage = `${((vendorProductsInStock.length / vendorProduct)*100).toFixed(2)}%`
    document.getElementById('stockRate').textContent = percentage
    document.getElementById('inStock').textContent = vendorProductsInStock.length
    window.percentage = percentage
}
availableStockPercentage()
}

function isBuyBoxCompetitive(productPrice, buyBoxPrice){
    if (!productPrice || !buyBoxPrice || buyBoxPrice <= 0 ){
        return false
    }
    const priceDifference = ((productPrice - buyBoxPrice)/buyBoxPrice) * 100
    return priceDifference < 5
}
// Variables de pagination
let currentPage = 1;
const itemsPerPage = 10; // Nombre d'éléments par page
let productsWithoutBuyBox = []; // Variable globale pour stocker les produits sans BuyBox

function getBestPriceProductCount() {
    const vendorProductsInStock = fullData.products.filter(product => 
        product["Nom vendeur"] === window.currentVendor &&
        product.Quantity > 0
    );
    
    let bestPriceProduct = 0;
    let competitivePrice = 0;
    let noCompetitivePrice = 0;
    productsWithoutBuyBox = []; // Réinitialisation de la liste
    
    document.getElementById("renderProductWithoutBuyBox").innerHTML = "";

    vendorProductsInStock.forEach(vendorProduct => {
        const similarProduct = fullData.products.filter(product =>
            product.Marque === vendorProduct.Marque &&
            product.Modele === vendorProduct.Modele &&
            product.Couleur === vendorProduct.Couleur &&
            product.Capacite === vendorProduct.Capacite &&
            product.Grade === vendorProduct.Grade &&
            product.Quantity > 0 &&
            product.Prix > 0 &&
            product["Nom vendeur"] !== window.currentVendor
        );
        
        // Performances du stock (Position sur le marché & BuyBox Optimisation)
        const hasBestPrice = similarProduct.length === 0 ||
                            similarProduct.every(product => product.Prix >= vendorProduct.Prix);
        
        if (hasBestPrice) {
            bestPriceProduct++;
        } else {
            let renderBestPrice = "N/C";
            if (similarProduct.length > 0) {
                renderBestPrice = Math.min(...similarProduct.map(product => product.Prix));
            }
            
            const isCompetitive = isBuyBoxCompetitive(vendorProduct.Prix, renderBestPrice);
            
            // Ajouter le produit à la liste des produits sans BuyBox avec toutes les infos nécessaires
            productsWithoutBuyBox.push({
                modele: vendorProduct.Modele,
                capacite: vendorProduct.Capacite,
                couleur: vendorProduct.Couleur,
                grade: vendorProduct.Grade,
                quantity: vendorProduct.Quantity,
                prix: vendorProduct.Prix,
                bestPrice: renderBestPrice,
                isCompetitive: isCompetitive
            });

            let lowerPriceRecommandation = (vendorProduct.Prix - renderBestPrice).toFixed(2)
            let lowerPricePercentage = ((lowerPriceRecommandation / vendorProduct.Prix)*100).toFixed(2)

            if (isCompetitive) {
                competitivePrice++;
                document.getElementById("buybox-opportunities").innerHTML += `
                <div class="bg-white p-2 rounded border border-blue-100 text-sm">
                <div class="font-medium">${vendorProduct.Modele}</div>
                <div class="flex justify-between text-xs">
                <span>Votre prix: ${vendorProduct.Prix}€</span>
                <span>BuyBox: ${renderBestPrice}€</span>
                </div>
                <div class="mt-1 text-xs text-blue-600">Baisse recommandée: ${lowerPriceRecommandation}€ (-${lowerPricePercentage}%)</div>
                </div>
                `
            } else {
                noCompetitivePrice++;
                document.getElementById("non-competitive-prices").innerHTML += `
                <div class="bg-white p-2 rounded border border-blue-100 text-sm">
                <div class="font-medium">${vendorProduct.Modele}</div>
                <div class="flex justify-between text-xs">
                <span>Votre prix: ${vendorProduct.Prix}€</span>
                <span>BuyBox: ${renderBestPrice}€</span>
                </div>
                <div class="mt-1 text-xs text-blue-600">Baisse recommandée: ${lowerPriceRecommandation}€ (-${lowerPricePercentage}%)</div>
                </div>
                `
            }
        }
        document.getElementById("opportunityCount").textContent = competitivePrice
        document.getElementById("noCompetitiveProductCount").textContent = noCompetitivePrice
        



        // Mise à jour des indicateurs de performance (inchangé)
        updatePerformanceIndicators(bestPriceProduct, competitivePrice, noCompetitivePrice, vendorProductsInStock);
    });
    
    // Mettre à jour les KPIs du haut de page (inchangé)
    updateKPIs(bestPriceProduct, vendorProductsInStock, competitivePrice, noCompetitivePrice);
    
    // Afficher les produits paginés
    displayPaginatedProducts();
}

// Fonction pour mettre à jour les indicateurs de performance
function updatePerformanceIndicators(bestPriceProduct, competitivePrice, noCompetitivePrice, vendorProductsInStock) {
    if (bestPriceProduct > (competitivePrice + noCompetitivePrice)) {
        document.getElementById('marketPosition').innerHTML = "Compétitif";   
        document.getElementById('marketPosition').classList = "price-value min";   
    } else if ((bestPriceProduct + competitivePrice) < noCompetitivePrice) {
        document.getElementById('marketPosition').innerHTML = "Dans la moyenne";   
        document.getElementById('marketPosition').classList = "price-value median"; 
    } else {
        document.getElementById('marketPosition').innerHTML = "En dessous de la moyenne";   
        document.getElementById('marketPosition').classList = "price-value max"; 
    }

    if (((bestPriceProduct / vendorProductsInStock.length) * 100) > 80) {
        document.getElementById('buyBoxPosition').innerHTML = "Compétitif";   
        document.getElementById('buyBoxPosition').classList = "price-value min";   
    } else if (((bestPriceProduct / vendorProductsInStock.length) * 100) > 60) {
        document.getElementById('buyBoxPosition').innerHTML = "Dans la moyenne";   
        document.getElementById('buyBoxPosition').classList = "price-value median"; 
    } else {
        document.getElementById('buyBoxPosition').innerHTML = "En dessous de la moyenne";   
        document.getElementById('buyBoxPosition').classList = "price-value max"; 
    }

    if (window.percentage >= 80) {
        document.getElementById('stockAvailable').innerHTML = "Compétitif";   
        document.getElementById('stockAvailable').classList = "price-value min";   
    } else if (window.percentage < 80 && window.percentage > 40) {
        document.getElementById('stockAvailable').innerHTML = "Dans la moyenne";   
        document.getElementById('stockAvailable').classList = "price-value median"; 
    } else {
        document.getElementById('stockAvailable').innerHTML = "En dessous de la moyenne";   
        document.getElementById('stockAvailable').classList = "price-value max"; 
    }
}

// Fonction pour mettre à jour les KPIs
function updateKPIs(bestPriceProduct, vendorProductsInStock, competitivePrice, noCompetitivePrice) {
    document.getElementById('buyboxRate').textContent = `${((bestPriceProduct / vendorProductsInStock.length) * 100).toFixed(2)}%`;
    document.getElementById('buyboxCount').textContent = `${bestPriceProduct}`;
    document.getElementById('renderBuyboxCount').textContent = bestPriceProduct;
    document.getElementById('buyboxBar').style.width = `${(bestPriceProduct / vendorProductsInStock.length).toFixed(2) * 100}%`;
    document.getElementById('competitivePrice').textContent = competitivePrice;
    document.getElementById('noCompetitivePrice').textContent = noCompetitivePrice;
}

// Fonction pour afficher les produits paginés
function displayPaginatedProducts() {
    const tableBody = document.getElementById("renderProductWithoutBuyBox");
    tableBody.innerHTML = "";
    
    // Calculer les indices de début et de fin pour la pagination
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, productsWithoutBuyBox.length);
    
    // Récupérer seulement les produits pour la page actuelle
    const productsForCurrentPage = productsWithoutBuyBox.slice(startIndex, endIndex);
    
    // Vérifier si nous avons des produits à afficher
    if (productsForCurrentPage.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center py-4 text-gray-500">
                    Aucun produit sans BuyBox trouvé
                </td>
            </tr>
        `;
        // Masquer les contrôles de pagination
        document.getElementById('paginationControls').style.display = 'none';
        return;
    }
    
    // Afficher les produits pour la page actuelle
    productsForCurrentPage.forEach(product => {
        let gapPrice = (((product.prix - product.bestPrice) / product.bestPrice) * 100).toFixed(2)
        tableBody.innerHTML += `
            <tr class="hover:bg-gray-50 transition-colors">
                                    <td class="px-4 py-3">
                                        <div class="text-sm font-medium text-gray-900">${product.modele}</div>
                                    </td>
                                    <td class="px-4 py-3">
                                        <span class="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded">${product.capacite}Go</span>
                                    </td>
                                    <td class="px-4 py-3">
                                        <span class="px-2 py-0.5 bg-gray-100 text-gray-800 text-xs rounded">${product.couleur}</span>
                                    </td>
                                    <td class="px-4 py-3 text-center">
                                        <span class="px-2 py-0.5 bg-purple-100 text-purple-800 text-xs rounded">${product.grade}</span>
                                    </td>
                                    <td class="px-4 py-3 text-center">
                                        <span class="px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full">${product.quantity}</span>
                                    </td>
                                    <td class="px-4 py-3 text-center text-sm text-gray-900">${product.prix}€</td>
                                    <td class="px-4 py-3 text-center text-sm text-green-600 font-medium">${product.bestPrice}€</td>
                                    <td class="px-4 py-3 text-center">
                                        <span class="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">${gapPrice}%</span>
                                    </td>
                                </tr>
        `
        console.log(`${product.prix}`)
        console.log(`${product.bestPrice}`)
        ;
    });


    
    // Mettre à jour le compteur de pagination
    updatePaginationCounter();
    
    // Afficher les contrôles de pagination si nécessaire
    const paginationControls = document.getElementById('paginationControls');
    paginationControls.style.display = productsWithoutBuyBox.length > itemsPerPage ? 'flex' : 'none';
    
    // Mettre à jour l'état des boutons de pagination
    document.getElementById('prevPage').disabled = currentPage === 1;
    document.getElementById('nextPage').disabled = currentPage >= Math.ceil(productsWithoutBuyBox.length / itemsPerPage);
}

// Fonction pour mettre à jour le compteur de pagination
function updatePaginationCounter() {
    const totalPages = Math.ceil(productsWithoutBuyBox.length / itemsPerPage);
    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, productsWithoutBuyBox.length);
    
    document.getElementById('paginationCounter').textContent = 
        `${startItem}-${endItem} sur ${productsWithoutBuyBox.length}`;
}

// Fonctions pour la navigation de pagination
function goToPreviousPage() {
    if (currentPage > 1) {
        currentPage--;
        displayPaginatedProducts();
    }
}

function goToNextPage() {
    const totalPages = Math.ceil(productsWithoutBuyBox.length / itemsPerPage);
    if (currentPage < totalPages) {
        currentPage++;
        displayPaginatedProducts();
    }
}

// État du tri
let tableSortState = {
    column: null,
    direction: 'asc'
};

// Fonction pour trier les produits sans BuyBox
function sortProductsWithoutBuyBox(column) {
    // Si on clique sur la même colonne, on inverse la direction du tri
    if (tableSortState.column === column) {
        tableSortState.direction = tableSortState.direction === 'asc' ? 'desc' : 'asc';
    } else {
        tableSortState.column = column;
        tableSortState.direction = 'asc';
    }

    // Tri des produits
    productsWithoutBuyBox.sort((a, b) => {
        let valueA, valueB;
        
        // Cas spécial pour la colonne "écart"
        if (column === 'ecart') {
            // Calcul de l'écart en pourcentage
            valueA = a.prix && a.bestPrice ? ((a.prix - a.bestPrice) / a.bestPrice) * 100 : 0;
            valueB = b.prix && b.bestPrice ? ((b.prix - b.bestPrice) / b.bestPrice) * 100 : 0;
        } else {
            valueA = a[column];
            valueB = b[column];
            
            // Gestion spéciale pour certaines colonnes numériques
            if (column === 'capacite' || column === 'prix' || column === 'bestPrice' || column === 'quantity') {
                valueA = parseFloat(valueA) || 0;
                valueB = parseFloat(valueB) || 0;
            } else {
                valueA = valueA ? valueA.toString().toLowerCase() : '';
                valueB = valueB ? valueB.toString().toLowerCase() : '';
            }
        }
        
        // Comparaison en fonction de la direction
        if (tableSortState.direction === 'asc') {
            return valueA > valueB ? 1 : -1;
        } else {
            return valueA < valueB ? 1 : -1;
        }
    });

    // Mettre à jour l'affichage
    currentPage = 1; // Retour à la première page après le tri
    displayPaginatedProducts();
    updateSortIndicators();
}

// Mettre à jour les indicateurs visuels de tri
function updateSortIndicators() {
    // Réinitialiser tous les en-têtes
    document.querySelectorAll('th[data-sort]').forEach(header => {
        header.classList.remove('sort-asc', 'sort-desc');
        const icon = header.querySelector('.sort-icon');
        if (icon) icon.textContent = '↕';
    });

    // Mettre à jour l'en-tête actif
    if (tableSortState.column) {
        const activeHeader = document.querySelector(`th[data-sort="${tableSortState.column}"]`);
        if (activeHeader) {
            activeHeader.classList.add(`sort-${tableSortState.direction}`);
            const icon = activeHeader.querySelector('.sort-icon');
            if (icon) icon.textContent = tableSortState.direction === 'asc' ? '↑' : '↓';
        }
    }
}

// Initialiser les en-têtes de colonne pour le tri
function initSortableTable() {
    // Ajouter les attributs data-sort et les icônes de tri aux en-têtes
    const tableElement = document.querySelector('#renderProductWithoutBuyBox').closest('table');
    const headers = tableElement.querySelectorAll('thead th');
    
    const sortableColumns = [
        { index: 0, key: 'modele' },
        { index: 1, key: 'capacite' },
        { index: 2, key: 'couleur' },
        { index: 3, key: 'grade' },
        { index: 4, key: 'quantity' },
        { index: 5, key: 'prix' },
        { index: 6, key: 'bestPrice' },
        { index: 7, key: 'ecart' }  // Ajout de la colonne écart
    ];
    
    sortableColumns.forEach(({ index, key }) => {
        if (headers[index]) {
            headers[index].setAttribute('data-sort', key);
            headers[index].classList.add('cursor-pointer');
            
            // Ajouter l'icône de tri
            const headerText = headers[index].textContent.trim();
            headers[index].innerHTML = `
                <div class="flex items-center justify-between">
                    <span>${headerText}</span>
                    <span class="sort-icon ml-1">↕</span>
                </div>
            `;
            
            // Ajouter l'écouteur d'événement
            headers[index].addEventListener('click', () => sortProductsWithoutBuyBox(key));
        }
    });
}
// Initialiser les écouteurs d'événements pour la pagination après le chargement du DOM
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('prevPage').addEventListener('click', goToPreviousPage);
    document.getElementById('nextPage').addEventListener('click', goToNextPage);
});