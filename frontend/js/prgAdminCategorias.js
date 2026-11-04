const API_URL = 'http://localhost:3000'
const token = localStorage.getItem('autoshopping_token')
const usuario = JSON.parse(localStorage.getItem('autoshopping_usuario') || 'null')
let categorias = []
let categoriaEmEdicao = null
let resposta = document.getElementById('mensagemAdmin')

function sair() {
    localStorage.removeItem('autoshopping_token')
    localStorage.removeItem('autoshopping_usuario')
    window.location.href = 'login.html?redirect=admin.html'
}

function mostrarAviso(texto, tipo) {
    resposta.hidden = false
    resposta.className = 'aviso-admin ' + tipo
    resposta.textContent = texto
}

function mostrarOperacao(operacao) {
    document.getElementById('botaoCadastrarCategoria').classList.remove('ativo')
    document.getElementById('botaoListarCategoria').classList.remove('ativo')
    document.getElementById('botaoConsultarCategoria').classList.remove('ativo')
    document.getElementById('botaoAtualizarCategoria').classList.remove('ativo')
    document.getElementById('botaoApagarCategoria').classList.remove('ativo')
    document.getElementById('painelCadastrarCategoria').hidden = true
    document.getElementById('painelListarCategoria').hidden = true
    document.getElementById('painelConsultarCategoria').hidden = true
    document.getElementById('painelAtualizarCategoria').hidden = true
    document.getElementById('painelApagarCategoria').hidden = true

    if (operacao === 'cadastrar') {
        document.getElementById('botaoCadastrarCategoria').classList.add('ativo')
        document.getElementById('painelCadastrarCategoria').hidden = false
    }
    if (operacao === 'listar') {
        document.getElementById('botaoListarCategoria').classList.add('ativo')
        document.getElementById('painelListarCategoria').hidden = false
    }
    if (operacao === 'consultar') {
        document.getElementById('botaoConsultarCategoria').classList.add('ativo')
        document.getElementById('painelConsultarCategoria').hidden = false
    }
    if (operacao === 'atualizar') {
        document.getElementById('botaoAtualizarCategoria').classList.add('ativo')
        document.getElementById('painelAtualizarCategoria').hidden = false
    }
    if (operacao === 'apagar') {
        document.getElementById('botaoApagarCategoria').classList.add('ativo')
        document.getElementById('painelApagarCategoria').hidden = false
    }
}

function listarCategorias() {
    fetch(API_URL + '/categorias')
    .then(function (res) { return res.json() })
    .then(function (dados) {
        categorias = dados
        let lista = document.getElementById('listaCategoriasAdmin')
        lista.innerHTML = ''

        if (dados.length === 0) {
            lista.innerHTML = '<div class="mensagem mensagem-vazia">Nenhuma categoria cadastrada.</div>'
            return
        }

        dados.forEach(function (categoria) {
            lista.innerHTML += '<article class="item-lista-admin"><div><strong>' + categoria.nome + '</strong><p>' + (categoria.descricao || 'Sem descrição') + '</p><small>Código: ' + categoria.codCategoria + '</small></div><button class="botao-texto" onclick="editarCategoria(' + categoria.codCategoria + ')">Atualizar</button></article>'
        })
    })
    .catch(function () { mostrarAviso('Erro ao listar categorias.', 'erro') })
}

function abrirCadastro() {
    categoriaEmEdicao = null
    document.getElementById('formCategoria').reset()
    document.getElementById('tituloFormCategoria').textContent = 'Cadastrar categoria'
    mostrarOperacao('cadastrar')
}

function salvarCategoria(evento) {
    evento.preventDefault()
    let valores = {
        nome: document.getElementById('categoriaNome').value,
        descricao: document.getElementById('categoriaDescricao').value
    }
    let caminho = categoriaEmEdicao ? '/categoria/' + categoriaEmEdicao.codCategoria : '/categoria'
    let metodo = categoriaEmEdicao ? 'PUT' : 'POST'

    fetch(API_URL + caminho, {
        method: metodo,
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify(valores)
    })
    .then(function (res) { return res.json() })
    .then(function (dados) {
        if (dados.message && !dados.codCategoria) {
            mostrarAviso(dados.message, 'erro')
            return
        }
        mostrarAviso(categoriaEmEdicao ? 'Categoria atualizada com sucesso.' : 'Categoria cadastrada com sucesso.', 'sucesso')
        categoriaEmEdicao = null
        mostrarOperacao('listar')
        listarCategorias()
    })
    .catch(function () { mostrarAviso('Erro ao salvar categoria.', 'erro') })
}

