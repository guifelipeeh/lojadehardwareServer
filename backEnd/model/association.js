const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Association = sequelize.define('Association', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    product_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'products',
            key: 'id'
        }
    },
    tipo_associacao: {
        type: DataTypes.ENUM('favorito', 'carrinho', 'comprado', 'visualizado', 'avaliacao'),
        allowNull: false
    },
    quantidade: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
        validate: {
            min: 1
        }
    },
    data_associacao: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    status: {
        type: DataTypes.ENUM('ativo', 'inativo', 'finalizado', 'cancelado'),
        defaultValue: 'ativo'
    },
    metadata: {
        type: DataTypes.JSON,
        allowNull: true
    }
}, {
    timestamps: true,
    tableName: 'associations',
    createdAt: 'data_criacao',
    updatedAt: 'data_atualizacao',
    indexes: [
        {
            unique: true,
            fields: ['user_id', 'product_id', 'tipo_associacao'],
            where: {
                status: 'ativo'
            }
        }
    ]
});

module.exports = Association;