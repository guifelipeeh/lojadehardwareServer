const sequelize = require('../config/database');
const setupAssociations = require('./associations');

// Importar models
const User = require('./User');
const Session = require('./Sessao');
const Product = require('./product');
const Association = require('./association');

// Coleção de models
const models = {
    User,
    Session,
    Product,
    Association
};

// Configurar associações
setupAssociations(models);

// Exportar models e sequelize
module.exports = {
    ...models,
    sequelize
};