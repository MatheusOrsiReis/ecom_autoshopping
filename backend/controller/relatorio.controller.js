const { Op, fn, col } = require('sequelize')
const { Usuario, Produto, Estoque, Pedido } = require('../models/rel')

async function resumo(req, res) {
    try {
        const [
            totalUsuarios,
            totalProdutos,
            produtosDisponiveis,
            totalPedidos,
            faturamento,
            pedidosPorStatus
        ] = await Promise.all([
            Usuario.count(),
            Produto.count(),
            Estoque.count({ where: { quantidade: { [Op.gt]: 0 } } }),
            Pedido.count(),
            Pedido.sum('valorTotal', { where: { status: { [Op.ne]: 'CANCELADO' } } }),
            Pedido.findAll({
                attributes: ['status', [fn('COUNT', col('codPedido')), 'quantidade']],
                group: ['status'],
                raw: true
            })
        ])

        return res.json({
            totalUsuarios,
            totalProdutos,
            produtosDisponiveis,
            totalPedidos,
            faturamento: Number(faturamento || 0),
            pedidosPorStatus
        })
    } catch (err) {
        console.error(err)
        return res.status(500).json({ message: 'Erro ao gerar relatório!' })
    }
}

module.exports = { resumo }

