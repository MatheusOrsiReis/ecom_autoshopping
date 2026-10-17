const { Produto, Categoria, Estoque } = require('../models/rel')

const cadastrar = async (req, res) => {
    const valores = req.body

    try {
        if (!valores.idCategoria || !valores.nome || !valores.marca ||
            !valores.modelo || !valores.ano || !valores.preco ||
            !valores.combustivel || !valores.cambio || !valores.cor) {
            return res.status(400).json({ message: 'Preencha todos os campos obrigatórios!' })
        }

        if (Number(valores.preco) <= 0 || Number(valores.quilometragem || 0) < 0) {
            return res.status(400).json({ message: 'Preço e quilometragem devem possuir valores válidos!' })
        }

        const quantidade = valores.quantidadeEstoque === undefined ? 1 : Number(valores.quantidadeEstoque)
        if (!Number.isInteger(quantidade) || quantidade < 0) {
            return res.status(400).json({ message: 'A quantidade em estoque deve ser um inteiro não negativo!' })
        }

        const categoria = await Categoria.findOne({
            where: { codCategoria: valores.idCategoria }
        })

        if (!categoria) {
            return res.status(404).json({ message: 'Categoria não encontrada!' })
        }

        const produto = await Produto.create({
            idCategoria: valores.idCategoria,
            nome: valores.nome,
            marca: valores.marca,
            modelo: valores.modelo,
            versao: valores.versao,
            ano: valores.ano,
            preco: valores.preco,
            quilometragem: valores.quilometragem || 0,
            combustivel: valores.combustivel,
            cambio: valores.cambio,
            cor: valores.cor,
            descricao: valores.descricao,
            imagem: valores.imagem,
            ativo: valores.ativo === undefined ? true : valores.ativo
        })

        const estoque = await Estoque.create({
            idProduto: produto.codProduto,
            quantidade: quantidade
        })

        const resposta = produto.toJSON()
        resposta.categoriaProduto = categoria
        resposta.estoqueProduto = estoque

        return res.status(201).json(resposta)
    } catch (err) {
        console.error(err)
        return res.status(500).json({ message: 'Erro ao cadastrar produto!' })
    }
}

const listar = async (req, res) => {
    try {
        const produtos = await Produto.findAll()
        const resposta = []

        for (const produto of produtos) {
            if (req.query.categoriaId && produto.idCategoria != req.query.categoriaId) continue
            if (req.query.marca && produto.marca !== req.query.marca) continue

            if (req.query.ativo !== undefined) {
                const ativo = req.query.ativo === 'true'
                if (produto.ativo !== ativo) continue
            }

            if (req.query.busca) {
                const busca = req.query.busca.toLowerCase()
                const encontrado = produto.nome.toLowerCase().includes(busca) ||
                    produto.marca.toLowerCase().includes(busca) ||
                    produto.modelo.toLowerCase().includes(busca)

                if (!encontrado) continue
            }

            const dados = produto.toJSON()
            dados.categoriaProduto = await Categoria.findOne({
                where: { codCategoria: produto.idCategoria }
            })
            dados.estoqueProduto = await Estoque.findOne({
                where: { idProduto: produto.codProduto }
            })
            resposta.push(dados)
        }

        return res.json(resposta)
    } catch (err) {
        console.error(err)
        return res.status(500).json({ message: 'Erro ao listar produtos!' })
    }
}

const consultar = async (req, res) => {
    try {
        const id = req.params.id
        const produto = await Produto.findOne({ where: { codProduto: id } })

        if (!produto) {
            return res.status(404).json({ message: 'Produto não encontrado!' })
        }

        const resposta = produto.toJSON()
        resposta.categoriaProduto = await Categoria.findOne({
            where: { codCategoria: produto.idCategoria }
        })
        resposta.estoqueProduto = await Estoque.findOne({
            where: { idProduto: produto.codProduto }
        })

        return res.json(resposta)
    } catch (err) {
        console.error(err)
        return res.status(500).json({ message: 'Erro ao consultar produto!' })
    }
}

const buscarPorNome = async (req, res) => {
    try {
        const nome = req.query.nome || req.query.busca

        if (!nome) {
            return res.status(400).json({ message: 'Informe o nome do veículo para a busca!' })
        }

        const produtos = await Produto.findAll()
        const resposta = produtos.filter((produto) => {
            return produto.nome.toLowerCase().includes(nome.toLowerCase())
        })

        return res.json(resposta)
    } catch (err) {
        console.error(err)
        return res.status(500).json({ message: 'Erro ao buscar produto!' })
    }
}

const atualizar = async (req, res) => {
    const valores = req.body

    try {
        const id = req.params.id
        const produto = await Produto.findOne({ where: { codProduto: id } })

        if (!produto) {
            return res.status(404).json({ message: 'Produto não encontrado!' })
        }

        if (valores.idCategoria !== undefined) {
            const categoria = await Categoria.findOne({
                where: { codCategoria: valores.idCategoria }
            })

            if (!categoria) {
                return res.status(404).json({ message: 'Categoria não encontrada!' })
            }

            produto.idCategoria = valores.idCategoria
        }

        if (valores.preco !== undefined && Number(valores.preco) <= 0) {
            return res.status(400).json({ message: 'O preço deve ser maior que zero!' })
        }

        if (valores.quilometragem !== undefined && Number(valores.quilometragem) < 0) {
            return res.status(400).json({ message: 'A quilometragem não pode ser negativa!' })
        }

        if (valores.nome !== undefined) produto.nome = valores.nome
        if (valores.marca !== undefined) produto.marca = valores.marca
        if (valores.modelo !== undefined) produto.modelo = valores.modelo
        if (valores.versao !== undefined) produto.versao = valores.versao
        if (valores.ano !== undefined) produto.ano = valores.ano
        if (valores.preco !== undefined) produto.preco = valores.preco
        if (valores.quilometragem !== undefined) produto.quilometragem = valores.quilometragem
        if (valores.combustivel !== undefined) produto.combustivel = valores.combustivel
        if (valores.cambio !== undefined) produto.cambio = valores.cambio
        if (valores.cor !== undefined) produto.cor = valores.cor
        if (valores.descricao !== undefined) produto.descricao = valores.descricao
        if (valores.imagem !== undefined) produto.imagem = valores.imagem
        if (valores.ativo !== undefined) produto.ativo = valores.ativo

        await produto.save()
        return res.json(produto)
    } catch (err) {
        console.error(err)
        return res.status(500).json({ message: 'Erro ao atualizar produto!' })
    }
}

const apagar = async (req, res) => {
    try {
        const id = req.params.id
        const produto = await Produto.findOne({ where: { codProduto: id } })

        if (!produto) {
            return res.status(404).json({ message: 'Produto não encontrado!' })
        }

        await produto.destroy()
        return res.json({ message: 'Produto apagado com sucesso!' })
    } catch (err) {
        console.error(err)
        return res.status(500).json({ message: 'Erro ao apagar produto!' })
    }
}

module.exports = { cadastrar, listar, consultar, buscarPorNome, atualizar, apagar }
