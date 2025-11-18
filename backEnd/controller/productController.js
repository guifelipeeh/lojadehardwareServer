
// controller/productController.js
const productService = require('../service/productService');
const uploadService = require('../service/uploadService');


    
async function addProduct(req, res) {

    console.log('=== DEBUG controller ===');
    console.log('Headers:', req.headers);
    console.log('Files:', req.files);
    console.log('Body:', req.body);
    console.log('=== FIM DEBUG ===');

    try {
        const productData = req.body;
        const product = await productService.createProduct(productData);
        product.id = 15;
        await uploadService.handleProductImageUpload(product.id, req.files);
        res.status(201).json(product);
    } catch (error) {
        console.error('Erro ao adicionar produto:', error);
        res.status(500).json({ error: 'Erro ao adicionar produto' });
    }
}
async function getAllProducts(req, res) {
    try{
        const products = await productService.getAllProducts();
        res.status(200).json(products);
    } catch (error) {
        console.error('Erro ao buscar produtos:', error);
        res.status(500).json({ error: 'Erro ao buscar produtos' });
    }
}


module.exports = { addProduct, getAllProducts };