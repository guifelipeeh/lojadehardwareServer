require('dotenv').config();
const express = require('express');
const app = express();
const cors = require('cors');
const userRoutes = require('./routes/userRoutes');
const productRoutes = require('./routes/productRoutes');


// Importações CORRETAS
const sequelize = require('./config/database'); // ✅ Importa a instância do Sequelize
const User = require('./model/User'); // ✅ Verifique se o caminho está correto
const Sessao = require('./model/Sessao'); 
const Product = require('./model/product');
const Association = require('./model/association');




const upload = require('./config/multer'); // Configuração do multer
// Middleware para servir arquivos estáticos (imagens)
app.use('/media/image', express.static('uploads'));
app.use(express.json());

// Middleware para permitir requisições de diferentes origens
app.use(cors());


// Middleware para verificar se o banco está pronto
let isDatabaseReady = false;

async function initializeDatabase() {
  try {
    // ✅ CORRETO: sequelize já é a instância configurada
    await sequelize.authenticate();
    console.log('✅ Conexão bem-sucedida com o banco de dados.');

    // ✅ Sincroniza os modelos
    
    await User.sync({ alter: true });
    console.log('✅ Tabela User sincronizada com sucesso.');

    await Sessao.sync({ alter: true });
    console.log('✅ Tabela Sessao sincronizada com sucesso.');
    
    await Product.sync({ alter: true });
    console.log('✅ Tabela Product sincronizada com sucesso.');
    await Association.sync({ alter: true });
    console.log('✅ Tabela Association sincronizada com sucesso.');


    isDatabaseReady = true;
    return true;
  } catch (error) {
    console.error('❌ Erro ao inicializar o banco de dados:', error);
    throw error;
  }
}

// Middleware para verificar se o banco está pronto
app.use((req, res, next) => {
  if (!isDatabaseReady) {
    return res.status(503).json({ 
      error: 'Sistema em inicialização. Tente novamente em alguns instantes.' 
    });
  }
  next();
});



app.use(cors());





// Rotas
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);

// Rota de fallback

// Tratamento de erros global
app.use((error, req, res, next) => {
  console.error('❌ Erro não tratado:', error);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

// Inicialização do servidor
async function startServer() {
  try {
    await initializeDatabase();
    
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`🚀 Servidor rodando na porta ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Falha ao iniciar o servidor:', error);
    process.exit(1);
  }
}

// Iniciar servidor
startServer();

// Tratamento de sinais de graceful shutdown
process.on('SIGINT', async () => {
  console.log('🔄 Encerrando servidor...');
  await sequelize.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('🔄 Encerrando servidor...');
  await sequelize.close();
  process.exit(0);
});