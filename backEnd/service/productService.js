// services/productService.js
const Product = require('../model/product');
const { Op } = require('sequelize');
const path = require('path');
const fs = require('fs');

class ProductService {
    async createProduct(productData, files, userId) {
        try {
            // Preparar dados do produto
            const productInfo = {
                ...productData,
                user_id: userId
            };

            // Processar upload de imagens
            if (files) {
                // Imagem principal
                if (files.imagem_principal && files.imagem_principal[0]) {
                    const mainImage = files.imagem_principal[0];
                    productInfo.imagem_filename = mainImage.filename;
                    productInfo.imagem_url = this.formatImageUrl(mainImage.filename);
                }

                // Imagens adicionais
                if (files.imagens_adicionais && files.imagens_adicionais.length > 0) {
                    const additionalFilenames = files.imagens_adicionais.map(file => file.filename);
                    productInfo.imagens_adicionais_filenames = additionalFilenames;
                    productInfo.imagens_adicionais = this.formatImageUrls(additionalFilenames);
                }
            }

            // Converter campos numéricos
            if (productInfo.preco) {
                productInfo.preco = parseFloat(productInfo.preco);
            }
            if (productInfo.estoque) {
                productInfo.estoque = parseInt(productInfo.estoque);
            }
            if (productInfo.peso) {
                productInfo.peso = parseFloat(productInfo.peso);
            }

            // Processar tags se for string
            if (productInfo.tags && typeof productInfo.tags === 'string') {
                productInfo.tags = productInfo.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
            }

            const product = await Product.create(productInfo);
            return await this.getProductById(product.id);
            
        } catch (error) {
            console.error('Erro no service ao criar produto:', error);
            
            // Se houver erro, remover arquivos enviados
            if (files) {
                await this.rollbackFileUpload(files);
            }
            
            throw error;
        }
    }

    async updateProduct(id, productData, files, userId) {
        try {
            const product = await Product.findByPk(id);
            if (!product) {
                throw new Error('Produto não encontrado');
            }

            // Verificar se o usuário é o dono do produto
            if (product.user_id !== userId) {
                throw new Error('Sem permissão para editar este produto');
            }

            const updateData = { ...productData };
            const filesToDelete = []; // Arquivos antigos para deletar

            // Processar upload de novas imagens
            if (files) {
                // Imagem principal
                if (files.imagem_principal && files.imagem_principal[0]) {
                    // Marcar imagem antiga para deleção
                    if (product.imagem_filename) {
                        filesToDelete.push(product.imagem_filename);
                    }

                    const mainImage = files.imagem_principal[0];
                    updateData.imagem_filename = mainImage.filename;
                    updateData.imagem_url = this.formatImageUrl(mainImage.filename);
                }

                // Imagens adicionais
                if (files.imagens_adicionais && files.imagens_adicionais.length > 0) {
                    const newFilenames = files.imagens_adicionais.map(file => file.filename);
                    
                    // Manter imagens antigas e adicionar novas
                    const currentFilenames = product.imagens_adicionais_filenames || [];
                    updateData.imagens_adicionais_filenames = [...currentFilenames, ...newFilenames];
                    updateData.imagens_adicionais = this.formatImageUrls(updateData.imagens_adicionais_filenames);
                }
            }

            // Converter campos numéricos
            if (updateData.preco) {
                updateData.preco = parseFloat(updateData.preco);
            }
            if (updateData.estoque) {
                updateData.estoque = parseInt(updateData.estoque);
            }
            if (updateData.peso) {
                updateData.peso = parseFloat(updateData.peso);
            }

            // Processar tags
            if (updateData.tags && typeof updateData.tags === 'string') {
                updateData.tags = updateData.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
            }

            await product.update(updateData);

            // Deletar arquivos antigos após atualização bem-sucedida
            if (filesToDelete.length > 0) {
                await this.deleteMultipleFiles(filesToDelete);
            }

            return await this.getProductById(id);

        } catch (error) {
            console.error('Erro no service ao atualizar produto:', error);
            
            // Se houver erro, remover arquivos enviados
            if (files) {
                await this.rollbackFileUpload(files);
            }
            
            throw error;
        }
    }

    async deleteProduct(id, userId) {
        try {
            const product = await Product.findByPk(id);
            if (!product) {
                throw new Error('Produto não encontrado');
            }

            // Verificar se o usuário é o dono do produto
            if (product.user_id !== userId) {
                throw new Error('Sem permissão para excluir este produto');
            }

            // Remover arquivos de imagem
            await this.deleteProductImages(product);

            await product.destroy();
            return { message: 'Produto excluído com sucesso' };

        } catch (error) {
            console.error('Erro no service ao excluir produto:', error);
            throw error;
        }
    }

