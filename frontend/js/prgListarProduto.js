const API_URL = 'http://localhost:3000'
let categoriaSelecionada = ''

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
        document.getElementById('linkConta').href = 'perfil.html'
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
    link.href = 'consultarProduto.html?id=' + produto.codProduto
    link.textContent = 'Ver detalhes'

    rodape.appendChild(preco)
    rodape.appendChild(link)
    conteudo.appendChild(rodape)
    card.appendChild(areaImagem)
    card.appendChild(conteudo)

    return card
}

function atualizarEnderecoPagina(busca) {
    const parametros = new URLSearchParams()
    if (busca) parametros.set('busca', busca)
    if (categoriaSelecionada) parametros.set('categoriaId', categoriaSelecionada)

    const consulta = parametros.toString()
    history.replaceState(null, '', consulta ? '?' + consulta : window.location.pathname)
}

function carregarProdutos() {
    const lista = document.getElementById('listaProdutos')
    const mensagem = document.getElementById('mensagemLista')
    const contador = document.getElementById('contadorResultados')
    const busca = document.getElementById('campoBusca').value.trim()
    const parametros = new URLSearchParams()

    parametros.set('ativo', 'true')
    if (busca) parametros.set('busca', busca)
    if (categoriaSelecionada) parametros.set('categoriaId', categoriaSelecionada)

    mensagem.hidden = false
    mensagem.className = 'mensagem carregando'
    mensagem.textContent = 'Carregando veículos...'
    lista.innerHTML = ''
    contador.textContent = 'Carregando...'
    atualizarEnderecoPagina(busca)

    fetch(API_URL + '/produtos?' + parametros.toString())
    .then(function (resposta) {
        if (!resposta.ok) {
            throw new Error('Erro HTTP ' + resposta.status)
        }
        return resposta.json()
    })
    .then(function (produtos) {
        const disponiveis = produtos.filter(function (produto) {
            return produto.estoqueProduto && Number(produto.estoqueProduto.quantidade) > 0
        })

        contador.textContent = disponiveis.length === 1
            ? '1 veículo encontrado'
            : disponiveis.length + ' veículos encontrados'

        if (disponiveis.length === 0) {
            mensagem.className = 'mensagem mensagem-vazia'
            mensagem.textContent = busca || categoriaSelecionada
                ? 'Nenhum veículo encontrado para os filtros selecionados.'
                : 'Nenhum veículo disponível no momento.'
            return
        }

        mensagem.hidden = true
        disponiveis.forEach(function (produto) {
            lista.appendChild(criarCardProduto(produto))
        })
    })
    .catch(function () {
        contador.textContent = 'Não foi possível obter os resultados'
        mensagem.hidden = false
        mensagem.className = 'mensagem mensagem-erro'
        mensagem.textContent = 'Não foi possível carregar os veículos. Verifique se o backend está ligado.'
    })
}

function selecionarCategoria(idCategoria, botaoSelecionado) {
    categoriaSelecionada = idCategoria

    const botoes = document.getElementById('filtroCategorias').getElementsByTagName('button')
    for (let indice = 0; indice < botoes.length; indice++) {
        botoes[indice].classList.remove('ativo')
    }

    botaoSelecionado.classList.add('ativo')
    carregarProdutos()
}

function carregarCategorias() {
    const filtros = document.getElementById('filtroCategorias')
    const botaoTodos = filtros.getElementsByTagName('button')[0]

    botaoTodos.addEventListener('click', function () {
        selecionarCategoria('', botaoTodos)
    })

    fetch(API_URL + '/categorias')
    .then(function (resposta) {
        if (!resposta.ok) {
            throw new Error('Erro HTTP ' + resposta.status)
        }
        return resposta.json()
    })
    .then(function (categorias) {
        categorias.forEach(function (categoria) {
            const botao = document.createElement('button')
            botao.className = 'filtro-categoria'
            botao.type = 'button'
            botao.dataset.categoria = categoria.codCategoria
            botao.textContent = categoria.nome
            botao.addEventListener('click', function () {
                selecionarCategoria(String(categoria.codCategoria), botao)
            })
            filtros.appendChild(botao)

            if (String(categoria.codCategoria) === categoriaSelecionada) {
                botaoTodos.classList.remove('ativo')
                botao.classList.add('ativo')
            }
        })
    })
    .catch(function () {
        const aviso = document.createElement('span')
        aviso.className = 'aviso-categorias'
        aviso.textContent = 'Categorias indisponíveis.'
        filtros.appendChild(aviso)
    })
}

function configurarListagem() {
    const parametros = new URLSearchParams(window.location.search)
    const buscaInicial = parametros.get('busca') || ''
    categoriaSelecionada = parametros.get('categoriaId') || ''
    document.getElementById('campoBusca').value = buscaInicial

    document.getElementById('formBusca').addEventListener('submit', function (evento) {
        evento.preventDefault()
        carregarProdutos()
    })

    carregarCategorias()
    carregarProdutos()
}

configurarListagem()
atualizarNavegacao()
