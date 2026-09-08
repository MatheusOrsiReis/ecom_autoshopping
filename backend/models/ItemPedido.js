const { DataTypes } = require('sequelize')
const db = require('../db/conn')

const ItemPedido = db.define('itemPedido', {
    codItemPedido: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    idPedido: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'pedidos', 
            key: 'codPedido'  
        }
    },
    idProduto: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'produtos', 
            key: 'codProduto'  
        }
    },
    quantidade: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1
    },
    precoUnitario: {
        type: DataTypes.DECIMAL(10, 2), 
        allowNull: false
    },
    valorTotalItem: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00
    }
}, {
    timestamps: false, 
    tableName: 'itens_pedidos'
})

module.exports = ItemPedido