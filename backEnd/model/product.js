const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Product = sequelize.define('Product', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nome: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: {
                msg: 'O nome do produto é obrigatório'
            },
            len: {
                args: [2, 255],
                msg: 'O nome deve ter entre 2 e 255 caracteres'
            }
        }
    },
    descricao: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    preco: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
            min: {
                args: [0.01],
                msg: 'O preço deve ser maior que zero'
            },
            isDecimal: {
                msg: 'O preço deve ser um valor decimal válido'
            }
        }
    },
    categoria: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: {
                msg: 'A categoria é obrigatória'
            }
        }
    },
    estoque: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
            min: {
                args: [0],
                msg: 'O estoque não pode ser negativo'
            },
            isInt: {
                msg: 'O estoque deve ser um número inteiro'
            }
        }
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            min: 1
        }
    },
    marca: {
        type: DataTypes.STRING,
        allowNull: true
    },
    peso: {
        type: DataTypes.DECIMAL(8, 2),
        allowNull: true,
        validate: {
            min: 0
        }
    },
    dimensoes: {
        type: DataTypes.STRING,
        allowNull: true
    },
    ativo: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    imagem_url: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
            isUrl: {
                msg: 'A URL da imagem principal deve ser uma URL válida'
            }
        }
    },
    imagens_adicionais: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: [],
        validate: {
            isValidImages(value) {
                if (value && !Array.isArray(value)) {
                    throw new Error('Imagens adicionais deve ser um array');
                }
                if (value && value.length > 10) {
                    throw new Error('Máximo de 10 imagens adicionais permitidas');
                }
                // Validar cada URL se for fornecida
                if (value && Array.isArray(value)) {
                    value.forEach((url, index) => {
                        if (url && typeof url === 'string' && url.length > 0) {
                            try {
                                new URL(url);
                            } catch {
                                throw new Error(`URL da imagem adicional ${index + 1} é inválida`);
                            }
                        }
                    });
                }
            }
        }
    },
    tags: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: [],
        validate: {
            isValidTags(value) {
                if (value && !Array.isArray(value)) {
                    throw new Error('Tags deve ser um array');
                }
                if (value && value.length > 20) {
                    throw new Error('Máximo de 20 tags permitidas');
                }
            }
        }
    },
    sku: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: {
            msg: 'SKU já existe'
        },
        validate: {
            len: {
                args: [1, 100],
                msg: 'SKU deve ter entre 1 e 100 caracteres'
            }
        }
    },
    condicao: {
        type: DataTypes.ENUM('novo', 'usado', 'recondicionado'),
        defaultValue: 'novo',
        validate: {
            isIn: {
                args: [['novo', 'usado', 'recondicionado']],
                msg: 'Condição deve ser: novo, usado ou recondicionado'
            }
        }
    }
}, {
    timestamps: true,
    tableName: 'products',
    createdAt: 'data_criacao',
    updatedAt: 'data_atualizacao',
    hooks: {
        beforeValidate: (product) => {
            // Garantir que arrays sejam sempre arrays válidos
            if (product.imagens_adicionais && !Array.isArray(product.imagens_adicionais)) {
                product.imagens_adicionais = [];
            }
            
            if (product.tags && !Array.isArray(product.tags)) {
                product.tags = [];
            }

            // Limpar arrays vazios
            if (product.imagens_adicionais && product.imagens_adicionais.length === 0) {
                product.imagens_adicionais = null;
            }

            if (product.tags && product.tags.length === 0) {
                product.tags = null;
            }

            // Gerar SKU automático se não fornecido
            if (!product.sku) {
                product.sku = Product.generateSKU(product.categoria, product.marca);
            }

            // Validar e normalizar URLs
            product.normalizeImageUrls();
        },
        
        beforeSave: (product) => {
            // Garantir que as URLs estejam normalizadas
            product.normalizeImageUrls();
        }
    },
    indexes: [
        {
            fields: ['categoria']
        },
        {
            fields: ['user_id']
        },
        {
            fields: ['ativo']
        },
        {
            fields: ['sku'],
            unique: true
        },
        {
            fields: ['nome']
        },
        {
            fields: ['preco']
        },
        {
            fields: ['marca']
        },
        {
            fields: ['condicao']
        }
    ]
});

// Métodos de instância
Product.prototype.normalizeImageUrls = function() {
    // Normalizar URL da imagem principal
    if (this.imagem_url) {
        this.imagem_url = this.imagem_url.trim();
        // Garantir que seja uma URL válida
        if (!this.isValidUrl(this.imagem_url)) {
            throw new Error('URL da imagem principal é inválida');
        }
    }

    // Normalizar URLs das imagens adicionais
    if (this.imagens_adicionais && Array.isArray(this.imagens_adicionais)) {
        this.imagens_adicionais = this.imagens_adicionais
            .map(url => {
                if (url && typeof url === 'string') {
                    const trimmedUrl = url.trim();
                    if (trimmedUrl && this.isValidUrl(trimmedUrl)) {
                        return trimmedUrl;
                    }
                }
                return null;
            })
            .filter(url => url !== null && url.length > 0);
        
        // Remover duplicatas
        this.imagens_adicionais = [...new Set(this.imagens_adicionais)];
    }
};

