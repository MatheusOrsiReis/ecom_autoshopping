const API_URL = 'http://localhost:3000'

function atualizarContadorCarrinho() {
    let carrinho = []
    try {
        carrinho = JSON.parse(localStorage.getItem('autoshopping_carrinho')) || []
    } catch (erro) {
        carrinho = []
    }
    document.getElementById('contadorCarrinho').textContent = carrinho.length
}

function mostrarMensagemCadastro(texto, tipo) {
    const mensagem = document.getElementById('mensagemCadastro')
    mensagem.className = 'mensagem-formulario ' + tipo
    mensagem.textContent = texto
}

function cadastrarUsuario(evento) {
    evento.preventDefault()

    const botao = document.getElementById('botaoCadastrar')
    const dados = {
        nome: document.getElementById('nome').value.trim(),
        cpf: document.getElementById('cpf').value.trim(),
        email: document.getElementById('email').value.trim(),
        senha: document.getElementById('senha').value,
        telefone: document.getElementById('telefone').value.trim(),
        cep: document.getElementById('cep').value.trim(),
        rua: document.getElementById('rua').value.trim(),
        numero: document.getElementById('numero').value.trim(),
        bairro: document.getElementById('bairro').value.trim(),
        cidade: document.getElementById('cidade').value.trim(),
        uf: document.getElementById('uf').value.trim().toUpperCase()
    }

    botao.disabled = true
    botao.textContent = 'Criando conta...'
    mostrarMensagemCadastro('', '')

    fetch(API_URL + '/usuario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados)
    })
    .then(function (resposta) {
        return resposta.json().then(function (conteudo) {
            if (!resposta.ok) {
                throw new Error(conteudo.message || 'Não foi possível criar a conta.')
            }
            return conteudo
        })
    })
    .then(function () {
        mostrarMensagemCadastro('Conta criada com sucesso! Redirecionando para o login...', 'sucesso')
        setTimeout(function () {
            window.location.href = 'login.html?email=' + encodeURIComponent(dados.email)
        }, 900)
    })
    .catch(function (erro) {
        mostrarMensagemCadastro(erro.message === 'Failed to fetch'
            ? 'Backend indisponível. Verifique se o servidor está ligado.'
            : erro.message, 'erro')
        botao.disabled = false
        botao.textContent = 'Criar minha conta'
    })
}

if (localStorage.getItem('autoshopping_token')) {
    window.location.href = 'perfil.html'
} else {
    document.getElementById('formCadastro').addEventListener('submit', cadastrarUsuario)
    atualizarContadorCarrinho()
}

