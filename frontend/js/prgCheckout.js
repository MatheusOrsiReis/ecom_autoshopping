const API_URL = 'http://localhost:3000'

let token = localStorage.getItem('autoshopping_token')
let usuario = JSON.parse(localStorage.getItem('autoshopping_usuario') || 'null')
let idsCarrinho = JSON.parse(localStorage.getItem('autoshopping_carrinho') || '[]')
let produtosCheckout = []
let resposta = document.getElementById('mensagemCheckout')

if (!token || !usuario) {
    window.location.href = 'login.html?redirect=checkout.html'
}

if (idsCarrinho.length === 0) {
    window.location.href = 'carrinho.html'
}

if (usuario && usuario.tipo === 'ADMIN') {
    document.getElementById('linkAdmin').hidden = false
}

document.getElementById('contadorCarrinho').textContent = idsCarrinho.length

function formatarCep(valor) {
    return valor.replace(/\D/g, '').slice(0, 8).replace(/^(\d{5})(\d)/, '$1-$2')
}

function consultarCep() {
    let cep = document.getElementById('cep').value.replace(/\D/g, '')

    if (cep.length !== 8) {
        return
    }

    document.getElementById('mensagemCepCheckout').textContent = 'Consultando CEP...'

    fetch(`https://viacep.com.br/ws/${cep}/json/`)
    .then(function(res) {
        return res.json()
    })
    .then(function(endereco) {
        if (endereco.erro) {
            document.getElementById('mensagemCepCheckout').textContent = 'CEP não encontrado.'
            return
        }

        document.getElementById('logradouro').value = endereco.logradouro || ''
        document.getElementById('bairro').value = endereco.bairro || ''
        document.getElementById('cidade').value = endereco.localidade || ''
        document.getElementById('uf').value = endereco.uf || ''
        document.getElementById('mensagemCepCheckout').textContent = 'Endereço preenchido automaticamente.'
        document.getElementById('numero').focus()
    })
    .catch(function() {
        document.getElementById('mensagemCepCheckout').textContent = 'Não foi possível consultar o CEP.'
    })
}

function mostrarTipoEntrega() {
    let entrega = document.getElementById('tipoEntrega').value === 'ENTREGA'
    document.getElementById('camposEndereco').hidden = !entrega
    document.getElementById('cep').required = entrega
    document.getElementById('logradouro').required = entrega
    document.getElementById('numero').required = entrega
    document.getElementById('bairro').required = entrega
    document.getElementById('cidade').required = entrega
    document.getElementById('uf').required = entrega
}

function mostrarResumo() {
    let subtotal = 0
    document.getElementById('itensCheckout').innerHTML = ''

    produtosCheckout.forEach(function(produto) {
        let nome = `${produto.marca || ''} ${produto.modelo || ''}`.trim() || produto.nome
        subtotal += Number(produto.preco)

        document.getElementById('itensCheckout').innerHTML += `
            <div class="item-checkout">
                <span>${nome}</span>
                <strong>${Number(produto.preco).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong>
            </div>
        `
    })

    let desconto = 0
    if (subtotal >= 200000) desconto = subtotal * 0.05

    document.getElementById('subtotalCheckout').textContent = subtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    document.getElementById('descontoCheckout').textContent = '- ' + desconto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    document.getElementById('linhaDescontoCheckout').hidden = desconto === 0
    document.getElementById('totalCheckout').textContent = (subtotal - desconto).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

fetch(`${API_URL}/produtos?ativo=true`)
.then(function(res) {
    return res.json()
})
.then(function(produtos) {
    produtosCheckout = produtos.filter(function(produto) {
        return idsCarrinho.includes(produto.codProduto) && produto.estoqueProduto && produto.estoqueProduto.quantidade > 0
    })

    if (produtosCheckout.length !== idsCarrinho.length) {
        resposta.textContent = 'Um dos veículos não está mais disponível. Revise seu carrinho.'
        document.getElementById('botaoConfirmarPedido').disabled = true
        return
    }

    mostrarResumo()
})
.catch(function() {
    resposta.textContent = 'Erro ao carregar os veículos!'
})

fetch(`${API_URL}/usuario/${usuario ? usuario.codUsuario : ''}`, {
    headers: { 'Authorization': `Bearer ${token}` }
})
.then(function(res) {
    return res.json()
})
.then(function(perfil) {
    document.getElementById('cep').value = formatarCep(perfil.cep || '')
    document.getElementById('logradouro').value = perfil.rua || ''
    document.getElementById('numero').value = perfil.numero || ''
    document.getElementById('bairro').value = perfil.bairro || ''
    document.getElementById('cidade').value = perfil.cidade || ''
    document.getElementById('uf').value = perfil.uf || ''
})

document.getElementById('tipoEntrega').addEventListener('change', mostrarTipoEntrega)

document.getElementById('cep').addEventListener('input', function(e) {
    e.target.value = formatarCep(e.target.value)

    if (e.target.value.replace(/\D/g, '').length === 8) {
        consultarCep()
    }
})

document.getElementById('formCheckout').addEventListener('submit', function(e) {
    e.preventDefault()

    let tipo = document.getElementById('tipoEntrega').value
    let entrega = {
        tipo: 'RETIRADA',
        endereco: 'Retirada na loja AutoShopping'
    }

    if (tipo === 'ENTREGA') {
        let rua = document.getElementById('logradouro').value
        let numero = document.getElementById('numero').value
        let bairro = document.getElementById('bairro').value
        let cidade = document.getElementById('cidade').value
        let uf = document.getElementById('uf').value

        entrega = {
            tipo: 'ENTREGA',
            endereco: `${rua}, ${numero}, ${bairro}, ${cidade} - ${uf}`,
            cep: document.getElementById('cep').value,
            logradouro: rua,
            numero: numero,
            bairro: bairro,
            localidade: cidade,
            uf: uf,
            complemento: document.getElementById('complemento').value
        }
    }

    let valores = {
        itens: produtosCheckout.map(function(produto) {
            return { produtoId: produto.codProduto, quantidade: 1 }
        }),
        entrega: entrega
    }

    document.getElementById('botaoConfirmarPedido').disabled = true

    fetch(`${API_URL}/pedido`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(valores)
    })
    .then(function(res) {
        return res.json()
    })
    .then(function(pedido) {
        if (pedido.message && !pedido.codPedido) {
            resposta.textContent = pedido.message
            document.getElementById('botaoConfirmarPedido').disabled = false
            return
        }

        localStorage.removeItem('autoshopping_carrinho')
        document.getElementById('conteudoCheckout').hidden = true
        document.getElementById('pedidoConcluido').hidden = false
        document.getElementById('numeroPedido').textContent = `Pedido #${pedido.codPedido} • Total ${Number(pedido.valorTotal).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`
        document.getElementById('contadorCarrinho').textContent = '0'
    })
    .catch(function() {
        resposta.textContent = 'Erro ao confirmar o pedido!'
        document.getElementById('botaoConfirmarPedido').disabled = false
    })
})

mostrarTipoEntrega()
