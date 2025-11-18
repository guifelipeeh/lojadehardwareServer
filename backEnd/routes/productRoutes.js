// routes/productRoutes.js
const express = require('express');
const multer = require('multer');
const productController = require('../controller/productController');
//const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

// Configuração do multer
const storage = multer.memoryStorage(); // ou diskStorage para salvar em disco
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Apenas imagens são permitidas'), false);
        }
    }
});

// Aplicar middleware de autenticação em todas as rotas
//router.use(authMiddleware);

// Rotas
router.post('/add', 
    upload.fields([
        { name: 'imagem_principal', maxCount: 1 },
        { name: 'imagens_adicionais', maxCount: 10 }
    ]),
    productController.createProduct
);

router.get('/getall', productController.getAllProducts);
router.get('/categories', productController.getCategories);
router.get('/user', productController.getUserProducts);
router.get('/statistics', productController.getProductStatistics);
router.get('/:id', productController.getProductById);

router.put('/:id',
    upload.fields([
        { name: 'imagem_principal', maxCount: 1 },
        { name: 'imagens_adicionais', maxCount: 10 }
    ]),
    productController.updateProduct
);

router.delete('/:id', productController.deleteProduct);
router.delete('/:id/images/:imageFilename', productController.removeProductImage);

module.exports = router;