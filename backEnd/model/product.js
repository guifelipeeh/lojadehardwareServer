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
        get() {
            const rawValue = this.getDataValue('imagem_url');
            return this.formatImageUrl(rawValue);
        },
        set(value) {
            this.setDataValue('imagem_url', this.cleanImageUrl(value));
        }
    },
    imagens_adicionais: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: [],
        get() {
            const rawValue = this.getDataValue('imagens_adicionais');
            return this.formatAdditionalImages(rawValue);
        },
        set(value) {
            this.setDataValue('imagens_adicionais', this.cleanAdditionalImages(value));
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
    },
    // Novo campo para melhor controle das imagens
    imagem_filename: {
        type: DataTypes.STRING,
        allowNull: true
    },
    imagens_adicionais_filenames: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: []
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

            if (product.imagens_adicionais_filenames && !Array.isArray(product.imagens_adicionais_filenames)) {
                product.imagens_adicionais_filenames = [];
            }

            // Gerar SKU automático se não fornecido
            if (!product.sku) {
                product.sku = Product.generateSKU();
            }

            // Sincronizar filenames com URLs
            product.syncImageFilenames();
        },
        
        beforeSave: (product) => {
            // Garantir que os filenames estejam sincronizados
            product.syncImageFilenames();
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
        }
    ]
});

// Métodos de instância
Product.prototype.formatImageUrl = function(rawValue) {
    if (!rawValue) {
        return null;
    }

    // Se já é uma URL completa, retorna como está
    if (rawValue.startsWith('http://') || rawValue.startsWith('https://')) {
        return rawValue;
    }

    // Se é um caminho local, adiciona a URL base
    const baseUrl = process.env.APP_URL || 'http://localhost:3000';
    return `${baseUrl}/uploads/${rawValue}`;
};

Product.prototype.cleanImageUrl = function(value) {
    if (!value) {
        return null;
    }

    if (value.startsWith('http://') || value.startsWith('https://')) {
        // Remove a URL base para salvar apenas o filename
        const baseUrl = process.env.APP_URL || 'http://localhost:3000';
        const filename = value.replace(`${baseUrl}/uploads/`, '');
        return filename;
    }

    return value;
};

Product.prototype.formatAdditionalImages = function(rawValue) {
    if (!rawValue || !Array.isArray(rawValue)) {
        return [];
    }

    const baseUrl = process.env.APP_URL || 'http://localhost:3000';

    return rawValue.map(img => {
        if (!img || typeof img !== 'string') return null;
        
        // Se já é uma URL completa, retorna como está
        if (img.startsWith('http://') || img.startsWith('https://')) {
            return img;
        }

        // Se é um caminho local, adiciona a URL base
        return `${baseUrl}/uploads/${img}`;
    }).filter(img => img !== null);
};

Product.prototype.cleanAdditionalImages = function(value) {
    if (!value || !Array.isArray(value)) {
        return [];
    }

    const baseUrl = process.env.APP_URL || 'http://localhost:3000';
    
    return value.map(img => {
        if (!img || typeof img !== 'string') return null;

        if (img.startsWith('http://') || img.startsWith('https://')) {
            // Remove a URL base para salvar apenas o filename
            return img.replace(`${baseUrl}/uploads/`, '');
        }
        return img;
    }).filter(img => img !== null);
};

// Sincronizar filenames com URLs
Product.prototype.syncImageFilenames = function() {
    // Para imagem principal
    if (this.imagem_url && !this.imagem_filename) {
        this.imagem_filename = this.cleanImageUrl(this.imagem_url);
    }
    
    if (this.imagem_filename && !this.imagem_url) {
        this.imagem_url = this.formatImageUrl(this.imagem_filename);
    }

    // Para imagens adicionais
    if (this.imagens_adicionais && this.imagens_adicionais.length > 0 && 
        (!this.imagens_adicionais_filenames || this.imagens_adicionais_filenames.length === 0)) {
        this.imagens_adicionais_filenames = this.cleanAdditionalImages(this.imagens_adicionais);
    }
    
    if (this.imagens_adicionais_filenames && this.imagens_adicionais_filenames.length > 0 && 
        (!this.imagens_adicionais || this.imagens_adicionais.length === 0)) {
        this.imagens_adicionais = this.formatAdditionalImages(this.imagens_adicionais_filenames);
    }
};

// Método estático para gerar SKU
Product.generateSKU = function() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `SKU-${timestamp}-${random}`.toUpperCase();
};

// Método para obter apenas os filenames (útil para operações de arquivo)
Product.prototype.getImageFilenames = function() {
    const filenames = [];
    
    if (this.imagem_filename) {
        filenames.push(this.imagem_filename);
    }
    
    if (this.imagens_adicionais_filenames && Array.isArray(this.imagens_adicionais_filenames)) {
        filenames.push(...this.imagens_adicionais_filenames);
    }
    
    return filenames.filter(filename => filename && typeof filename === 'string');
};

// Método para adicionar imagem adicional
Product.prototype.addAdditionalImage = function(filename) {
    const cleanedFilename = this.cleanImageUrl(filename);
    
    if (!this.imagens_adicionais_filenames) {
        this.imagens_adicionais_filenames = [];
    }
    
    if (!this.imagens_adicionais_filenames.includes(cleanedFilename)) {
        this.imagens_adicionais_filenames.push(cleanedFilename);
        this.imagens_adicionais = this.formatAdditionalImages(this.imagens_adicionais_filenames);
    }
};

// Método para remover imagem adicional
Product.prototype.removeAdditionalImage = function(filename) {
    const cleanedFilename = this.cleanImageUrl(filename);
    
    if (this.imagens_adicionais_filenames && Array.isArray(this.imagens_adicionais_filenames)) {
        this.imagens_adicionais_filenames = this.imagens_adicionais_filenames.filter(
            img => img !== cleanedFilename
        );
        this.imagens_adicionais = this.formatAdditionalImages(this.imagens_adicionais_filenames);
    }
};

// Sobrescrever o método toJSON para controle do que é retornado
Product.prototype.toJSON = function() {
    const values = Object.assign({}, this.get());
    
    // Remover campos internos se necessário
    delete values.imagem_filename;
    delete values.imagens_adicionais_filenames;
    
    return values;
};

module.exports = Product;