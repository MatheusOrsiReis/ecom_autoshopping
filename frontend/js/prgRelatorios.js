const API_URL = 'http://localhost:3000'

let token = localStorage.getItem('autoshopping_token')
let usuario = JSON.parse(localStorage.getItem('autoshopping_usuario') || 'null')
let graficoFaturamento = null
let graficoEstoque = null

if (!token || !usuario) {
    window.location.href = 'login.html?redirect=relatorios.html'
} else if (usuario.tipo !== 'ADMIN') {
    window.location.href = 'perfil.html'
} else {
    document.getElementById('bloqueioRelatorios').hidden = true
    document.getElementById('conteudoRelatorios').hidden = false
}

function sair() {
    localStorage.removeItem('autoshopping_token')
    localStorage.removeItem('autoshopping_usuario')
    window.location.href = 'login.html?redirect=relatorios.html'
}

function carregarRelatorios() {
    let resumo
    let vendas
    let estoque
    let botao = document.getElementById('botaoAtualizarRelatorio')
    let resposta = document.getElementById('mensagemRelatorio')

    botao.disabled = true
    botao.textContent = 'Atualizando...'
    resposta.hidden = true

    fetch(`${API_URL}/relatorios/resumo`, {
        headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(function(res) {
        return res.json()
    })
    .then(function(dados) {
        resumo = dados
        return fetch(`${API_URL}/relatorios/vendas`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
    })
    .then(function(res) {
        return res.json()
    })
    .then(function(dados) {
        vendas = dados
        return fetch(`${API_URL}/relatorios/estoque`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
    })
    .then(function(res) {
        return res.json()
    })
    .then(function(dados) {
        estoque = dados
        return fetch(`${API_URL}/pedidos`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
    })
    .then(function(res) {
        return res.json()
    })
    .then(function(pedidos) {
        document.getElementById('relTotalUsuarios').textContent = resumo.totalUsuarios
        document.getElementById('relTotalProdutos').textContent = resumo.totalProdutos
        document.getElementById('relProdutosDisponiveis').textContent = resumo.produtosDisponiveis
        document.getElementById('relTotalPedidos').textContent = resumo.totalPedidos
        document.getElementById('relFaturamento').textContent = Number(resumo.faturamento).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

        if (graficoFaturamento) graficoFaturamento.destroy()
        if (graficoEstoque) graficoEstoque.destroy()

        graficoFaturamento = new Chart(document.getElementById('graficoFaturamentoMensal'), {
            type: 'line',
            data: {
                labels: vendas.faturamentoMensal.map(function(item) { return item.rotulo }),
                datasets: [{
                    label: 'Faturamento (R$)',
                    data: vendas.faturamentoMensal.map(function(item) { return item.total }),
                    borderColor: '#ff252c',
                    backgroundColor: 'rgba(255, 37, 44, 0.18)',
                    fill: true
                }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        })

        graficoEstoque = new Chart(document.getElementById('graficoEstoqueCategoria'), {
            type: 'bar',
            data: {
                labels: estoque.estoquePorCategoria.map(function(item) { return item.categoria }),
                datasets: [{
                    label: 'Unidades em estoque',
                    data: estoque.estoquePorCategoria.map(function(item) { return item.unidades }),
                    backgroundColor: '#ff252c'
                }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        })

        document.getElementById('corpoPedidosRecentes').innerHTML = ''

        pedidos.slice(0, 8).forEach(function(pedido) {
            let cliente = pedido.usuarioPedido || {}
            document.getElementById('corpoPedidosRecentes').innerHTML += `
                <tr>
                    <td data-label="Pedido"><strong>#${pedido.codPedido}</strong></td>
                    <td data-label="Cliente">${cliente.nome || 'Cliente'}<small>${cliente.email || ''}</small></td>
                    <td data-label="Data">${new Date(pedido.dataPedido).toLocaleDateString('pt-BR')}</td>
                    <td data-label="Status">${pedido.status}</td>
                    <td data-label="Total"><strong>${Number(pedido.valorTotal).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong></td>
                </tr>
            `
        })

        if (pedidos.length === 0) {
            document.getElementById('corpoPedidosRecentes').innerHTML = '<tr><td colspan="5">Nenhum pedido realizado.</td></tr>'
        }

        document.getElementById('dataAtualizacaoRelatorio').textContent = `Atualizado em ${new Date().toLocaleString('pt-BR')}`
        botao.disabled = false
        botao.textContent = 'Atualizar'
    })
    .catch(function() {
        resposta.hidden = false
        resposta.textContent = 'Erro ao carregar os relatórios!'
        botao.disabled = false
        botao.textContent = 'Atualizar'
    })
}

document.getElementById('botaoSair').addEventListener('click', sair)
document.getElementById('botaoAtualizarRelatorio').addEventListener('click', carregarRelatorios)
document.getElementById('botaoImprimirRelatorio').addEventListener('click', function() {
    window.print()
})

carregarRelatorios()
