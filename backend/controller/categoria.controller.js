const { Categoria, Produto } = require('../models/rel')

function tratarErro(res, err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).json({ message: 'Categoria já cadastrada!' })
    }

    if (err.name === 'SequelizeForeignKeyConstraintError') {
        return res.status(409).json({ message: 'A categoria possui produtos vinculados!' })
    }

    console.error(err)
    return res.status(500).json({ message: 'Erro interno ao processar categoria!' })
}

async function cadastrar(req, res) {
    try {
        if (!req.body.nome) {
            return res.status(400).json({ message: 'O nome da categoria é obrigatório!' })
        }

        const categoria = await Categoria.create({
            nome: req.body.nome,
            descricao: req.body.descricao
        })

        return res.status(201).json(categoria)
    } catch (err) {
        return tratarErro(res, err)
    }
}

async function listar(req, res) {
    try {
        const categorias = await Categoria.findAll({ order: [['nome', 'ASC']] })
        return res.json(categorias)
    } catch (err) {
        return tratarErro(res, err)
    }
}

async function consultar(req, res) {
    try {
        const categoria = await Categoria.findByPk(req.params.id, {
            include: [{ model: Produto, as: 'produtosCategoria' }]
        })

        if (!categoria) {
            return res.status(404).json({ message: 'Categoria não encontrada!' })
        }

        return res.json(categoria)
    } catch (err) {
        return tratarErro(res, err)
    }
}

async function atualizar(req, res) {
    try {
        const categoria = await Categoria.findByPk(req.params.id)

        if (!categoria) {
            return res.status(404).json({ message: 'Categoria não encontrada!' })
        }

        if (req.body.nome !== undefined) categoria.nome = req.body.nome
        if (req.body.descricao !== undefined) categoria.descricao = req.body.descricao

        await categoria.save()
        return res.json(categoria)
    } catch (err) {
        return tratarErro(res, err)
    }
}

async function apagar(req, res) {
    try {
        const categoria = await Categoria.findByPk(req.params.id)

        if (!categoria) {
            return res.status(404).json({ message: 'Categoria não encontrada!' })
        }

        await categoria.destroy()
        return res.json({ message: 'Categoria apagada com sucesso!' })
    } catch (err) {
        return tratarErro(res, err)
    }
}

module.exports = { cadastrar, listar, consultar, atualizar, apagar }

