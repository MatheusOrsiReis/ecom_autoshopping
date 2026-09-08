const { DataTypes } = require('sequelize')
const db = require('../db/conn') 

const Entrega = db.define('entrega', {
    codEntrega: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    idPedido: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true, 
        references: {
            model: 'pedidos', 
            key: 'codPedido'  
        }
    },
    tipo: {
        type: DataTypes.ENUM('ENTREGA', 'RETIRADA'),
        allowNull: false,
        defaultValue: 'ENTREGA'
    },
    endereco: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    cep: { 
        type: DataTypes.STRING(9), 
        allowNull: true 
    },
    logradouro: { 
        type: DataTypes.STRING(70), 
        allowNull: true 
    },
    complemento: { 
        type: DataTypes.STRING(100), 
        allowNull: true 
    },
    bairro: { 
        type: DataTypes.STRING(70), 
        allowNull: true 
    },
    localidade: { 
        type: DataTypes.STRING(70), 
        allowNull: true 
    },
    uf: { 
        type: DataTypes.STRING(2), 
        allowNull: true 
    },
    numero: { 
        type: DataTypes.STRING(12), 
        allowNull: true 
    },    
    previsao: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        field: 'dataEstimada'
    },
    codigoRastreio: {
        type: DataTypes.STRING(50),
        allowNull: true,
        unique: true
    },
    status: {
        type: DataTypes.ENUM('AGUARDANDO', 'EM_TRANSITO', 'SAIU_PARA_ENTREGA', 'ENTREGUE', 'EXTRAVIADO'),
        allowNull: false,
        defaultValue: 'AGUARDANDO',
        field: 'statusEntrega'
    }
}, {
    timestamps: false,
    tableName: 'entregas'
})

module.exports = Entrega
