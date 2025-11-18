// routes/productRoutes.js
const Routes = require('express').Router();
const productController = require('../controller/productController');
const { upload, handleMulterError } = require('../config/multer');
const debugMulter = require('../middlewares/debugMiddlware');


// Rota para adicionar produto COM upload de imagens
Routes.post('/addProduct', 
    
    (req,res,next) => {
        console.log('=== DEBUG ROUTE ===');
        next();
    },

    upload.fields([
        { name: 'imagem_principal', maxCount: 1 },
        { name: 'imagens_adicionais', maxCount: 5 }
    ]),

    (req,res,next) => {
        console.log('=== DEBUG ROUTE antes MULTER ===',req.files, req.body);
        next();
    },
   

    productController.addProduct
   
);
Routes.get('/getAllProducts', productController.getAllProducts);





module.exports = Routes;