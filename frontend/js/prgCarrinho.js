const API_URL = 'http://localhost:3000'
let produtosCarrinho = []

function lerCarrinho() {
    try {
        const carrinho = JSON.parse(localStorage.getItem('autoshopping_carrinho')) || []
        return carrinho.map(Number).filter(function (id, indice, lista) {
            return Number.isInteger(id) && id > 0 && lista.indexOf(id) === indice
        })
    } catch (erro) {
        return []
    }
}

function salvarCarrinho(carrinho) {
    localStorage.setItem('autoshopping_carrinho', JSON.stringify(carrinho))
    document.getElementById('contadorCarrinho').textContent = carrinho.length
}

function formatarPreco(valor) {
    return Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function criarImagemCarrinho(produto) {
    const area = document.createElement('div')
    area.className = 'carrinho-imagem'

    if (produto.imagem) {
        const imagem = document.createElement('img')
        imagem.src = produto.imagem
        imagem.alt = produto.nome
        imagem.addEventListener('error', function () {
            area.innerHTML = '<span>A</span>'
        })
        area.appendChild(imagem)
    } else {
        area.innerHTML = '<span>A</span>'
    }

    return area
}

function removerProduto(idProduto) {
    const carrinho = lerCarrinho().filter(function (id) {
        return id !== idProduto
    })
    salvarCarrinho(carrinho)
    carregarCarrinho()
}

function criarItemCarrinho(produto) {
    const item = document.createElement('article')
    item.className = 'item-carrinho'
    item.appendChild(criarImagemCarrinho(produto))

    const dados = document.createElement('div')
    dados.className = 'item-carrinho-dados'
    const categoria = produto.categoriaProduto ? produto.categoriaProduto.nome : ''
    dados.innerHTML = '<small></small><h2></h2><p></p>'
    dados.getElementsByTagName('small')[0].textContent = categoria
    dados.getElementsByTagName('h2')[0].textContent = [produto.marca, produto.modelo].filter(Boolean).join(' ') || produto.nome
    dados.getElementsByTagName('p')[0].textContent = [produto.ano, produto.cambio, produto.combustivel].filter(Boolean).join(' • ')

    const acoes = document.createElement('div')
    acoes.className = 'item-carrinho-acoes'
    const preco = document.createElement('strong')
    preco.textContent = formatarPreco(produto.preco)
    const remover = document.createElement('button')
    remover.type = 'button'
    remover.className = 'botao-texto perigo'
    remover.textContent = 'Remover'
    remover.addEventListener('click', function () {
        removerProduto(produto.codProduto)
    })
    acoes.appendChild(preco)
    acoes.appendChild(remover)

    item.appendChild(dados)
    item.appendChild(acoes)
    return item
}

function renderizarCarrinho() {
    const lista = document.getElementById('itensCarrinho')
    const mensagem = document.getElementById('mensagemCarrinho')
    const botaoCheckout = document.getElementById('botaoCheckout')
    const botaoLimpar = document.getElementById('botaoLimparCarrinho')
    const total = produtosCarrinho.reduce(function (soma, produto) {
        return soma + Number(produto.preco)
    }, 0)

    lista.innerHTML = ''
    document.getElementById('quantidadeResumo').textContent = produtosCarrinho.length
    document.getElementById('totalCarrinho').textContent = formatarPreco(total)

    if (produtosCarrinho.length === 0) {
        mensagem.hidden = false
        mensagem.className = 'mensagem mensagem-vazia'
        mensagem.innerHTML = 'Seu carrinho está vazio.<br><a class="link-destaque" href="listarProduto.html">Ver veículos disponíveis</a>'
        botaoCheckout.classList.add('desabilitado')
        botaoLimpar.hidden = true
        return
    }

    mensagem.hidden = true
    botaoLimpar.hidden = false
    botaoCheckout.classList.remove('desabilitado')
    botaoCheckout.href = localStorage.getItem('autoshopping_token')
        ? 'checkout.html'
        : 'login.html?redirect=checkout.html'

    produtosCarrinho.forEach(function (produto) {
        lista.appendChild(criarItemCarrinho(produto))
    })
}

function carregarCarrinho() {
    const ids = lerCarrinho()
    salvarCarrinho(ids)

    if (ids.length === 0) {
        produtosCarrinho = []
        renderizarCarrinho()
        return
    }

    document.getElementById('mensagemCarrinho').hidden = false
    Promise.all(ids.map(function (id) {
        return fetch(API_URL + '/produto/' + id).then(function (resposta) {
            if (!resposta.ok) return null
            return resposta.json()
        })
    }))
    .then(function (produtos) {
        produtosCarrinho = produtos.filter(function (produto) {
            return produto && produto.ativo && produto.estoqueProduto && Number(produto.estoqueProduto.quantidade) > 0
        })
        salvarCarrinho(produtosCarrinho.map(function (produto) { return produto.codProduto }))
        renderizarCarrinho()
    })
    .catch(function () {
        const mensagem = document.getElementById('mensagemCarrinho')
        mensagem.className = 'mensagem mensagem-erro'
        mensagem.textContent = 'Não foi possível atualizar o carrinho. Verifique se o backend está ligado.'
    })
}

function atualizarNavegacao() {
    const usuarioSalvo = localStorage.getItem('autoshopping_usuario')
    if (!usuarioSalvo) return
    let usuario = null
    try { usuario = JSON.parse(usuarioSalvo) } catch (erro) { usuario = null }
    document.getElementById('linkPedidos').hidden = false
    document.getElementById('linkConta').textContent = 'Minha conta'
    document.getElementById('linkConta').href = 'perfil.html'
    if (usuario && usuario.tipo === 'ADMIN') document.getElementById('linkAdmin').hidden = false
}

document.getElementById('botaoLimparCarrinho').addEventListener('click', function () {
    salvarCarrinho([])
    produtosCarrinho = []
    renderizarCarrinho()
})

atualizarNavegacao()
carregarCarrinho()
