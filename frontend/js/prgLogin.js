const API_URL = 'http://localhost:3000'
let resposta = document.getElementById('mensagemLogin')
let entrar = document.getElementById('botaoEntrar')
let formularioLogin = document.getElementById('formLogin')

function atualizarContadorCarrinho() {
    let carrinho = []
    try {
        carrinho = JSON.parse(localStorage.getItem('autoshopping_carrinho')) || []
    } catch (erro) {
        carrinho = []
    }
    document.getElementById('contadorCarrinho').textContent = carrinho.length
}

function mostrarMensagemLogin(texto, tipo) {
    resposta.className = 'mensagem-formulario ' + tipo
    resposta.textContent = texto
}

function obterDestinoLogin(tipoUsuario) {
    const destino = new URLSearchParams(window.location.search).get('redirect')
    const destinosPermitidos = ['checkout.html', 'perfil.html', 'meusPedidos.html', 'admin.html', 'relatorios.html']
    if (destinosPermitidos.includes(destino)) return destino
    return tipoUsuario === 'ADMIN' ? 'admin.html' : '../index.html'
}

function realizarLogin(evento) {
    evento.preventDefault()

    const dados = {
        email: document.getElementById('email').value.trim(),
        senha: document.getElementById('senha').value
    }

    entrar.disabled = true
    entrar.textContent = 'Entrando...'
    mostrarMensagemLogin('', '')

    fetch(API_URL + '/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados)
    })
    .then((res) => {
        return res.json().then((conteudo) => {
            if (!res.ok) {
                throw new Error(conteudo.message || 'Não foi possível entrar.')
            }
            return conteudo
        })
    })
    .then((conteudo) => {
        localStorage.setItem('autoshopping_token', conteudo.token)
        localStorage.setItem('autoshopping_usuario', JSON.stringify(conteudo.usuario))
        mostrarMensagemLogin('Login realizado com sucesso!', 'sucesso')
        setTimeout(function () {
            window.location.href = obterDestinoLogin(conteudo.usuario.tipo)
        }, 500)
    })
    .catch((erro) => {
        mostrarMensagemLogin(erro.message === 'Failed to fetch'
            ? 'Backend indisponível. Verifique se o servidor está ligado.'
            : erro.message, 'erro')
        entrar.disabled = false
        entrar.textContent = 'Entrar'
    })
}

if (localStorage.getItem('autoshopping_token')) {
    let usuarioSalvo = null
    try { usuarioSalvo = JSON.parse(localStorage.getItem('autoshopping_usuario')) } catch (erro) { usuarioSalvo = null }
    window.location.href = usuarioSalvo && usuarioSalvo.tipo === 'ADMIN' ? 'admin.html' : 'perfil.html'
} else {
    const emailRecebido = new URLSearchParams(window.location.search).get('email')
    if (emailRecebido) document.getElementById('email').value = emailRecebido
    formularioLogin.addEventListener('submit', realizarLogin)
    atualizarContadorCarrinho()
}
