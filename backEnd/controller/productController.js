// controllers/productController.js
const productService = require('../service/productService');

class ProductController {
    async createProduct(req, res) {
        try {
            const productData = req.body;
            const files = req.files;
            const userId = 1;

            // Log para debug
            console.log('Files recebidos:', files);
            console.log('Dados do produto:', productData);

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

    // Outros métodos permanecem iguais...
    async getAllProducts(req, res) {
    try {
        // CORREÇÃO: Garantir que req.query existe
        const query = req.query || {};
        
        const {
            categoria,
            minPreco,
            maxPreco,
            estoqueMin,
            estoqueMax,
            ativo,
            search,
            page = 1,
            limit = 10,
            orderBy = 'data_criacao',
            orderDirection = 'DESC',
            marca,
            condicao,
            tags,
            user_id,
            sku
        } = query;

        // VALIDAÇÃO: Verificar se os valores numéricos são válidos
        const validateNumber = (value, fieldName) => {
            if (value !== undefined && value !== null && value !== '') {
                const num = parseFloat(value);
                if (isNaN(num)) {
                    throw new Error(`${fieldName} deve ser um número válido`);
                }
                if (num < 0) {
                    throw new Error(`${fieldName} não pode ser negativo`);
                }
                return num;
            }
            return undefined;
        };

        // Validar valores numéricos
        const validatedMinPreco = validateNumber(minPreco, 'Preço mínimo');
        const validatedMaxPreco = validateNumber(maxPreco, 'Preço máximo');
        const validatedEstoqueMin = validateNumber(estoqueMin, 'Estoque mínimo');
        const validatedEstoqueMax = validateNumber(estoqueMax, 'Estoque máximo');

        // Validar se preço mínimo não é maior que máximo
        if (validatedMinPreco !== undefined && validatedMaxPreco !== undefined && 
            validatedMinPreco > validatedMaxPreco) {
            return res.status(400).json({
                success: false,
                message: 'Preço mínimo não pode ser maior que preço máximo'
            });
        }

        // Validar se estoque mínimo não é maior que máximo
        if (validatedEstoqueMin !== undefined && validatedEstoqueMax !== undefined && 
            validatedEstoqueMin > validatedEstoqueMax) {
            return res.status(400).json({
                success: false,
                message: 'Estoque mínimo não pode ser maior que estoque máximo'
            });
        }

        // Preparar filtros - CORREÇÃO: garantir que todos os campos existam
        const filters = {
            categoria: categoria || undefined,
            minPreco: validatedMinPreco,
            maxPreco: validatedMaxPreco,
            estoqueMin: validatedEstoqueMin,
            estoqueMax: validatedEstoqueMax,
            ativo: ativo !== undefined ? ativo === 'true' : true,
            search: search || undefined,
            page: parseInt(page) || 1,
            limit: Math.min(parseInt(limit) || 10, 50), // Máximo 50
            orderBy: orderBy || 'data_criacao',
            orderDirection: orderDirection || 'DESC',
            marca: marca || undefined,
            condicao: condicao || undefined,
            tags: tags || undefined,
            user_id: user_id ? parseInt(user_id) : undefined,
            sku: sku || undefined
        };

        // Validações adicionais
        if (filters.page < 1) {
            return res.status(400).json({
                success: false,
                message: 'Página deve ser maior que 0'
            });
        }

        if (filters.limit < 1) {
            return res.status(400).json({
                success: false,
                message: 'Limite deve ser maior que 0'
            });
        }

        // CORREÇÃO: Garantir que estamos passando um objeto válido
        const result = await productService.getAllProducts(filters);

        // CORREÇÃO: Verificar se result existe antes de acessar propriedades
        if (!result) {
            return res.status(500).json({
                success: false,
                message: 'Erro ao processar a busca de produtos'
            });
        }

        res.json({
            success: true,
            data: result.products || [],
            pagination: result.pagination || {
                currentPage: filters.page,
                totalPages: 0,
                totalProducts: 0,
                hasNext: false,
                hasPrev: false,
                pageSize: filters.limit
            }
        });

    } catch (error) {
        console.error('Erro no controller ao buscar produtos:', error);
        
        // Tratamento específico de erros
        if (error.message.includes('deve ser um número válido') || 
            error.message.includes('não pode ser negativo') ||
            error.message.includes('não pode ser maior')) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }

        if (error.message.includes('Erro na consulta do banco de dados')) {
            return res.status(400).json({
                success: false,
                message: 'Parâmetros de filtro inválidos'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor ao buscar produtos'
        });
    }
}

// Método auxiliar para obter filtros disponíveis
async getAvailableFilters() {
    try {
        const categories = await productService.getCategories();
        
        // Você pode adicionar mais filtros aqui conforme necessário
        return {
            categorias: categories,
            condicoes: ['novo', 'usado', 'recondicionado'],
            ordenacao: [
                { value: 'nome', label: 'Nome A-Z' },
                { value: 'nome DESC', label: 'Nome Z-A' },
                { value: 'preco', label: 'Preço Menor' },
                { value: 'preco DESC', label: 'Preço Maior' },
                { value: 'estoque', label: 'Estoque Menor' },
                { value: 'estoque DESC', label: 'Estoque Maior' },
                { value: 'data_criacao', label: 'Mais Antigos' },
                { value: 'data_criacao DESC', label: 'Mais Recentes' }
            ]
        };
    } catch (error) {
        console.error('Erro ao obter filtros disponíveis:', error);
        return {
            categorias: [],
            condicoes: ['novo', 'usado', 'recondicionado'],
            ordenacao: []
        };
    }
}
    async getProductById(req, res) {
        // ... implementação anterior
    }

    async deleteProduct(req, res) {
        // ... implementação anterior
    }

    async getUserProducts(req, res) {
        // ... implementação anterior
    }

    async getCategories(req, res) {
        // ... implementação anterior
    }

    async removeProductImage(req, res) {
        // ... implementação anterior
    }

    async getProductStatistics(req, res) {
        // ... implementação anterior
    }
}

module.exports = new ProductController();