// services/productService.js
const { Product } = require('../model/product');

class ProductService {
    async createProduct(productData) {
        // Remove campos desnecessários que podem vir do frontend
        const { id, data_criacao, data_atualizacao, ...cleanData } = productData;
        
        return await Product.create(cleanData);
    }

    async getProductById(productId) {
        return await Product.findByPk(productId);
    }

    async getProductsByUser(userId) {
        return await Product.findAll({
            where: { user_id: userId },
            order: [['data_criacao', 'DESC']]
        });
    }
}

module.exports = new ProductService();