// controllers/productController.js
const productService = require('../service/productService');

class ProductController {
    async createProduct(req, res) {
        try {
            const productData = req.body;
            const files = req.files;
            const userId = 1; // Supondo que o usuário está autenticado

            const product = await productService.createProduct(productData, files, userId);

            res.status(201).json({
                success: true,
                message: 'Produto criado com sucesso',
                data: product
            });

        } catch (error) {
            console.error('Erro no controller ao criar produto:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Erro ao criar produto'
            });
        }
    }

    async getAllProducts(req, res) {
        try {
            const filters = {
                categoria: req.query.categoria,
                minPreco: req.query.minPreco,
                maxPreco: req.query.maxPreco,
                estoqueMin: req.query.estoqueMin,
                estoqueMax: req.query.estoqueMax,
                ativo: req.query.ativo !== 'false',
                search: req.query.search,
                page: req.query.page || 1,
                limit: req.query.limit || 10,
                orderBy: req.query.orderBy,
                order: req.query.order
            };

            const result = await productService.getAllProducts(filters);

            res.json({
                success: true,
                data: result.products,
                pagination: result.pagination
            });

        } catch (error) {
            console.error('Erro no controller ao buscar produtos:', error);
            res.status(500).json({
                success: false,
                message: 'Erro ao buscar produtos'
            });
        }
    }

    async getProductById(req, res) {
        try {
            const { id } = req.params;
            const product = await productService.getProductById(id);

            res.json({
                success: true,
                data: product
            });

        } catch (error) {
            console.error('Erro no controller ao buscar produto:', error);
            if (error.message === 'Produto não encontrado') {
                return res.status(404).json({
                    success: false,
                    message: error.message
                });
            }
            res.status(500).json({
                success: false,
                message: 'Erro ao buscar produto'
            });
        }
    }

    async updateProduct(req, res) {
        try {
            const { id } = req.params;
            const productData = req.body;
            const files = req.files;
            const userId = req.user.id;

            const product = await productService.updateProduct(id, productData, files, userId);

            res.json({
                success: true,
                message: 'Produto atualizado com sucesso',
                data: product
            });

        } catch (error) {
            console.error('Erro no controller ao atualizar produto:', error);
            if (error.message === 'Produto não encontrado' || error.message === 'Sem permissão para editar este produto') {
                return res.status(403).json({
                    success: false,
                    message: error.message
                });
            }
            res.status(400).json({
                success: false,
                message: error.message || 'Erro ao atualizar produto'
            });
        }
    }

    async deleteProduct(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.id;

            const result = await productService.deleteProduct(id, userId);

            res.json({
                success: true,
                message: result.message
            });

        } catch (error) {
            console.error('Erro no controller ao excluir produto:', error);
            if (error.message === 'Produto não encontrado' || error.message === 'Sem permissão para excluir este produto') {
                return res.status(403).json({
                    success: false,
                    message: error.message
                });
            }
            res.status(500).json({
                success: false,
                message: 'Erro ao excluir produto'
            });
        }
    }

    async getUserProducts(req, res) {
        try {
            const userId = req.user.id;
            const filters = {
                ativo: req.query.ativo !== 'false'
            };

            const products = await productService.getProductsByUser(userId, filters);

            res.json({
                success: true,
                data: products
            });

        } catch (error) {
            console.error('Erro no controller ao buscar produtos do usuário:', error);
            res.status(500).json({
                success: false,
                message: 'Erro ao buscar produtos'
            });
        }
    }

    async getCategories(req, res) {
        try {
            const categories = await productService.getCategories();

            res.json({
                success: true,
                data: categories
            });

        } catch (error) {
            console.error('Erro no controller ao buscar categorias:', error);
            res.status(500).json({
                success: false,
                message: 'Erro ao buscar categorias'
            });
        }
    }

    async removeProductImage(req, res) {
        try {
            const { id, imageFilename } = req.params;
            const userId = req.user.id;

            const product = await productService.removeProductImage(id, imageFilename, userId);

            res.json({
                success: true,
                message: 'Imagem removida com sucesso',
                data: product
            });

        } catch (error) {
            console.error('Erro no controller ao remover imagem:', error);
            if (error.message === 'Produto não encontrado' || 
                error.message === 'Sem permissão para editar este produto' ||
                error.message === 'Imagem não encontrada no produto') {
                return res.status(403).json({
                    success: false,
                    message: error.message
                });
            }
            res.status(500).json({
                success: false,
                message: 'Erro ao remover imagem'
            });
        }
    }

    async getProductStatistics(req, res) {
        try {
            const userId = req.user.id;
            
            // Implementar estatísticas do usuário
            const userProducts = await productService.getProductsByUser(userId);
            
            const statistics = {
                totalProducts: userProducts.length,
                activeProducts: userProducts.filter(p => p.ativo).length,
                totalStock: userProducts.reduce((sum, p) => sum + p.estoque, 0),
                totalValue: userProducts.reduce((sum, p) => sum + (p.preco * p.estoque), 0),
                lowStock: userProducts.filter(p => p.estoque <= 5 && p.estoque > 0).length,
                outOfStock: userProducts.filter(p => p.estoque === 0).length
            };

            res.json({
                success: true,
                data: statistics
            });

        } catch (error) {
            console.error('Erro no controller ao buscar estatísticas:', error);
            res.status(500).json({
                success: false,
                message: 'Erro ao buscar estatísticas'
            });
        }
    }
}

module.exports = new ProductController();