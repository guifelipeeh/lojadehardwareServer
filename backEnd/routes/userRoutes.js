const express = require('express');
const userRoutes = express.Router();
const userController = require('../controller/userController');





userRoutes.post('/logout', userController.logout)



userRoutes.get('/', (req, res) => {
  res.send(` 

    <div style="display: flex;justify-content: center;align-items: center;height: 100vh">

      <h1 style="font-size: 50px; text-align: center">Bem vindo ao Servidor da Loja de Hardware</h1>

+
    </div>
    `);
});

userRoutes.post('/login', userController.login)





userRoutes.put('/update', userController.updateUserController)
userRoutes.get('/allUsers', userController.getallUsers)
userRoutes.get('/seekByCpf/:cpf', userController.seekUserByCpf)
userRoutes.get('/searchByFeatName/:name', userController.searchUserByFeatName)
userRoutes.post('/register', userController.registerUser)
userRoutes.delete('/delete', userController.deleteUser,(req, res) => {
  res.status(200).json({ message: 'chegamos na rota de delete' });
});


module.exports = userRoutes;
