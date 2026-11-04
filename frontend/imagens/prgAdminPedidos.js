const API_URL = 'http://localhost:3000'
const token = localStorage.getItem('autoshopping_token')
const usuario = JSON.parse(localStorage.getItem('autoshopping_usuario') || 'null')
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
    document.getElementById('botaoCadastrarPedido').classList.remove('ativo')
    document.getElementById('botaoListarPedido').classList.remove('ativo')
    document.getElementById('botaoConsultarPedido').classList.remove('ativo')
    document.getElementById('botaoAtualizarPedido').classList.remove('ativo')
    document.getElementById('botaoApagarPedido').classList.remove('ativo')
    document.getElementById('painelCadastrarPedido').hidden = true
    document.getElementById('painelListarPedido').hidden = true
    document.getElementById('painelConsultarPedido').hidden = true
    document.getElementById('painelAtualizarPedido').hidden = true
    document.getElementById('painelApagarPedido').hidden = true

    if (operacao === 'cadastrar') {
        document.getElementById('botaoCadastrarPedido').classList.add('ativo')
        document.getElementById('painelCadastrarPedido').hidden = false
    }
    if (operacao === 'listar') {
        document.getElementById('botaoListarPedido').classList.add('ativo')
        document.getElementById('painelListarPedido').hidden = false
    }
    if (operacao === 'consultar') {
        document.getElementById('botaoConsultarPedido').classList.add('ativo')
        document.getElementById('painelConsultarPedido').hidden = false
    }
    if (operacao === 'atualizar') {
        document.getElementById('botaoAtualizarPedido').classList.add('ativo')
        document.getElementById('painelAtualizarPedido').hidden = false
    }
    if (operacao === 'apagar') {
        document.getElementById('botaoApagarPedido').classList.add('ativo')
        document.getElementById('painelApagarPedido').hidden = false
    }
}

function nomeStatus(status) {
    if (status === 'PENDENTE_PAGAMENTO') return 'Pendente de pagamento'
    if (status === 'PAGO') return 'Pago'
    if (status === 'ENVIADO') return 'Enviado'
    if (status === 'ENTREGUE') return 'Entregue'
    if (status === 'CANCELADO') return 'Cancelado'
    return status
}

function mostrarPedidos(pedidos, local) {
    let lista = document.getElementById(local)
    lista.innerHTML = ''

    if (pedidos.length === 0) {
        lista.innerHTML = '<div class="mensagem mensagem-vazia">Nenhum pedido encontrado.</div>'
        return
    }

    pedidos.forEach(function (pedido) {
        let cliente = pedido.usuarioPedido ? pedido.usuarioPedido.nome : 'Cliente não identificado'
        let itens = ''
        if (pedido.itensPedido) {
            pedido.itensPedido.forEach(function (item) {
                let nome = item.produtoItem ? item.produtoItem.nome : 'Veículo'
                itens += '<span>' + nome + ' x' + item.quantidade + '</span>'
            })
        }

        let total = Number(pedido.valorTotal || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
        lista.innerHTML += '<article class="card-gestao-admin"><div class="gestao-admin-topo"><div><span class="sobretitulo">Pedido #' + pedido.codPedido + '</span><h3>' + cliente + '</h3><p>Status: ' + nomeStatus(pedido.status) + '</p></div><strong>' + total + '</strong></div><div class="resumo-itens-admin">' + (itens || '<span>Sem itens</span>') + '</div></article>'
    })
}

function listarPedidos() {
    let status = document.getElementById('filtroStatusPedido').value
    let caminho = '/pedidos'
    if (status) caminho += '?status=' + status

    fetch(API_URL + caminho, { headers: { Authorization: 'Bearer ' + token } })
    .then(function (res) { return res.json() })
    .then(function (dados) {
        if (dados.message) mostrarAviso(dados.message, 'erro')
        else mostrarPedidos(dados, 'listaPedidosAdmin')
    })
    .catch(function () { mostrarAviso('Erro ao listar pedidos.', 'erro') })
}

function cadastrarPedido(evento) {
    evento.preventDefault()
    let tipo = document.getElementById('pedidoTipoEntrega').value
    let endereco = document.getElementById('pedidoEndereco').value

    if (tipo === 'ENTREGA' && !endereco) {
        mostrarAviso('Informe o endereço da entrega.', 'erro')
        return
    }

    let valores = {
        usuarioId: Number(document.getElementById('pedidoUsuario').value),
        itens: [{
            produtoId: Number(document.getElementById('pedidoProduto').value),
            quantidade: Number(document.getElementById('pedidoQuantidade').value)
        }],
        entrega: { tipo: tipo, endereco: tipo === 'RETIRADA' ? 'Retirada na loja AutoShopping' : endereco },
        valorFrete: Number(document.getElementById('pedidoFrete').value || 0)
    }

    fetch(API_URL + '/pedido', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify(valores)
    })
    .then(function (res) { return res.json() })
    .then(function (dados) {
        if (dados.message && !dados.codPedido) {
            mostrarAviso(dados.message, 'erro')
            return
        }
        mostrarAviso('Pedido cadastrado com sucesso.', 'sucesso')
        document.getElementById('formCadastrarPedido').reset()
        mostrarOperacao('listar')
        listarPedidos()
    })
    .catch(function () { mostrarAviso('Erro ao cadastrar pedido.', 'erro') })
}

