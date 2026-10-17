const { Usuario, Produto, Estoque, Pedido, Categoria } = require('../models/rel')

const resumo = async (req, res) => {
    try {
        const usuarios = await Usuario.findAll()
        const produtos = await Produto.findAll()
        const estoques = await Estoque.findAll()
        const pedidos = await Pedido.findAll()

        let produtosDisponiveis = 0
        estoques.forEach((estoque) => {
            if (estoque.quantidade > 0) produtosDisponiveis++
        })

        let faturamento = 0
        const pedidosPorStatus = []

        pedidos.forEach((pedido) => {
            if (pedido.status !== 'CANCELADO') {
                faturamento += Number(pedido.valorTotal)
            }

            const statusEncontrado = pedidosPorStatus.find((item) => item.status === pedido.status)
            if (statusEncontrado) {
                statusEncontrado.quantidade++
            } else {
                pedidosPorStatus.push({
                    status: pedido.status,
                    quantidade: 1
                })
            }
        })

        return res.json({
            totalUsuarios: usuarios.length,
            totalProdutos: produtos.length,
            produtosDisponiveis,
            totalPedidos: pedidos.length,
            faturamento,
            pedidosPorStatus
        })
    } catch (err) {
        console.error(err)
        return res.status(500).json({ message: 'Erro ao gerar relatório!' })
    }
}

const vendas = async (req, res) => {
    try {
        const pedidos = await Pedido.findAll()
        const faturamentoMensal = []

        pedidos.forEach((pedido) => {
            if (pedido.status !== 'CANCELADO') {
                const data = new Date(pedido.dataPedido)
                const chave = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`
                const mesEncontrado = faturamentoMensal.find((item) => item.mes === chave)

                if (mesEncontrado) {
                    mesEncontrado.total += Number(pedido.valorTotal)
                } else {
                    const dataMes = new Date(`${chave}-01T00:00:00Z`)
                    const rotulo = dataMes.toLocaleDateString('pt-BR', {
                        month: 'short',
                        year: 'numeric',
                        timeZone: 'UTC'
                    }).replace('.', '')

                    faturamentoMensal.push({
                        mes: chave,
                        rotulo: rotulo,
                        total: Number(pedido.valorTotal)
                    })
                }
            }
        })

        faturamentoMensal.forEach((item) => {
            item.total = Number(item.total.toFixed(2))
        })

        return res.json({ faturamentoMensal })
    } catch (err) {
        console.error(err)
        return res.status(500).json({ message: 'Erro ao gerar relatório de vendas!' })
    }
}

const estoque = async (req, res) => {
    try {
        const categorias = await Categoria.findAll()
        const produtos = await Produto.findAll()
        const estoques = await Estoque.findAll()
        const estoquePorCategoria = []

        produtos.forEach((produto) => {
            const categoria = categorias.find((item) => item.codCategoria === produto.idCategoria)
            const estoqueProduto = estoques.find((item) => item.idProduto === produto.codProduto)
            const nomeCategoria = categoria ? categoria.nome : 'Sem categoria'
            const quantidade = estoqueProduto ? Number(estoqueProduto.quantidade) : 0
            const categoriaEncontrada = estoquePorCategoria.find((item) => item.categoria === nomeCategoria)

            if (categoriaEncontrada) {
                categoriaEncontrada.unidades += quantidade
                categoriaEncontrada.produtos++
            } else {
                estoquePorCategoria.push({
                    categoria: nomeCategoria,
                    unidades: quantidade,
                    produtos: 1
                })
            }
        })

        return res.json({ estoquePorCategoria })
    } catch (err) {
        console.error(err)
        return res.status(500).json({ message: 'Erro ao gerar relatório de estoque!' })
    }
}

module.exports = { resumo, vendas, estoque }
