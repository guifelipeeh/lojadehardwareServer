const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: true,
            len: [2, 100]
        }
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true,
            notEmpty: true
        }
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: true,
            len: [6, 255] // Mínimo de 6 caracteres para senha
        }
    },
    endereco: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: true
        }
    },
    telefone: {
        type: DataTypes.STRING,
        allowNull: true,

    },
    cpf: {
        type: DataTypes.STRING(14),
        allowNull: false,
        unique: true,
    },
    role: {
        type: DataTypes.ENUM('admin', 'user'),
        defaultValue: 'user',
        allowNull: false,

    },
    userImage: {
        type: DataTypes.STRING,
        allowNull: true,
        get() {
            const rawValue = this.getDataValue('userImage');
            return rawValue ? `/uploads/users/${rawValue}` : null;
        },
        set(value) {
            this.setDataValue('userImage', value);
            if (value) {
                this.setDataValue('userImage', value);
            } else {
                this.setDataValue('userImage', null);
            }
            

        }

    }
},
    {
        timestamps: true,
        tableName: 'users', // Nome mais convencional para tabelas

    });

module.exports = User;