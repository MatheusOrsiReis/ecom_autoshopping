const express = require('express')
const app = express()
const cors = require('cors')
const conn = require('./db/conn')
require('./models/rel')

const authController = require('./controller/auth.controller')
const usuarioController = require('./controller/usuario.controller')
const categoriaController = require('./controller/categoria.controller')
const produtoController = require('./controller/produto.controller')
const estoqueController = require('./controller/estoque.controller')
const pedidoController = require('./controller/pedido.controller')
const itemPedidoController = require('./controller/itemPedido.controller')
const entregaController = require('./controller/entrega.controller')
const relatorioController = require('./controller/relatorio.controller')
const { autenticar, autenticarOpcional, somenteAdmin } = require('./middleware/auth.middleware')

const hostname = 'localhost' // 127.0.0.1
const PORT = 3000

// ---- Middleware ---------
app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(cors())
// -------------------------

app.get('/', (req, res) => {
    res.json({ message: 'Aplicação rodando!' })
})

// ---- Autenticação e usuários ---------
app.post('/login', authController.login)
app.post('/usuario', autenticarOpcional, usuarioController.cadastrar)
app.get('/usuarios', autenticar, somenteAdmin, usuarioController.listar)
app.get('/usuario/:id', autenticar, usuarioController.consultar)
app.put('/usuario/:id', autenticar, usuarioController.atualizar)
app.delete('/usuario/:id', autenticar, usuarioController.apagar)

// ---- Categorias ---------
app.post('/categoria', autenticar, somenteAdmin, categoriaController.cadastrar)
app.get('/categorias', categoriaController.listar)
app.get('/categoria/:id', categoriaController.consultar)
app.put('/categoria/:id', autenticar, somenteAdmin, categoriaController.atualizar)
app.delete('/categoria/:id', autenticar, somenteAdmin, categoriaController.apagar)

// ---- Produtos ---------
app.post('/produto', autenticar, somenteAdmin, produtoController.cadastrar)
app.get('/produtos', produtoController.listar)
app.get('/produto/:id', produtoController.consultar)
app.put('/produto/:id', autenticar, somenteAdmin, produtoController.atualizar)
app.delete('/produto/:id', autenticar, somenteAdmin, produtoController.apagar)

// ---- Estoque ---------
app.post('/estoque', autenticar, somenteAdmin, estoqueController.cadastrar)
app.get('/estoques', autenticar, somenteAdmin, estoqueController.listar)
app.get('/estoque/produto/:produtoId', estoqueController.consultarPorProduto)
app.get('/estoque/:id', autenticar, somenteAdmin, estoqueController.consultar)
app.put('/estoque/:id', autenticar, somenteAdmin, estoqueController.atualizar)
app.delete('/estoque/:id', autenticar, somenteAdmin, estoqueController.apagar)

// ---- Pedidos e itens ---------
app.post('/pedido', autenticar, pedidoController.cadastrar)
app.get('/pedidos', autenticar, pedidoController.listar)
app.get('/pedido/:id', autenticar, pedidoController.consultar)
app.put('/pedido/:id', autenticar, pedidoController.atualizar)
app.delete('/pedido/:id', autenticar, somenteAdmin, pedidoController.apagar)

app.post('/item-pedido', autenticar, somenteAdmin, itemPedidoController.cadastrar)
app.get('/itens-pedido', autenticar, itemPedidoController.listar)
app.get('/item-pedido/:id', autenticar, itemPedidoController.consultar)
app.put('/item-pedido/:id', autenticar, somenteAdmin, itemPedidoController.atualizar)
app.delete('/item-pedido/:id', autenticar, somenteAdmin, itemPedidoController.apagar)

// ---- Entregas ---------
app.post('/entrega', autenticar, entregaController.cadastrar)
app.get('/entregas', autenticar, entregaController.listar)
app.get('/entrega/:id', autenticar, entregaController.consultar)
app.put('/entrega/:id', autenticar, entregaController.atualizar)
app.delete('/entrega/:id', autenticar, somenteAdmin, entregaController.apagar)

// ---- Relatório ---------
app.get('/relatorio/resumo', autenticar, somenteAdmin, relatorioController.resumo)

app.use((req, res) => {
    res.status(404).json({ message: 'Rota não encontrada!' })
})

// -------------------------
conn.sync()
.then(() => {
    app.listen(PORT, hostname, () => {
        console.log(`Servidor rodando em http://${hostname}:${PORT}`)
    })
})
.catch((err) => {
    console.error('Erro ao sincronizar com o BD!', err)
})
