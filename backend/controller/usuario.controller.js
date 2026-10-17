const bcrypt = require('bcrypt')
const { Usuario, Pedido } = require('../models/rel')

const cadastrar = async (req, res) => {
    const valores = req.body

    try {
        if (!valores.nome || !valores.cpf || !valores.email || !valores.senha ||
            !valores.telefone || !valores.cep || !valores.rua || !valores.numero ||
            !valores.bairro || !valores.cidade || !valores.uf) {
            return res.status(400).json({ message: 'Preencha todos os campos obrigatórios!' })
        }

        const cpf = valores.cpf.replace(/\D/g, '')

        if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) {
            return res.status(400).json({ message: 'Informe um CPF válido!' })
        }

        let soma = 0
        for (let i = 0; i < 9; i++) {
            soma += Number(cpf[i]) * (10 - i)
        }
        let primeiroDigito = (soma * 10) % 11
        if (primeiroDigito === 10) primeiroDigito = 0

        soma = 0
        for (let i = 0; i < 10; i++) {
            soma += Number(cpf[i]) * (11 - i)
        }
        let segundoDigito = (soma * 10) % 11
        if (segundoDigito === 10) segundoDigito = 0

        if (primeiroDigito !== Number(cpf[9]) || segundoDigito !== Number(cpf[10])) {
            return res.status(400).json({ message: 'Informe um CPF válido!' })
        }

        const cpfFormatado = cpf.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4')
        const emailFormatado = String(valores.email).trim().toLowerCase()
        const emailCadastrado = await Usuario.findOne({ where: { email: emailFormatado } })
        const cpfCadastrado = await Usuario.findOne({ where: { cpf: cpfFormatado } })

        if (emailCadastrado || cpfCadastrado) {
            return res.status(409).json({ message: 'E-mail ou CPF já cadastrado!' })
        }

        let tipo = 'CLIENTE'

        if (valores.tipo === 'ADMIN') {
            const administradores = await Usuario.findAll({ where: { tipo: 'ADMIN' } })
            const solicitanteAdmin = req.usuario && req.usuario.tipo === 'ADMIN'

            if (administradores.length > 0 && !solicitanteAdmin) {
                return res.status(403).json({ message: 'Somente um administrador pode cadastrar outro ADMIN!' })
            }

            tipo = 'ADMIN'
        }

        const senha = await bcrypt.hash(
            valores.senha,
            Number(process.env.BCRYPT_SALT_ROUNDS) || 10
        )

        const usuario = await Usuario.create({
            nome: valores.nome,
            cpf: cpfFormatado,
            email: emailFormatado,
            senha,
            telefone: valores.telefone,
            cep: valores.cep,
            rua: valores.rua,
            numero: valores.numero,
            bairro: valores.bairro,
            cidade: valores.cidade,
            uf: valores.uf,
            identidade: valores.identidade,
            tipo
        })

        const resposta = usuario.toJSON()
        delete resposta.senha

        return res.status(201).json(resposta)
    } catch (err) {
        console.error(err)
        return res.status(500).json({ message: 'Erro ao cadastrar usuário!' })
    }
}

const listar = async (req, res) => {
    try {
        const usuarios = await Usuario.findAll()
        const resposta = []

        usuarios.forEach((usuario) => {
            const dados = usuario.toJSON()
            delete dados.senha
            resposta.push(dados)
        })

        return res.json(resposta)
    } catch (err) {
        console.error(err)
        return res.status(500).json({ message: 'Erro ao listar usuários!' })
    }
}

const consultar = async (req, res) => {
    try {
        const id = Number(req.params.id)

        if (req.usuario.tipo !== 'ADMIN' && req.usuario.id !== id) {
            return res.status(403).json({ message: 'Você não pode consultar outro usuário!' })
        }

        const usuario = await Usuario.findOne({
            where: { codUsuario: id }
        })

        if (!usuario) {
            return res.status(404).json({ message: 'Usuário não encontrado!' })
        }

        const resposta = usuario.toJSON()
        delete resposta.senha
        return res.json(resposta)
    } catch (err) {
        console.error(err)
        return res.status(500).json({ message: 'Erro ao consultar usuário!' })
    }
}

const perfil = async (req, res) => {
    req.params.id = String(req.usuario.id)
    return consultar(req, res)
}

const buscarPorNome = async (req, res) => {
    try {
        const nome = req.query.nome || req.query.busca
        if (!nome) {
            return res.status(400).json({ message: 'Informe o nome do usuário para a busca!' })
        }

        let usuarios = await Usuario.findAll()
        usuarios = usuarios.filter((usuario) => {
            return usuario.nome.toLowerCase().includes(nome.toLowerCase())
        })

        const resposta = []
        usuarios.forEach((usuario) => {
            const dados = usuario.toJSON()
            delete dados.senha
            resposta.push(dados)
        })

        return res.json(resposta)
    } catch (err) {
        console.error(err)
        return res.status(500).json({ message: 'Erro ao buscar usuário!' })
    }
}

