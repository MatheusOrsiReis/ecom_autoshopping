const API_URL = 'http://localhost:3000'
const token = localStorage.getItem('autoshopping_token')
let usuario = null
let produtosCheckout = []
let ultimoCepConsultado = ''

function lerUsuario() {
    try {
        return JSON.parse(localStorage.getItem('autoshopping_usuario'))
    } catch (erro) {
        return null
    }
}

function lerCarrinho() {
    try {
        return (JSON.parse(localStorage.getItem('autoshopping_carrinho')) || []).map(Number)
    } catch (erro) {
        return []
    }
}

function formatarPreco(valor) {
    return Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function encerrarSessao() {
    localStorage.removeItem('autoshopping_token')
    localStorage.removeItem('autoshopping_usuario')
    window.location.href = 'login.html?redirect=checkout.html'
}

function mostrarMensagem(texto, tipo) {
    const mensagem = document.getElementById('mensagemCheckout')
    mensagem.className = 'mensagem-formulario campo-largo ' + tipo
    mensagem.textContent = texto
}

function somenteNumeros(valor) {
    return valor.replace(/\D/g, '')
}

function formatarCep(valor) {
    return somenteNumeros(valor).slice(0, 8).replace(/^(\d{5})(\d)/, '$1-$2')
}

function mostrarEstadoCep(texto, tipo) {
    const input = document.getElementById('cep')
    const mensagem = document.getElementById('mensagemCepCheckout')
    mensagem.className = 'mensagem-campo ' + (tipo || '')
    mensagem.textContent = texto || ''
    input.classList.toggle('invalido', tipo === 'erro')
}

function limparEnderecoConsultado() {
    ;['logradouro', 'bairro', 'cidade', 'uf'].forEach(function (id) {
        document.getElementById(id).value = ''
    })
}

async function consultarCep() {
    const input = document.getElementById('cep')
    const cep = somenteNumeros(input.value)
    input.value = formatarCep(input.value)

    if (cep.length !== 8) {
        ultimoCepConsultado = ''
        mostrarEstadoCep(cep ? 'O CEP deve possuir 8 dígitos.' : '', cep ? 'erro' : '')
        input.setCustomValidity(cep ? 'Informe um CEP válido.' : '')
        return false
    }

    if (cep === ultimoCepConsultado) return !input.classList.contains('invalido')
    ultimoCepConsultado = cep
    mostrarEstadoCep('Consultando CEP...', 'carregando')

    try {
        const resposta = await fetch('https://viacep.com.br/ws/' + cep + '/json/')
        if (!resposta.ok) throw new Error('CONSULTA_INDISPONIVEL')
        const endereco = await resposta.json()
        if (endereco.erro) {
            ultimoCepConsultado = ''
            limparEnderecoConsultado()
            mostrarEstadoCep('CEP não encontrado.', 'erro')
            input.setCustomValidity('CEP não encontrado.')
            return false
        }

        if (somenteNumeros(input.value) !== cep) return false
        input.value = endereco.cep || formatarCep(cep)
        document.getElementById('logradouro').value = endereco.logradouro || ''
        document.getElementById('bairro').value = endereco.bairro || ''
        document.getElementById('cidade').value = endereco.localidade || ''
        document.getElementById('uf').value = endereco.uf || ''
        if (endereco.complemento) document.getElementById('complemento').value = endereco.complemento
        input.setCustomValidity('')
        mostrarEstadoCep('Endereço preenchido automaticamente.', 'sucesso')
        document.getElementById('numero').focus()
        return true
    } catch (erro) {
        ultimoCepConsultado = ''
        mostrarEstadoCep('Não foi possível consultar o CEP. Preencha o endereço manualmente.', 'erro')
        input.setCustomValidity('')
        return false
    }
}

function configurarTipoEntrega() {
    const tipo = document.getElementById('tipoEntrega').value
    const campos = document.getElementById('camposEndereco')
    const idsObrigatorios = ['cep', 'logradouro', 'numero', 'bairro', 'cidade', 'uf']
    const entrega = tipo === 'ENTREGA'

    campos.hidden = !entrega
    idsObrigatorios.forEach(function (id) {
        document.getElementById(id).required = entrega
    })
}

function preencherEndereco(dados) {
    document.getElementById('cep').value = formatarCep(dados.cep || '')
    document.getElementById('logradouro').value = dados.rua || ''
    document.getElementById('numero').value = dados.numero || ''
    document.getElementById('bairro').value = dados.bairro || ''
    document.getElementById('cidade').value = dados.cidade || ''
    document.getElementById('uf').value = dados.uf || ''
}

function carregarPerfil() {
    return fetch(API_URL + '/usuario/' + usuario.codUsuario, {
        headers: { Authorization: 'Bearer ' + token }
    })
    .then(function (resposta) {
        if (resposta.status === 401) {
            encerrarSessao()
            throw new Error('SESSAO_EXPIRADA')
        }
        if (!resposta.ok) throw new Error('PERFIL_INDISPONIVEL')
        return resposta.json()
    })
    .then(function (perfil) {
        preencherEndereco(perfil)
    })
}

function renderizarResumo() {
    const area = document.getElementById('itensCheckout')
    let total = 0
    area.innerHTML = ''

    produtosCheckout.forEach(function (produto) {
        const item = document.createElement('div')
        item.className = 'item-checkout'
        const nome = document.createElement('span')
        nome.textContent = [produto.marca, produto.modelo].filter(Boolean).join(' ') || produto.nome
        const preco = document.createElement('strong')
        preco.textContent = formatarPreco(produto.preco)
        item.appendChild(nome)
        item.appendChild(preco)
        area.appendChild(item)
        total += Number(produto.preco)
    })

    document.getElementById('totalCheckout').textContent = formatarPreco(total)
    document.getElementById('contadorCarrinho').textContent = produtosCheckout.length
}

function carregarProdutosCheckout() {
    const ids = lerCarrinho()
    if (ids.length === 0) {
        window.location.href = 'carrinho.html'
        return Promise.reject(new Error('CARRINHO_VAZIO'))
    }

    return Promise.all(ids.map(function (id) {
        return fetch(API_URL + '/produto/' + id).then(function (resposta) {
            if (!resposta.ok) return null
            return resposta.json()
        })
    }))
    .then(function (produtos) {
        produtosCheckout = produtos.filter(function (produto) {
            return produto && produto.ativo && produto.estoqueProduto && Number(produto.estoqueProduto.quantidade) > 0
        })

        if (produtosCheckout.length !== ids.length) {
            localStorage.setItem('autoshopping_carrinho', JSON.stringify(
                produtosCheckout.map(function (produto) { return produto.codProduto })
            ))
            throw new Error('Um dos veículos não está mais disponível. Revise seu carrinho.')
        }

        renderizarResumo()
    })
}

function montarEntrega() {
    const tipo = document.getElementById('tipoEntrega').value

    if (tipo === 'RETIRADA') {
        return { tipo: 'RETIRADA', endereco: 'Retirada na loja AutoShopping' }
    }

    const logradouro = document.getElementById('logradouro').value.trim()
    const numero = document.getElementById('numero').value.trim()
    const bairro = document.getElementById('bairro').value.trim()
    const cidade = document.getElementById('cidade').value.trim()
    const uf = document.getElementById('uf').value.trim().toUpperCase()

    return {
        tipo: 'ENTREGA',
        endereco: [logradouro + ', ' + numero, bairro, cidade + ' - ' + uf].join(', '),
        cep: document.getElementById('cep').value.trim(),
        logradouro,
        numero,
        bairro,
        localidade: cidade,
        uf,
        complemento: document.getElementById('complemento').value.trim()
    }
}

function confirmarPedido(evento) {
    evento.preventDefault()

    if (document.getElementById('tipoEntrega').value === 'ENTREGA' && somenteNumeros(document.getElementById('cep').value).length !== 8) {
        mostrarEstadoCep('Informe um CEP válido.', 'erro')
        document.getElementById('cep').focus()
        return
    }

    const botao = document.getElementById('botaoConfirmarPedido')
    const corpo = {
        itens: produtosCheckout.map(function (produto) {
            return { produtoId: produto.codProduto, quantidade: 1 }
        }),
        entrega: montarEntrega()
    }

    botao.disabled = true
    botao.textContent = 'Confirmando pedido...'
    mostrarMensagem('', '')

    fetch(API_URL + '/pedido', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + token
        },
        body: JSON.stringify(corpo)
    })
    .then(function (resposta) {
        return resposta.json().then(function (conteudo) {
            if (resposta.status === 401) {
                encerrarSessao()
                throw new Error('SESSAO_EXPIRADA')
            }
            if (!resposta.ok) throw new Error(conteudo.message || 'Não foi possível criar o pedido.')
            return conteudo
        })
    })
    .then(function (pedido) {
        localStorage.removeItem('autoshopping_carrinho')
        document.getElementById('conteudoCheckout').hidden = true
        document.getElementById('pedidoConcluido').hidden = false
        document.getElementById('numeroPedido').textContent = 'Pedido #' + pedido.codPedido + ' • Total ' + formatarPreco(pedido.valorTotal)
        document.getElementById('contadorCarrinho').textContent = '0'
    })
    .catch(function (erro) {
        if (erro.message !== 'SESSAO_EXPIRADA') {
            mostrarMensagem(erro.message === 'Failed to fetch'
                ? 'Backend indisponível. Verifique se o servidor está ligado.'
                : erro.message, 'erro')
            botao.disabled = false
            botao.textContent = 'Confirmar pedido'
        }
    })
}

if (!token || !lerUsuario()) {
    window.location.href = 'login.html?redirect=checkout.html'
} else {
    usuario = lerUsuario()
    if (usuario.tipo === 'ADMIN') document.getElementById('linkAdmin').hidden = false
    document.getElementById('tipoEntrega').addEventListener('change', configurarTipoEntrega)
    document.getElementById('cep').addEventListener('input', function (evento) {
        evento.target.value = formatarCep(evento.target.value)
        evento.target.setCustomValidity('')
        if (somenteNumeros(evento.target.value).length === 8) consultarCep()
        else mostrarEstadoCep('', '')
    })
    document.getElementById('cep').addEventListener('blur', consultarCep)
    document.getElementById('formCheckout').addEventListener('submit', confirmarPedido)
    configurarTipoEntrega()

    Promise.all([carregarProdutosCheckout(), carregarPerfil()])
    .catch(function (erro) {
        if (!['CARRINHO_VAZIO', 'SESSAO_EXPIRADA'].includes(erro.message)) {
            mostrarMensagem(erro.message === 'Failed to fetch'
                ? 'Backend indisponível. Verifique se o servidor está ligado.'
                : erro.message, 'erro')
            document.getElementById('botaoConfirmarPedido').disabled = true
        }
    })
}
