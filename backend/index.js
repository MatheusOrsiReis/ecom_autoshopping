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
app.patch('/usuario/:id', autenticar, usuarioController.atualizar)
app.delete('/usuario/:id', autenticar, usuarioController.apagar)

// Mesmas operações com os nomes no plural pedidos no enunciado
app.post('/usuarios', autenticarOpcional, usuarioController.cadastrar)
app.get('/usuarios/perfil', autenticar, usuarioController.perfil)
app.get('/usuarios/buscar', autenticar, somenteAdmin, usuarioController.buscarPorNome)
app.get('/usuarios/:id', autenticar, usuarioController.consultar)
app.put('/usuarios/:id', autenticar, usuarioController.atualizar)
app.patch('/usuarios/:id', autenticar, usuarioController.atualizar)
app.delete('/usuarios/:id', autenticar, usuarioController.apagar)

// ---- Categorias ---------
app.post('/categoria', autenticar, somenteAdmin, categoriaController.cadastrar)
app.get('/categorias', categoriaController.listar)
app.get('/categoria/:id', categoriaController.consultar)
app.put('/categoria/:id', autenticar, somenteAdmin, categoriaController.atualizar)
app.patch('/categoria/:id', autenticar, somenteAdmin, categoriaController.atualizar)
app.delete('/categoria/:id', autenticar, somenteAdmin, categoriaController.apagar)

app.post('/categorias', autenticar, somenteAdmin, categoriaController.cadastrar)
app.get('/categorias/buscar', categoriaController.buscarPorNome)
app.get('/categorias/:id', categoriaController.consultar)
app.put('/categorias/:id', autenticar, somenteAdmin, categoriaController.atualizar)
app.patch('/categorias/:id', autenticar, somenteAdmin, categoriaController.atualizar)
app.delete('/categorias/:id', autenticar, somenteAdmin, categoriaController.apagar)

// ---- Produtos ---------
app.post('/produto', autenticar, somenteAdmin, produtoController.cadastrar)
app.get('/produtos', produtoController.listar)
app.get('/produto/:id', produtoController.consultar)
app.put('/produto/:id', autenticar, somenteAdmin, produtoController.atualizar)
app.patch('/produto/:id', autenticar, somenteAdmin, produtoController.atualizar)
app.delete('/produto/:id', autenticar, somenteAdmin, produtoController.apagar)

app.post('/produtos', autenticar, somenteAdmin, produtoController.cadastrar)
app.get('/produtos/buscar', produtoController.buscarPorNome)
app.get('/produtos/:id', produtoController.consultar)
app.put('/produtos/:id', autenticar, somenteAdmin, produtoController.atualizar)
app.patch('/produtos/:id', autenticar, somenteAdmin, produtoController.atualizar)
app.delete('/produtos/:id', autenticar, somenteAdmin, produtoController.apagar)

// ---- Estoque ---------
app.post('/estoque', autenticar, somenteAdmin, estoqueController.cadastrar)
app.get('/estoques', autenticar, somenteAdmin, estoqueController.listar)
app.get('/estoque/produto/:produtoId', estoqueController.consultarPorProduto)
app.get('/estoque/:id', autenticar, somenteAdmin, estoqueController.consultar)
app.put('/estoque/:id', autenticar, somenteAdmin, estoqueController.atualizar)
app.patch('/estoque/:id', autenticar, somenteAdmin, estoqueController.atualizar)
app.delete('/estoque/:id', autenticar, somenteAdmin, estoqueController.apagar)

app.post('/estoques', autenticar, somenteAdmin, estoqueController.cadastrar)
app.get('/estoques/produto/:produtoId', estoqueController.consultarPorProduto)
app.get('/estoques/:id', autenticar, somenteAdmin, estoqueController.consultar)
app.put('/estoques/:id', autenticar, somenteAdmin, estoqueController.atualizar)
app.patch('/estoques/:id', autenticar, somenteAdmin, estoqueController.atualizar)
app.delete('/estoques/:id', autenticar, somenteAdmin, estoqueController.apagar)

