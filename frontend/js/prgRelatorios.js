const API_URL = 'http://localhost:3000'
const tokenRelatorio = localStorage.getItem('autoshopping_token')

function lerUsuarioRelatorio() {
    try { return JSON.parse(localStorage.getItem('autoshopping_usuario')) } catch (erro) { return null }
}

function escapar(texto) {
    return String(texto == null ? '' : texto).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;')
}

function formatarMoeda(valor) {
    return Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatarData(valor) {
    return valor ? new Date(valor).toLocaleDateString('pt-BR') : '--'
}

function nomeStatus(status) {
    const nomes = { PENDENTE_PAGAMENTO: 'Pendente de pagamento', PAGO: 'Pago', ENVIADO: 'Enviado', ENTREGUE: 'Entregue', CANCELADO: 'Cancelado' }
    return nomes[status] || status
}

function sairRelatorio() {
    localStorage.removeItem('autoshopping_token')
    localStorage.removeItem('autoshopping_usuario')
    window.location.href = 'login.html?redirect=relatorios.html'
}

async function requisicao(caminho) {
    let resposta
    try {
        resposta = await fetch(API_URL + caminho, { headers: { Authorization: 'Bearer ' + tokenRelatorio } })
    } catch (erro) {
        throw new Error('Backend indisponível. Verifique se o servidor está ligado.')
    }
    if (resposta.status === 401) {
        sairRelatorio()
        throw new Error('Sua sessão expirou.')
    }
    const conteudo = await resposta.json().catch(function () { return {} })
    if (!resposta.ok) throw new Error(conteudo.message || 'Não foi possível carregar o relatório.')
    return conteudo
}

function mostrarAviso(texto, tipo) {
    const aviso = document.getElementById('mensagemRelatorio')
    aviso.hidden = !texto
    aviso.className = 'aviso-admin ' + (tipo || '')
    aviso.textContent = texto || ''
}

function renderizarIndicadores(resumo) {
    document.getElementById('relTotalUsuarios').textContent = resumo.totalUsuarios
    document.getElementById('relTotalProdutos').textContent = resumo.totalProdutos
    document.getElementById('relProdutosDisponiveis').textContent = resumo.produtosDisponiveis
    document.getElementById('relTotalPedidos').textContent = resumo.totalPedidos
    document.getElementById('relFaturamento').textContent = formatarMoeda(resumo.faturamento)

    const quantidades = {}
    resumo.pedidosPorStatus.forEach(function (item) { quantidades[item.status] = Number(item.quantidade) })
    const maior = Math.max(1, ...Object.values(quantidades))
    const status = ['PENDENTE_PAGAMENTO', 'PAGO', 'ENVIADO', 'ENTREGUE', 'CANCELADO']
    document.getElementById('totalGraficoPedidos').textContent = resumo.totalPedidos
    document.getElementById('graficoStatusPedidos').innerHTML = status.map(function (item) {
        const quantidade = quantidades[item] || 0
        const largura = quantidade ? Math.max(6, quantidade / maior * 100) : 0
        return '<div class="linha-grafico"><div class="rotulo-grafico"><span>' + nomeStatus(item) + '</span><strong>' + quantidade + '</strong></div><div class="trilho-grafico"><span class="barra-grafico status-grafico-' + item.toLowerCase().replaceAll('_', '-') + '" style="width:' + largura + '%"></span></div></div>'
    }).join('')
}

function renderizarEstoque(produtos) {
    let unidades = 0
    let disponiveis = 0
    let zerados = 0
    let inativos = 0
    produtos.forEach(function (produto) {
        const quantidade = produto.estoqueProduto ? Number(produto.estoqueProduto.quantidade) : 0
        unidades += quantidade
        if (!produto.ativo) inativos++
        else if (quantidade > 0) disponiveis++
        else zerados++
    })
    document.getElementById('resumoEstoqueRelatorio').innerHTML =
        '<div class="numero-estoque"><strong>' + unidades + '</strong><span>unidades no estoque</span></div>' +
        '<dl class="lista-metricas"><div><dt>Veículos disponíveis</dt><dd>' + disponiveis + '</dd></div><div><dt>Sem estoque</dt><dd>' + zerados + '</dd></div><div><dt>Anúncios inativos</dt><dd>' + inativos + '</dd></div></dl>'
}

function renderizarPedidosRecentes(pedidos) {
    const corpo = document.getElementById('corpoPedidosRecentes')
    const recentes = pedidos.slice(0, 8)
    if (!recentes.length) {
        corpo.innerHTML = '<tr><td colspan="5" class="estado-tabela">Nenhum pedido realizado.</td></tr>'
        return
    }
    corpo.innerHTML = recentes.map(function (pedido) {
        const cliente = pedido.usuarioPedido || {}
        return '<tr><td data-label="Pedido"><strong>#' + pedido.codPedido + '</strong></td><td data-label="Cliente">' + escapar(cliente.nome || 'Cliente') + '<small>' + escapar(cliente.email || '') + '</small></td>' +
            '<td data-label="Data">' + formatarData(pedido.dataPedido) + '</td><td data-label="Status"><span class="status-pedido status-' + pedido.status.toLowerCase().replaceAll('_', '-') + '">' + nomeStatus(pedido.status) + '</span></td>' +
            '<td data-label="Total"><strong>' + formatarMoeda(pedido.valorTotal) + '</strong></td></tr>'
    }).join('')
}

async function carregarRelatorios() {
    const botao = document.getElementById('botaoAtualizarRelatorio')
    botao.disabled = true
    botao.textContent = 'Atualizando...'
    mostrarAviso('', '')
    try {
        const dados = await Promise.all([requisicao('/relatorio/resumo'), requisicao('/produtos'), requisicao('/pedidos')])
        renderizarIndicadores(dados[0])
        renderizarEstoque(dados[1])
        renderizarPedidosRecentes(dados[2])
        document.getElementById('dataAtualizacaoRelatorio').textContent = 'Atualizado em ' + new Date().toLocaleString('pt-BR')
    } catch (erro) {
        mostrarAviso(erro.message, 'erro')
    } finally {
        botao.disabled = false
        botao.textContent = 'Atualizar'
    }
}

async function iniciarRelatorios() {
    const usuario = lerUsuarioRelatorio()
    if (!tokenRelatorio || !usuario) {
        window.location.href = 'login.html?redirect=relatorios.html'
        return
    }
    if (usuario.tipo !== 'ADMIN') {
        window.location.href = 'perfil.html'
        return
    }
    document.getElementById('botaoSair').addEventListener('click', sairRelatorio)
    document.getElementById('botaoAtualizarRelatorio').addEventListener('click', carregarRelatorios)
    document.getElementById('botaoImprimirRelatorio').addEventListener('click', function () { window.print() })
    document.getElementById('bloqueioRelatorios').hidden = true
    document.getElementById('conteudoRelatorios').hidden = false
    await carregarRelatorios()
}

iniciarRelatorios()
