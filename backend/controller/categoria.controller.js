const { Categoria, Produto } = require('../models/rel')

const cadastrar = async (req, res) => {
    const valores = req.body

    try {
        if (!valores.nome) {
            return res.status(400).json({ message: 'O nome da categoria é obrigatório!' })
        }

        const categoriaCadastrada = await Categoria.findOne({ where: { nome: valores.nome } })
        if (categoriaCadastrada) {
            return res.status(409).json({ message: 'Categoria já cadastrada!' })
        }

        const categoria = await Categoria.create({
            nome: valores.nome,
            descricao: valores.descricao
        })

        return res.status(201).json(categoria)
    } catch (err) {
        console.error(err)
        return res.status(500).json({ message: 'Erro ao cadastrar categoria!' })
    }
}

const listar = async (req, res) => {
    try {
        const categorias = await Categoria.findAll()
        return res.json(categorias)
    } catch (err) {
        console.error(err)
        return res.status(500).json({ message: 'Erro ao listar categorias!' })
    }
}

const consultar = async (req, res) => {
    try {
        const id = req.params.id
        const categoria = await Categoria.findOne({
            where: { codCategoria: id }
        })

        if (!categoria) {
            return res.status(404).json({ message: 'Categoria não encontrada!' })
        }

        return res.json(categoria)
    } catch (err) {
        console.error(err)
        return res.status(500).json({ message: 'Erro ao consultar categoria!' })
    }
}

const buscarPorNome = async (req, res) => {
    try {
        const nome = req.query.nome || req.query.busca
        if (!nome) {
            return res.status(400).json({ message: 'Informe o nome da categoria para a busca!' })
        }

        const categorias = await Categoria.findAll()
        const resultado = categorias.filter((categoria) => {
            return categoria.nome.toLowerCase().includes(nome.toLowerCase())
        })

        return res.json(resultado)
    } catch (err) {
        console.error(err)
        return res.status(500).json({ message: 'Erro ao buscar categoria!' })
    }
}

const atualizar = async (req, res) => {
    const valores = req.body

    try {
        const id = req.params.id
        const categoria = await Categoria.findOne({ where: { codCategoria: id } })

        if (!categoria) {
            return res.status(404).json({ message: 'Categoria não encontrada!' })
        }

        if (valores.nome !== undefined) {
            const categoriaCadastrada = await Categoria.findOne({ where: { nome: valores.nome } })
            if (categoriaCadastrada && categoriaCadastrada.codCategoria != id) {
                return res.status(409).json({ message: 'Categoria já cadastrada!' })
            }
            categoria.nome = valores.nome
        }

        if (valores.descricao !== undefined) categoria.descricao = valores.descricao

        await categoria.save()
        return res.json(categoria)
    } catch (err) {
        console.error(err)
        return res.status(500).json({ message: 'Erro ao atualizar categoria!' })
    }
}

const apagar = async (req, res) => {
    try {
        const id = req.params.id
        const categoria = await Categoria.findOne({ where: { codCategoria: id } })

        if (!categoria) {
            return res.status(404).json({ message: 'Categoria não encontrada!' })
        }

        const produtos = await Produto.findAll({ where: { idCategoria: id } })
        if (produtos.length > 0) {
            return res.status(409).json({ message: 'A categoria possui produtos vinculados!' })
        }

        await categoria.destroy()
        return res.json({ message: 'Categoria apagada com sucesso!' })
    } catch (err) {
        console.error(err)
        return res.status(500).json({ message: 'Erro ao apagar categoria!' })
    }
}

module.exports = { cadastrar, listar, consultar, buscarPorNome, atualizar, apagar }

