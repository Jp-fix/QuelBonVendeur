import { APP_DATA as fullData } from "../../data/data.js";
import { APP_DATA as sampleData } from "../../data/sampleData.js";

document.getElementById("overviewProductStock").textContent = fullData.metadata.stats.totalProduits
document.getElementById("overViewProductStock").textContent = "Data ?"

function renderactiveProductKPI(){
    const activeProducts = fullData.products.filter(product =>
        product.Quantity > 0 &&
        product.Prix > 0 &&
        product.Status === "validated"
    ).length
    document.getElementById("overViewActiveProducts").textContent = activeProducts
}
renderactiveProductKPI()
function countUniqueProductId(){
    const modelsCount = {}
    const dataSource = fullData.products

    dataSource.forEach((product) => {
        const model = product.Modele

        if(modelsCount[model]){
            modelsCount[model] += 1
        } else {
            modelsCount[model] = 1
        }
    })
     document.getElementById("overviewProductId").textContent = Object.keys(modelsCount).length
}
countUniqueModelId()
function countUniqueModelId(){
    const productCount = {}
    const dataSource = fullData.products
    dataSource.forEach((product) => {
        const productId = `${product.Marque} ${product.Modele} ${product.Capacite} ${product.Couleur}`
        if (productCount[productId]){
            productCount[productId] += 1
        } else {
            productCount[productId] = 1
        }
    })
    document.getElementById("overviewModelId").textContent = Object.keys(productCount).length
} 
countUniqueProductId()
function countUniqueGradeModelId(){
    const modelCount = {}
    const dataSource = fullData.products
    dataSource.forEach((model) => {
        const gradeModelId = `${model.Marque} ${model.Modele} ${model.Capacite} ${model.Couleur} ${model.Grade}`
        if(modelCount[gradeModelId]){
            modelCount[gradeModelId] += 1
        } else {
            modelCount[gradeModelId] = 1
        }
    })
    document.getElementById("overviewGradeModelId").textContent = Object.keys(modelCount).length
}
countUniqueGradeModelId()
function activeSku (){
    const countSku = fullData.products.filter(sku => 
        sku.sku = !null &&
        sku.Quantity > 0
    ).length
    document.getElementById("activeSku").textContent = countSku
}
activeSku()

function noStockSku (){
    const countnoStockSku = fullData.products.filter(sku => 
        sku.sku = !null &&
        sku.Quantity === 0
    ).length
    document.getElementById("noStockSku").textContent = countnoStockSku
}
noStockSku()

// Variables pour la pagination
let currentPage = 1;
const rowsPerPage = 10;

// Variables pour le tri
let currentSortColumn = null;
let currentSortDirection = 'asc';

