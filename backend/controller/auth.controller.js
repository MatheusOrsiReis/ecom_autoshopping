const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const { Usuario } = require('../models/rel')

const login = async (req, res) => {
    const valores = req.body

    try {
        if (!valores.email || !valores.senha) {
            return res.status(400).json({ message: 'E-mail e senha são obrigatórios!' })
        }

        const emailFormatado = String(valores.email).trim().toLowerCase()
        const usuario = await Usuario.findOne({ where: { email: emailFormatado } })

        if (!usuario || !(await bcrypt.compare(valores.senha, usuario.senha))) {
            return res.status(401).json({ message: 'E-mail ou senha inválidos!' })
        }

        const token = jwt.sign(
            { id: usuario.codUsuario, tipo: usuario.tipo },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
        )

        return res.json({
            message: 'Login realizado com sucesso!',
            token,
            usuario: {
                codUsuario: usuario.codUsuario,
                nome: usuario.nome,
                email: usuario.email,
                tipo: usuario.tipo
            }
        })
    } catch (err) {
        console.error(err)
        return res.status(500).json({ message: 'Erro ao realizar login!' })
    }
}

module.exports = { login }

