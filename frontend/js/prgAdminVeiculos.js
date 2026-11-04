const API_URL = 'http://localhost:3000'
const token = localStorage.getItem('autoshopping_token')
const usuario = JSON.parse(localStorage.getItem('autoshopping_usuario') || 'null')
let produtos = []
let produtoEmEdicao = null
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
    document.getElementById('abaCadastrarProduto').classList.remove('ativo')
    document.getElementById('abaListarProdutos').classList.remove('ativo')
    document.getElementById('abaConsultarProduto').classList.remove('ativo')
    document.getElementById('abaAtualizarProduto').classList.remove('ativo')
    document.getElementById('abaApagarProduto').classList.remove('ativo')

    document.getElementById('formProduto').hidden = true
    document.getElementById('painelListarProdutos').hidden = true
    document.getElementById('painelConsultarProduto').hidden = true
    document.getElementById('painelAtualizarProduto').hidden = true
    document.getElementById('painelApagarProduto').hidden = true

    if (operacao === 'cadastrar') {
        document.getElementById('abaCadastrarProduto').classList.add('ativo')
        document.getElementById('formProduto').hidden = false
    }
    if (operacao === 'listar') {
        document.getElementById('abaListarProdutos').classList.add('ativo')
        document.getElementById('painelListarProdutos').hidden = false
    }
    if (operacao === 'consultar') {
        document.getElementById('abaConsultarProduto').classList.add('ativo')
        document.getElementById('painelConsultarProduto').hidden = false
    }
    if (operacao === 'atualizar') {
        document.getElementById('abaAtualizarProduto').classList.add('ativo')
        document.getElementById('painelAtualizarProduto').hidden = false
    }
    if (operacao === 'apagar') {
        document.getElementById('abaApagarProduto').classList.add('ativo')
        document.getElementById('painelApagarProduto').hidden = false
    }
}

function carregarCategorias() {
    fetch(API_URL + '/categorias')
    .then(function (res) { return res.json() })
    .then(function (categorias) {
        let select = document.getElementById('produtoCategoria')
        select.innerHTML = '<option value="">Selecione</option>'

        categorias.forEach(function (categoria) {
            select.innerHTML += '<option value="' + categoria.codCategoria + '">' + categoria.nome + '</option>'
        })

        if (categorias.length === 0) {
            mostrarAviso('Cadastre uma categoria antes de cadastrar um veículo.', 'erro')
            select.disabled = true
        }
    })
    .catch(function () { mostrarAviso('Erro ao carregar categorias.', 'erro') })
}

function mostrarListaProdutos(dados) {
    let corpo = document.getElementById('corpoTabelaProdutos')
    corpo.innerHTML = ''

    dados.forEach(function (produto) {
        let categoria = produto.categoriaProduto ? produto.categoriaProduto.nome : 'Sem categoria'
        let estoque = produto.estoqueProduto ? produto.estoqueProduto.quantidade : 0
        let preco = Number(produto.preco).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
        let acao = '<button class="botao-texto" onclick="editarProduto(' + produto.codProduto + ')">Atualizar</button>'

        if (produto.fixo) {
            acao = '<span class="selo-status ativo">Veículo fixo</span>'
        }

        corpo.innerHTML += '<tr><td><strong>' + produto.marca + ' ' + produto.modelo + '</strong><small>' + produto.nome + ' - ' + produto.ano + '</small></td><td>' + categoria + '</td><td>' + preco + '</td><td>' + estoque + '</td><td>' + (produto.ativo ? 'Ativo' : 'Inativo') + '</td><td>' + acao + '</td></tr>'
    })
}

function listarProdutos() {
    fetch(API_URL + '/produtos')
    .then(function (res) { return res.json() })
    .then(function (dados) {
        if (!Array.isArray(dados)) dados = []
        produtos = dados.length > 0 ? dados : VEICULOS_FIXOS
        mostrarListaProdutos(produtos)
    })
    .catch(function () {
        produtos = VEICULOS_FIXOS
        mostrarListaProdutos(produtos)
    })
}

