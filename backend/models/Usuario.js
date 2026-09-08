const { DataTypes } = require('sequelize')
const db = require('../db/conn')

const Usuario = db.define('usuario', {
    codUsuario: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nome: {
        type: DataTypes.STRING(80),
        allowNull: false
    },
    email: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true
    },
    senha: {
        type: DataTypes.STRING(255), 
        allowNull: false 
    },
    telefone: {
        type: DataTypes.STRING(20),
        allowNull: false
    },
    cpf: { 
        type: DataTypes.STRING(14),
        allowNull: false,
        unique: true
    },
    cep: {
        type: DataTypes.STRING(9),
        allowNull: false
    },
    rua: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    numero: {
        type: DataTypes.STRING(12),
        allowNull: false
    },
    bairro: {
        type: DataTypes.STRING(70),
        allowNull: false
    },
    cidade: {
        type: DataTypes.STRING(70),
        allowNull: false
    },
    uf: {
        type: DataTypes.STRING(2),
        allowNull: false
    },
    identidade: {
        type: DataTypes.STRING(20),
        allowNull: true
    },
    tipo: {
        type: DataTypes.ENUM('CLIENTE', 'ADMIN'),
        allowNull: false,
        defaultValue: 'CLIENTE',
        field: 'tipo_usuario'
    }
}, {
    timestamps: false, 
    tableName: 'usuarios'
})

module.exports = Usuario
