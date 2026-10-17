const { Estoque, Produto } = require('../models/rel')

const cadastrar = async (req, res) => {
    const valores = req.body

    try {
        const quantidade = Number(valores.quantidade)

        if (!valores.idProduto || !Number.isInteger(quantidade) || quantidade < 0) {
            return res.status(400).json({ message: 'Produto e quantidade inteira não negativa são obrigatórios!' })
        }

        const produto = await Produto.findOne({
            where: { codProduto: valores.idProduto }
        })
        if (!produto) {
            return res.status(404).json({ message: 'Produto não encontrado!' })
        }

        const estoqueCadastrado = await Estoque.findOne({ where: { idProduto: valores.idProduto } })
        if (estoqueCadastrado) {
            return res.status(409).json({ message: 'Este produto já possui estoque!' })
        }

        const estoque = await Estoque.create({
            idProduto: valores.idProduto,
            quantidade,
            quantidade_minima: valores.quantidade_minima || 0
        })

        return res.status(201).json(estoque)
    } catch (err) {
        console.error(err)
        return res.status(500).json({ message: 'Erro ao cadastrar estoque!' })
    }
}

const listar = async (req, res) => {
    try {
        const estoques = await Estoque.findAll()
        return res.json(estoques)
    } catch (err) {
        console.error(err)
        return res.status(500).json({ message: 'Erro ao listar estoques!' })
    }
}

const consultar = async (req, res) => {
    try {
        const id = req.params.id
        const estoque = await Estoque.findOne({
            where: { codEstoque: id }
        })

        if (!estoque) {
            return res.status(404).json({ message: 'Estoque não encontrado!' })
        }

        return res.json(estoque)
    } catch (err) {
        console.error(err)
        return res.status(500).json({ message: 'Erro ao consultar estoque!' })
    }
}

const consultarPorProduto = async (req, res) => {
    try {
        const estoque = await Estoque.findOne({
            where: { idProduto: req.params.produtoId }
        })

        if (!estoque) {
            return res.status(404).json({ message: 'Estoque não encontrado!' })
        }

        return res.json(estoque)
    } catch (err) {
        console.error(err)
        return res.status(500).json({ message: 'Erro ao consultar estoque do produto!' })
    }
}

const atualizar = async (req, res) => {
    const valores = req.body

    try {
        const id = req.params.id
        const estoque = await Estoque.findOne({ where: { codEstoque: id } })

        if (!estoque) {
            return res.status(404).json({ message: 'Estoque não encontrado!' })
        }

        if (valores.quantidade !== undefined) {
            const quantidade = Number(valores.quantidade)
            if (!Number.isInteger(quantidade) || quantidade < 0) {
                return res.status(400).json({ message: 'A quantidade deve ser um inteiro não negativo!' })
            }
            estoque.quantidade = quantidade
        }

        if (valores.quantidade_minima !== undefined) {
            const quantidadeMinima = Number(valores.quantidade_minima)
            if (!Number.isInteger(quantidadeMinima) || quantidadeMinima < 0) {
                return res.status(400).json({ message: 'A quantidade mínima deve ser um inteiro não negativo!' })
            }
            estoque.quantidade_minima = quantidadeMinima
        }

        await estoque.save()
        return res.json(estoque)
    } catch (err) {
        console.error(err)
        return res.status(500).json({ message: 'Erro ao atualizar estoque!' })
    }
}

const apagar = async (req, res) => {
    try {
        const id = req.params.id
        const estoque = await Estoque.findOne({ where: { codEstoque: id } })

        if (!estoque) {
            return res.status(404).json({ message: 'Estoque não encontrado!' })
        }

        await estoque.destroy()
        return res.json({ message: 'Estoque apagado com sucesso!' })
    } catch (err) {
        console.error(err)
        return res.status(500).json({ message: 'Erro ao apagar estoque!' })
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