function abrirCadastro() {
    produtoEmEdicao = null
    document.getElementById('formProduto').reset()
    document.getElementById('tituloFormProduto').textContent = 'Cadastrar veículo'
    document.getElementById('produtoEstoque').value = 1
    document.getElementById('produtoQuilometragem').value = 0
    document.getElementById('produtoAtivo').checked = true
    mostrarOperacao('cadastrar')
}

function dadosFormulario() {
    return {
        idCategoria: Number(document.getElementById('produtoCategoria').value),
        nome: document.getElementById('produtoNome').value,
        marca: document.getElementById('produtoMarca').value,
        modelo: document.getElementById('produtoModelo').value,
        versao: document.getElementById('produtoVersao').value,
        ano: Number(document.getElementById('produtoAno').value),
        preco: Number(document.getElementById('produtoPreco').value),
        quilometragem: Number(document.getElementById('produtoQuilometragem').value),
        combustivel: document.getElementById('produtoCombustivel').value,
        cambio: document.getElementById('produtoCambio').value,
        cor: document.getElementById('produtoCor').value,
        quantidadeEstoque: Number(document.getElementById('produtoEstoque').value),
        imagem: document.getElementById('produtoImagem').value,
        descricao: document.getElementById('produtoDescricao').value,
        ativo: document.getElementById('produtoAtivo').checked
    }
}

function salvarProduto(evento) {
    evento.preventDefault()
    let dados = dadosFormulario()
    let caminho = '/produto'
    let metodo = 'POST'
    let quantidade = dados.quantidadeEstoque

    if (produtoEmEdicao) {
        caminho = '/produto/' + produtoEmEdicao.codProduto
        metodo = 'PUT'
        delete dados.quantidadeEstoque
    }

    fetch(API_URL + caminho, {
        method: metodo,
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify(dados)
    })
    .then(function (res) { return res.json() })
    .then(function (resultado) {
        if (resultado.message && !resultado.codProduto) throw new Error(resultado.message)

        if (produtoEmEdicao) {
            let caminhoEstoque = '/estoque'
            let metodoEstoque = 'POST'
            let valoresEstoque = { idProduto: produtoEmEdicao.codProduto, quantidade: quantidade }

            if (produtoEmEdicao.estoqueProduto) {
                caminhoEstoque = '/estoque/' + produtoEmEdicao.estoqueProduto.codEstoque
                metodoEstoque = 'PUT'
                valoresEstoque = { quantidade: quantidade }
            }

            return fetch(API_URL + caminhoEstoque, {
                method: metodoEstoque,
                headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
                body: JSON.stringify(valoresEstoque)
            })
            .then(function (res) { return res.json() })
            .then(function (estoque) {
                if (estoque.message && !estoque.codEstoque) throw new Error(estoque.message)
                return estoque
            })
        }
    })
    .then(function () {
        mostrarAviso(produtoEmEdicao ? 'Veículo atualizado com sucesso.' : 'Veículo cadastrado com sucesso.', 'sucesso')
        produtoEmEdicao = null
        mostrarOperacao('listar')
        listarProdutos()
    })
    .catch(function (erro) { mostrarAviso(erro.message || 'Erro ao salvar veículo.', 'erro') })
}

function preencherFormulario(produto) {
    produtoEmEdicao = produto
    document.getElementById('tituloFormProduto').textContent = 'Atualizar veículo'
    document.getElementById('produtoCategoria').value = produto.idCategoria
    document.getElementById('produtoNome').value = produto.nome || ''
    document.getElementById('produtoMarca').value = produto.marca || ''
    document.getElementById('produtoModelo').value = produto.modelo || ''
    document.getElementById('produtoVersao').value = produto.versao || ''
    document.getElementById('produtoAno').value = produto.ano || ''
    document.getElementById('produtoPreco').value = produto.preco || ''
    document.getElementById('produtoQuilometragem').value = produto.quilometragem || 0
    document.getElementById('produtoCombustivel').value = produto.combustivel || ''
    document.getElementById('produtoCambio').value = produto.cambio || ''
    document.getElementById('produtoCor').value = produto.cor || ''
    document.getElementById('produtoEstoque').value = produto.estoqueProduto ? produto.estoqueProduto.quantidade : 0
    document.getElementById('produtoImagem').value = produto.imagem || ''
    document.getElementById('produtoDescricao').value = produto.descricao || ''
    document.getElementById('produtoAtivo').checked = produto.ativo
    mostrarOperacao('atualizar')
    document.getElementById('painelAtualizarProduto').hidden = true
    document.getElementById('formProduto').hidden = false
}