    // Métodos auxiliares para arquivos
    formatImageUrl(filename) {
        if (!filename) return null;
        const baseUrl = process.env.APP_URL || 'http://localhost:3000';
        return `${baseUrl}/uploads/${filename}`;
    }

    formatImageUrls(filenames) {
        if (!filenames || !Array.isArray(filenames)) return [];
        return filenames.map(filename => this.formatImageUrl(filename));
    }

    async deleteImageFile(filename) {
        try {
            const filePath = path.join(__dirname, '../uploads', filename);
            if (fs.existsSync(filePath)) {
                await fs.promises.unlink(filePath);
                console.log(`Arquivo deletado: ${filename}`);
            }
        } catch (error) {
            console.error('Erro ao deletar arquivo de imagem:', error);
        }
    }

    async deleteMultipleFiles(filenames) {
        try {
            for (const filename of filenames) {
                await this.deleteImageFile(filename);
            }
        } catch (error) {
            console.error('Erro ao deletar múltiplos arquivos:', error);
        }
    }

    async deleteProductImages(product) {
        try {
            const filesToDelete = [];

            // Imagem principal
            if (product.imagem_filename) {
                filesToDelete.push(product.imagem_filename);
            }

            // Imagens adicionais
            if (product.imagens_adicionais_filenames && Array.isArray(product.imagens_adicionais_filenames)) {
                filesToDelete.push(...product.imagens_adicionais_filenames);
            }

            await this.deleteMultipleFiles(filesToDelete);

        } catch (error) {
            console.error('Erro ao deletar imagens do produto:', error);
        }
    }

    async rollbackFileUpload(files) {
        try {
            const filesToDelete = [];

            if (files.imagem_principal && files.imagem_principal[0]) {
                filesToDelete.push(files.imagem_principal[0].filename);
            }

            if (files.imagens_adicionais && files.imagens_adicionais.length > 0) {
                files.imagens_adicionais.forEach(file => {
                    filesToDelete.push(file.filename);
                });
            }

            await this.deleteMultipleFiles(filesToDelete);

        } catch (error) {
            console.error('Erro no rollback de upload:', error);
        }
    }

    async removeProductImage(productId, imageFilename, userId) {
        try {
            const product = await Product.findByPk(productId);
            if (!product) {
                throw new Error('Produto não encontrado');
            }

            if (product.user_id !== userId) {
                throw new Error('Sem permissão para editar este produto');
            }

            // Verificar se é a imagem principal
            if (product.imagem_filename === imageFilename) {
                await this.deleteImageFile(imageFilename);
                await product.update({
                    imagem_filename: null,
                    imagem_url: null
                });
            } 
            // Verificar se é imagem adicional
            else if (product.imagens_adicionais_filenames && 
                     product.imagens_adicionais_filenames.includes(imageFilename)) {
                
                await this.deleteImageFile(imageFilename);
                
                const updatedFilenames = product.imagens_adicionais_filenames.filter(
                    filename => filename !== imageFilename
                );
                
                await product.update({
                    imagens_adicionais_filenames: updatedFilenames,
                    imagens_adicionais: this.formatImageUrls(updatedFilenames)
                });
            } else {
                throw new Error('Imagem não encontrada no produto');
            }

            return await this.getProductById(productId);

        } catch (error) {
            console.error('Erro ao remover imagem do produto:', error);
            throw error;
        }
    }