function consultarPedido(evento) {
    evento.preventDefault()
    let id = document.getElementById('codigoConsultarPedido').value
    fetch(API_URL + '/pedido/' + id, { headers: { Authorization: 'Bearer ' + token } })
    .then(function (res) { return res.json() })
    .then(function (dados) {
        if (dados.message) mostrarAviso(dados.message, 'erro')
        else mostrarPedidos([dados], 'resultadoConsultaPedido')
    })
    .catch(function () { mostrarAviso('Erro ao consultar pedido.', 'erro') })
}

function atualizarPedido(evento) {
    evento.preventDefault()
    let id = document.getElementById('codigoAtualizarPedido').value
    let valores = { status: document.getElementById('statusAtualizarPedido').value }

    fetch(API_URL + '/pedido/' + id, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify(valores)
    })
    .then(function (res) { return res.json() })
    .then(function (dados) {
        if (dados.message && !dados.codPedido) {
            mostrarAviso(dados.message, 'erro')
            return
        }
        mostrarAviso('Pedido atualizado com sucesso.', 'sucesso')
        mostrarOperacao('listar')
        listarPedidos()
    })
    .catch(function () { mostrarAviso('Erro ao atualizar pedido.', 'erro') })
}

function apagarPedido(evento) {
    evento.preventDefault()
    let id = document.getElementById('codigoApagarPedido').value
    if (!confirm('Deseja realmente apagar este pedido?')) return

    fetch(API_URL + '/pedido/' + id, { method: 'DELETE', headers: { Authorization: 'Bearer ' + token } })
    .then(function (res) { return res.json() })
    .then(function (dados) {
        mostrarAviso(dados.message, dados.message.includes('sucesso') ? 'sucesso' : 'erro')
        mostrarOperacao('listar')
        listarPedidos()
    })
    .catch(function () { mostrarAviso('Erro ao apagar pedido.', 'erro') })
}

function iniciar() {
    if (!token || !usuario) {
        window.location.href = 'login.html?redirect=adminPedidos.html'
        return
    }
    if (usuario.tipo !== 'ADMIN') {
        window.location.href = 'perfil.html'
        return
    }

    document.getElementById('botaoSair').addEventListener('click', sair)
    document.getElementById('botaoCadastrarPedido').addEventListener('click', function () { mostrarOperacao('cadastrar') })
    document.getElementById('botaoListarPedido').addEventListener('click', function () { mostrarOperacao('listar'); listarPedidos() })
    document.getElementById('botaoConsultarPedido').addEventListener('click', function () { mostrarOperacao('consultar') })
    document.getElementById('botaoAtualizarPedido').addEventListener('click', function () { mostrarOperacao('atualizar') })
    document.getElementById('botaoApagarPedido').addEventListener('click', function () { mostrarOperacao('apagar') })
    document.getElementById('formCadastrarPedido').addEventListener('submit', cadastrarPedido)
    document.getElementById('formConsultarPedido').addEventListener('submit', consultarPedido)
    document.getElementById('formAtualizarPedido').addEventListener('submit', atualizarPedido)
    document.getElementById('formApagarPedido').addEventListener('submit', apagarPedido)
    document.getElementById('filtroStatusPedido').addEventListener('change', listarPedidos)
    document.getElementById('bloqueioAdmin').hidden = true
    document.getElementById('conteudoAdmin').hidden = false
    listarPedidos()
}

iniciar()
