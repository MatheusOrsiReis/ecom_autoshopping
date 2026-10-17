const API_URL = 'http://localhost:3000'

let produtosCarrinho = []
let resposta = document.getElementById('mensagemCarrinho')
let listar = document.getElementById('itensCarrinho')

let usuario = JSON.parse(localStorage.getItem('autoshopping_usuario') || 'null')

if (usuario) {
    document.getElementById('linkPedidos').hidden = false
    document.getElementById('linkConta').textContent = 'Minha conta'
    document.getElementById('linkConta').href = 'perfil.html'

    if (usuario.tipo === 'ADMIN') {
        document.getElementById('linkAdmin').hidden = false
    }
}

function lerCarrinho() {
    return JSON.parse(localStorage.getItem('autoshopping_carrinho') || '[]')
}

function salvarCarrinho(carrinho) {
    localStorage.setItem('autoshopping_carrinho', JSON.stringify(carrinho))
    document.getElementById('contadorCarrinho').textContent = carrinho.length
}

function removerProduto(idProduto) {
    let carrinho = lerCarrinho().filter(function(id) {
        return id !== idProduto
    })

    salvarCarrinho(carrinho)
    carregarCarrinho()
}

function mostrarCarrinho() {
    let subtotal = 0
    listar.innerHTML = ''

    produtosCarrinho.forEach(function(produto) {
        subtotal += Number(produto.preco)

        let categoria = produto.categoriaProduto ? produto.categoriaProduto.nome : ''
        let titulo = `${produto.marca || ''} ${produto.modelo || ''}`.trim() || produto.nome
        let imagem = produto.imagem ? `<img src="${produto.imagem}" alt="${titulo}">` : '<span>A</span>'

        listar.innerHTML += `
            <article class="item-carrinho">
                <div class="carrinho-imagem">${imagem}</div>
                <div class="item-carrinho-dados">
                    <small>${categoria}</small>
                    <h2>${titulo}</h2>
                    <p>${produto.ano || ''} • ${produto.cambio || ''} • ${produto.combustivel || ''}</p>
                </div>
                <div class="item-carrinho-acoes">
                    <strong>${Number(produto.preco).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong>
                    <button type="button" class="botao-texto perigo" onclick="removerProduto(${produto.codProduto})">Remover</button>
                </div>
            </article>
        `
    })

    let desconto = 0

    if (subtotal >= 200000) {
        desconto = subtotal * 0.05
    }

    document.getElementById('quantidadeResumo').textContent = produtosCarrinho.length
    document.getElementById('subtotalCarrinho').textContent = subtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    document.getElementById('descontoCarrinho').textContent = '- ' + desconto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    document.getElementById('linhaDescontoCarrinho').hidden = desconto === 0
    document.getElementById('totalCarrinho').textContent = (subtotal - desconto).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

    if (produtosCarrinho.length === 0) {
        resposta.hidden = false
        resposta.innerHTML = 'Seu carrinho está vazio.<br><a class="link-destaque" href="listarProduto.html">Ver veículos disponíveis</a>'
        document.getElementById('botaoCheckout').classList.add('desabilitado')
        document.getElementById('botaoLimparCarrinho').hidden = true
    } else {
        resposta.hidden = true
        document.getElementById('botaoLimparCarrinho').hidden = false
        document.getElementById('botaoCheckout').classList.remove('desabilitado')
        document.getElementById('botaoCheckout').href = localStorage.getItem('autoshopping_token') ? 'checkout.html' : 'login.html?redirect=checkout.html'
    }
}

function carregarCarrinho() {
    let ids = lerCarrinho()
    salvarCarrinho(ids)

    if (ids.length === 0) {
        produtosCarrinho = []
        mostrarCarrinho()
        return
    }

    fetch(`${API_URL}/produtos?ativo=true`)
    .then(function(res) {
        return res.json()
    })
    .then(function(produtos) {
        produtosCarrinho = produtos.filter(function(produto) {
            return ids.includes(produto.codProduto) && produto.estoqueProduto && produto.estoqueProduto.quantidade > 0
        })

        salvarCarrinho(produtosCarrinho.map(function(produto) {
            return produto.codProduto
        }))

        mostrarCarrinho()
    })
    .catch(function() {
        resposta.textContent = 'Não foi possível atualizar o carrinho. Verifique se o backend está ligado.'
    })
}

document.getElementById('botaoLimparCarrinho').addEventListener('click', function(e) {
    e.preventDefault()
    salvarCarrinho([])
    produtosCarrinho = []
    mostrarCarrinho()
})

carregarCarrinho()
