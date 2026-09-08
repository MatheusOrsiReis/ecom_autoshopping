const { Op } = require('sequelize')
const conn = require('../db/conn')
const { Produto, Categoria, Estoque } = require('../models/rel')

const camposProduto = [
    'idCategoria', 'nome', 'marca', 'modelo', 'versao', 'ano',
    'preco', 'quilometragem', 'combustivel', 'cambio', 'cor',
    'descricao', 'imagem', 'ativo'
]

function tratarErro(res, err) {
    if (err.name === 'SequelizeForeignKeyConstraintError') {
        return res.status(400).json({ message: 'Categoria inválida ou produto vinculado a um pedido!' })
    }

    if (err.name === 'SequelizeValidationError') {
        return res.status(400).json({ message: err.errors[0].message })
    }

    console.error(err)
    return res.status(500).json({ message: 'Erro interno ao processar produto!' })
}

function incluirRelacionamentos() {
    return [
        { model: Categoria, as: 'categoriaProduto' },
        { model: Estoque, as: 'estoqueProduto' }
    ]
}

async function cadastrar(req, res) {
    const transaction = await conn.transaction()

    try {
        const obrigatorios = [
            'idCategoria', 'nome', 'marca', 'modelo', 'ano',
            'preco', 'combustivel', 'cambio', 'cor'
        ]
        const ausentes = obrigatorios.filter((campo) => req.body[campo] === undefined || req.body[campo] === '')

        if (ausentes.length > 0) {
            await transaction.rollback()
            return res.status(400).json({ message: `Campos obrigatórios ausentes: ${ausentes.join(', ')}` })
        }

        if (Number(req.body.preco) <= 0 || Number(req.body.quilometragem || 0) < 0) {
            await transaction.rollback()
            return res.status(400).json({ message: 'Preço e quilometragem devem possuir valores válidos!' })
        }

        const quantidadeEstoque = req.body.quantidadeEstoque === undefined
            ? 1
            : Number(req.body.quantidadeEstoque)
        if (!Number.isInteger(quantidadeEstoque) || quantidadeEstoque < 0) {
            await transaction.rollback()
            return res.status(400).json({ message: 'A quantidade em estoque deve ser um inteiro não negativo!' })
        }

        const categoria = await Categoria.findByPk(req.body.idCategoria, { transaction })
        if (!categoria) {
            await transaction.rollback()
            return res.status(404).json({ message: 'Categoria não encontrada!' })
        }

        const dados = {}
        for (const campo of camposProduto) {
            if (req.body[campo] !== undefined) dados[campo] = req.body[campo]
        }

        const produto = await Produto.create(dados, { transaction })
        await Estoque.create({
            idProduto: produto.codProduto,
            quantidade: quantidadeEstoque
        }, { transaction })

        await transaction.commit()

        const resposta = await Produto.findByPk(produto.codProduto, {
            include: incluirRelacionamentos()
        })
        return res.status(201).json(resposta)
    } catch (err) {
        if (!transaction.finished) await transaction.rollback()
        return tratarErro(res, err)
    }
}

async function listar(req, res) {
    try {
        const where = {}

        if (req.query.categoriaId) where.idCategoria = req.query.categoriaId
        if (req.query.marca) where.marca = req.query.marca
        if (req.query.ativo !== undefined) where.ativo = req.query.ativo === 'true'
        if (req.query.busca) {
            where[Op.or] = [
                { nome: { [Op.like]: `%${req.query.busca}%` } },
                { marca: { [Op.like]: `%${req.query.busca}%` } },
                { modelo: { [Op.like]: `%${req.query.busca}%` } }
            ]
        }

        const produtos = await Produto.findAll({
            where,
            include: incluirRelacionamentos(),
            order: [['codProduto', 'DESC']]
        })

        return res.json(produtos)
    } catch (err) {
        return tratarErro(res, err)
    }
}

async function consultar(req, res) {
    try {
        const produto = await Produto.findByPk(req.params.id, {
            include: incluirRelacionamentos()
        })

        if (!produto) {
            return res.status(404).json({ message: 'Produto não encontrado!' })
        }

        return res.json(produto)
    } catch (err) {
        return tratarErro(res, err)
    }
}

async function atualizar(req, res) {
    try {
        const produto = await Produto.findByPk(req.params.id)

        if (!produto) {
            return res.status(404).json({ message: 'Produto não encontrado!' })
        }

        if (req.body.idCategoria !== undefined) {
            const categoria = await Categoria.findByPk(req.body.idCategoria)
            if (!categoria) {
                return res.status(404).json({ message: 'Categoria não encontrada!' })
            }
        }

        if (req.body.preco !== undefined && Number(req.body.preco) <= 0) {
            return res.status(400).json({ message: 'O preço deve ser maior que zero!' })
        }

        if (req.body.quilometragem !== undefined && Number(req.body.quilometragem) < 0) {
            return res.status(400).json({ message: 'A quilometragem não pode ser negativa!' })
        }

        for (const campo of camposProduto) {
            if (req.body[campo] !== undefined) produto[campo] = req.body[campo]
        }

        await produto.save()
        const resposta = await Produto.findByPk(produto.codProduto, {
            include: incluirRelacionamentos()
        })
        return res.json(resposta)
    } catch (err) {
        return tratarErro(res, err)
    }
}

async function apagar(req, res) {
    try {
        const produto = await Produto.findByPk(req.params.id)

        if (!produto) {
            return res.status(404).json({ message: 'Produto não encontrado!' })
        }

        await produto.destroy()
        return res.json({ message: 'Produto apagado com sucesso!' })
    } catch (err) {
        return tratarErro(res, err)
    }
}

module.exports = { cadastrar, listar, consultar, atualizar, apagar }
