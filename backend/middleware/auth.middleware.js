const jwt = require('jsonwebtoken')

function lerToken(req) {
    const authorization = req.headers.authorization

    if (!authorization || !authorization.startsWith('Bearer ')) {
        return null
    }

    return authorization.split(' ')[1]
}

function autenticar(req, res, next) {
    const token = lerToken(req)

    if (!token) {
        return res.status(401).json({ message: 'Token não informado!' })
    }

    try {
        req.usuario = jwt.verify(token, process.env.JWT_SECRET)
        next()
    } catch (err) {
        return res.status(401).json({ message: 'Token inválido ou expirado!' })
    }
}

function autenticarOpcional(req, res, next) {
    const token = lerToken(req)

    if (!token) {
        return next()
    }

    try {
        req.usuario = jwt.verify(token, process.env.JWT_SECRET)
        next()
    } catch (err) {
        return res.status(401).json({ message: 'Token inválido ou expirado!' })
    }
}

function somenteAdmin(req, res, next) {
    if (!req.usuario || req.usuario.tipo !== 'ADMIN') {
        return res.status(403).json({ message: 'Acesso permitido somente para administradores!' })
    }

    next()
}

module.exports = { autenticar, autenticarOpcional, somenteAdmin }

