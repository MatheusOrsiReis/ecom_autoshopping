const API_URL = 'http://localhost:3000'

let categoriaSelecionada = ''
let resposta = document.getElementById('mensagemLista')
let listar = document.getElementById('listaProdutos')
let contador = document.getElementById('contadorResultados')

let carrinho = JSON.parse(localStorage.getItem('autoshopping_carrinho') || '[]')
let usuario = JSON.parse(localStorage.getItem('autoshopping_usuario') || 'null')

document.getElementById('contadorCarrinho').textContent = carrinho.length

if (usuario) {
    document.getElementById('linkPedidos').hidden = false
    document.getElementById('linkConta').textContent = 'Minha conta'
    document.getElementById('linkConta').href = 'perfil.html'

    if (usuario.tipo === 'ADMIN') {
        document.getElementById('linkAdmin').hidden = false
    }
}

if (window.location.search.includes('busca=')) {
    document.getElementById('campoBusca').value = decodeURIComponent(window.location.search.split('busca=')[1].split('&')[0])
}

if (window.location.search.includes('categoriaId=')) {
    categoriaSelecionada = window.location.search.split('categoriaId=')[1].split('&')[0]
}

function criarCard(produto) {
    let categoria = produto.categoriaProduto ? produto.categoriaProduto.nome : ''
    let titulo = `${produto.marca || ''} ${produto.modelo || ''}`.trim() || produto.nome
    let imagem = '<div class="imagem-placeholder">Imagem não disponível</div>'

    if (produto.imagem) {
        imagem = `<img src="${produto.imagem}" alt="${titulo}" loading="lazy">`
    }

    return `
        <article class="card-veiculo">
            <div class="card-imagem">${imagem}</div>
            <div class="card-conteudo">
                <span class="card-categoria">${categoria}</span>
                <h3>${titulo}</h3>
                <p class="card-nome">${produto.nome || ''}</p>
                <div class="card-caracteristicas">
                    <span>${produto.ano || ''}</span>
                    <span>${produto.quilometragem || 0} km</span>
                </div>
                <div class="card-rodape">
                    <strong class="card-preco">${Number(produto.preco).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong>
                    <a class="botao botao-secundario botao-menor" href="consultarProduto.html?id=${produto.codProduto}">Ver detalhes</a>
                </div>
            </div>
        </article>
    `
}

function carregarProdutos() {
    let busca = document.getElementById('campoBusca').value
    let endereco = `${API_URL}/produtos?ativo=true`

    if (busca) {
        endereco += `&busca=${encodeURIComponent(busca)}`
    }

    if (categoriaSelecionada) {
        endereco += `&categoriaId=${categoriaSelecionada}`
    }

    resposta.hidden = false
    resposta.textContent = 'Carregando veículos...'
    listar.innerHTML = ''

    fetch(endereco)
    .then(function(res) {
        return res.json()
    })
    .then(function(produtos) {
        let quantidade = 0

        produtos.forEach(function(produto) {
            if (produto.estoqueProduto && produto.estoqueProduto.quantidade > 0) {
                listar.innerHTML += criarCard(produto)
                quantidade++
            }
        })

        contador.textContent = `${quantidade} veículo(s) encontrado(s)`

        if (quantidade === 0) {
            resposta.textContent = 'Nenhum veículo encontrado.'
        } else {
            resposta.hidden = true
        }
    })
    .catch(function() {
        resposta.textContent = 'Não foi possível carregar os veículos. Verifique se o backend está ligado.'
    })
}

function selecionarCategoria(idCategoria, botao) {
    categoriaSelecionada = idCategoria
    let botoes = document.getElementById('filtroCategorias').getElementsByTagName('button')

    for (let i = 0; i < botoes.length; i++) {
        botoes[i].classList.remove('ativo')
    }

    botao.classList.add('ativo')
    carregarProdutos()
}

fetch(`${API_URL}/categorias`)
.then(function(res) {
    return res.json()
})
.then(function(categorias) {
    let botoes = `<button class="filtro-categoria ${categoriaSelecionada ? '' : 'ativo'}" type="button" onclick="selecionarCategoria('', this)">Todos</button>`

    categorias.forEach(function(categoria) {
        let ativo = String(categoria.codCategoria) === categoriaSelecionada ? 'ativo' : ''
        botoes += `<button class="filtro-categoria ${ativo}" type="button" onclick="selecionarCategoria('${categoria.codCategoria}', this)">${categoria.nome}</button>`
    })

    document.getElementById('filtroCategorias').innerHTML = botoes
})

document.getElementById('formBusca').addEventListener('submit', function(e) {
    e.preventDefault()
    carregarProdutos()
})

carregarProdutos()
