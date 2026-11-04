const conn = require('./db/conn')
const { Categoria, Produto, Estoque } = require('./models/rel')

const veiculosFixos = [
    {
        categoria: 'Picape',
        descricaoCategoria: 'Picapes disponíveis na loja',
        nome: 'Ford Maverick Lariat FX4',
        marca: 'Ford',
        modelo: 'Maverick',
        versao: 'Lariat FX4',
        ano: 2024,
        preco: 239990,
        quilometragem: 0,
        combustivel: 'Gasolina',
        cambio: 'Automático',
        cor: 'Cinza',
        descricao: 'Picape moderna, confortável e pronta para todos os caminhos.',
        imagem: 'ford-maverick.avif'
    },
    {
        categoria: 'Elétrico',
        descricaoCategoria: 'Veículos elétricos disponíveis na loja',
        nome: 'BYD Dolphin Mini',
        marca: 'BYD',
        modelo: 'Dolphin Mini',
        versao: 'Elétrico',
        ano: 2025,
        preco: 119800,
        quilometragem: 0,
        combustivel: 'Elétrico',
        cambio: 'Automático',
        cor: 'Azul',
        descricao: 'Compacto elétrico, econômico e ideal para o uso urbano.',
        imagem: 'dolphin-mini.webp'
    },
    {
        categoria: 'SUV',
        descricaoCategoria: 'Utilitários esportivos disponíveis na loja',
        nome: 'Jeep Compass Longitude',
        marca: 'Jeep',
        modelo: 'Compass',
        versao: 'Longitude',
        ano: 2024,
        preco: 189990,
        quilometragem: 12000,
        combustivel: 'Flex',
        cambio: 'Automático',
        cor: 'Preto',
        descricao: 'SUV espaçoso, completo e com excelente desempenho.',
        imagem: 'jeep-compass.jpg'
    },
    {
        categoria: 'Hatch',
        descricaoCategoria: 'Veículos hatch disponíveis na loja',
        nome: 'Chevrolet Onix Hatch LT',
        marca: 'Chevrolet',
        modelo: 'Onix Hatch',
        versao: 'LT',
        ano: 2024,
        preco: 94990,
        quilometragem: 8500,
        combustivel: 'Flex',
        cambio: 'Automático',
        cor: 'Branco',
        descricao: 'Hatch confortável, econômico e completo para o dia a dia.',
        imagem: 'onix-hatch.jpg'
    }
]

const sincronizar = async () => {
    try {
        await conn.sync()

        for (const valores of veiculosFixos) {
            let categoria = await Categoria.findOne({ where: { nome: valores.categoria } })

            if (!categoria) {
                categoria = await Categoria.create({
                    nome: valores.categoria,
                    descricao: valores.descricaoCategoria
                })
            }

            let produto = await Produto.findOne({ where: { nome: valores.nome } })

            if (!produto) {
                produto = await Produto.create({
                    idCategoria: categoria.codCategoria,
                    nome: valores.nome,
                    marca: valores.marca,
                    modelo: valores.modelo,
                    versao: valores.versao,
                    ano: valores.ano,
                    preco: valores.preco,
                    quilometragem: valores.quilometragem,
                    combustivel: valores.combustivel,
                    cambio: valores.cambio,
                    cor: valores.cor,
                    descricao: valores.descricao,
                    imagem: valores.imagem,
                    ativo: true
                })
            }

            const estoque = await Estoque.findOne({ where: { idProduto: produto.codProduto } })

            if (!estoque) {
                await Estoque.create({
                    idProduto: produto.codProduto,
                    quantidade: 1,
                    quantidade_minima: 0
                })
            }
        }

        console.log('Banco sincronizado e 4 veículos fixos cadastrados com sucesso!')
    } catch (err) {
        console.error('Erro ao sincronizar o banco de dados!', err.message)
    } finally {
        await conn.close()
    }
}

sincronizar()
