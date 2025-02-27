import { APP_DATA as fullData } from "../../data/data.js"


// Selection du vendeur via le dropDown menu
window.currentVendor = ""
const menuSelection = document.getElementById("vendorSelect")

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
}
availableStockPercentage()
}

function isBuyBoxCompetitive(productPrice, buyBoxPrice){
    if (!productPrice || !buyBoxPrice || buyBoxPrice <= 0 ){
        return false
    }
    const priceDifference = ((productPrice - buyBoxPrice)/buyBoxPrice) * 100
    return priceDifference <= 5
}
function getBestPriceProductCount(){
    const vendorProductsInStock = fullData.products.filter(product => 
        product["Nom vendeur"] === window.currentVendor &&
        product.Quantity > 0
    )
    let bestPriceProduct = 0
    let competitivePrice  = 0
    let noCompetitivePrice = 0
    let productWithoutBuyBox = []
    document.getElementById("renderProductWithoutBuyBox").innerHTML = ""

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
    )
        const hasBestPrice = similarProduct.length === 0 ||
                            similarProduct.every(product => product.Prix >= vendorProduct.Prix)
        if (hasBestPrice){
            bestPriceProduct++
        } else {
            productWithoutBuyBox.push(vendorProduct)

        let renderBestPrice = "N/C"
        if (similarProduct.length > 0){
            renderBestPrice = Math.min(...similarProduct.map(product => product.Prix))
        }

        const isCompetitive = isBuyBoxCompetitive(vendorProduct.Prix,renderBestPrice)
        if (isCompetitive){
            competitivePrice++
        } else {
            noCompetitivePrice++
        }
            document.getElementById("renderProductWithoutBuyBox").innerHTML +=`
    <tr class="${isCompetitive ? 'bg-blue-100' : noCompetitivePrice ? 'bg-red-100' : ""}">
        <td class="text-left">${vendorProduct.Modele} ${vendorProduct.Capacite}GO ${vendorProduct.Couleur}</td>
        <td class="text-right">${vendorProduct.Grade}</td>
        <td class="text-right">${vendorProduct.Quantity}</td>
        <td class="text-right">${vendorProduct.Prix}€</td>
        <td class="text-right">${renderBestPrice}€</td>
    </tr>`
        }
        
        console.log("Produit sans meilleur prix:", vendorProduct.Modele,vendorProduct.Capacite,vendorProduct.Couleur,vendorProduct.Grade, "Prix:", vendorProduct.Prix + "€")
    })
    document.getElementById('buyboxRate').textContent = `${((bestPriceProduct / vendorProductsInStock.length)*100).toFixed(2)}%`
    document.getElementById('buyboxCount').textContent = bestPriceProduct
    document.getElementById('renderBuyboxCount').textContent = bestPriceProduct
    document.getElementById('buyboxBar').style.width = `${(bestPriceProduct / vendorProductsInStock.length).toFixed(2)*100}%`
    document.getElementById('competitivePrice').textContent = competitivePrice
    document.getElementById('noCompetitivePrice').textContent = noCompetitivePrice
}