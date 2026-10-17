const API_URL = 'http://localhost:3000'

let token = localStorage.getItem('autoshopping_token')
let usuario = JSON.parse(localStorage.getItem('autoshopping_usuario') || 'null')
let resposta = document.getElementById('mensagemPedidos')
let listar = document.getElementById('listaPedidos')
let carrinho = JSON.parse(localStorage.getItem('autoshopping_carrinho') || '[]')

if (!token || !usuario) {
    window.location.href = 'login.html?redirect=meusPedidos.html'
}

document.getElementById('contadorCarrinho').textContent = carrinho.length

if (usuario && usuario.tipo === 'ADMIN') {
    document.getElementById('linkAdmin').hidden = false
    document.getElementById('linkAdminConta').hidden = false
}

function sair() {
    localStorage.removeItem('autoshopping_token')
    localStorage.removeItem('autoshopping_usuario')
    window.location.href = 'login.html?redirect=meusPedidos.html'
}

function traduzirStatus(status) {
    let nome = status

    if (status === 'PENDENTE_PAGAMENTO') nome = 'Pendente'
    if (status === 'PAGO') nome = 'Pago'
    if (status === 'ENVIADO') nome = 'Enviado'
    if (status === 'ENTREGUE') nome = 'Entregue'
    if (status === 'CANCELADO') nome = 'Cancelado'
    if (status === 'AGUARDANDO') nome = 'Aguardando'
    if (status === 'EM_TRANSITO') nome = 'Em trânsito'
    if (status === 'SAIU_PARA_ENTREGA') nome = 'Saiu para entrega'
    if (status === 'EXTRAVIADO') nome = 'Extraviado'

    return nome
}

function cancelarPedido(idPedido) {
    if (!confirm('Deseja realmente cancelar este pedido?')) {
        return
    }

    fetch(`${API_URL}/pedido/${idPedido}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'CANCELADO' })
    })
    .then(function(res) {
        if (res.status === 401) {
            sair()
        }

        return res.json()
    })
    .then(function() {
        carregarPedidos()
    })
    .catch(function() {
        alert('Não foi possível cancelar o pedido!')
    })
}

function carregarPedidos() {
    fetch(`${API_URL}/pedidos`, {
        headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(function(res) {
        if (res.status === 401) {
            sair()
        }

        return res.json()
    })
    .then(function(pedidos) {
        listar.innerHTML = ''

        if (pedidos.length === 0) {
            resposta.innerHTML = 'Você ainda não possui pedidos.<br><a class="link-destaque" href="listarProduto.html">Encontrar um veículo</a>'
            return
        }

        resposta.hidden = true

        pedidos.forEach(function(pedido) {
            let itens = ''

            pedido.itensPedido.forEach(function(item) {
                let produto = item.produtoItem || {}
                let nome = `${produto.marca || ''} ${produto.modelo || ''}`.trim() || produto.nome || 'Veículo'

                itens += `
                    <div class="produto-pedido">
                        <span>${nome}</span>
                        <strong>${Number(item.valorTotalItem).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong>
                    </div>
                `
            })

            let entrega = ''
            if (pedido.entregaPedido) {
                entrega = `${pedido.entregaPedido.tipo === 'RETIRADA' ? 'Retirada' : 'Entrega'} • ${traduzirStatus(pedido.entregaPedido.status)}`
            }

            let botaoCancelar = ''
            if (pedido.status === 'PENDENTE_PAGAMENTO') {
                botaoCancelar = `<button class="botao-texto perigo cancelar-pedido" type="button" onclick="cancelarPedido(${pedido.codPedido})">Cancelar pedido</button>`
            }

            listar.innerHTML += `
                <article class="card-pedido">
                    <div class="pedido-topo">
                        <div>
                            <h2>Pedido #${pedido.codPedido}</h2>
                            <span>${new Date(pedido.dataPedido).toLocaleString('pt-BR')}</span>
                        </div>
                        <span class="status-pedido status-${pedido.status.toLowerCase()}">${traduzirStatus(pedido.status)}</span>
                    </div>
                    <div class="produtos-pedido">${itens}</div>
                    <div class="pedido-rodape">
                        <div>${entrega}</div>
                        <strong>Total: ${Number(pedido.valorTotal).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong>
                    </div>
                    ${botaoCancelar}
                </article>
            `
        })
    })
    .catch(function() {
        resposta.textContent = 'Não foi possível carregar os pedidos. Verifique se o backend está ligado.'
    })
}

carregarPedidos()
