const conn = require('./db/conn') 

// Importa todas as 7 entidades com seus respectivos relacionamentos definidos em rel.js
require('./models/rel')

async function syncDataBase() {
    try {
        await conn.authenticate()
        console.log('Conexão com o banco de dados realizada com sucesso!')

        // Cria as tabelas que ainda não existem sem apagar os dados existentes.
        await conn.sync()
        
        console.log('--------------------------------------------------')
        console.log('Banco de Dados sincronizado com sucesso (7 Tabelas)!')
        console.log('--------------------------------------------------')

    } catch (err) {
        console.error('ERRO: Não foi possível sincronizar o banco de dados!', err)
    } finally {
        await conn.close()
        console.log('Conexão com o banco de dados fechada.')
    }
}

// Executa a função de sincronização do banco de dados
syncDataBase()
