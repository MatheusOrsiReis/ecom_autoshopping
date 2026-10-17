const { Entrega, Pedido } = require('../models/rel')

const cadastrar = async (req, res) => {
    const valores = req.body

    try {
        if (!valores.idPedido || !['ENTREGA', 'RETIRADA'].includes(valores.tipo)) {
            return res.status(400).json({ message: 'Pedido e tipo ENTREGA ou RETIRADA são obrigatórios!' })
        }

        if (valores.tipo === 'ENTREGA' && !valores.endereco && !valores.logradouro) {
            return res.status(400).json({ message: 'Informe o endereço para a entrega!' })
        }

        const pedido = await Pedido.findOne({
            where: { codPedido: valores.idPedido }
        })

        if (!pedido) {
            return res.status(404).json({ message: 'Pedido não encontrado!' })
        }

        if (req.usuario.tipo !== 'ADMIN' && pedido.idUsuario !== req.usuario.id) {
            return res.status(403).json({ message: 'Você não pode criar a entrega deste pedido!' })
        }

        const entregaCadastrada = await Entrega.findOne({
            where: { idPedido: valores.idPedido }
        })

        if (entregaCadastrada) {
            return res.status(409).json({ message: 'O pedido já possui entrega!' })
        }

        if (valores.codigoRastreio) {
            const rastreioCadastrado = await Entrega.findOne({
                where: { codigoRastreio: valores.codigoRastreio }
            })

            if (rastreioCadastrado) {
                return res.status(409).json({ message: 'O código de rastreio já está cadastrado!' })
            }
        }

        let status = 'AGUARDANDO'
        if (req.usuario.tipo === 'ADMIN' && valores.status) status = valores.status

        const entrega = await Entrega.create({
            idPedido: valores.idPedido,
            tipo: valores.tipo,
            endereco: valores.endereco,
            cep: valores.cep,
            logradouro: valores.logradouro,
            complemento: valores.complemento,
            bairro: valores.bairro,
            localidade: valores.localidade,
            uf: valores.uf,
            numero: valores.numero,
            previsao: valores.previsao,
            codigoRastreio: valores.codigoRastreio,
            status: status
        })

        return res.status(201).json(entrega)
    } catch (err) {
        console.error(err)
        return res.status(500).json({ message: 'Erro ao cadastrar entrega!' })
    }
}

const listar = async (req, res) => {
    try {
        let entregas = await Entrega.findAll()

        if (req.usuario.tipo !== 'ADMIN') {
            const pedidos = await Pedido.findAll({ where: { idUsuario: req.usuario.id } })

            entregas = entregas.filter((entrega) => {
                return pedidos.find((pedido) => pedido.codPedido === entrega.idPedido)
            })
        }

        return res.json(entregas)
    } catch (err) {
        console.error(err)
        return res.status(500).json({ message: 'Erro ao listar entregas!' })
    }
}

const consultar = async (req, res) => {
    try {
        const id = req.params.id
        const entrega = await Entrega.findOne({ where: { codEntrega: id } })

        if (!entrega) {
            return res.status(404).json({ message: 'Entrega não encontrada!' })
        }

        const pedido = await Pedido.findOne({ where: { codPedido: entrega.idPedido } })

        if (req.usuario.tipo !== 'ADMIN' && pedido.idUsuario !== req.usuario.id) {
            return res.status(403).json({ message: 'Você não pode consultar esta entrega!' })
        }

        return res.json(entrega)
    } catch (err) {
        console.error(err)
        return res.status(500).json({ message: 'Erro ao consultar entrega!' })
    }
}

const atualizar = async (req, res) => {
    const valores = req.body

    try {
        const id = req.params.id
        const entrega = await Entrega.findOne({ where: { codEntrega: id } })

        if (!entrega) {
            return res.status(404).json({ message: 'Entrega não encontrada!' })
        }

        const pedido = await Pedido.findOne({ where: { codPedido: entrega.idPedido } })

        if (req.usuario.tipo !== 'ADMIN' && pedido.idUsuario !== req.usuario.id) {
            return res.status(403).json({ message: 'Você não pode atualizar esta entrega!' })
        }

        if (valores.tipo && !['ENTREGA', 'RETIRADA'].includes(valores.tipo)) {
            return res.status(400).json({ message: 'Tipo de entrega inválido!' })
        }

        if (valores.status && req.usuario.tipo !== 'ADMIN') {
            return res.status(403).json({ message: 'Somente administradores podem alterar o status da entrega!' })
        }

        if (valores.status && !['AGUARDANDO', 'EM_TRANSITO', 'SAIU_PARA_ENTREGA', 'ENTREGUE', 'EXTRAVIADO'].includes(valores.status)) {
            return res.status(400).json({ message: 'Status de entrega inválido!' })
        }

        if (valores.codigoRastreio) {
            const rastreioCadastrado = await Entrega.findOne({
                where: { codigoRastreio: valores.codigoRastreio }
            })

            if (rastreioCadastrado && rastreioCadastrado.codEntrega !== entrega.codEntrega) {
                return res.status(409).json({ message: 'O código de rastreio já está cadastrado!' })
            }
        }

        if (valores.tipo !== undefined) entrega.tipo = valores.tipo
        if (valores.endereco !== undefined) entrega.endereco = valores.endereco
        if (valores.cep !== undefined) entrega.cep = valores.cep
        if (valores.logradouro !== undefined) entrega.logradouro = valores.logradouro
        if (valores.complemento !== undefined) entrega.complemento = valores.complemento
        if (valores.bairro !== undefined) entrega.bairro = valores.bairro
        if (valores.localidade !== undefined) entrega.localidade = valores.localidade
        if (valores.uf !== undefined) entrega.uf = valores.uf
        if (valores.numero !== undefined) entrega.numero = valores.numero
        if (valores.previsao !== undefined) entrega.previsao = valores.previsao
        if (valores.codigoRastreio !== undefined) entrega.codigoRastreio = valores.codigoRastreio
        if (valores.status !== undefined) entrega.status = valores.status

        await entrega.save()
        return res.json(entrega)
    } catch (err) {
        console.error(err)
        return res.status(500).json({ message: 'Erro ao atualizar entrega!' })
    }
}

const apagar = async (req, res) => {
    try {
        const id = req.params.id
        const entrega = await Entrega.findOne({ where: { codEntrega: id } })

        if (!entrega) {
            return res.status(404).json({ message: 'Entrega não encontrada!' })
        }

        await entrega.destroy()
        return res.json({ message: 'Entrega apagada com sucesso!' })
    } catch (err) {
        console.error(err)
        return res.status(500).json({ message: 'Erro ao apagar entrega!' })
    }
}

module.exports = { cadastrar, listar, consultar, atualizar, apagar }
