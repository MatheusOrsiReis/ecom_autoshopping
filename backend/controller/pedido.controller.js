const conn = require('../db/conn')
const {
    Pedido,
    ItemPedido,
    Produto,
    Estoque,
    Entrega,
    Usuario,
    Categoria
} = require('../models/rel')

const statusPermitidos = ['PENDENTE_PAGAMENTO', 'PAGO', 'ENVIADO', 'ENTREGUE', 'CANCELADO']

function relacionamentosPedido() {
    return [
        { model: Usuario, as: 'usuarioPedido', attributes: { exclude: ['senha'] } },
        {
            model: ItemPedido,
            as: 'itensPedido',
            include: [{
                model: Produto,
                as: 'produtoItem',
                include: [{ model: Categoria, as: 'categoriaProduto' }]
            }]
        },
        { model: Entrega, as: 'entregaPedido' }
    ]
}

async function buscarPedido(id) {
    return Pedido.findByPk(id, { include: relacionamentosPedido() })
}

function podeAcessar(req, pedido) {
    return req.usuario.tipo === 'ADMIN' || pedido.idUsuario === req.usuario.id
}

function tratarErro(res, err) {
    if (err.name === 'SequelizeForeignKeyConstraintError') {
        return res.status(400).json({ message: 'Usuário, produto ou pedido inválido!' })
    }

    if (err.name === 'SequelizeValidationError') {
        return res.status(400).json({ message: err.errors[0].message })
    }

    console.error(err)
    return res.status(500).json({ message: 'Erro interno ao processar pedido!' })
}

async function cadastrar(req, res) {
    const transaction = await conn.transaction()

    try {
        const itensRecebidos = req.body.itens
        if (!Array.isArray(itensRecebidos) || itensRecebidos.length === 0) {
            await transaction.rollback()
            return res.status(400).json({ message: 'O pedido deve possuir pelo menos um produto!' })
        }

        if (!req.body.entrega || !['ENTREGA', 'RETIRADA'].includes(req.body.entrega.tipo)) {
            await transaction.rollback()
            return res.status(400).json({ message: 'Informe uma entrega com tipo ENTREGA ou RETIRADA!' })
        }

        if (req.body.entrega.tipo === 'ENTREGA' && !req.body.entrega.endereco && !req.body.entrega.logradouro) {
            await transaction.rollback()
            return res.status(400).json({ message: 'Informe o endereço para a entrega!' })
        }

        const usuarioId = req.usuario.tipo === 'ADMIN' && req.body.usuarioId
            ? Number(req.body.usuarioId)
            : req.usuario.id
        const usuario = await Usuario.findByPk(usuarioId, { transaction })

        if (!usuario) {
            await transaction.rollback()
            return res.status(404).json({ message: 'Usuário não encontrado!' })
        }

        const quantidades = new Map()
        for (const item of itensRecebidos) {
            const produtoId = Number(item.produtoId)
            const quantidade = Number(item.quantidade)

            if (!Number.isInteger(produtoId) || !Number.isInteger(quantidade) || quantidade <= 0) {
                await transaction.rollback()
                return res.status(400).json({ message: 'Cada item precisa de produtoId e quantidade inteira positiva!' })
            }

            quantidades.set(produtoId, (quantidades.get(produtoId) || 0) + quantidade)
        }

        const itensCalculados = []
        let valorSubtotal = 0

        for (const [produtoId, quantidade] of quantidades) {
            const produto = await Produto.findByPk(produtoId, {
                transaction,
                lock: transaction.LOCK.UPDATE
            })
            const estoque = await Estoque.findOne({
                where: { idProduto: produtoId },
                transaction,
                lock: transaction.LOCK.UPDATE
            })

            if (!produto || !produto.ativo) {
                await transaction.rollback()
                return res.status(404).json({ message: `Produto ${produtoId} não encontrado ou inativo!` })
            }

            if (!estoque || estoque.quantidade < quantidade) {
                await transaction.rollback()
                return res.status(409).json({ message: `Estoque insuficiente para o produto ${produto.nome}!` })
            }

            const precoUnitario = Number(produto.preco)
            const valorTotalItem = precoUnitario * quantidade
            valorSubtotal += valorTotalItem
            itensCalculados.push({ produto, estoque, quantidade, precoUnitario, valorTotalItem })
        }

        const valorFrete = req.body.entrega.tipo === 'RETIRADA'
            ? 0
            : Number(req.body.valorFrete || 0)
        const desconto = req.usuario.tipo === 'ADMIN'
            ? Number(req.body.desconto || 0)
            : 0

        if (valorFrete < 0 || desconto < 0 || desconto > valorSubtotal + valorFrete) {
            await transaction.rollback()
            return res.status(400).json({ message: 'Frete ou desconto inválido!' })
        }

        const pedido = await Pedido.create({
            idUsuario: usuarioId,
            valorSubtotal,
            valorFrete,
            desconto,
            valorTotal: valorSubtotal + valorFrete - desconto
        }, { transaction })

        for (const item of itensCalculados) {
            await ItemPedido.create({
                idPedido: pedido.codPedido,
                idProduto: item.produto.codProduto,
                quantidade: item.quantidade,
                precoUnitario: item.precoUnitario,
                valorTotalItem: item.valorTotalItem
            }, { transaction })

            item.estoque.quantidade -= item.quantidade
            await item.estoque.save({ transaction })
        }

        const dadosEntrega = req.body.entrega
        await Entrega.create({
            idPedido: pedido.codPedido,
            tipo: dadosEntrega.tipo,
            endereco: dadosEntrega.endereco,
            cep: dadosEntrega.cep,
            logradouro: dadosEntrega.logradouro,
            complemento: dadosEntrega.complemento,
            bairro: dadosEntrega.bairro,
            localidade: dadosEntrega.localidade,
            uf: dadosEntrega.uf,
            numero: dadosEntrega.numero,
            previsao: dadosEntrega.previsao,
            codigoRastreio: dadosEntrega.codigoRastreio,
            status: 'AGUARDANDO'
        }, { transaction })

        await transaction.commit()
        return res.status(201).json(await buscarPedido(pedido.codPedido))
    } catch (err) {
        if (!transaction.finished) await transaction.rollback()
        return tratarErro(res, err)
    }
}

