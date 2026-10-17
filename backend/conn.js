require('dotenv').config()
const mysql = require('mysql2')

const conexao = mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASS
})

conexao.connect((err) => {
    if (err) {
        console.error('Erro ao conectar com o MySQL!', err.message)
        return
    }

    console.log('Conexão com o MySQL realizada com sucesso!')

    conexao.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME}`, (err) => {
        if (err) {
            console.error('Erro ao criar o banco de dados!', err.message)
        } else {
            console.log(`Banco de dados "${process.env.DB_NAME}" pronto para uso!`)
        }

        conexao.end()
    })
})
