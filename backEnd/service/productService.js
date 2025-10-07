const Product = require('../model/product');


async function addProduct(productData){

    try {
        console.log(productData + " chegou na service");

        const product = await Product.create(productData);
        return product;
    } catch (error) {
        throw error;
    }
}

module.exports = {
    addProduct
}