async function listar(req, res) {
    try {
        const where = {}
        if (req.usuario.tipo !== 'ADMIN') where.idUsuario = req.usuario.id
        if (req.query.status) where.status = req.query.status

        const pedidos = await Pedido.findAll({
            where,
            include: relacionamentosPedido(),
            order: [['dataPedido', 'DESC']]
        })
        return res.json(pedidos)
    } catch (err) {
        return tratarErro(res, err)
    }
}

async function consultar(req, res) {
    try {
        const pedido = await buscarPedido(req.params.id)

        if (!pedido) {
            return res.status(404).json({ message: 'Pedido não encontrado!' })
        }

        if (!podeAcessar(req, pedido)) {
            return res.status(403).json({ message: 'Você não pode consultar este pedido!' })
        }

        return res.json(pedido)
    } catch (err) {
        return tratarErro(res, err)
    }
}

async function atualizar(req, res) {
    const transaction = await conn.transaction()

    try {
        const pedido = await Pedido.findByPk(req.params.id, {
            transaction,
            lock: transaction.LOCK.UPDATE
        })

        if (!pedido) {
            await transaction.rollback()
            return res.status(404).json({ message: 'Pedido não encontrado!' })
        }

        if (!podeAcessar(req, pedido)) {
            await transaction.rollback()
            return res.status(403).json({ message: 'Você não pode atualizar este pedido!' })
        }

        const novoStatus = req.body.status
        if (!statusPermitidos.includes(novoStatus)) {
            await transaction.rollback()
            return res.status(400).json({ message: 'Status de pedido inválido!' })
        }

        if (req.usuario.tipo !== 'ADMIN' && novoStatus !== 'CANCELADO') {
            await transaction.rollback()
            return res.status(403).json({ message: 'Clientes somente podem cancelar pedidos!' })
        }

        if (req.usuario.tipo !== 'ADMIN' && pedido.status !== 'PENDENTE_PAGAMENTO') {
            await transaction.rollback()
            return res.status(409).json({ message: 'O cliente somente pode cancelar um pedido pendente!' })
        }

        if (pedido.status === 'ENTREGUE' && novoStatus === 'CANCELADO') {
            await transaction.rollback()
            return res.status(409).json({ message: 'Um pedido entregue não pode ser cancelado!' })
        }

        if (pedido.status === 'CANCELADO' && novoStatus !== 'CANCELADO') {
            await transaction.rollback()
            return res.status(409).json({ message: 'Um pedido cancelado não pode ser reaberto!' })
        }

        if (novoStatus === 'CANCELADO' && pedido.status !== 'CANCELADO') {
            const itens = await ItemPedido.findAll({
                where: { idPedido: pedido.codPedido },
                transaction,
                lock: transaction.LOCK.UPDATE
            })

            for (const item of itens) {
                const estoque = await Estoque.findOne({
                    where: { idProduto: item.idProduto },
                    transaction,
                    lock: transaction.LOCK.UPDATE
                })
                if (estoque) {
                    estoque.quantidade += item.quantidade
                    await estoque.save({ transaction })
                }
            }
        }

        pedido.status = novoStatus
        await pedido.save({ transaction })

        if (novoStatus === 'ENTREGUE') {
            await Entrega.update(
                { status: 'ENTREGUE' },
                { where: { idPedido: pedido.codPedido }, transaction }
            )
        } else if (novoStatus === 'ENVIADO') {
            await Entrega.update(
                { status: 'EM_TRANSITO' },
                { where: { idPedido: pedido.codPedido }, transaction }
            )
        }

        await transaction.commit()
        return res.json(await buscarPedido(pedido.codPedido))
    } catch (err) {
        if (!transaction.finished) await transaction.rollback()
        return tratarErro(res, err)
    }
}

async function apagar(req, res) {
    const transaction = await conn.transaction()

    try {
        const pedido = await Pedido.findByPk(req.params.id, {
            transaction,
            lock: transaction.LOCK.UPDATE
        })

        if (!pedido) {
            await transaction.rollback()
            return res.status(404).json({ message: 'Pedido não encontrado!' })
        }

        if (pedido.status !== 'CANCELADO') {
            const itens = await ItemPedido.findAll({ where: { idPedido: pedido.codPedido }, transaction })
            for (const item of itens) {
                await Estoque.increment(
                    { quantidade: item.quantidade },
                    { where: { idProduto: item.idProduto }, transaction }
                )
            }
        }

        await pedido.destroy({ transaction })
        await transaction.commit()
        return res.json({ message: 'Pedido apagado e estoque restaurado com sucesso!' })
    } catch (err) {
        if (!transaction.finished) await transaction.rollback()
        return tratarErro(res, err)
    }
}

module.exports = { cadastrar, listar, consultar, atualizar, apagar }
