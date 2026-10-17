const API_URL = 'http://localhost:3000'

let produtoAtual = null
let resposta = document.getElementById('mensagemDetalhe')
let detalheProduto = document.getElementById('detalheProduto')
let botaoAdicionar = document.getElementById('botaoAdicionarCarrinho')

let carrinho = JSON.parse(localStorage.getItem('autoshopping_carrinho') || '[]')
document.getElementById('contadorCarrinho').textContent = carrinho.length

let usuario = JSON.parse(localStorage.getItem('autoshopping_usuario') || 'null')

if (usuario) {
    document.getElementById('linkConta').textContent = 'Minha conta'
    document.getElementById('linkConta').href = 'perfil.html'
    document.getElementById('linkPedidos').hidden = false

    if (usuario.tipo === 'ADMIN') {
        document.getElementById('linkAdmin').hidden = false
    }
}

let idProduto = window.location.search.replace('?id=', '')

fetch(`${API_URL}/produto/${idProduto}`)
.then(function(res) {
    return res.json()
})
.then(function(produto) {
    if (produto.message) {
        detalheProduto.hidden = true
        resposta.textContent = produto.message
        return
    }

    produtoAtual = produto

    let categoria = produto.categoriaProduto ? produto.categoriaProduto.nome : 'Sem categoria'
    let quantidade = produto.estoqueProduto ? Number(produto.estoqueProduto.quantidade) : 0
    let nomeVeiculo = `${produto.marca || ''} ${produto.modelo || ''}`.trim()

    resposta.textContent = ''
    detalheProduto.hidden = false

    if (produto.imagem) {
        document.getElementById('imagemDetalhe').innerHTML = `<img id="fotoProduto" src="${produto.imagem}" alt="${nomeVeiculo}">`

        document.getElementById('fotoProduto').addEventListener('error', function() {
            document.getElementById('imagemDetalhe').innerHTML = '<div class="imagem-placeholder">Sem imagem</div>'
        })
    } else {
        document.getElementById('imagemDetalhe').innerHTML = '<div class="imagem-placeholder">Sem imagem</div>'
    }

    document.getElementById('categoriaDetalhe').textContent = categoria
    document.getElementById('marcaModeloDetalhe').textContent = nomeVeiculo || produto.nome
    document.getElementById('nomeDetalhe').textContent = produto.nome
    document.getElementById('precoDetalhe').textContent = Number(produto.preco).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    })

    document.getElementById('listaInformacoes').innerHTML = `
        <div class="item-informacao"><dt>Marca</dt><dd>${produto.marca || '-'}</dd></div>
        <div class="item-informacao"><dt>Modelo</dt><dd>${produto.modelo || '-'}</dd></div>
        <div class="item-informacao"><dt>Ano</dt><dd>${produto.ano || '-'}</dd></div>
        <div class="item-informacao"><dt>Cor</dt><dd>${produto.cor || '-'}</dd></div>
        <div class="item-informacao"><dt>Quilometragem</dt><dd>${produto.quilometragem || 0} km</dd></div>
        <div class="item-informacao"><dt>Categoria</dt><dd>${categoria}</dd></div>
    `

    if (produto.descricao) {
        document.getElementById('blocoDescricao').hidden = false
        document.getElementById('descricaoDetalhe').textContent = produto.descricao
    }

    if (produto.ativo && quantidade > 0) {
        document.getElementById('statusEstoque').textContent = `${quantidade} unidade(s) disponível(is)`
        botaoAdicionar.disabled = false
    } else {
        document.getElementById('statusEstoque').textContent = 'Veículo indisponível'
        botaoAdicionar.disabled = true
    }
})
.catch(function() {
    detalheProduto.hidden = true
    resposta.textContent = 'Erro ao consultar o veículo!'
})

botaoAdicionar.addEventListener('click', function() {
    let carrinho = JSON.parse(localStorage.getItem('autoshopping_carrinho') || '[]')

    if (carrinho.includes(produtoAtual.codProduto)) {
        document.getElementById('mensagemCarrinhoDetalhe').textContent = 'Esse veículo já está no carrinho!'
        return
    }

    carrinho.push(produtoAtual.codProduto)
    localStorage.setItem('autoshopping_carrinho', JSON.stringify(carrinho))
    document.getElementById('contadorCarrinho').textContent = carrinho.length
    document.getElementById('mensagemCarrinhoDetalhe').textContent = 'Veículo adicionado ao carrinho!'
})
