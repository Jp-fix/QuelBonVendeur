import { APP_DATA as fullData } from "/src/data/data.js";
import { APP_DATA as sampleData } from "/src/data/sampleData.js";

// Permet de transformer les nombres en pourcentages
function numberAsPercentage(num){
    return new Intl.NumberFormat("default", {
        style: "percent",
        minimumFractionDigits : 0,
        maximumFractionDigits : 2,
    }).format(num / 100)
}

document.getElementById("overviewCatalogue").textContent = fullData.metadata.stats.totalProduits
document.getElementById("overViewProductStock").textContent = fullData.metadata.stats.produitEnStock
function renderactiveProductKPI(){
    //• Décompte des ProductIDs où : - Stock > 0  - Prix > 0€ - Statut = Actif
    const activeProducts = fullData.products.filter(product =>
        product.Quantity > 0 &&
        product.Prix > 0 &&
        product.Status === "validated"
    ).length
    document.getElementById("overViewActiveProducts").textContent = activeProducts
}
renderactiveProductKPI()
function countUniqueModelId(){
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
     document.getElementById("overviewModelId").textContent = Object.keys(modelsCount).length
}
countUniqueModelId()

function countUniqueProductId(){
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
    document.getElementById("overviewProductId").textContent = Object.keys(productCount).length
} 
countUniqueProductId()

function populateTable(){
    const dataSource = sampleData.products
    const tableBody = document.getElementById("productsTableBody")
    tableBody.innerHTML = ""

    dataSource.forEach((product) => {
        const productId = `${product.Marque} ${product.Modele} ${product.Capacite} ${product.Couleur}`
        const tableRow = `
                    <tr>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${productId}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-gray-900">${product.Grade}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${"a faire"}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${product.Prix} €
                </td>
            </tr>`
        tableBody.innerHTML += tableRow;
    })
}
populateTable()

function matchedSkuKPI(){
    // Nombre de SKU matché sur notre catalogue
}
/**
 *  * END | TABLEAU DE BORD - Vue d'ensemble des indicateurs clés
 */

function partnairTrendKPI(){
    // Évolution du nombre de SKU matché par nos partenaires
}

function waitingModelIdKPI(){
    // Model ID en attente d'un match
}

function missingSkuKPI(){
    // SKU manquants
}

function noStockSkuKPI(){
    // SKU matché mais pas de stock
}


function aez(){
    
}






/* CODE GÉNÉRÉ PAR IA */
