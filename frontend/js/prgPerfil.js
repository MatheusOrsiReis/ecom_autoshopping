const API_URL = 'http://localhost:3000'
const token = localStorage.getItem('autoshopping_token')
let usuario = null

function lerUsuario() {
    try {
        return JSON.parse(localStorage.getItem('autoshopping_usuario'))
    } catch (erro) {
        return null
    }
}

function atualizarContadorCarrinho() {
    try {
        const carrinho = JSON.parse(localStorage.getItem('autoshopping_carrinho')) || []
        document.getElementById('contadorCarrinho').textContent = carrinho.length
    } catch (erro) {
        document.getElementById('contadorCarrinho').textContent = '0'
    }
}

function sair() {
    localStorage.removeItem('autoshopping_token')
    localStorage.removeItem('autoshopping_usuario')
    window.location.href = '../index.html'
}

function mostrarMensagem(texto, tipo) {
    const mensagem = document.getElementById('mensagemPerfil')
    mensagem.className = 'mensagem-formulario campo-largo ' + tipo
    mensagem.textContent = texto
}

function tratarNaoAutorizado(resposta) {
    if (resposta.status === 401) {
        sair()
        throw new Error('SESSAO_EXPIRADA')
    }
}

function preencherPerfil(perfil) {
    const campos = ['nome', 'cpf', 'telefone', 'email', 'cep', 'uf', 'rua', 'numero', 'bairro', 'cidade']
    campos.forEach(function (campo) {
        document.getElementById(campo).value = perfil[campo] || ''
    })
    document.getElementById('carregandoPerfil').hidden = true
    document.getElementById('formPerfil').hidden = false
}

function carregarPerfil() {
    fetch(API_URL + '/usuario/' + usuario.codUsuario, {
        headers: { Authorization: 'Bearer ' + token }
    })
    .then(function (resposta) {
        tratarNaoAutorizado(resposta)
        if (!resposta.ok) throw new Error('Não foi possível carregar o perfil.')
        return resposta.json()
    })
    .then(preencherPerfil)
    .catch(function (erro) {
        if (erro.message !== 'SESSAO_EXPIRADA') {
            const carregando = document.getElementById('carregandoPerfil')
            carregando.className = 'mensagem mensagem-erro'
            carregando.textContent = erro.message === 'Failed to fetch'
                ? 'Backend indisponível. Verifique se o servidor está ligado.'
                : erro.message
        }
    })
}

function salvarPerfil(evento) {
    evento.preventDefault()
    const botao = document.getElementById('botaoSalvarPerfil')
    const dados = {}
    const campos = ['nome', 'cpf', 'telefone', 'email', 'cep', 'rua', 'numero', 'bairro', 'cidade']

    campos.forEach(function (campo) {
        dados[campo] = document.getElementById(campo).value.trim()
    })
    dados.uf = document.getElementById('uf').value.trim().toUpperCase()

    const senha = document.getElementById('senha').value
    if (senha) dados.senha = senha

    botao.disabled = true
    botao.textContent = 'Salvando...'
    mostrarMensagem('', '')

    fetch(API_URL + '/usuario/' + usuario.codUsuario, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify(dados)
    })
    .then(function (resposta) {
        tratarNaoAutorizado(resposta)
        return resposta.json().then(function (conteudo) {
            if (!resposta.ok) throw new Error(conteudo.message || 'Não foi possível atualizar o perfil.')
            return conteudo
        })
    })
    .then(function (perfil) {
        usuario.nome = perfil.nome
        usuario.email = perfil.email
        localStorage.setItem('autoshopping_usuario', JSON.stringify(usuario))
        document.getElementById('senha').value = ''
        mostrarMensagem('Perfil atualizado com sucesso!', 'sucesso')
    })
    .catch(function (erro) {
        if (erro.message !== 'SESSAO_EXPIRADA') {
            mostrarMensagem(erro.message === 'Failed to fetch'
                ? 'Backend indisponível. Verifique se o servidor está ligado.'
                : erro.message, 'erro')
        }
    })
    .finally(function () {
        botao.disabled = false
        botao.textContent = 'Salvar alterações'
    })
}

if (!token || !lerUsuario()) {
    window.location.href = 'login.html?redirect=perfil.html'
} else {
    usuario = lerUsuario()
    if (usuario.tipo === 'ADMIN') {
        document.getElementById('linkAdmin').hidden = false
        document.getElementById('linkAdminConta').hidden = false
    }
    document.getElementById('botaoSair').addEventListener('click', sair)
    document.getElementById('formPerfil').addEventListener('submit', salvarPerfil)
    atualizarContadorCarrinho()
    carregarPerfil()
}
