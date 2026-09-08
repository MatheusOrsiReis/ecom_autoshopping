const API_URL = 'http://localhost:3000'

function atualizarNavegacao() {
    let carrinho = []
    try {
        carrinho = JSON.parse(localStorage.getItem('autoshopping_carrinho')) || []
    } catch (erro) {
        carrinho = []
    }
    document.getElementById('contadorCarrinho').textContent = carrinho.length

    if (localStorage.getItem('autoshopping_usuario')) {
        let usuario = null
        try { usuario = JSON.parse(localStorage.getItem('autoshopping_usuario')) } catch (erro) { usuario = null }
        document.getElementById('linkPedidos').hidden = false
        document.getElementById('linkConta').textContent = 'Minha conta'
        document.getElementById('linkConta').href = 'html/perfil.html'
        if (usuario && usuario.tipo === 'ADMIN') document.getElementById('linkAdmin').hidden = false
    }
}

function possuiValor(valor) {
    return valor !== undefined && valor !== null && valor !== ''
}

function formatarPreco(valor) {
    return Number(valor).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    })
}

function formatarQuilometragem(valor) {
    return Number(valor).toLocaleString('pt-BR') + ' km'
}

function criarPlaceholderImagem() {
    const placeholder = document.createElement('div')
    placeholder.className = 'imagem-placeholder'
    placeholder.innerHTML = '<span class="placeholder-marca">A</span><small>Imagem não disponível</small>'
    return placeholder
}

function criarCardProduto(produto) {
    const card = document.createElement('article')
    card.className = 'card-veiculo'

    const areaImagem = document.createElement('div')
    areaImagem.className = 'card-imagem'

    if (possuiValor(produto.imagem)) {
        const imagem = document.createElement('img')
        imagem.src = produto.imagem
        imagem.alt = produto.nome || 'Veículo AutoShopping'
        imagem.loading = 'lazy'
        imagem.addEventListener('error', function () {
            areaImagem.innerHTML = ''
            areaImagem.appendChild(criarPlaceholderImagem())
        })
        areaImagem.appendChild(imagem)
    } else {
        areaImagem.appendChild(criarPlaceholderImagem())
    }

    const conteudo = document.createElement('div')
    conteudo.className = 'card-conteudo'

    if (produto.categoriaProduto && possuiValor(produto.categoriaProduto.nome)) {
        const categoria = document.createElement('span')
        categoria.className = 'card-categoria'
        categoria.textContent = produto.categoriaProduto.nome
        conteudo.appendChild(categoria)
    }

    const titulo = document.createElement('h3')
    titulo.textContent = [produto.marca, produto.modelo].filter(possuiValor).join(' ') || produto.nome
    conteudo.appendChild(titulo)

    if (possuiValor(produto.nome) && titulo.textContent !== produto.nome) {
        const nome = document.createElement('p')
        nome.className = 'card-nome'
        nome.textContent = produto.nome
        conteudo.appendChild(nome)
    }

    const caracteristicas = document.createElement('div')
    caracteristicas.className = 'card-caracteristicas'

    if (possuiValor(produto.ano)) {
        const ano = document.createElement('span')
        ano.textContent = produto.ano
        caracteristicas.appendChild(ano)
    }

    if (possuiValor(produto.quilometragem)) {
        const quilometragem = document.createElement('span')
        quilometragem.textContent = formatarQuilometragem(produto.quilometragem)
        caracteristicas.appendChild(quilometragem)
    }

    conteudo.appendChild(caracteristicas)

    const rodape = document.createElement('div')
    rodape.className = 'card-rodape'

    const preco = document.createElement('strong')
    preco.className = 'card-preco'
    preco.textContent = formatarPreco(produto.preco)

    const link = document.createElement('a')
    link.className = 'botao botao-secundario botao-menor'
    link.href = 'html/consultarProduto.html?id=' + produto.codProduto
    link.textContent = 'Ver detalhes'

    rodape.appendChild(preco)
    rodape.appendChild(link)
    conteudo.appendChild(rodape)
    card.appendChild(areaImagem)
    card.appendChild(conteudo)

    return card
}

function carregarDestaques() {
    const lista = document.getElementById('listaDestaques')
    const mensagem = document.getElementById('mensagemHome')

    fetch(API_URL + '/produtos?ativo=true')
    .then(function (resposta) {
        if (!resposta.ok) {
            throw new Error('Erro HTTP ' + resposta.status)
        }
        return resposta.json()
    })
    .then(function (produtos) {
        const disponiveis = produtos.filter(function (produto) {
            return produto.estoqueProduto && Number(produto.estoqueProduto.quantidade) > 0
        }).slice(0, 4)

        lista.innerHTML = ''

        if (disponiveis.length === 0) {
            mensagem.className = 'mensagem mensagem-vazia'
            mensagem.textContent = 'Nenhum veículo disponível no momento.'
            return
        }

        mensagem.hidden = true
        disponiveis.forEach(function (produto) {
            lista.appendChild(criarCardProduto(produto))
        })
    })
    .catch(function () {
        mensagem.hidden = false
        mensagem.className = 'mensagem mensagem-erro'
        mensagem.textContent = 'Não foi possível carregar os veículos. Verifique se o backend está ligado.'
    })
}

function configurarBuscaHome() {
    const formulario = document.getElementById('formBuscaHome')
    const campo = document.getElementById('buscaHome')

    formulario.addEventListener('submit', function (evento) {
        evento.preventDefault()
        const busca = campo.value.trim()
        let destino = 'html/listarProduto.html'

        if (busca) {
            destino += '?busca=' + encodeURIComponent(busca)
        }

        window.location.href = destino
    })
}

carregarDestaques()
configurarBuscaHome()
atualizarNavegacao()
