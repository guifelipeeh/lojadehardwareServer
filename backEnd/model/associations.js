
const setupAssociations = (models) => {
    const { User, Session, Product, Association } = models;
    
    // User -> Session (1:N)
    User.hasMany(Session, {
        foreignKey: 'user_id',
        as: 'sessions'
    });
    Session.belongsTo(User, {
        foreignKey: 'user_id',
        as: 'user'
    });
    
    // User -> Product (1:N) - Vendedor dos produtos
    User.hasMany(Product, {
        foreignKey: 'user_id',
        as: 'products'
    });
    Product.belongsTo(User, {
        foreignKey: 'user_id',
        as: 'seller'
    });
    
    // User -> Association (1:N)
    User.hasMany(Association, {
        foreignKey: 'user_id',
        as: 'associations'
    });
    Association.belongsTo(User, {
        foreignKey: 'user_id',
        as: 'user'
    });
    
    // Product -> Association (1:N)
    Product.hasMany(Association, {
        foreignKey: 'product_id',
        as: 'associations'
    });
    Association.belongsTo(Product, {
        foreignKey: 'product_id',
        as: 'product'
    });
    
    // Relacionamentos N:N através da tabela Association
    User.belongsToMany(Product, {
        through: Association,
        foreignKey: 'user_id',
        otherKey: 'product_id',
        as: 'associated_products'
    });
    
    Product.belongsToMany(User, {
        through: Association,
        foreignKey: 'product_id',
        otherKey: 'user_id',
        as: 'associated_users'
    });
};

module.exports = setupAssociations;