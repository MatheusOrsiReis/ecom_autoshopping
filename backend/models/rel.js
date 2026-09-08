const Usuario = require('./Usuario')
const Pedido = require('./Pedido')
const Produto = require('./Produto')
const ItemPedido = require('./ItemPedido')
const Entrega = require('./Entrega')
const Estoque = require('./Estoque')
const Categoria = require('./Categoria')


// 1. RELACIONAMENTOS CATEGORIA & PRODUTO
Categoria.hasMany(Produto, {
    foreignKey: 'idCategoria',
    as: 'produtosCategoria',
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE'
})

Produto.belongsTo(Categoria, {
    foreignKey: 'idCategoria',
    as: 'categoriaProduto'
})


// 2. RELACIONAMENTOS USUÁRIO & PEDIDO
Usuario.hasMany(Pedido, { 
    foreignKey: 'idUsuario', 
    as: 'pedidosUsuario', 
    onDelete: 'CASCADE', 
    onUpdate: 'CASCADE' 
})

Pedido.belongsTo(Usuario, { 
    foreignKey: 'idUsuario', 
    as: 'usuarioPedido' 
})


// 3. RELACIONAMENTOS PEDIDO (ITEM_PEDIDO E ENTREGA)
Pedido.hasMany(ItemPedido, { 
    foreignKey: 'idPedido', 
    as: 'itensPedido', 
    onDelete: 'CASCADE', 
    onUpdate: 'CASCADE' 
})

ItemPedido.belongsTo(Pedido, { 
    foreignKey: 'idPedido', 
    as: 'pedidoItem' 
})

Pedido.hasOne(Entrega, { 
    foreignKey: 'idPedido', 
    as: 'entregaPedido', 
    onDelete: 'CASCADE', 
    onUpdate: 'CASCADE' 
})

Entrega.belongsTo(Pedido, { 
    foreignKey: 'idPedido', 
    as: 'pedidoEntrega' 
})


// 4. RELACIONAMENTOS PRODUTO (ITEM_PEDIDO E ESTOQUE)
Produto.hasMany(ItemPedido, { 
    foreignKey: 'idProduto', 
    as: 'itensProduto', 
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE' 
})

ItemPedido.belongsTo(Produto, { 
    foreignKey: 'idProduto', 
    as: 'produtoItem' 
})

Produto.hasOne(Estoque, { 
    foreignKey: 'idProduto', 
    as: 'estoqueProduto', 
    onDelete: 'CASCADE', 
    onUpdate: 'CASCADE' 
})

Estoque.belongsTo(Produto, { 
    foreignKey: 'idProduto', 
    as: 'produtoEstoque' 
})


module.exports = { 
    Usuario, 
    Pedido, 
    Produto, 
    ItemPedido, 
    Entrega, 
    Estoque,
    Categoria
}
