// routes/productRoutes.js
const express = require('express');
const productController = require('../controller/productController');
//const authMiddleware = require('../middlewares/authMiddleware');
const { upload, handleMulterError } = require('../config/multer');

const router = express.Router();

// Aplicar middleware de autenticação em todas as rotas
//router.use(authMiddleware);

// Configuração de campos para upload
const uploadFields = upload.fields([
    { name: 'imagem_principal', maxCount: 1 },
    { name: 'imagens_adicionais', maxCount: 10 }
]);

// Rotas com upload de arquivos
router.post('/add', uploadFields, handleMulterError, productController.createProduct);
router.put('/:id', uploadFields, handleMulterError, productController.updateProduct);

// Rotas sem upload de arquivos
router.get('/', productController.getAllProducts);
router.get('/categories', productController.getCategories);
router.get('/user', productController.getUserProducts);
router.get('/statistics', productController.getProductStatistics);
router.get('/:id', productController.getProductById);
router.delete('/:id', productController.deleteProduct);
router.delete('/:id/images/:imageFilename', productController.removeProductImage);

module.exports = router;