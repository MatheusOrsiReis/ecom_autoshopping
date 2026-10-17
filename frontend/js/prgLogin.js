const API_URL = 'http://localhost:3000'

let resposta = document.getElementById('mensagemLogin')
let entrar = document.getElementById('botaoEntrar')
let carrinho = JSON.parse(localStorage.getItem('autoshopping_carrinho') || '[]')
let usuario = JSON.parse(localStorage.getItem('autoshopping_usuario') || 'null')

document.getElementById('contadorCarrinho').textContent = carrinho.length

if (localStorage.getItem('autoshopping_token')) {
    window.location.href = usuario && usuario.tipo === 'ADMIN' ? 'admin.html' : 'perfil.html'
}

document.getElementById('formLogin').addEventListener('submit', function(e) {
    e.preventDefault()

    const valores = {
        email: document.getElementById('email').value,
        senha: document.getElementById('senha').value
    }

    entrar.disabled = true
    entrar.textContent = 'Entrando...'
    resposta.textContent = ''

    fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(valores)
    })
    .then(function(res) {
        return res.json()
    })
    .then(function(dados) {
        if (!dados.token) {
            resposta.textContent = dados.message || 'E-mail ou senha inválidos!'
            entrar.disabled = false
            entrar.textContent = 'Entrar'
            return
        }

        localStorage.setItem('autoshopping_token', dados.token)
        localStorage.setItem('autoshopping_usuario', JSON.stringify(dados.usuario))

        let destino = dados.usuario.tipo === 'ADMIN' ? 'admin.html' : 'perfil.html'

        if (window.location.search.includes('redirect=')) {
            destino = window.location.search.split('redirect=')[1].split('&')[0]
        }

        window.location.href = destino
    })
    .catch(function() {
        resposta.textContent = 'Erro ao realizar login! Verifique se o backend está ligado.'
        entrar.disabled = false
        entrar.textContent = 'Entrar'
    })
})
