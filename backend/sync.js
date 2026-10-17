const conn = require('./db/conn') 

// Importa as 7 tabelas e seus relacionamentos.
require('./models/rel')

conn.sync()
.then(() => {
    console.log('Banco de dados sincronizado com sucesso! As 7 tabelas estão prontas.')
    conn.close()
})
.catch((err) => {
    console.error('Erro ao sincronizar o banco de dados!', err.message)
    conn.close()
})
