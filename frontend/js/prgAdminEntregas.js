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
    document.getElementById('botaoCadastrarEntrega').classList.remove('ativo')
    document.getElementById('botaoListarEntrega').classList.remove('ativo')
    document.getElementById('botaoConsultarEntrega').classList.remove('ativo')
    document.getElementById('botaoAtualizarEntrega').classList.remove('ativo')
    document.getElementById('botaoApagarEntrega').classList.remove('ativo')
    document.getElementById('painelCadastrarEntrega').hidden = true
    document.getElementById('painelListarEntrega').hidden = true
    document.getElementById('painelConsultarEntrega').hidden = true
    document.getElementById('painelAtualizarEntrega').hidden = true
    document.getElementById('painelApagarEntrega').hidden = true

    if (operacao === 'cadastrar') {
        document.getElementById('botaoCadastrarEntrega').classList.add('ativo')
        document.getElementById('painelCadastrarEntrega').hidden = false
    }
    if (operacao === 'listar') {
        document.getElementById('botaoListarEntrega').classList.add('ativo')
        document.getElementById('painelListarEntrega').hidden = false
    }
    if (operacao === 'consultar') {
        document.getElementById('botaoConsultarEntrega').classList.add('ativo')
        document.getElementById('painelConsultarEntrega').hidden = false
    }
    if (operacao === 'atualizar') {
        document.getElementById('botaoAtualizarEntrega').classList.add('ativo')
        document.getElementById('painelAtualizarEntrega').hidden = false
    }
    if (operacao === 'apagar') {
        document.getElementById('botaoApagarEntrega').classList.add('ativo')
        document.getElementById('painelApagarEntrega').hidden = false
    }
}

function nomeStatus(status) {
    if (status === 'AGUARDANDO') return 'Aguardando'
    if (status === 'EM_TRANSITO') return 'Em trânsito'
    if (status === 'SAIU_PARA_ENTREGA') return 'Saiu para entrega'
    if (status === 'ENTREGUE') return 'Entregue'
    if (status === 'EXTRAVIADO') return 'Extraviado'
    return status
}

function mostrarEntregas(entregas, local) {
    let lista = document.getElementById(local)
    lista.innerHTML = ''

    if (entregas.length === 0) {
        lista.innerHTML = '<div class="mensagem mensagem-vazia">Nenhuma entrega cadastrada.</div>'
        return
    }

    entregas.forEach(function (entrega) {
        let endereco = entrega.tipo === 'RETIRADA' ? 'Retirada na loja' : (entrega.endereco || entrega.logradouro || 'Endereço não informado')
        lista.innerHTML += '<article class="card-gestao-admin"><div class="gestao-admin-topo"><div><span class="sobretitulo">Entrega #' + entrega.codEntrega + ' - Pedido #' + entrega.idPedido + '</span><h3>' + (entrega.tipo === 'RETIRADA' ? 'Retirada' : 'Entrega') + '</h3><p>' + endereco + '</p></div><strong>' + nomeStatus(entrega.status) + '</strong></div><p>Rastreio: ' + (entrega.codigoRastreio || 'Não informado') + '</p></article>'
    })
}

function listarEntregas() {
    fetch(API_URL + '/entregas', { headers: { Authorization: 'Bearer ' + token } })
    .then(function (res) { return res.json() })
    .then(function (dados) {
        if (dados.message) mostrarAviso(dados.message, 'erro')
        else mostrarEntregas(dados, 'listaEntregasAdmin')
    })
    .catch(function () { mostrarAviso('Erro ao listar entregas.', 'erro') })
}