function editarProduto(id) {
    let produto = produtos.find(function (item) { return item.codProduto === id })
    if (produto) preencherFormulario(produto)
}

function buscarParaAtualizar(evento) {
    evento.preventDefault()
    let id = document.getElementById('codigoAtualizarProduto').value
    fetch(API_URL + '/produto/' + id)
    .then(function (res) { return res.json() })
    .then(function (produto) {
        if (produto.message) mostrarAviso(produto.message, 'erro')
        else preencherFormulario(produto)
    })
    .catch(function () { mostrarAviso('Erro ao consultar veículo.', 'erro') })
}

function consultarProduto(evento) {
    evento.preventDefault()
    let id = document.getElementById('codigoConsultaProduto').value
    fetch(API_URL + '/produto/' + id)
    .then(function (res) { return res.json() })
    .then(function (produto) {
        let resultado = document.getElementById('resultadoConsultaProduto')
        if (produto.message) {
            resultado.innerHTML = '<div class="mensagem mensagem-erro">' + produto.message + '</div>'
            return
        }
        resultado.innerHTML = '<article class="card-gestao-admin"><span class="sobretitulo">Veículo #' + produto.codProduto + '</span><h3>' + produto.marca + ' ' + produto.modelo + '</h3><p>' + produto.nome + '</p><strong>' + Number(produto.preco).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) + '</strong></article>'
    })
    .catch(function () { mostrarAviso('Erro ao consultar veículo.', 'erro') })
}

function apagarProduto(evento) {
    evento.preventDefault()
    let id = document.getElementById('codigoApagarProduto').value
    if (!confirm('Deseja realmente apagar este veículo?')) return

    fetch(API_URL + '/produto/' + id, { method: 'DELETE', headers: { Authorization: 'Bearer ' + token } })
    .then(function (res) { return res.json() })
    .then(function (dados) {
        mostrarAviso(dados.message, dados.message.includes('sucesso') ? 'sucesso' : 'erro')
        mostrarOperacao('listar')
        listarProdutos()
    })
    .catch(function () { mostrarAviso('Erro ao apagar veículo.', 'erro') })
}

function iniciar() {
    if (!token || !usuario) {
        window.location.href = 'login.html?redirect=adminVeiculos.html'
        return
    }
    if (usuario.tipo !== 'ADMIN') {
        window.location.href = 'perfil.html'
        return
    }

    document.getElementById('botaoSair').addEventListener('click', sair)
    document.getElementById('abaCadastrarProduto').addEventListener('click', abrirCadastro)
    document.getElementById('abaListarProdutos').addEventListener('click', function () { mostrarOperacao('listar'); listarProdutos() })
    document.getElementById('abaConsultarProduto').addEventListener('click', function () { mostrarOperacao('consultar') })
    document.getElementById('abaAtualizarProduto').addEventListener('click', function () { mostrarOperacao('atualizar') })
    document.getElementById('abaApagarProduto').addEventListener('click', function () { mostrarOperacao('apagar') })
    document.getElementById('formProduto').addEventListener('submit', salvarProduto)
    document.getElementById('formConsultarProduto').addEventListener('submit', consultarProduto)
    document.getElementById('formAtualizarProduto').addEventListener('submit', buscarParaAtualizar)
    document.getElementById('formApagarProduto').addEventListener('submit', apagarProduto)
    document.getElementById('botaoCancelarProduto').addEventListener('click', function () { mostrarOperacao('listar') })
    document.getElementById('bloqueioAdmin').hidden = true
    document.getElementById('conteudoAdmin').hidden = false
    carregarCategorias()
    listarProdutos()
}

iniciar()