   async getAllProducts(filters = {}) {
    try {
        // CORREÇÃO: Garantir que filters sempre seja um objeto
        const safeFilters = filters || {};
        
        // CORREÇÃO: Usar valores padrão para todas as propriedades
        const {
            categoria,
            minPreco,
            maxPreco,
            estoqueMin,
            estoqueMax,
            ativo = true,
            search,
            page = 1,
            limit = 10,
            orderBy = 'data_criacao',
            orderDirection = 'DESC',
            marca,
            condicao,
            tags,
            user_id,
            sku,
            withUser = false
        } = safeFilters;

        const where = { ativo };
        const offset = (page - 1) * limit;

        // Filtro por usuário
        if (user_id) {
            where.user_id = parseInt(user_id);
        }

        // Filtro por categoria
        if (categoria) {
            where.categoria = {
                [Op.like]: `%${categoria}%`
            };
        }

        // Filtro por marca
        if (marca) {
            where.marca = {
                [Op.like]: `%${marca}%`
            };
        }

        // Filtro por SKU
        if (sku) {
            where.sku = {
                [Op.like]: `%${sku}%`
            };
        }

        // Filtro por condição
        if (condicao && ['novo', 'usado', 'recondicionado'].includes(condicao)) {
            where.condicao = condicao;
        }

        // Filtro por preço
        if (minPreco !== undefined && maxPreco !== undefined) {
            where.preco = {
                [Op.between]: [parseFloat(minPreco), parseFloat(maxPreco)]
            };
        } else if (minPreco !== undefined) {
            where.preco = {
                [Op.gte]: parseFloat(minPreco)
            };
        } else if (maxPreco !== undefined) {
            where.preco = {
                [Op.lte]: parseFloat(maxPreco)
            };
        }

        // Filtro por estoque
        if (estoqueMin !== undefined && estoqueMax !== undefined) {
            where.estoque = {
                [Op.between]: [parseInt(estoqueMin), parseInt(estoqueMax)]
            };
        } else if (estoqueMin !== undefined) {
            where.estoque = {
                [Op.gte]: parseInt(estoqueMin)
            };
        } else if (estoqueMax !== undefined) {
            where.estoque = {
                [Op.lte]: parseInt(estoqueMax)
            };
        }

        // Filtro por tags
        if (tags) {
            const tagsArray = Array.isArray(tags) ? tags : tags.split(',').map(tag => tag.trim());
            where.tags = {
                [Op.overlap]: tagsArray
            };
        }

        // Busca por texto
        if (search) {
            const searchPattern = { [Op.like]: `%${search}%` };
            where[Op.or] = [
                { nome: searchPattern },
                { descricao: searchPattern },
                { marca: searchPattern },
                { sku: searchPattern },
                { categoria: searchPattern }
            ];
        }

        // Configurar ordenação
        const orderArray = [];
        const validOrderFields = ['nome', 'preco', 'estoque', 'data_criacao', 'data_atualizacao', 'marca'];
        
        if (orderBy && validOrderFields.includes(orderBy)) {
            orderArray.push([orderBy, orderDirection.toUpperCase() === 'ASC' ? 'ASC' : 'DESC']);
        } else {
            orderArray.push(['data_criacao', 'DESC']);
        }
        orderArray.push(['id', 'ASC']);

        // Buscar produtos
        const { count, rows } = await Product.findAndCountAll({
            where,
            order: orderArray,
            limit: parseInt(limit),
            offset: parseInt(offset),
            attributes: {
                exclude: ['user_id']
            }
        });

        // CORREÇÃO: Verificar se rows existe antes de mapear
        const processedProducts = rows ? rows.map(product => {
            const productData = product.toJSON ? product.toJSON() : product;
            
            // Garantir URLs de imagem
            if (productData.imagem_url && !productData.imagem_url.startsWith('http')) {
                productData.imagem_url = this.formatImageUrl(productData.imagem_url);
            }

            if (productData.imagens_adicionais && Array.isArray(productData.imagens_adicionais)) {
                productData.imagens_adicionais = productData.imagens_adicionais.map(img => 
                    img && !img.startsWith('http') ? this.formatImageUrl(img) : img
                );
            }

            // Adicionar status de estoque
            productData.status_estoque = this.getStockStatus(productData.estoque);

            return productData;
        }) : [];

        return {
            products: processedProducts,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(count / limit),
                totalProducts: count,
                hasNext: offset + parseInt(limit) < count,
                hasPrev: page > 1,
                pageSize: parseInt(limit)
            }
        };

    } catch (error) {
        console.error('Erro no service ao buscar produtos:', error);
        
        if (error.name === 'SequelizeDatabaseError') {
            throw new Error('Erro na consulta do banco de dados. Verifique os parâmetros de filtro.');
        }
        
        throw new Error(`Erro ao buscar produtos: ${error.message}`);
    }
}

// Método auxiliar para status do estoque
getStockStatus(stock) {
    if (stock === 0) {
        return 'esgotado';
    } else if (stock <= 5) {
        return 'baixo';
    } else if (stock <= 20) {
        return 'medio';
    } else {
        return 'alto';
    }
}

// Método para formatar URL da imagem
formatImageUrl(filename) {
    if (!filename) return null;
    const baseUrl = process.env.APP_URL || 'http://localhost:3000';
    return `${baseUrl}/uploads/${filename}`;
}
   

}

module.exports = new ProductService();