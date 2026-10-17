const { Pedido, ItemPedido, Produto, Estoque, Entrega, Usuario } = require('../models/rel')

const cadastrar = async (req, res) => {
    const valores = req.body

    try {
        if (!Array.isArray(valores.itens) || valores.itens.length === 0) {
            return res.status(400).json({ message: 'O pedido deve possuir pelo menos um produto!' })
        }

        if (!valores.entrega || !['ENTREGA', 'RETIRADA'].includes(valores.entrega.tipo)) {
            return res.status(400).json({ message: 'Informe uma entrega com tipo ENTREGA ou RETIRADA!' })
        }

        if (valores.entrega.tipo === 'ENTREGA' && !valores.entrega.endereco && !valores.entrega.logradouro) {
            return res.status(400).json({ message: 'Informe o endereço para a entrega!' })
        }

        let idUsuario = req.usuario.id
        if (req.usuario.tipo === 'ADMIN' && valores.usuarioId) {
            idUsuario = Number(valores.usuarioId)
        }

        const usuario = await Usuario.findOne({ where: { codUsuario: idUsuario } })
        if (!usuario) {
            return res.status(404).json({ message: 'Usuário não encontrado!' })
        }

        const itensRecebidos = []

        for (const item of valores.itens) {
            const produtoId = Number(item.produtoId)
            const quantidade = Number(item.quantidade)

            if (!Number.isInteger(produtoId) || !Number.isInteger(quantidade) || quantidade <= 0) {
                return res.status(400).json({ message: 'Cada item precisa de produtoId e quantidade inteira positiva!' })
            }

            const itemRepetido = itensRecebidos.find((itemSalvo) => {
                return itemSalvo.produtoId === produtoId
            })

            if (itemRepetido) {
                itemRepetido.quantidade += quantidade
            } else {
                itensRecebidos.push({ produtoId, quantidade })
            }
        }

        const itensCalculados = []
        let valorSubtotal = 0

        for (const item of itensRecebidos) {
            const produto = await Produto.findOne({
                where: { codProduto: item.produtoId }
            })
            const estoque = await Estoque.findOne({
                where: { idProduto: item.produtoId }
            })

            if (!produto || !produto.ativo) {
                return res.status(404).json({ message: `Produto ${item.produtoId} não encontrado ou inativo!` })
            }

            if (!estoque || estoque.quantidade < item.quantidade) {
                return res.status(409).json({ message: `Estoque insuficiente para o produto ${produto.nome}!` })
            }

            const precoUnitario = Number(produto.preco)
            const valorTotalItem = precoUnitario * item.quantidade
            valorSubtotal += valorTotalItem

            itensCalculados.push({
                produto: produto,
                estoque: estoque,
                quantidade: item.quantidade,
                precoUnitario: precoUnitario,
                valorTotalItem: valorTotalItem
            })
        }

        let valorFrete = Number(valores.valorFrete || 0)
        if (valores.entrega.tipo === 'RETIRADA') valorFrete = 0

        if (valorFrete < 0) {
            return res.status(400).json({ message: 'O valor do frete não pode ser negativo!' })
        }

        let desconto = 0
        if (valorSubtotal >= 200000) desconto = valorSubtotal * 0.05

        const pedido = await Pedido.create({
            idUsuario: idUsuario,
            valorSubtotal: valorSubtotal,
            valorFrete: valorFrete,
            desconto: desconto,
            valorTotal: valorSubtotal + valorFrete - desconto
        })

        for (const item of itensCalculados) {
            await ItemPedido.create({
                idPedido: pedido.codPedido,
                idProduto: item.produto.codProduto,
                quantidade: item.quantidade,
                precoUnitario: item.precoUnitario,
                valorTotalItem: item.valorTotalItem
            })

            item.estoque.quantidade -= item.quantidade
            await item.estoque.save()
        }

        await Entrega.create({
            idPedido: pedido.codPedido,
            tipo: valores.entrega.tipo,
            endereco: valores.entrega.endereco,
            cep: valores.entrega.cep,
            logradouro: valores.entrega.logradouro,
            complemento: valores.entrega.complemento,
            bairro: valores.entrega.bairro,
            localidade: valores.entrega.localidade,
            uf: valores.entrega.uf,
            numero: valores.entrega.numero,
            previsao: valores.entrega.previsao,
            codigoRastreio: valores.entrega.codigoRastreio,
            status: 'AGUARDANDO'
        })

        return res.status(201).json(pedido)
    } catch (err) {
        console.error(err)
        return res.status(500).json({ message: 'Erro ao cadastrar pedido!' })
    }
}

const listar = async (req, res) => {
    try {
        let pedidos = await Pedido.findAll()

        if (req.usuario.tipo !== 'ADMIN') {
            pedidos = pedidos.filter((pedido) => pedido.idUsuario === req.usuario.id)
        }

        if (req.query.status) {
            pedidos = pedidos.filter((pedido) => pedido.status === req.query.status)
        }

        const resposta = []

        for (const pedido of pedidos) {
            const dados = pedido.toJSON()
            const usuario = await Usuario.findOne({
                where: { codUsuario: pedido.idUsuario }
            })

            if (usuario) {
                dados.usuarioPedido = usuario.toJSON()
                delete dados.usuarioPedido.senha
            }

            const itens = await ItemPedido.findAll({
                where: { idPedido: pedido.codPedido }
            })
            dados.itensPedido = []

            for (const item of itens) {
                const dadosItem = item.toJSON()
                dadosItem.produtoItem = await Produto.findOne({
                    where: { codProduto: item.idProduto }
                })
                dados.itensPedido.push(dadosItem)
            }

            dados.entregaPedido = await Entrega.findOne({
                where: { idPedido: pedido.codPedido }
            })
            resposta.push(dados)
        }

        return res.json(resposta)
    } catch (err) {
        console.error(err)
        return res.status(500).json({ message: 'Erro ao listar pedidos!' })
    }
}

