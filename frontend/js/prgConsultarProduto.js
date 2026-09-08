const API_URL = 'http://localhost:3000'
let produtoAtual = null

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

function adicionarAoCarrinho() {
    if (!produtoAtual) return

    let carrinho = []
    try {
        carrinho = JSON.parse(localStorage.getItem('autoshopping_carrinho')) || []
    } catch (erro) {
        carrinho = []
    }

    const idProduto = Number(produtoAtual.codProduto)
    const mensagem = document.getElementById('mensagemCarrinhoDetalhe')

    if (carrinho.map(Number).includes(idProduto)) {
        mensagem.className = 'mensagem-inline aviso'
        mensagem.textContent = 'Este veículo já está no carrinho.'
        return
    }

    carrinho.push(idProduto)
    localStorage.setItem('autoshopping_carrinho', JSON.stringify(carrinho))
    document.getElementById('contadorCarrinho').textContent = carrinho.length
    mensagem.className = 'mensagem-inline sucesso'
    mensagem.innerHTML = 'Veículo adicionado. <a href="carrinho.html">Ver carrinho</a>'
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
    placeholder.className = 'imagem-placeholder imagem-placeholder-grande'
    placeholder.innerHTML = '<span class="placeholder-marca">A</span><small>Imagem não disponível</small>'
    return placeholder
}

function adicionarInformacao(titulo, valor) {
    if (!possuiValor(valor)) {
        return
    }

    const lista = document.getElementById('listaInformacoes')
    const grupo = document.createElement('div')
    grupo.className = 'item-informacao'

    const termo = document.createElement('dt')
    termo.textContent = titulo

    const descricao = document.createElement('dd')
    descricao.textContent = valor

    grupo.appendChild(termo)
    grupo.appendChild(descricao)
    lista.appendChild(grupo)
}

function renderizarImagem(produto) {
    const areaImagem = document.getElementById('imagemDetalhe')
    areaImagem.innerHTML = ''

    if (!possuiValor(produto.imagem)) {
        areaImagem.appendChild(criarPlaceholderImagem())
        return
    }

    const imagem = document.createElement('img')
    imagem.src = produto.imagem
    imagem.alt = produto.nome || 'Veículo AutoShopping'
    imagem.addEventListener('error', function () {
        areaImagem.innerHTML = ''
        areaImagem.appendChild(criarPlaceholderImagem())
    })
    areaImagem.appendChild(imagem)
}

function renderizarProduto(produto) {
    produtoAtual = produto
    const detalhe = document.getElementById('detalheProduto')
    const mensagem = document.getElementById('mensagemDetalhe')
    const categoria = document.getElementById('categoriaDetalhe')
    const marcaModelo = [produto.marca, produto.modelo].filter(possuiValor).join(' ')

    renderizarImagem(produto)

    if (produto.categoriaProduto && possuiValor(produto.categoriaProduto.nome)) {
        categoria.textContent = produto.categoriaProduto.nome
    } else {
        categoria.hidden = true
    }

    document.getElementById('marcaModeloDetalhe').textContent = marcaModelo
    document.getElementById('marcaModeloDetalhe').hidden = !marcaModelo
    document.getElementById('nomeDetalhe').textContent = produto.nome || marcaModelo || 'Veículo'

    const preco = document.getElementById('precoDetalhe')
    if (possuiValor(produto.preco)) {
        preco.textContent = formatarPreco(produto.preco)
    } else {
        preco.hidden = true
    }

    const status = document.getElementById('statusEstoque')
    const disponivel = produto.estoqueProduto && Number(produto.estoqueProduto.quantidade) > 0
    status.className = disponivel ? 'status-estoque disponivel' : 'status-estoque indisponivel'
    status.textContent = disponivel ? 'Veículo disponível' : 'Veículo indisponível'
    document.getElementById('botaoAdicionarCarrinho').disabled = !disponivel
    document.getElementById('botaoAdicionarCarrinho').textContent = disponivel
        ? 'Adicionar ao carrinho'
        : 'Veículo indisponível'

    adicionarInformacao('Marca', produto.marca)
    adicionarInformacao('Modelo', produto.modelo)
    adicionarInformacao('Versão', produto.versao)
    adicionarInformacao('Ano', produto.ano)
    adicionarInformacao('Quilometragem', possuiValor(produto.quilometragem) ? formatarQuilometragem(produto.quilometragem) : null)
    adicionarInformacao('Combustível', produto.combustivel)
    adicionarInformacao('Câmbio', produto.cambio)
    adicionarInformacao('Cor', produto.cor)
    adicionarInformacao('Categoria', produto.categoriaProduto ? produto.categoriaProduto.nome : null)

    if (possuiValor(produto.descricao)) {
        document.getElementById('descricaoDetalhe').textContent = produto.descricao
        document.getElementById('blocoDescricao').hidden = false
    }

    document.title = (produto.nome || marcaModelo || 'Veículo') + ' | AutoShopping'
    mensagem.hidden = true
    detalhe.hidden = false
}

function mostrarErro(mensagemTexto) {
    const mensagem = document.getElementById('mensagemDetalhe')
    mensagem.hidden = false
    mensagem.className = 'mensagem mensagem-erro'
    mensagem.textContent = mensagemTexto
}

function consultarProduto() {
    const parametros = new URLSearchParams(window.location.search)
    const idProduto = parametros.get('id')

    if (!idProduto || !/^\d+$/.test(idProduto)) {
        mostrarErro('Produto inválido. Volte para a listagem e selecione um veículo.')
        return
    }

    fetch(API_URL + '/produto/' + encodeURIComponent(idProduto))
    .then(function (resposta) {
        if (resposta.status === 404) {
            throw new Error('PRODUTO_NAO_ENCONTRADO')
        }
        if (!resposta.ok) {
            throw new Error('ERRO_HTTP')
        }
        return resposta.json()
    })
    .then(function (produto) {
        renderizarProduto(produto)
    })
    .catch(function (erro) {
        if (erro.message === 'PRODUTO_NAO_ENCONTRADO') {
            mostrarErro('Veículo não encontrado.')
        } else {
            mostrarErro('Não foi possível carregar o veículo. Verifique se o backend está ligado.')
        }
    })
}

consultarProduto()
atualizarNavegacao()
document.getElementById('botaoAdicionarCarrinho').addEventListener('click', adicionarAoCarrinho)