const atualizar = async (req, res) => {
    const valores = req.body

    try {
        const id = Number(req.params.id)

        if (req.usuario.tipo !== 'ADMIN' && req.usuario.id !== id) {
            return res.status(403).json({ message: 'Você não pode atualizar outro usuário!' })
        }

        const usuario = await Usuario.findOne({ where: { codUsuario: id } })

        if (!usuario) {
            return res.status(404).json({ message: 'Usuário não encontrado!' })
        }

        if (valores.cpf !== undefined) {
            const cpf = valores.cpf.replace(/\D/g, '')

            if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) {
                return res.status(400).json({ message: 'Informe um CPF válido!' })
            }

            let soma = 0
            for (let i = 0; i < 9; i++) {
                soma += Number(cpf[i]) * (10 - i)
            }
            let primeiroDigito = (soma * 10) % 11
            if (primeiroDigito === 10) primeiroDigito = 0

            soma = 0
            for (let i = 0; i < 10; i++) {
                soma += Number(cpf[i]) * (11 - i)
            }
            let segundoDigito = (soma * 10) % 11
            if (segundoDigito === 10) segundoDigito = 0

            if (primeiroDigito !== Number(cpf[9]) || segundoDigito !== Number(cpf[10])) {
                return res.status(400).json({ message: 'Informe um CPF válido!' })
            }

            valores.cpf = cpf.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4')
        }

        if (valores.email !== undefined) {
            valores.email = String(valores.email).trim().toLowerCase()
        }

        let emailCadastrado = null
        let cpfCadastrado = null

        if (valores.email) {
            emailCadastrado = await Usuario.findOne({ where: { email: valores.email } })
        }

        if (valores.cpf) {
            cpfCadastrado = await Usuario.findOne({ where: { cpf: valores.cpf } })
        }

        if ((emailCadastrado && emailCadastrado.codUsuario !== id) ||
            (cpfCadastrado && cpfCadastrado.codUsuario !== id)) {
            return res.status(409).json({ message: 'E-mail ou CPF já cadastrado por outro usuário!' })
        }

        if (valores.nome !== undefined) usuario.nome = valores.nome
        if (valores.cpf !== undefined) usuario.cpf = valores.cpf
        if (valores.email !== undefined) usuario.email = valores.email
        if (valores.telefone !== undefined) usuario.telefone = valores.telefone
        if (valores.cep !== undefined) usuario.cep = valores.cep
        if (valores.rua !== undefined) usuario.rua = valores.rua
        if (valores.numero !== undefined) usuario.numero = valores.numero
        if (valores.bairro !== undefined) usuario.bairro = valores.bairro
        if (valores.cidade !== undefined) usuario.cidade = valores.cidade
        if (valores.uf !== undefined) usuario.uf = valores.uf
        if (valores.identidade !== undefined) usuario.identidade = valores.identidade

        if (valores.senha) {
            usuario.senha = await bcrypt.hash(
                valores.senha,
                Number(process.env.BCRYPT_SALT_ROUNDS) || 10
            )
        }

        if (valores.tipo && req.usuario.tipo === 'ADMIN') {
            if (!['CLIENTE', 'ADMIN'].includes(valores.tipo)) {
                return res.status(400).json({ message: 'Tipo de usuário inválido!' })
            }
            usuario.tipo = valores.tipo
        }

        await usuario.save()
        const resposta = usuario.toJSON()
        delete resposta.senha

        return res.json(resposta)
    } catch (err) {
        console.error(err)
        return res.status(500).json({ message: 'Erro ao atualizar usuário!' })
    }
}

const apagar = async (req, res) => {
    try {
        const id = Number(req.params.id)

        if (req.usuario.tipo !== 'ADMIN' && req.usuario.id !== id) {
            return res.status(403).json({ message: 'Você não pode apagar outro usuário!' })
        }

        const usuario = await Usuario.findOne({ where: { codUsuario: id } })

        if (!usuario) {
            return res.status(404).json({ message: 'Usuário não encontrado!' })
        }

        const pedidos = await Pedido.findAll({ where: { idUsuario: id } })
        if (pedidos.length > 0) {
            return res.status(409).json({ message: 'Não é possível apagar um usuário que possui pedidos!' })
        }

        await usuario.destroy()
        return res.json({ message: 'Usuário apagado com sucesso!' })
    } catch (err) {
        console.error(err)
        return res.status(500).json({ message: 'Erro ao apagar usuário!' })
    }
}

module.exports = { cadastrar, listar, consultar, perfil, buscarPorNome, atualizar, apagar }