const consultar = async (req, res) => {
    try {
        const id = req.params.id
        const pedido = await Pedido.findOne({ where: { codPedido: id } })

        if (!pedido) {
            return res.status(404).json({ message: 'Pedido não encontrado!' })
        }

        if (req.usuario.tipo !== 'ADMIN' && pedido.idUsuario !== req.usuario.id) {
            return res.status(403).json({ message: 'Você não pode consultar este pedido!' })
        }

        const resposta = pedido.toJSON()
        const usuario = await Usuario.findOne({ where: { codUsuario: pedido.idUsuario } })

        if (usuario) {
            resposta.usuarioPedido = usuario.toJSON()
            delete resposta.usuarioPedido.senha
        }

        const itens = await ItemPedido.findAll({ where: { idPedido: pedido.codPedido } })
        resposta.itensPedido = []

        for (const item of itens) {
            const dadosItem = item.toJSON()
            dadosItem.produtoItem = await Produto.findOne({
                where: { codProduto: item.idProduto }
            })
            resposta.itensPedido.push(dadosItem)
        }

        resposta.entregaPedido = await Entrega.findOne({
            where: { idPedido: pedido.codPedido }
        })

        return res.json(resposta)
    } catch (err) {
        console.error(err)
        return res.status(500).json({ message: 'Erro ao consultar pedido!' })
    }
}

const atualizar = async (req, res) => {
    const valores = req.body

    try {
        const id = req.params.id
        const pedido = await Pedido.findOne({ where: { codPedido: id } })

        if (!pedido) {
            return res.status(404).json({ message: 'Pedido não encontrado!' })
        }

        if (req.usuario.tipo !== 'ADMIN' && pedido.idUsuario !== req.usuario.id) {
            return res.status(403).json({ message: 'Você não pode atualizar este pedido!' })
        }

        if (!['PENDENTE_PAGAMENTO', 'PAGO', 'ENVIADO', 'ENTREGUE', 'CANCELADO'].includes(valores.status)) {
            return res.status(400).json({ message: 'Status de pedido inválido!' })
        }

        if (req.usuario.tipo !== 'ADMIN' && valores.status !== 'CANCELADO') {
            return res.status(403).json({ message: 'Clientes somente podem cancelar pedidos!' })
        }

        if (req.usuario.tipo !== 'ADMIN' && pedido.status !== 'PENDENTE_PAGAMENTO') {
            return res.status(409).json({ message: 'O cliente somente pode cancelar um pedido pendente!' })
        }

        if (pedido.status === 'ENTREGUE' && valores.status === 'CANCELADO') {
            return res.status(409).json({ message: 'Um pedido entregue não pode ser cancelado!' })
        }

        if (pedido.status === 'CANCELADO' && valores.status !== 'CANCELADO') {
            return res.status(409).json({ message: 'Um pedido cancelado não pode ser reaberto!' })
        }

        if (valores.status === 'CANCELADO' && pedido.status !== 'CANCELADO') {
            const itens = await ItemPedido.findAll({
                where: { idPedido: pedido.codPedido }
            })

            for (const item of itens) {
                const estoque = await Estoque.findOne({
                    where: { idProduto: item.idProduto }
                })

                if (estoque) {
                    estoque.quantidade += item.quantidade
                    await estoque.save()
                }
            }
        }

        pedido.status = valores.status
        await pedido.save()

        const entrega = await Entrega.findOne({ where: { idPedido: pedido.codPedido } })

        if (entrega && valores.status === 'ENTREGUE') {
            entrega.status = 'ENTREGUE'
            await entrega.save()
        }

        if (entrega && valores.status === 'ENVIADO') {
            entrega.status = 'EM_TRANSITO'
            await entrega.save()
        }

        return res.json(pedido)
    } catch (err) {
        console.error(err)
        return res.status(500).json({ message: 'Erro ao atualizar pedido!' })
    }
}

const apagar = async (req, res) => {
    try {
        const id = req.params.id
        const pedido = await Pedido.findOne({ where: { codPedido: id } })

        if (!pedido) {
            return res.status(404).json({ message: 'Pedido não encontrado!' })
        }

        if (pedido.status !== 'CANCELADO') {
            const itens = await ItemPedido.findAll({ where: { idPedido: pedido.codPedido } })

            for (const item of itens) {
                const estoque = await Estoque.findOne({ where: { idProduto: item.idProduto } })

                if (estoque) {
                    estoque.quantidade += item.quantidade
                    await estoque.save()
                }
            }
        }

        await pedido.destroy()
        return res.json({ message: 'Pedido apagado e estoque restaurado com sucesso!' })
    } catch (err) {
        console.error(err)
        return res.status(500).json({ message: 'Erro ao apagar pedido!' })
    }
}

module.exports = { cadastrar, listar, consultar, atualizar, apagar }
