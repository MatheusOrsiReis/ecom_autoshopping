const { Estoque, Produto } = require('../models/rel')

function tratarErro(res, err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).json({ message: 'Este produto já possui estoque!' })
    }

    if (err.name === 'SequelizeForeignKeyConstraintError') {
        return res.status(400).json({ message: 'Produto inválido!' })
    }

    console.error(err)
    return res.status(500).json({ message: 'Erro interno ao processar estoque!' })
}

async function cadastrar(req, res) {
    try {
        const quantidade = Number(req.body.quantidade)

        if (!req.body.idProduto || !Number.isInteger(quantidade) || quantidade < 0) {
            return res.status(400).json({ message: 'Produto e quantidade inteira não negativa são obrigatórios!' })
        }

        const produto = await Produto.findByPk(req.body.idProduto)
        if (!produto) {
            return res.status(404).json({ message: 'Produto não encontrado!' })
        }

        const estoque = await Estoque.create({
            idProduto: req.body.idProduto,
            quantidade,
            quantidade_minima: req.body.quantidade_minima || 0
        })

        return res.status(201).json(estoque)
    } catch (err) {
        return tratarErro(res, err)
    }
}

async function listar(req, res) {
    try {
        const estoques = await Estoque.findAll({
            include: [{ model: Produto, as: 'produtoEstoque' }],
            order: [['codEstoque', 'ASC']]
        })
        return res.json(estoques)
    } catch (err) {
        return tratarErro(res, err)
    }
}

async function consultar(req, res) {
    try {
        const estoque = await Estoque.findByPk(req.params.id, {
            include: [{ model: Produto, as: 'produtoEstoque' }]
        })

        if (!estoque) {
            return res.status(404).json({ message: 'Estoque não encontrado!' })
        }

        return res.json(estoque)
    } catch (err) {
        return tratarErro(res, err)
    }
}

async function consultarPorProduto(req, res) {
    try {
        const estoque = await Estoque.findOne({
            where: { idProduto: req.params.produtoId },
            include: [{ model: Produto, as: 'produtoEstoque' }]
        })

        if (!estoque) {
            return res.status(404).json({ message: 'Estoque não encontrado!' })
        }

        return res.json(estoque)
    } catch (err) {
        return tratarErro(res, err)
    }
}

async function atualizar(req, res) {
    try {
        const estoque = await Estoque.findByPk(req.params.id)

        if (!estoque) {
            return res.status(404).json({ message: 'Estoque não encontrado!' })
        }

        if (req.body.quantidade !== undefined) {
            const quantidade = Number(req.body.quantidade)
            if (!Number.isInteger(quantidade) || quantidade < 0) {
                return res.status(400).json({ message: 'A quantidade deve ser um inteiro não negativo!' })
            }
            estoque.quantidade = quantidade
        }

        if (req.body.quantidade_minima !== undefined) {
            const quantidadeMinima = Number(req.body.quantidade_minima)
            if (!Number.isInteger(quantidadeMinima) || quantidadeMinima < 0) {
                return res.status(400).json({ message: 'A quantidade mínima deve ser um inteiro não negativo!' })
            }
            estoque.quantidade_minima = quantidadeMinima
        }

        await estoque.save()
        return res.json(estoque)
    } catch (err) {
        return tratarErro(res, err)
    }
}

async function apagar(req, res) {
    try {
        const estoque = await Estoque.findByPk(req.params.id)

        if (!estoque) {
            return res.status(404).json({ message: 'Estoque não encontrado!' })
        }

        await estoque.destroy()
        return res.json({ message: 'Estoque apagado com sucesso!' })
    } catch (err) {
        return tratarErro(res, err)
    }
}

module.exports = {
    cadastrar,
    listar,
    consultar,
    consultarPorProduto,
    atualizar,
    apagar
}
