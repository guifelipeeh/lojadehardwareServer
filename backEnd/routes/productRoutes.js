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
   
    
    handleMulterError, // Middleware para tratar erros do Multer

    (req,res) => {
        console.log('=== DEBUG ROUTE APÓS HANDLE MULTER ERROR ===',req.files, req.body);
       productController.addProduct;
    },
   
);

// Rota para adicionar produto SEM imagens (opcional)
Routes.post('/addProductWithoutImages',
   
    productController.addProduct
);

// Rota específica para upload de imagens para produto existente
Routes.post('/:productId/images',
  
    upload.fields([
        { name: 'imagem_principal', maxCount: 1 },
        { name: 'imagens_adicionais', maxCount: 5 }
    ]),
    handleMulterError,
    productController.uploadProductImages
);

module.exports = Routes;