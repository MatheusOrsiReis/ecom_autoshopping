const { DataTypes } = require('sequelize')
const db = require('../db/conn') 

const Produto = db.define('produto', {
    codProduto: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    idCategoria: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'categorias',
            key: 'codCategoria'
        }
    },
    nome: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    marca: {
        type: DataTypes.STRING(50),
        allowNull: false
    },
    modelo: {
        type: DataTypes.STRING(80),
        allowNull: false
    },
    versao: {
        type: DataTypes.STRING(80),
        allowNull: true
    },
    ano: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    quilometragem: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    combustivel: {
        type: DataTypes.STRING(30),
        allowNull: false
    },
    cambio: {
        type: DataTypes.STRING(30),
        allowNull: false
    },
    cor: {
        type: DataTypes.STRING(30),
        allowNull: false
    },
    descricao: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    preco: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    imagem: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'imagem_url'
    },
    ativo: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    }
}, {
    timestamps: false,
    tableName: 'produtos'
})

module.exports = Produto