function cadastrarEntrega(evento) {
    evento.preventDefault()
    let tipo = document.getElementById('entregaTipo').value
    let endereco = document.getElementById('entregaEndereco').value

    if (tipo === 'ENTREGA' && !endereco) {
        mostrarAviso('Informe o endereço da entrega.', 'erro')
        return
    }

    let valores = {
        idPedido: Number(document.getElementById('entregaPedido').value),
        tipo: tipo,
        endereco: tipo === 'RETIRADA' ? 'Retirada na loja AutoShopping' : endereco
    }

    fetch(API_URL + '/entrega', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify(valores)
    })
    .then(function (res) { return res.json() })
    .then(function (dados) {
        if (dados.message && !dados.codEntrega) {
            mostrarAviso(dados.message, 'erro')
            return
        }
        mostrarAviso('Entrega cadastrada com sucesso.', 'sucesso')
        document.getElementById('formCadastrarEntrega').reset()
        mostrarOperacao('listar')
        listarEntregas()
    })
    .catch(function () { mostrarAviso('Erro ao cadastrar entrega.', 'erro') })
}

function consultarEntrega(evento) {
    evento.preventDefault()
    let id = document.getElementById('codigoConsultarEntrega').value
    fetch(API_URL + '/entrega/' + id, { headers: { Authorization: 'Bearer ' + token } })
    .then(function (res) { return res.json() })
    .then(function (dados) {
        if (dados.message) mostrarAviso(dados.message, 'erro')
        else mostrarEntregas([dados], 'resultadoConsultaEntrega')
    })
    .catch(function () { mostrarAviso('Erro ao consultar entrega.', 'erro') })
}

function atualizarEntrega(evento) {
    evento.preventDefault()
    let id = document.getElementById('codigoAtualizarEntrega').value
    let valores = {
        status: document.getElementById('statusAtualizarEntrega').value,
        codigoRastreio: document.getElementById('rastreioAtualizarEntrega').value,
        previsao: document.getElementById('previsaoAtualizarEntrega').value || null
    }

    fetch(API_URL + '/entrega/' + id, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify(valores)
    })
    .then(function (res) { return res.json() })
    .then(function (dados) {
        if (dados.message && !dados.codEntrega) {
            mostrarAviso(dados.message, 'erro')
            return
        }
        mostrarAviso('Entrega atualizada com sucesso.', 'sucesso')
        mostrarOperacao('listar')
        listarEntregas()
    })
    .catch(function () { mostrarAviso('Erro ao atualizar entrega.', 'erro') })
}

function apagarEntrega(evento) {
    evento.preventDefault()
    let id = document.getElementById('codigoApagarEntrega').value
    if (!confirm('Deseja realmente apagar esta entrega?')) return

    fetch(API_URL + '/entrega/' + id, { method: 'DELETE', headers: { Authorization: 'Bearer ' + token } })
    .then(function (res) { return res.json() })
    .then(function (dados) {
        mostrarAviso(dados.message, dados.message.includes('sucesso') ? 'sucesso' : 'erro')
        mostrarOperacao('listar')
        listarEntregas()
    })
    .catch(function () { mostrarAviso('Erro ao apagar entrega.', 'erro') })
}

function iniciar() {
    if (!token || !usuario) {
        window.location.href = 'login.html?redirect=adminEntregas.html'
        return
    }
    if (usuario.tipo !== 'ADMIN') {
        window.location.href = 'perfil.html'
        return
    }

    document.getElementById('botaoSair').addEventListener('click', sair)
    document.getElementById('botaoCadastrarEntrega').addEventListener('click', function () { mostrarOperacao('cadastrar') })
    document.getElementById('botaoListarEntrega').addEventListener('click', function () { mostrarOperacao('listar'); listarEntregas() })
    document.getElementById('botaoConsultarEntrega').addEventListener('click', function () { mostrarOperacao('consultar') })
    document.getElementById('botaoAtualizarEntrega').addEventListener('click', function () { mostrarOperacao('atualizar') })
    document.getElementById('botaoApagarEntrega').addEventListener('click', function () { mostrarOperacao('apagar') })
    document.getElementById('formCadastrarEntrega').addEventListener('submit', cadastrarEntrega)
    document.getElementById('formConsultarEntrega').addEventListener('submit', consultarEntrega)
    document.getElementById('formAtualizarEntrega').addEventListener('submit', atualizarEntrega)
    document.getElementById('formApagarEntrega').addEventListener('submit', apagarEntrega)
    document.getElementById('bloqueioAdmin').hidden = true
    document.getElementById('conteudoAdmin').hidden = false
    listarEntregas()
}

iniciar()
