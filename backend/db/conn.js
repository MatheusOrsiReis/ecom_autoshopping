require('dotenv').config() // Carrega as variáveis de ambiente
const { Sequelize } = require('sequelize')

const db = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASS,
    {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        dialect: 'mysql'
    }
)

module.exports = db