function preencherFormulario(categoria) {
    categoriaEmEdicao = categoria
    document.getElementById('tituloFormCategoria').textContent = 'Atualizar categoria'
    document.getElementById('categoriaNome').value = categoria.nome
    document.getElementById('categoriaDescricao').value = categoria.descricao || ''
    mostrarOperacao('atualizar')
    document.getElementById('painelAtualizarCategoria').hidden = true
    document.getElementById('painelCadastrarCategoria').hidden = false
}

function editarCategoria(id) {
    let categoria = categorias.find(function (item) { return item.codCategoria === id })
    if (categoria) preencherFormulario(categoria)
}

function buscarParaAtualizar(evento) {
    evento.preventDefault()
    let id = Number(document.getElementById('codigoAtualizarCategoria').value)
    let categoria = categorias.find(function (item) { return item.codCategoria === id })
    if (categoria) preencherFormulario(categoria)
    else mostrarAviso('Categoria não encontrada.', 'erro')
}

function consultarCategoria(evento) {
    evento.preventDefault()
    let id = document.getElementById('codigoConsultarCategoria').value
    fetch(API_URL + '/categoria/' + id)
    .then(function (res) { return res.json() })
    .then(function (categoria) {
        let resultado = document.getElementById('resultadoConsultaCategoria')
        if (categoria.message) resultado.innerHTML = '<div class="mensagem mensagem-erro">' + categoria.message + '</div>'
        else resultado.innerHTML = '<article class="item-lista-admin"><div><strong>' + categoria.nome + '</strong><p>' + (categoria.descricao || 'Sem descrição') + '</p><small>Código: ' + categoria.codCategoria + '</small></div></article>'
    })
    .catch(function () { mostrarAviso('Erro ao consultar categoria.', 'erro') })
}

function apagarCategoria(evento) {
    evento.preventDefault()
    let id = document.getElementById('codigoApagarCategoria').value
    if (!confirm('Deseja realmente apagar esta categoria?')) return

    fetch(API_URL + '/categoria/' + id, { method: 'DELETE', headers: { Authorization: 'Bearer ' + token } })
    .then(function (res) { return res.json() })
    .then(function (dados) {
        mostrarAviso(dados.message, dados.message.includes('sucesso') ? 'sucesso' : 'erro')
        mostrarOperacao('listar')
        listarCategorias()
    })
    .catch(function () { mostrarAviso('Erro ao apagar categoria.', 'erro') })
}

function iniciar() {
    if (!token || !usuario) {
        window.location.href = 'login.html?redirect=adminCategorias.html'
        return
    }
    if (usuario.tipo !== 'ADMIN') {
        window.location.href = 'perfil.html'
        return
    }

    document.getElementById('botaoSair').addEventListener('click', sair)
    document.getElementById('botaoCadastrarCategoria').addEventListener('click', abrirCadastro)
    document.getElementById('botaoListarCategoria').addEventListener('click', function () { mostrarOperacao('listar'); listarCategorias() })
    document.getElementById('botaoConsultarCategoria').addEventListener('click', function () { mostrarOperacao('consultar') })
    document.getElementById('botaoAtualizarCategoria').addEventListener('click', function () { mostrarOperacao('atualizar') })
    document.getElementById('botaoApagarCategoria').addEventListener('click', function () { mostrarOperacao('apagar') })
    document.getElementById('formCategoria').addEventListener('submit', salvarCategoria)
    document.getElementById('formConsultarCategoria').addEventListener('submit', consultarCategoria)
    document.getElementById('formAtualizarCategoria').addEventListener('submit', buscarParaAtualizar)
    document.getElementById('formApagarCategoria').addEventListener('submit', apagarCategoria)
    document.getElementById('botaoCancelarCategoria').addEventListener('click', function () { mostrarOperacao('listar') })
    document.getElementById('bloqueioAdmin').hidden = true
    document.getElementById('conteudoAdmin').hidden = false
    listarCategorias()
}

iniciar()