Product.prototype.isValidUrl = function(string) {
    try {
        // Verifica se é uma string válida
        if (typeof string !== 'string' || string.length === 0) {
            return false;
        }

        // Verifica se começa com http:// ou https://
        if (!string.startsWith('http://') && !string.startsWith('https://')) {
            return false;
        }

        // Tenta criar uma URL (lança erro se for inválida)
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
};

// Método para adicionar imagem adicional
Product.prototype.addAdditionalImage = function(imageUrl) {
    if (!this.imagens_adicionais) {
        this.imagens_adicionais = [];
    }
    
    if (this.isValidUrl(imageUrl)) {
        const normalizedUrl = imageUrl.trim();
        if (!this.imagens_adicionais.includes(normalizedUrl)) {
            this.imagens_adicionais.push(normalizedUrl);
        }
    } else {
        throw new Error('URL da imagem adicional é inválida');
    }
};

// Método para remover imagem adicional
Product.prototype.removeAdditionalImage = function(imageUrl) {
    if (this.imagens_adicionais && Array.isArray(this.imagens_adicionais)) {
        const normalizedUrl = imageUrl.trim();
        this.imagens_adicionais = this.imagens_adicionais.filter(
            url => url !== normalizedUrl
        );
        
        // Se ficar vazio, definir como null
        if (this.imagens_adicionais.length === 0) {
            this.imagens_adicionais = null;
        }
    }
};

// Método para obter todas as URLs de imagem (principal + adicionais)
Product.prototype.getAllImageUrls = function() {
    const urls = [];
    
    if (this.imagem_url) {
        urls.push(this.imagem_url);
    }
    
    if (this.imagens_adicionais && Array.isArray(this.imagens_adicionais)) {
        urls.push(...this.imagens_adicionais);
    }
    
    return urls;
};

// Método para verificar se tem imagens
Product.prototype.hasImages = function() {
    return !!(this.imagem_url || 
              (this.imagens_adicionais && 
               Array.isArray(this.imagens_adicionais) && 
               this.imagens_adicionais.length > 0));
};

// Método para obter estatísticas básicas do produto
Product.prototype.getStats = function() {
    return {
        hasMainImage: !!this.imagem_url,
        additionalImagesCount: this.imagens_adicionais ? this.imagens_adicionais.length : 0,
        totalImages: this.getAllImageUrls().length,
        tagsCount: this.tags ? this.tags.length : 0,
        stockStatus: this.getStockStatus(),
        isActive: this.ativo
    };
};

// Método para obter status do estoque
Product.prototype.getStockStatus = function() {
    if (this.estoque === 0) {
        return 'esgotado';
    } else if (this.estoque <= 5) {
        return 'baixo';
    } else if (this.estoque <= 20) {
        return 'medio';
    } else {
        return 'alto';
    }
};

// Método estático para gerar SKU
Product.generateSKU = function(categoria = 'PRO', marca = 'BRD') {
    const timestamp = Date.now().toString().slice(-6);
    const catCode = categoria ? categoria.substring(0, 3).toUpperCase() : 'PRO';
    const brandCode = marca ? marca.substring(0, 3).toUpperCase() : 'BRD';
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `${catCode}-${brandCode}-${timestamp}-${random}`;
};

// Método estático para buscar produtos por categoria
Product.findByCategory = function(categoria, options = {}) {
    return this.findAll({
        where: { 
            categoria: {
                [sequelize.Op.like]: `%${categoria}%`
            },
            ativo: true
        },
        ...options
    });
};

// Método estático para buscar produtos com estoque baixo
Product.findLowStock = function(userId = null, limit = 50) {
    const where = {
        estoque: {
            [sequelize.Op.lte]: 5,
            [sequelize.Op.gt]: 0
        },
        ativo: true
    };
    
    if (userId) {
        where.user_id = userId;
    }
    
    return this.findAll({
        where,
        limit: parseInt(limit),
        order: [['estoque', 'ASC']]
    });
};

// Sobrescrever o método toJSON para controle do que é retornado
Product.prototype.toJSON = function() {
    const values = Object.assign({}, this.get());
    
    // Adicionar campos calculados
    values.status_estoque = this.getStockStatus();
    values.total_imagens = this.getAllImageUrls().length;
    values.tem_imagem_principal = !!this.imagem_url;
    
    return values;
};

module.exports = Product;