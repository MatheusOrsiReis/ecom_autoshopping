const bcrypt = require('bcrypt')
const { Usuario, Pedido } = require('../models/rel')

const camposObrigatorios = [
    'nome', 'cpf', 'email', 'senha', 'telefone',
    'cep', 'rua', 'numero', 'bairro', 'cidade', 'uf'
]

function somenteNumeros(valor) {
    return String(valor || '').replace(/\D/g, '')
}

function cpfValido(valor) {
    const cpf = somenteNumeros(valor)
    if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false

    function calcularDigito(tamanho) {
        let soma = 0
        for (let indice = 0; indice < tamanho; indice++) {
            soma += Number(cpf[indice]) * (tamanho + 1 - indice)
        }
        const resto = (soma * 10) % 11
        return resto === 10 ? 0 : resto
    }

    return calcularDigito(9) === Number(cpf[9]) && calcularDigito(10) === Number(cpf[10])
}

function formatarCpf(valor) {
    const cpf = somenteNumeros(valor)
    return cpf.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4')
}

function tratarErro(res, err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).json({ message: 'E-mail ou CPF já cadastrado!' })
    }

    if (err.name === 'SequelizeValidationError') {
        return res.status(400).json({ message: err.errors[0].message })
    }

    console.error(err)
    return res.status(500).json({ message: 'Erro interno ao processar usuário!' })
}

async function cadastrar(req, res) {
    try {
        const ausentes = camposObrigatorios.filter((campo) => !req.body[campo])

        if (ausentes.length > 0) {
            return res.status(400).json({
                message: `Campos obrigatórios ausentes: ${ausentes.join(', ')}`
            })
        }

        if (!cpfValido(req.body.cpf)) {
            return res.status(400).json({ message: 'Informe um CPF válido!' })
        }

        let tipo = 'CLIENTE'

        if (req.body.tipo === 'ADMIN') {
            const quantidadeAdmins = await Usuario.count({ where: { tipo: 'ADMIN' } })
            const solicitanteAdmin = req.usuario && req.usuario.tipo === 'ADMIN'

            if (quantidadeAdmins > 0 && !solicitanteAdmin) {
                return res.status(403).json({ message: 'Somente um administrador pode cadastrar outro ADMIN!' })
            }

            tipo = 'ADMIN'
        }

        const senha = await bcrypt.hash(
            req.body.senha,
            Number(process.env.BCRYPT_SALT_ROUNDS) || 10
        )

        const usuario = await Usuario.create({
            nome: req.body.nome,
            cpf: formatarCpf(req.body.cpf),
            email: req.body.email,
            senha,
            telefone: req.body.telefone,
            cep: req.body.cep,
            rua: req.body.rua,
            numero: req.body.numero,
            bairro: req.body.bairro,
            cidade: req.body.cidade,
            uf: req.body.uf,
            identidade: req.body.identidade,
            tipo
        })

        const resposta = usuario.toJSON()
        delete resposta.senha

        return res.status(201).json(resposta)
    } catch (err) {
        return tratarErro(res, err)
    }
}

async function listar(req, res) {
    try {
        const usuarios = await Usuario.findAll({
            attributes: { exclude: ['senha'] },
            order: [['codUsuario', 'ASC']]
        })

        return res.json(usuarios)
    } catch (err) {
        return tratarErro(res, err)
    }
}

async function consultar(req, res) {
    try {
        const id = Number(req.params.id)

        if (req.usuario.tipo !== 'ADMIN' && req.usuario.id !== id) {
            return res.status(403).json({ message: 'Você não pode consultar outro usuário!' })
        }

        const usuario = await Usuario.findByPk(id, {
            attributes: { exclude: ['senha'] },
            include: [{ model: Pedido, as: 'pedidosUsuario' }]
        })

        if (!usuario) {
            return res.status(404).json({ message: 'Usuário não encontrado!' })
        }

        return res.json(usuario)
    } catch (err) {
        return tratarErro(res, err)
    }
}

async function atualizar(req, res) {
    try {
        const id = Number(req.params.id)

        if (req.usuario.tipo !== 'ADMIN' && req.usuario.id !== id) {
            return res.status(403).json({ message: 'Você não pode atualizar outro usuário!' })
        }

        const usuario = await Usuario.findByPk(id)

        if (!usuario) {
            return res.status(404).json({ message: 'Usuário não encontrado!' })
        }

        if (req.body.cpf !== undefined) {
            if (!cpfValido(req.body.cpf)) {
                return res.status(400).json({ message: 'Informe um CPF válido!' })
            }
            req.body.cpf = formatarCpf(req.body.cpf)
        }

        const camposPermitidos = [
            'nome', 'cpf', 'email', 'telefone', 'cep', 'rua',
            'numero', 'bairro', 'cidade', 'uf', 'identidade'
        ]

        for (const campo of camposPermitidos) {
            if (req.body[campo] !== undefined) {
                usuario[campo] = req.body[campo]
            }
        }

        if (req.body.senha) {
            usuario.senha = await bcrypt.hash(
                req.body.senha,
                Number(process.env.BCRYPT_SALT_ROUNDS) || 10
            )
        }

        if (req.body.tipo && req.usuario.tipo === 'ADMIN') {
            if (!['CLIENTE', 'ADMIN'].includes(req.body.tipo)) {
                return res.status(400).json({ message: 'Tipo de usuário inválido!' })
            }
            usuario.tipo = req.body.tipo
        }

        await usuario.save()
        const resposta = usuario.toJSON()
        delete resposta.senha

        return res.json(resposta)
    } catch (err) {
        return tratarErro(res, err)
    }
}

async function apagar(req, res) {
    try {
        const id = Number(req.params.id)

        if (req.usuario.tipo !== 'ADMIN' && req.usuario.id !== id) {
            return res.status(403).json({ message: 'Você não pode apagar outro usuário!' })
        }

        const usuario = await Usuario.findByPk(id)

        if (!usuario) {
            return res.status(404).json({ message: 'Usuário não encontrado!' })
        }

        const quantidadePedidos = await Pedido.count({ where: { idUsuario: id } })
        if (quantidadePedidos > 0) {
            return res.status(409).json({ message: 'Não é possível apagar um usuário que possui pedidos!' })
        }

        await usuario.destroy()
        return res.json({ message: 'Usuário apagado com sucesso!' })
    } catch (err) {
        return tratarErro(res, err)
    }
}

module.exports = { cadastrar, listar, consultar, atualizar, apagar }
