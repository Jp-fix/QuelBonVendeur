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

document.getElementById("overviewProductStock").textContent = fullData.metadata.stats.totalProduits
document.getElementById("overViewProductStock").textContent = "Data ?"
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










function populateTable(){
    const dataSource = sampleData.products
    const tableBody = document.getElementById("productsTableBody")
    tableBody.innerHTML = ""

    const averagePriceByModeliD = {}
    dataSource.forEach(product => {
        const modelId = `
            ${product.Marque} 
            ${product.Modele} 
            ${product.Capacite} 
            ${product.Couleur} `
        if (!averagePriceByModeliD[modelId]){
            averagePriceByModeliD[modelId] = {
                totalPrice: 0,
                count : 0
            }
        }
        averagePriceByModeliD[modelId].totalPrice += product.Prix
        averagePriceByModeliD[modelId].count += 1
    })

    dataSource.forEach((product) => {
        const modelId = `
            ${product.Marque} 
            ${product.Modele} 
            ${product.Capacite} 
            ${product.Couleur} `
        const gradeModelId = `${product.Grade}`
        const quantityModelId = `${product.Quantity}`
        const averagePriceModelId = (averagePriceByModeliD[modelId].totalPrice/averagePriceByModeliD[modelId].count).toFixed(0)
        const margeQBP = (averagePriceModelId * 0.09)
        const tableRow = `
                    <tr>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${modelId}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-gray-900">${gradeModelId}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${quantityModelId}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${averagePriceModelId} €
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${margeQBP} €
                </td>
            </tr>`
        tableBody.innerHTML += tableRow;
    })
}
populateTable()