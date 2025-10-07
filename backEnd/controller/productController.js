
const productService = require('../service/productService');



async function addProduct(req,res){

    try {
        const result = await productService.addProduct(req.body);
        res.status(200).json(result);
    }
     catch (error) {

        console.error('Erro ao adicionar produto:', error);
        res.status(400).json({ error: 'Erro ao adicionar produto' });
    }

}
module.exports = {
    addProduct
}
