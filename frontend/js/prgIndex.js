const API_URL = 'http://localhost:3000'

let resposta = document.getElementById('mensagemHome')
let listar = document.getElementById('listaDestaques')
let formularioBusca = document.getElementById('formBuscaHome')

let carrinho = JSON.parse(localStorage.getItem('autoshopping_carrinho') || '[]')
let usuario = JSON.parse(localStorage.getItem('autoshopping_usuario') || 'null')

document.getElementById('contadorCarrinho').textContent = carrinho.length

if (usuario) {
    document.getElementById('linkPedidos').hidden = false
    document.getElementById('linkConta').textContent = 'Minha conta'
    document.getElementById('linkConta').href = 'html/perfil.html'

    if (usuario.tipo === 'ADMIN') {
        document.getElementById('linkAdmin').hidden = false
    }
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
                    <a class="botao botao-secundario botao-menor" href="html/consultarProduto.html?id=${produto.codProduto}">Ver detalhes</a>
                </div>
            </div>
        </article>
    `
}

fetch(`${API_URL}/produtos?ativo=true`)
.then(function(res) {
    return res.json()
})
.then(function(produtos) {
    listar.innerHTML = ''
    let quantidade = 0

    produtos.forEach(function(produto) {
        if (produto.estoqueProduto && produto.estoqueProduto.quantidade > 0 && quantidade < 4) {
            listar.innerHTML += criarCard(produto)
            quantidade++
        }
    })

    if (quantidade === 0) {
        resposta.textContent = 'Nenhum veículo disponível no momento.'
    } else {
        resposta.hidden = true
    }
})
.catch(function() {
    resposta.textContent = 'Não foi possível carregar os veículos. Verifique se o backend está ligado.'
})

formularioBusca.addEventListener('submit', function(e) {
    e.preventDefault()
    let busca = document.getElementById('buscaHome').value
    window.location.href = `html/listarProduto.html?busca=${encodeURIComponent(busca)}`
})
