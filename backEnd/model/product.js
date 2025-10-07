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
            notEmpty: true,
            len: [2, 255]
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
            min: 0.01
        }
    },
    categoria: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: true
        }
    },
    estoque: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
            min: 0
        }
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    marca: {
        type: DataTypes.STRING,
        allowNull: true
    },
    peso: {
        type: DataTypes.DECIMAL(8, 2),
        allowNull: true
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
            if (!rawValue) {
                return null;
            }

            // Se já é uma URL completa, retorna como está
            if (rawValue.startsWith('http://') || rawValue.startsWith('https://')) {
                return rawValue;
            }

            // Se é um caminho local, adiciona a URL base
            return `${process.env.APP_URL || 'http://localhost:3000'}/uploads/${rawValue}`;
        },
        set(value) {
            if (value && (value.startsWith('http://') || value.startsWith('https://'))) {
                // Remove a URL base para salvar apenas o filename
                const baseUrl = process.env.APP_URL || 'http://localhost:3000';
                const filename = value.replace(`${baseUrl}/uploads/`, '');
                this.setDataValue('imagem_url', filename);
            } else {
                this.setDataValue('imagem_url', value);
            }
        }
    },
    imagens_adicionais: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: [],
        get() {
            const rawValue = this.getDataValue('imagens_adicionais');
            if (!rawValue || !Array.isArray(rawValue)) {
                return [];
            }

            const baseUrl = process.env.APP_URL || 'http://localhost:3000';

            return rawValue.map(img => {
                if (!img) return null;
                
                // Se já é uma URL completa, retorna como está
                if (img.startsWith('http://') || img.startsWith('https://')) {
                    return img;
                }

                // Se é um caminho local, adiciona a URL base
                return `${baseUrl}/uploads/${img}`;
            }).filter(img => img !== null);
        },
        set(value) {
            if (Array.isArray(value)) {
                const baseUrl = process.env.APP_URL || 'http://localhost:3000';
                const cleanedValue = value.map(img => {
                    if (!img) return null;

                    if (img.startsWith('http://') || img.startsWith('https://')) {
                        // Remove a URL base para salvar apenas o filename
                        return img.replace(`${baseUrl}/uploads/`, '');
                    }
                    return img;
                }).filter(img => img !== null);
                
                this.setDataValue('imagens_adicionais', cleanedValue);
            } else {
                this.setDataValue('imagens_adicionais', []);
            }
        }
    },
    tags: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: []
    },
    sku: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true
    },
    condicao: {
        type: DataTypes.ENUM('novo', 'usado', 'recondicionado'),
        defaultValue: 'novo'
    }
}, {
    timestamps: true,
    tableName: 'products',
    createdAt: 'data_criacao',
    updatedAt: 'data_atualizacao',
    hooks: {
        beforeValidate: (product) => {
            // Garantir que imagens_adicionais seja sempre um array
            if (product.imagens_adicionais && !Array.isArray(product.imagens_adicionais)) {
                product.imagens_adicionais = [];
            }
            
            // Gerar SKU automático se não fornecido
            if (!product.sku) {
                const timestamp = Date.now().toString(36);
                const random = Math.random().toString(36).substring(2, 7);
                product.sku = `SKU-${timestamp}-${random}`.toUpperCase();
            }
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
        }
    ]
});

module.exports = Product;