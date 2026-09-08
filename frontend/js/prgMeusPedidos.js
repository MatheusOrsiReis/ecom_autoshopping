const API_URL = 'http://localhost:3000'
const token = localStorage.getItem('autoshopping_token')

function lerUsuario() {
    try {
        return JSON.parse(localStorage.getItem('autoshopping_usuario'))
    } catch (erro) {
        return null
    }
}

function sair() {
    localStorage.removeItem('autoshopping_token')
    localStorage.removeItem('autoshopping_usuario')
    window.location.href = 'login.html?redirect=meusPedidos.html'
}

function atualizarContadorCarrinho() {
    try {
        const carrinho = JSON.parse(localStorage.getItem('autoshopping_carrinho')) || []
        document.getElementById('contadorCarrinho').textContent = carrinho.length
    } catch (erro) {
        document.getElementById('contadorCarrinho').textContent = '0'
    }
}

function atualizarNavegacaoAdmin() {
    const usuario = lerUsuario()
    if (usuario && usuario.tipo === 'ADMIN') {
        document.getElementById('linkAdmin').hidden = false
        document.getElementById('linkAdminConta').hidden = false
    }
}

function formatarPreco(valor) {
    return Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatarData(valor) {
    return new Date(valor).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

function traduzirStatus(status) {
    const textos = {
        PENDENTE_PAGAMENTO: 'Pendente',
        PAGO: 'Pago',
        ENVIADO: 'Enviado',
        ENTREGUE: 'Entregue',
        CANCELADO: 'Cancelado',
        AGUARDANDO: 'Aguardando',
        EM_TRANSITO: 'Em trânsito',
        SAIU_PARA_ENTREGA: 'Saiu para entrega',
        EXTRAVIADO: 'Extraviado'
    }
    return textos[status] || status
}

function cancelarPedido(idPedido, botao) {
    if (!window.confirm('Deseja realmente cancelar este pedido?')) return

    botao.disabled = true
    botao.textContent = 'Cancelando...'

    fetch(API_URL + '/pedido/' + idPedido, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify({ status: 'CANCELADO' })
    })
    .then(function (resposta) {
        if (resposta.status === 401) {
            sair()
            throw new Error('SESSAO_EXPIRADA')
        }
        return resposta.json().then(function (conteudo) {
            if (!resposta.ok) throw new Error(conteudo.message || 'Não foi possível cancelar o pedido.')
        })
    })
    .then(carregarPedidos)
    .catch(function (erro) {
        if (erro.message !== 'SESSAO_EXPIRADA') {
            window.alert(erro.message === 'Failed to fetch' ? 'Backend indisponível.' : erro.message)
            botao.disabled = false
            botao.textContent = 'Cancelar pedido'
        }
    })
}

function criarItemPedido(item) {
    const linha = document.createElement('div')
    linha.className = 'produto-pedido'
    const produto = item.produtoItem || {}
    const nome = document.createElement('span')
    nome.textContent = [produto.marca, produto.modelo].filter(Boolean).join(' ') || produto.nome || 'Veículo'
    const valor = document.createElement('strong')
    valor.textContent = formatarPreco(item.valorTotalItem)
    linha.appendChild(nome)
    linha.appendChild(valor)
    return linha
}

function criarCardPedido(pedido) {
    const card = document.createElement('article')
    card.className = 'card-pedido'

    const topo = document.createElement('div')
    topo.className = 'pedido-topo'
    const identificacao = document.createElement('div')
    const numero = document.createElement('h2')
    numero.textContent = 'Pedido #' + pedido.codPedido
    const data = document.createElement('span')
    data.textContent = formatarData(pedido.dataPedido)
    identificacao.appendChild(numero)
    identificacao.appendChild(data)
    const status = document.createElement('span')
    status.className = 'status-pedido status-' + pedido.status.toLowerCase()
    status.textContent = traduzirStatus(pedido.status)
    topo.appendChild(identificacao)
    topo.appendChild(status)

    const itens = document.createElement('div')
    itens.className = 'produtos-pedido'
    ;(pedido.itensPedido || []).forEach(function (item) {
        itens.appendChild(criarItemPedido(item))
    })

    const rodape = document.createElement('div')
    rodape.className = 'pedido-rodape'
    const entrega = document.createElement('div')
    if (pedido.entregaPedido) {
        entrega.textContent = (pedido.entregaPedido.tipo === 'RETIRADA' ? 'Retirada' : 'Entrega') +
            ' • ' + traduzirStatus(pedido.entregaPedido.status)
    }
    const total = document.createElement('strong')
    total.textContent = 'Total: ' + formatarPreco(pedido.valorTotal)
    rodape.appendChild(entrega)
    rodape.appendChild(total)

    card.appendChild(topo)
    card.appendChild(itens)
    card.appendChild(rodape)

    if (pedido.status === 'PENDENTE_PAGAMENTO') {
        const botao = document.createElement('button')
        botao.className = 'botao-texto perigo cancelar-pedido'
        botao.type = 'button'
        botao.textContent = 'Cancelar pedido'
        botao.addEventListener('click', function () {
            cancelarPedido(pedido.codPedido, botao)
        })
        card.appendChild(botao)
    }

    return card
}

function carregarPedidos() {
    const lista = document.getElementById('listaPedidos')
    const mensagem = document.getElementById('mensagemPedidos')
    mensagem.hidden = false
    mensagem.className = 'mensagem carregando'
    mensagem.textContent = 'Carregando pedidos...'
    lista.innerHTML = ''

    fetch(API_URL + '/pedidos', { headers: { Authorization: 'Bearer ' + token } })
    .then(function (resposta) {
        if (resposta.status === 401) {
            sair()
            throw new Error('SESSAO_EXPIRADA')
        }
        if (!resposta.ok) throw new Error('Não foi possível carregar seus pedidos.')
        return resposta.json()
    })
    .then(function (pedidos) {
        if (pedidos.length === 0) {
            mensagem.className = 'mensagem mensagem-vazia'
            mensagem.innerHTML = 'Você ainda não possui pedidos.<br><a class="link-destaque" href="listarProduto.html">Encontrar um veículo</a>'
            return
        }

        mensagem.hidden = true
        pedidos.forEach(function (pedido) {
            lista.appendChild(criarCardPedido(pedido))
        })
    })
    .catch(function (erro) {
        if (erro.message !== 'SESSAO_EXPIRADA') {
            mensagem.className = 'mensagem mensagem-erro'
            mensagem.textContent = erro.message === 'Failed to fetch'
                ? 'Backend indisponível. Verifique se o servidor está ligado.'
                : erro.message
        }
    })
}

if (!token || !lerUsuario()) {
    window.location.href = 'login.html?redirect=meusPedidos.html'
} else {
    atualizarContadorCarrinho()
    atualizarNavegacaoAdmin()
    carregarPedidos()
}
