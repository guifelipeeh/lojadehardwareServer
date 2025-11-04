const userService = require("../service/userService");
const bcrypt = require('bcrypt');
const Sessao = require('../model/Sessao');
const jwt = require('jsonwebtoken');  
const moment = require('moment-timezone');

const createUser = async (req, res) => {
  try {
    const user = await userService.createUser(req.body);
    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const registerUser = async (req, res) => {
  try {
    console.log(req.body);

    const user = await userService.getUser(req.body);

    if (user != null) {
      console.log("deu erro");
      return res.status(400).json({ error: "Usuario ja cadastrado" });
    } else {
      console.log("deu certo");
      var hash = await bcrypt.hash(req.body.password, 10);
      req.body.password = hash;
      const newuser = await userService.registerUser(req.body);
      res.status(200).json(newuser);
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await userService.login(email, password);

    // Verifica se o usuário foi encontrado
    if (!user) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    // Verifica a senha
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    // Invalida sessões anteriores
    await Sessao.destroy({ where: { usuarioid: user.id, invalido: false } });

    // Remove a senha do objeto user
    user.password = undefined;
    
    // Gera token JWT
    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });
    const expiracao = moment().tz('America/Sao_Paulo').add(1, 'hour').toDate();
    
    // Cria nova sessão
    await Sessao.create({ usuarioid: user.id, token, expiracao, invalido: false });
    
    return res.status(200).json({ 
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        endereco: user.endereco,
        telefone: user.telefone,
        cpf: user.cpf
      }, 
      token 
    });

  } catch (error) {
    console.error("Erro no login:", error);
    res.status(401).json({ error: error.message });
  }
};

const logout = async (req, res) => {
  try {
    // Extrai o token da requisição
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(400).json({ error: 'Token não fornecido' });
    }

    console.log("Fazendo o logout do backend token:" + token);
    var resp = await userService.logout(token);

    res.status(200).json(resp);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    const user = await userService.deleteUser(req.body);
    return res.status(200).json(user);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

const updateUserController = async (req, res) => {
  try {
    const userData = req.body;
    
    // Chama o serviço correto - userService.updateUser
    const updatedUser = await userService.updateUser(userData);
    
    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Usuário atualizado com sucesso',
      user: updatedUser
    });

  } catch (error) {
    console.error("Erro no controller:", error);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar usuário',
      error: error.message
    });
  }
};

const getUsers = async (req, res) => {
  try {
    const users = await userService.getUsers();
    res.status(200).json(users);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const seekUserByCpf = async (req, res) => {
  try {
    const user = await userService.seekUserByCpf(req.params.cpf);
    res.status(200).json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const searchUserByFeatName = async (req, res) => {
  try {
    const users = await userService.searchUserByFeatName(req.params.name);    
    res.status(200).json(users);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const getallUsers = async (req, res) => {
  try {
    const users = await userService.getallUsers();
    res.status(200).json(users);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const uploadImage = async (req, res) => {

  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(400).json({ success: false, error: 'Token não fornecido' });
  }
  try {
    // Verifica a sessão do usuário
    const session = await Sessao.findOne({ where: { token, invalido: false } });
    if (!session) {
      return res.status(401).json({ success: false, error: 'Sessão inválida ou expirada' });
    }
    const userId = session.usuarioid;
    const imagePath = req.file.filename; // Salva apenas o nome do arquivo

    // Atualiza o caminho da imagem do usuário no banco de dados
    const updatedUser = await userService.uploadImage(userId, imagePath);

    if (!updatedUser) {
      return res.status(404).json({ success: false, error: 'Usuário nao encontrado' });
    }

    return res.status(200).json({ success: true, message: 'Imagem atualizada com sucesso', user: updatedUser });


  }catch (error) {
    console.error("Erro ao fazer upload da imagem: Erro no controller", error);
    return res.status(500).json({ success: false, error: 'Erro ao fazer upload da imagem' });
  }
};



module.exports = {
  uploadImage,
  createUser,
  registerUser, 
  login,
  logout,
  deleteUser,
  updateUserController,
  getUsers,
  seekUserByCpf,
  searchUserByFeatName,
  getallUsers
};