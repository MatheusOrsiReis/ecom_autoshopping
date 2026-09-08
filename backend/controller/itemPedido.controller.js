const conn = require('../db/conn')
const { ItemPedido, Pedido, Produto, Estoque } = require('../models/rel')

function tratarErro(res, err) {
    if (err.name === 'SequelizeForeignKeyConstraintError') {
        return res.status(400).json({ message: 'Pedido ou produto inválido!' })
    }

    console.error(err)
    return res.status(500).json({ message: 'Erro interno ao processar item do pedido!' })
}

async function recalcularPedido(pedido, transaction) {
    const subtotal = Number(await ItemPedido.sum('valorTotalItem', {
        where: { idPedido: pedido.codPedido },
        transaction
    }) || 0)

    pedido.valorSubtotal = subtotal
    pedido.valorTotal = Math.max(0, subtotal + Number(pedido.valorFrete) - Number(pedido.desconto))
    await pedido.save({ transaction })
}

async function cadastrar(req, res) {
    const transaction = await conn.transaction()

    try {
        const quantidade = Number(req.body.quantidade)
        if (!req.body.idPedido || !req.body.idProduto || !Number.isInteger(quantidade) || quantidade <= 0) {
            await transaction.rollback()
            return res.status(400).json({ message: 'Pedido, produto e quantidade positiva são obrigatórios!' })
        }

        const pedido = await Pedido.findByPk(req.body.idPedido, { transaction, lock: transaction.LOCK.UPDATE })
        const produto = await Produto.findByPk(req.body.idProduto, { transaction })
        const estoque = await Estoque.findOne({
            where: { idProduto: req.body.idProduto },
            transaction,
            lock: transaction.LOCK.UPDATE
        })

        if (!pedido || !produto) {
            await transaction.rollback()
            return res.status(404).json({ message: 'Pedido ou produto não encontrado!' })
        }

        if (pedido.status !== 'PENDENTE_PAGAMENTO') {
            await transaction.rollback()
            return res.status(409).json({ message: 'Somente pedidos pendentes podem ter itens alterados!' })
        }

        const existente = await ItemPedido.findOne({
            where: { idPedido: pedido.codPedido, idProduto: produto.codProduto },
            transaction
        })
        if (existente) {
            await transaction.rollback()
            return res.status(409).json({ message: 'Este produto já pertence ao pedido!' })
        }

        if (!estoque || estoque.quantidade < quantidade) {
            await transaction.rollback()
            return res.status(409).json({ message: 'Estoque insuficiente!' })
        }

        const precoUnitario = Number(produto.preco)
        const item = await ItemPedido.create({
            idPedido: pedido.codPedido,
            idProduto: produto.codProduto,
            quantidade,
            precoUnitario,
            valorTotalItem: precoUnitario * quantidade
        }, { transaction })

        estoque.quantidade -= quantidade
        await estoque.save({ transaction })
        await recalcularPedido(pedido, transaction)
        await transaction.commit()

        return res.status(201).json(item)
    } catch (err) {
        if (!transaction.finished) await transaction.rollback()
        return tratarErro(res, err)
    }
}

async function listar(req, res) {
    try {
        const incluirPedido = { model: Pedido, as: 'pedidoItem' }
        if (req.usuario.tipo !== 'ADMIN') {
            incluirPedido.where = { idUsuario: req.usuario.id }
        }

        const itens = await ItemPedido.findAll({
            include: [
                incluirPedido,
                { model: Produto, as: 'produtoItem' }
            ],
            order: [['codItemPedido', 'ASC']]
        })
        return res.json(itens)
    } catch (err) {
        return tratarErro(res, err)
    }
}

async function consultar(req, res) {
    try {
        const item = await ItemPedido.findByPk(req.params.id, {
            include: [
                { model: Pedido, as: 'pedidoItem' },
                { model: Produto, as: 'produtoItem' }
            ]
        })

        if (!item) {
            return res.status(404).json({ message: 'Item do pedido não encontrado!' })
        }

        if (req.usuario.tipo !== 'ADMIN' && item.pedidoItem.idUsuario !== req.usuario.id) {
            return res.status(403).json({ message: 'Você não pode consultar este item!' })
        }

        return res.json(item)
    } catch (err) {
        return tratarErro(res, err)
    }
}

async function atualizar(req, res) {
    const transaction = await conn.transaction()

    try {
        const quantidade = Number(req.body.quantidade)
        if (!Number.isInteger(quantidade) || quantidade <= 0) {
            await transaction.rollback()
            return res.status(400).json({ message: 'A quantidade deve ser um inteiro positivo!' })
        }

        const item = await ItemPedido.findByPk(req.params.id, { transaction, lock: transaction.LOCK.UPDATE })
        if (!item) {
            await transaction.rollback()
            return res.status(404).json({ message: 'Item do pedido não encontrado!' })
        }

        const pedido = await Pedido.findByPk(item.idPedido, { transaction, lock: transaction.LOCK.UPDATE })
        if (pedido.status !== 'PENDENTE_PAGAMENTO') {
            await transaction.rollback()
            return res.status(409).json({ message: 'Somente pedidos pendentes podem ter itens alterados!' })
        }

        const estoque = await Estoque.findOne({
            where: { idProduto: item.idProduto },
            transaction,
            lock: transaction.LOCK.UPDATE
        })
        const diferenca = quantidade - item.quantidade

        if (diferenca > 0 && (!estoque || estoque.quantidade < diferenca)) {
            await transaction.rollback()
            return res.status(409).json({ message: 'Estoque insuficiente!' })
        }

        if (estoque) {
            estoque.quantidade -= diferenca
            await estoque.save({ transaction })
        }

        item.quantidade = quantidade
        item.valorTotalItem = Number(item.precoUnitario) * quantidade
        await item.save({ transaction })
        await recalcularPedido(pedido, transaction)
        await transaction.commit()

        return res.json(item)
    } catch (err) {
        if (!transaction.finished) await transaction.rollback()
        return tratarErro(res, err)
    }
}

async function apagar(req, res) {
    const transaction = await conn.transaction()

    try {
        const item = await ItemPedido.findByPk(req.params.id, { transaction, lock: transaction.LOCK.UPDATE })
        if (!item) {
            await transaction.rollback()
            return res.status(404).json({ message: 'Item do pedido não encontrado!' })
        }

        const pedido = await Pedido.findByPk(item.idPedido, { transaction, lock: transaction.LOCK.UPDATE })
        if (pedido.status !== 'PENDENTE_PAGAMENTO') {
            await transaction.rollback()
            return res.status(409).json({ message: 'Somente pedidos pendentes podem ter itens alterados!' })
        }

        const quantidadeItens = await ItemPedido.count({ where: { idPedido: pedido.codPedido }, transaction })
        if (quantidadeItens === 1) {
            await transaction.rollback()
            return res.status(409).json({ message: 'O pedido deve manter pelo menos um item!' })
        }

        await Estoque.increment(
            { quantidade: item.quantidade },
            { where: { idProduto: item.idProduto }, transaction }
        )
        await item.destroy({ transaction })
        await recalcularPedido(pedido, transaction)
        await transaction.commit()

        return res.json({ message: 'Item removido e estoque restaurado com sucesso!' })
    } catch (err) {
        if (!transaction.finished) await transaction.rollback()
        return tratarErro(res, err)
    }
}

module.exports = { cadastrar, listar, consultar, atualizar, apagar }