function populateTable(page = 1) {
    let dataSource = fullData.products.filter(product => product.Quantity > 0);
    const tableBody = document.getElementById("productsTableBody");
    tableBody.innerHTML = "";

    // Calcul des moyennes de prix
    const averagePriceByModeliD = {}
    dataSource.forEach(product => {
        const modelId = `${product.Marque} ${product.Modele} ${product.Capacite} ${product.Couleur}`
        if (!averagePriceByModeliD[modelId]){
            averagePriceByModeliD[modelId] = {
                totalPrice: 0,
                count : 0
            }
        }
        averagePriceByModeliD[modelId].totalPrice += product.Prix
        averagePriceByModeliD[modelId].count += 1
    });

    // Préparation des données pour le tri
    dataSource = dataSource.map(product => {
        const modelId = `${product.Marque} ${product.Modele} ${product.Capacite} ${product.Couleur}`;
        const averagePrice = (averagePriceByModeliD[modelId].totalPrice/averagePriceByModeliD[modelId].count).toFixed(0);
        return {
            ...product,
            modelId,
            gradeModelId: product.Grade,
            quantityModelId: product.Quantity,
            averagePriceModelId: Number(averagePrice),
            margeQBP: Number((averagePrice * 0.09).toFixed(2))
        };
    });

    // Appliquer le tri si une colonne est sélectionnée
    if (currentSortColumn) {
        dataSource.sort((a, b) => {
            let comparison = 0;
            const aValue = a[currentSortColumn];
            const bValue = b[currentSortColumn];
            
            if (typeof aValue === 'string') {
                comparison = aValue.localeCompare(bValue);
            } else {
                comparison = aValue - bValue;
            }
            
            return currentSortDirection === 'asc' ? comparison : -comparison;
        });
    }

    // Slice pour la pagination
    const startIndex = (page - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const paginatedData = dataSource.slice(startIndex, endIndex);

    // Mise à jour du tableau
    paginatedData.forEach((product) => {
        const tableRow = `
            <tr>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${product.modelId}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-gray-900">${product.gradeModelId}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${product.quantityModelId}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${product.averagePriceModelId} €
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${product.margeQBP} €
                </td>
            </tr>`;
        tableBody.innerHTML += tableRow;
    });

    createPaginationControls(dataSource.length);
}
/* CODE GÉNÉRÉ PAR IA 👇 - GESTION TRI & PAGINATION TABLEAU */
function createPaginationControls(totalItems) {
    // Supprimer les contrôles de pagination existants s'il y en a
    const existingPagination = document.querySelector('.pagination-controls');
    if (existingPagination) {
        existingPagination.remove();
    }

    const totalPages = Math.ceil(totalItems / rowsPerPage);
    const paginationContainer = document.createElement('div');
    paginationContainer.className = 'pagination-controls flex justify-center items-center mt-4 space-x-2';
    
    // Bouton précédent
    const prevButton = document.createElement('button');
    prevButton.textContent = 'Précédent';
    prevButton.className = 'px-4 py-2 border rounded-md hover:bg-gray-100';
    prevButton.disabled = currentPage === 1;
    prevButton.onclick = () => {
        if (currentPage > 1) {
            currentPage--;
            populateTable(currentPage);
        }
    };

    // Bouton suivant
    const nextButton = document.createElement('button');
    nextButton.textContent = 'Suivant';
    nextButton.className = 'px-4 py-2 border rounded-md hover:bg-gray-100';
    nextButton.disabled = currentPage === totalPages;
    nextButton.onclick = () => {
        if (currentPage < totalPages) {
            currentPage++;
            populateTable(currentPage);
        }
    };

    // Indicateur de page actuelle
    const pageInfo = document.createElement('span');
    pageInfo.textContent = `Page ${currentPage} sur ${totalPages}`;
    pageInfo.className = 'text-sm text-gray-600';

    paginationContainer.appendChild(prevButton);
    paginationContainer.appendChild(pageInfo);
    paginationContainer.appendChild(nextButton);

    // Ajouter les contrôles après le tableau
    const table = document.getElementById('productsTableBody').closest('table');
    table.parentNode.insertBefore(paginationContainer, table.nextSibling);
}
function handleSort(column) {
    if (currentSortColumn === column) {
        // Si on clique sur la même colonne, on inverse la direction
        currentSortDirection = currentSortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        // Nouvelle colonne, on réinitialise la direction
        currentSortColumn = column;
        currentSortDirection = 'asc';
    }
    
    // Mettre à jour les indicateurs visuels de tri
    updateSortIndicators();
    
    // Recharger le tableau avec le nouveau tri
    populateTable(currentPage);
}
function updateSortIndicators() {
    // Supprimer tous les indicateurs existants
    document.querySelectorAll('.sort-indicator').forEach(el => el.textContent = '');
    
    // Ajouter l'indicateur à la colonne active
    if (currentSortColumn) {
        const header = document.querySelector(`[data-sort="${currentSortColumn}"]`);
        if (header) {
            const indicator = header.querySelector('.sort-indicator');
            indicator.textContent = currentSortDirection === 'asc' ? ' ↑' : ' ↓';
        }
    }
}
// Initialisation des en-têtes de colonnes triables
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('th[data-sort]').forEach(header => {
        header.style.cursor = 'pointer';
        // Ajouter un span pour l'indicateur de tri
        const indicator = document.createElement('span');
        indicator.className = 'sort-indicator';
        header.appendChild(indicator);
        
        header.addEventListener('click', () => {
            handleSort(header.dataset.sort);
        });
    });

    // Appel initial
    populateTable(currentPage);
});
/* CODE GÉNÉRÉ PAR IA 👆 - GESTION TRI & PAGINATION TABLEAU */