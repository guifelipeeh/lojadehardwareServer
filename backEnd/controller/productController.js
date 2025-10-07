
// controller/productController.js
const productService = require('../service/productService');
const uploadService = require('../service/uploadService');

class ProductController {
    
    async addProduct(req, res) {
        console.log('=== DEBUG CONTROLLER ===');
        try {
            // Verificar se o usuário está autenticado
            if (!req.user || !req.user.id) {
                return res.status(401).json({
                    success: false,
                    error: 'Usuário não autenticado'
                });
            }

            const productData = {
                ...req.body,
                user_id: req.user.id // ID do usuário autenticado
            };

            let product;

            // Se há arquivos, usar o processo com upload
            if (req.files && (req.files.imagem_principal || req.files.imagens_adicionais)) {
                // Primeiro cria o produto
                product = await productService.createProduct(productData);
                
                // Depois processa as imagens
                if (req.files) {
                    await uploadService.handleProductImageUpload(product.id, req.files);
                    // Recarrega o produto com as imagens
                    product = await productService.getProductById(product.id);
                }

                res.status(201).json({
                    success: true,
                    message: 'Produto criado com imagens com sucesso',
                    product
                });

            } else {
                // Se não há arquivos, cria apenas o produto
                product = await productService.createProduct(productData);
                
                res.status(201).json({
                    success: true,
                    message: 'Produto criado com sucesso',
                    product
                });
            }

        } catch (error) {
            console.error('Erro ao criar produto:', error);
            
            // Em caso de erro, limpa os arquivos enviados se existirem
            if (req.files) {
                await uploadService.cleanupFiles(req.files);
            }

            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    }

    async uploadProductImages(req, res) {
        try {
            const { productId } = req.params;

            if (!req.files || (!req.files.imagem_principal && !req.files.imagens_adicionais)) {
                return res.status(400).json({
                    success: false,
                    error: 'Nenhuma imagem enviada'
                });
            }

            const product = await uploadService.handleProductImageUpload(productId, req.files);

            res.json({
                success: true,
                message: 'Imagens uploadadas com sucesso',
                product: {
                    id: product.id,
                    nome: product.nome,
                    imagem_url: product.imagem_url,
                    imagens_adicionais: product.imagens_adicionais
                }
            });

        } catch (error) {
            console.error('Erro ao fazer upload de imagens:', error);
            
            if (req.files) {
                await uploadService.cleanupFiles(req.files);
            }

            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    }
}

module.exports = new ProductController();