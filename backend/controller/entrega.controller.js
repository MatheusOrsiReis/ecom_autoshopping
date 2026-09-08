const { Entrega, Pedido } = require('../models/rel')

const camposEntrega = [
    'tipo', 'endereco', 'cep', 'logradouro', 'complemento',
    'bairro', 'localidade', 'uf', 'numero', 'previsao',
    'codigoRastreio', 'status'
]
const statusPermitidos = ['AGUARDANDO', 'EM_TRANSITO', 'SAIU_PARA_ENTREGA', 'ENTREGUE', 'EXTRAVIADO']

function tratarErro(res, err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).json({ message: 'O pedido já possui entrega ou o rastreio já está cadastrado!' })
    }

    if (err.name === 'SequelizeForeignKeyConstraintError') {
        return res.status(400).json({ message: 'Pedido inválido!' })
    }

    console.error(err)
    return res.status(500).json({ message: 'Erro interno ao processar entrega!' })
}

function podeAcessar(req, entrega) {
    return req.usuario.tipo === 'ADMIN' || entrega.pedidoEntrega.idUsuario === req.usuario.id
}

async function cadastrar(req, res) {
    try {
        if (!req.body.idPedido || !['ENTREGA', 'RETIRADA'].includes(req.body.tipo)) {
            return res.status(400).json({ message: 'Pedido e tipo ENTREGA ou RETIRADA são obrigatórios!' })
        }

        if (req.body.tipo === 'ENTREGA' && !req.body.endereco && !req.body.logradouro) {
            return res.status(400).json({ message: 'Informe o endereço para a entrega!' })
        }

        const pedido = await Pedido.findByPk(req.body.idPedido)
        if (!pedido) {
            return res.status(404).json({ message: 'Pedido não encontrado!' })
        }

        if (req.usuario.tipo !== 'ADMIN' && pedido.idUsuario !== req.usuario.id) {
            return res.status(403).json({ message: 'Você não pode criar a entrega deste pedido!' })
        }

        const dados = { idPedido: req.body.idPedido, status: 'AGUARDANDO' }
        for (const campo of camposEntrega) {
            if (req.body[campo] !== undefined) dados[campo] = req.body[campo]
        }
        if (req.usuario.tipo !== 'ADMIN') dados.status = 'AGUARDANDO'

        const entrega = await Entrega.create(dados)
        return res.status(201).json(entrega)
    } catch (err) {
        return tratarErro(res, err)
    }
}

async function listar(req, res) {
    try {
        const incluirPedido = { model: Pedido, as: 'pedidoEntrega' }
        if (req.usuario.tipo !== 'ADMIN') incluirPedido.where = { idUsuario: req.usuario.id }

        const entregas = await Entrega.findAll({
            include: [incluirPedido],
            order: [['codEntrega', 'DESC']]
        })
        return res.json(entregas)
    } catch (err) {
        return tratarErro(res, err)
    }
}

async function consultar(req, res) {
    try {
        const entrega = await Entrega.findByPk(req.params.id, {
            include: [{ model: Pedido, as: 'pedidoEntrega' }]
        })

        if (!entrega) {
            return res.status(404).json({ message: 'Entrega não encontrada!' })
        }

        if (!podeAcessar(req, entrega)) {
            return res.status(403).json({ message: 'Você não pode consultar esta entrega!' })
        }

        return res.json(entrega)
    } catch (err) {
        return tratarErro(res, err)
    }
}

async function atualizar(req, res) {
    try {
        const entrega = await Entrega.findByPk(req.params.id, {
            include: [{ model: Pedido, as: 'pedidoEntrega' }]
        })

        if (!entrega) {
            return res.status(404).json({ message: 'Entrega não encontrada!' })
        }

        if (!podeAcessar(req, entrega)) {
            return res.status(403).json({ message: 'Você não pode atualizar esta entrega!' })
        }

        if (req.body.tipo && !['ENTREGA', 'RETIRADA'].includes(req.body.tipo)) {
            return res.status(400).json({ message: 'Tipo de entrega inválido!' })
        }

        if (req.body.status && req.usuario.tipo !== 'ADMIN') {
            return res.status(403).json({ message: 'Somente administradores podem alterar o status da entrega!' })
        }

        if (req.body.status && !statusPermitidos.includes(req.body.status)) {
            return res.status(400).json({ message: 'Status de entrega inválido!' })
        }

        for (const campo of camposEntrega) {
            if (req.body[campo] !== undefined) entrega[campo] = req.body[campo]
        }

        await entrega.save()
        return res.json(entrega)
    } catch (err) {
        return tratarErro(res, err)
    }
}

async function apagar(req, res) {
    try {
        const entrega = await Entrega.findByPk(req.params.id)
        if (!entrega) {
            return res.status(404).json({ message: 'Entrega não encontrada!' })
        }

        await entrega.destroy()
        return res.json({ message: 'Entrega apagada com sucesso!' })
    } catch (err) {
        return tratarErro(res, err)
    }
}

module.exports = { cadastrar, listar, consultar, atualizar, apagar }