// ---- Pedidos e itens ---------
app.post('/pedido', autenticar, pedidoController.cadastrar)
app.get('/pedidos', autenticar, pedidoController.listar)
app.get('/pedido/:id', autenticar, pedidoController.consultar)
app.put('/pedido/:id', autenticar, pedidoController.atualizar)
app.patch('/pedido/:id', autenticar, pedidoController.atualizar)
app.delete('/pedido/:id', autenticar, somenteAdmin, pedidoController.apagar)

app.post('/pedidos', autenticar, pedidoController.cadastrar)
app.get('/pedidos/meus-pedidos', autenticar, pedidoController.listar)
app.get('/pedidos/:id', autenticar, pedidoController.consultar)
app.put('/pedidos/:id', autenticar, pedidoController.atualizar)
app.patch('/pedidos/:id', autenticar, pedidoController.atualizar)
app.delete('/pedidos/:id', autenticar, somenteAdmin, pedidoController.apagar)

app.post('/item-pedido', autenticar, somenteAdmin, itemPedidoController.cadastrar)
app.get('/itens-pedido', autenticar, itemPedidoController.listar)
app.get('/item-pedido/:id', autenticar, itemPedidoController.consultar)
app.put('/item-pedido/:id', autenticar, somenteAdmin, itemPedidoController.atualizar)
app.patch('/item-pedido/:id', autenticar, somenteAdmin, itemPedidoController.atualizar)
app.delete('/item-pedido/:id', autenticar, somenteAdmin, itemPedidoController.apagar)

app.post('/itens-pedido', autenticar, somenteAdmin, itemPedidoController.cadastrar)
app.get('/itens-pedido/:id', autenticar, itemPedidoController.consultar)
app.put('/itens-pedido/:id', autenticar, somenteAdmin, itemPedidoController.atualizar)
app.patch('/itens-pedido/:id', autenticar, somenteAdmin, itemPedidoController.atualizar)
app.delete('/itens-pedido/:id', autenticar, somenteAdmin, itemPedidoController.apagar)

// ---- Entregas ---------
app.post('/entrega', autenticar, entregaController.cadastrar)
app.get('/entregas', autenticar, entregaController.listar)
app.get('/entrega/:id', autenticar, entregaController.consultar)
app.put('/entrega/:id', autenticar, entregaController.atualizar)
app.patch('/entrega/:id', autenticar, entregaController.atualizar)
app.delete('/entrega/:id', autenticar, somenteAdmin, entregaController.apagar)

app.post('/entregas', autenticar, entregaController.cadastrar)
app.get('/entregas/:id', autenticar, entregaController.consultar)
app.put('/entregas/:id', autenticar, entregaController.atualizar)
app.patch('/entregas/:id', autenticar, entregaController.atualizar)
app.delete('/entregas/:id', autenticar, somenteAdmin, entregaController.apagar)

// ---- Relatório ---------
app.get('/relatorio/resumo', autenticar, somenteAdmin, relatorioController.resumo)
app.get('/relatorios/resumo', autenticar, somenteAdmin, relatorioController.resumo)
app.get('/relatorios/vendas', autenticar, somenteAdmin, relatorioController.vendas)
app.get('/relatorios/estoque', autenticar, somenteAdmin, relatorioController.estoque)

app.use((req, res) => {
    res.status(404).json({ message: 'Rota não encontrada!' })
})

// -------------------------
conn.authenticate()
.then(() => {
    app.listen(PORT, hostname, () => {
        console.log('Conexão com o banco de dados realizada com sucesso!')
        console.log(`Servidor rodando em http://${hostname}:${PORT}`)
    })
})
.catch((err) => {
    console.error('Erro ao conectar com o banco de dados!', err.message)
})
