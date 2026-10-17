const { ItemPedido, Pedido, Produto, Estoque } = require('../models/rel')

const cadastrar = async (req, res) => {
    const valores = req.body

    try {
        const quantidade = Number(valores.quantidade)

        if (!valores.idPedido || !valores.idProduto || !Number.isInteger(quantidade) || quantidade <= 0) {
            return res.status(400).json({ message: 'Pedido, produto e quantidade positiva são obrigatórios!' })
        }

        const pedido = await Pedido.findOne({
            where: { codPedido: valores.idPedido }
        })
        const produto = await Produto.findOne({
            where: { codProduto: valores.idProduto }
        })
        const estoque = await Estoque.findOne({
            where: { idProduto: valores.idProduto }
        })

        if (!pedido || !produto) {
            return res.status(404).json({ message: 'Pedido ou produto não encontrado!' })
        }

        if (pedido.status !== 'PENDENTE_PAGAMENTO') {
            return res.status(409).json({ message: 'Somente pedidos pendentes podem ter itens alterados!' })
        }

        const itemCadastrado = await ItemPedido.findOne({
            where: {
                idPedido: pedido.codPedido,
                idProduto: produto.codProduto
            }
        })

        if (itemCadastrado) {
            return res.status(409).json({ message: 'Este produto já pertence ao pedido!' })
        }

        if (!estoque || estoque.quantidade < quantidade) {
            return res.status(409).json({ message: 'Estoque insuficiente!' })
        }

        const precoUnitario = Number(produto.preco)
        const item = await ItemPedido.create({
            idPedido: pedido.codPedido,
            idProduto: produto.codProduto,
            quantidade: quantidade,
            precoUnitario: precoUnitario,
            valorTotalItem: precoUnitario * quantidade
        })

        estoque.quantidade -= quantidade
        await estoque.save()

        const itens = await ItemPedido.findAll({ where: { idPedido: pedido.codPedido } })
        let subtotal = 0

        itens.forEach((itemPedido) => {
            subtotal += Number(itemPedido.valorTotalItem)
        })

        let desconto = 0
        if (subtotal >= 200000) desconto = subtotal * 0.05

        pedido.valorSubtotal = subtotal
        pedido.desconto = desconto
        pedido.valorTotal = subtotal + Number(pedido.valorFrete) - desconto
        await pedido.save()

        return res.status(201).json(item)
    } catch (err) {
        console.error(err)
        return res.status(500).json({ message: 'Erro ao cadastrar item do pedido!' })
    }
}

const listar = async (req, res) => {
    try {
        let itens = await ItemPedido.findAll()

        if (req.usuario.tipo !== 'ADMIN') {
            const pedidos = await Pedido.findAll({ where: { idUsuario: req.usuario.id } })

            itens = itens.filter((item) => {
                return pedidos.find((pedido) => pedido.codPedido === item.idPedido)
            })
        }

        return res.json(itens)
    } catch (err) {
        console.error(err)
        return res.status(500).json({ message: 'Erro ao listar itens do pedido!' })
    }
}

const consultar = async (req, res) => {
    try {
        const id = req.params.id
        const item = await ItemPedido.findOne({ where: { codItemPedido: id } })

        if (!item) {
            return res.status(404).json({ message: 'Item do pedido não encontrado!' })
        }

        const pedido = await Pedido.findOne({ where: { codPedido: item.idPedido } })

        if (req.usuario.tipo !== 'ADMIN' && pedido.idUsuario !== req.usuario.id) {
            return res.status(403).json({ message: 'Você não pode consultar este item!' })
        }

        return res.json(item)
    } catch (err) {
        console.error(err)
        return res.status(500).json({ message: 'Erro ao consultar item do pedido!' })
    }
}

const atualizar = async (req, res) => {
    const valores = req.body

    try {
        const quantidade = Number(valores.quantidade)

        if (!Number.isInteger(quantidade) || quantidade <= 0) {
            return res.status(400).json({ message: 'A quantidade deve ser um inteiro positivo!' })
        }

        const id = req.params.id
        const item = await ItemPedido.findOne({ where: { codItemPedido: id } })

        if (!item) {
            return res.status(404).json({ message: 'Item do pedido não encontrado!' })
        }

        const pedido = await Pedido.findOne({ where: { codPedido: item.idPedido } })

        if (pedido.status !== 'PENDENTE_PAGAMENTO') {
            return res.status(409).json({ message: 'Somente pedidos pendentes podem ter itens alterados!' })
        }

        const estoque = await Estoque.findOne({ where: { idProduto: item.idProduto } })
        const diferenca = quantidade - item.quantidade

        if (diferenca > 0 && (!estoque || estoque.quantidade < diferenca)) {
            return res.status(409).json({ message: 'Estoque insuficiente!' })
        }

        if (estoque) {
            estoque.quantidade -= diferenca
            await estoque.save()
        }

        item.quantidade = quantidade
        item.valorTotalItem = Number(item.precoUnitario) * quantidade
        await item.save()

        const itens = await ItemPedido.findAll({ where: { idPedido: pedido.codPedido } })
        let subtotal = 0

        itens.forEach((itemPedido) => {
            subtotal += Number(itemPedido.valorTotalItem)
        })

        let desconto = 0
        if (subtotal >= 200000) desconto = subtotal * 0.05

        pedido.valorSubtotal = subtotal
        pedido.desconto = desconto
        pedido.valorTotal = subtotal + Number(pedido.valorFrete) - desconto
        await pedido.save()

        return res.json(item)
    } catch (err) {
        console.error(err)
        return res.status(500).json({ message: 'Erro ao atualizar item do pedido!' })
    }
}

const apagar = async (req, res) => {
    try {
        const id = req.params.id
        const item = await ItemPedido.findOne({ where: { codItemPedido: id } })

        if (!item) {
            return res.status(404).json({ message: 'Item do pedido não encontrado!' })
        }

        const pedido = await Pedido.findOne({ where: { codPedido: item.idPedido } })

        if (pedido.status !== 'PENDENTE_PAGAMENTO') {
            return res.status(409).json({ message: 'Somente pedidos pendentes podem ter itens alterados!' })
        }

        const itensPedido = await ItemPedido.findAll({ where: { idPedido: pedido.codPedido } })

        if (itensPedido.length === 1) {
            return res.status(409).json({ message: 'O pedido deve manter pelo menos um item!' })
        }

        const estoque = await Estoque.findOne({ where: { idProduto: item.idProduto } })

        if (estoque) {
            estoque.quantidade += item.quantidade
            await estoque.save()
        }

        await item.destroy()

        const itens = await ItemPedido.findAll({ where: { idPedido: pedido.codPedido } })
        let subtotal = 0

        itens.forEach((itemPedido) => {
            subtotal += Number(itemPedido.valorTotalItem)
        })

        let desconto = 0
        if (subtotal >= 200000) desconto = subtotal * 0.05

        pedido.valorSubtotal = subtotal
        pedido.desconto = desconto
        pedido.valorTotal = subtotal + Number(pedido.valorFrete) - desconto
        await pedido.save()

        return res.json({ message: 'Item removido e estoque restaurado com sucesso!' })
    } catch (err) {
        console.error(err)
        return res.status(500).json({ message: 'Erro ao apagar item do pedido!' })
    }
}

module.exports = { cadastrar, listar, consultar, atualizar, apagar }
