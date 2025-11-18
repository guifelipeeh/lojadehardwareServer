// services/productService.js
const product = require('../model/product');

class ProductService {
    async createProduct(productData) {
        // Remove campos desnecessários que podem vir do frontend
        const { id, data_criacao, data_atualizacao, ...cleanData } = productData;
        
        return await product.create(cleanData);
    }
    async getAllProducts() {
        return await product.findAll();
    }

}

module.exports = new ProductService();