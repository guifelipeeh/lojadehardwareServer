const User = require('../model/User');
const Sessao = require('../model/Sessao');
const { Op } = require('sequelize'); // Importar Op para operadores like

const createUser = async (user) => {
    const newUser = await User.create(user);
    return newUser;
};

const updateUser = async (userData) => {
    try {
        console.log("service updateUser", userData);
        
        // Verifica se o ID está presente
        if (!userData.id) {
            throw new Error('ID do usuário é obrigatório');
        }

        // Extrai o ID e remove do objeto de dados
        const userId = userData.id;
        const updateData = { ...userData };
        delete updateData.id;

        // Atualiza o usuário com where clause
        const [affectedCount] = await User.update(updateData, {
            where: { id: userId }
        });

        console.log("affectedCount", affectedCount);

        // Se nenhum registro foi atualizado, retorna null
        if (affectedCount === 0) {
            return null;
        }

        // Busca o usuário atualizado
        const updatedUser = await User.findByPk(userId);
        console.log("updatedUser", updatedUser);

        return updatedUser;

    } catch (error) {
        console.error("Erro no updateUser service:", error);
        throw error;
    }
};

const deleteUser = async (user) => {
    console.log("Deletando usuário:", user);
    const deletedUser = await User.destroy({ where: { id: user.id } });
    return deletedUser;
};

const login = async (email) => {
    const loggedUser = await User.findOne({ where: { email: email} });

    console.log(loggedUser);
    
    if (!loggedUser) {
        throw new Error("Usuário ou senha incorretos");
    }

    return loggedUser;
};

const logout = async (token) => {
   
    await Sessao.destroy({ where: { token } });
    
   return "Logout realizado com sucesso";
};

const registerUser = async (user) => {
    console.log(user);
    const registeredUser = await User.create(user);
    return registeredUser;
};

const getUser = async (user) => {
    const loggedUser = await User.findOne({ where: { email: user.email } });
    return loggedUser;
};

const getallUsers = async () => {
    const users = await User.findAll();
    return users;
};

const seekUserByCpf = async (cpf) => {
    const user = await User.findOne({ where: { cpf: cpf } });
    return user;
};

const searchUserByFeatName = async (name) => {
    const users = await User.findAll({ 
        where: { 
            name: { 
                [Op.like]: `%${name}%` 
            } 
        } 
    });
    return users;
};

module.exports = { 
    createUser, 
    updateUser, 
    deleteUser, 
    login, 
    logout, 
    registerUser, 
    getUser, 
    getallUsers, 
    seekUserByCpf, 
    searchUserByFeatName 
};