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
                    const mainImage = await this.processAndSaveImage(files.imagem_principal[0]);
                    productInfo.imagem_filename = mainImage.filename;
                    productInfo.imagem_url = mainImage.url;
                }

                // Imagens adicionais
                if (files.imagens_adicionais && files.imagens_adicionais.length > 0) {
                    const additionalImages = await this.processMultipleImages(files.imagens_adicionais);
                    productInfo.imagens_adicionais_filenames = additionalImages.map(img => img.filename);
                    productInfo.imagens_adicionais = additionalImages.map(img => img.url);
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
            throw error;
        }
    }

    async getAllProducts(filters = {}) {
        try {
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
                orderDirection = 'DESC' // CORREÇÃO: mudei o nome da variável
            } = filters;

            const where = { ativo };
            const offset = (page - 1) * limit;

            // Filtros
            if (categoria) {
                where.categoria = categoria;
            }

            if (minPreco || maxPreco) {
                where.preco = {};
                if (minPreco) where.preco[Op.gte] = parseFloat(minPreco);
                if (maxPreco) where.preco[Op.lte] = parseFloat(maxPreco);
            }

            if (estoqueMin || estoqueMax) {
                where.estoque = {};
                if (estoqueMin) where.estoque[Op.gte] = parseInt(estoqueMin);
                if (estoqueMax) where.estoque[Op.lte] = parseInt(estoqueMax);
            }

            // Busca por texto
            if (search) {
                where[Op.or] = [
                    { nome: { [Op.like]: `%${search}%` } },
                    { descricao: { [Op.like]: `%${search}%` } },
                    { marca: { [Op.like]: `%${search}%` } },
                    { sku: { [Op.like]: `%${search}%` } }
                ];
            }

            // CORREÇÃO: removi a declaração duplicada da variável order
            const orderArray = [];
            if (orderBy && ['nome', 'preco', 'estoque', 'data_criacao', 'data_atualizacao'].includes(orderBy)) {
                orderArray.push([orderBy, orderDirection.toUpperCase() === 'ASC' ? 'ASC' : 'DESC']);
            } else {
                orderArray.push(['data_criacao', 'DESC']);
            }

            const { count, rows } = await Product.findAndCountAll({
                where,
                order: orderArray, // CORREÇÃO: usando orderArray
                limit: parseInt(limit),
                offset: parseInt(offset)
            });

            return {
                products: rows,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(count / limit),
                    totalProducts: count,
                    hasNext: offset + rows.length < count,
                    hasPrev: page > 1
                }
            };

        } catch (error) {
            console.error('Erro no service ao buscar produtos:', error);
            throw error;
        }
    }

    async getProductById(id) {
        try {
            const product = await Product.findByPk(id);
            if (!product) {
                throw new Error('Produto não encontrado');
            }
            return product;
        } catch (error) {
            console.error('Erro no service ao buscar produto:', error);
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

            // Processar upload de novas imagens
            if (files) {
                // Imagem principal
                if (files.imagem_principal && files.imagem_principal[0]) {
                    // Remover imagem antiga se existir
                    if (product.imagem_filename) {
                        await this.deleteImageFile(product.imagem_filename);
                    }

                    const mainImage = await this.processAndSaveImage(files.imagem_principal[0]);
                    updateData.imagem_filename = mainImage.filename;
                    updateData.imagem_url = mainImage.url;
                }

                // Imagens adicionais
                if (files.imagens_adicionais && files.imagens_adicionais.length > 0) {
                    const additionalImages = await this.processMultipleImages(files.imagens_adicionais);
                    const newFilenames = additionalImages.map(img => img.filename);
                    
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
            return await this.getProductById(id);

        } catch (error) {
            console.error('Erro no service ao atualizar produto:', error);
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

    async getProductsByUser(userId, filters = {}) {
        try {
            const where = { user_id: userId, ...filters };
            return await Product.findAll({ where });
        } catch (error) {
            console.error('Erro no service ao buscar produtos do usuário:', error);
            throw error;
        }
    }

    async getCategories() {
        try {
            const categories = await Product.findAll({
                attributes: ['categoria'],
                group: ['categoria'],
                raw: true
            });
            return categories.map(cat => cat.categoria).filter(cat => cat);
        } catch (error) {
            console.error('Erro no service ao buscar categorias:', error);
            throw error;
        }
    }

    // Métodos auxiliares para imagens
    async processAndSaveImage(file) {
        const uploadDir = path.join(__dirname, '../uploads');
        
        // Criar diretório se não existir
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        // Gerar nome único para o arquivo
        const fileExtension = path.extname(file.originalname);
        const fileName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${fileExtension}`;
        const filePath = path.join(uploadDir, fileName);

        // Salvar arquivo
        if (file.buffer) {
            await fs.promises.writeFile(filePath, file.buffer);
        } else {
            // Se for disk storage
            await fs.promises.rename(file.path, filePath);
        }

        return {
            filename: fileName,
            url: this.formatImageUrl(fileName)
        };
    }

    async processMultipleImages(files) {
        const processedImages = [];
        for (const file of files) {
            const image = await this.processAndSaveImage(file);
            processedImages.push(image);
        }
        return processedImages;
    }

    formatImageUrl(filename) {
        if (!filename) return null;
        const baseUrl = process.env.APP_URL || 'http://localhost:3000';
        return `${baseUrl}/uploads/${filename}`;
    }

    async deleteImageFile(filename) {
        try {
            const filePath = path.join(__dirname, '../uploads', filename);
            if (fs.existsSync(filePath)) {
                await fs.promises.unlink(filePath);
            }
        } catch (error) {
            console.error('Erro ao deletar arquivo de imagem:', error);
        }
    }

    async deleteProductImages(product) {
        try {
            // Deletar imagem principal
            if (product.imagem_filename) {
                await this.deleteImageFile(product.imagem_filename);
            }

            // Deletar imagens adicionais
            if (product.imagens_adicionais_filenames && Array.isArray(product.imagens_adicionais_filenames)) {
                for (const filename of product.imagens_adicionais_filenames) {
                    await this.deleteImageFile(filename);
                }
            }
        } catch (error) {
            console.error('Erro ao deletar imagens do produto:', error);
        }
    }

    // Método para remover imagem específica
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

    formatImageUrls(filenames) {
        if (!filenames || !Array.isArray(filenames)) return [];
        return filenames.map(filename => this.formatImageUrl(filename));
    }
}

module.exports = new ProductService();