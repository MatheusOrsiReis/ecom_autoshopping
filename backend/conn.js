require('dotenv').config()
const mysql = require('mysql2/promise')

async function conectarBanco() {
    let conexao

    try {
        const nomeBanco = process.env.DB_NAME

        if (!/^[a-zA-Z0-9_]+$/.test(nomeBanco)) {
            throw new Error('O nome do banco de dados configurado no .env é inválido.')
        }

        conexao = await mysql.createConnection({
            host: process.env.DB_HOST,
            port: process.env.DB_PORT,
            user: process.env.DB_USER,
            password: process.env.DB_PASS
        })

        await conexao.query(
            `CREATE DATABASE IF NOT EXISTS \`${nomeBanco}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
        )

        console.log(`Conexão realizada! Banco de dados "${nomeBanco}" pronto para uso.`)
    } catch (err) {
        console.error('Erro ao conectar ou criar o banco de dados!', err.message)
        process.exitCode = 1
    } finally {
        if (conexao) await conexao.end()
    }
}

conectarBanco()
