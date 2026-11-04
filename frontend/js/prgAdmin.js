const API_URL = 'http://localhost:3000'
const token = localStorage.getItem('autoshopping_token')
const usuario = JSON.parse(localStorage.getItem('autoshopping_usuario') || 'null')
let resposta = document.getElementById('mensagemAdmin')

function sair() {
    localStorage.removeItem('autoshopping_token')
    localStorage.removeItem('autoshopping_usuario')
    window.location.href = 'login.html?redirect=admin.html'
}

function mostrarErro(texto) {
    resposta.hidden = false
    resposta.className = 'aviso-admin erro'
    resposta.textContent = texto
}

function carregarResumo() {
    fetch(API_URL + '/relatorio/resumo', {
        headers: { Authorization: 'Bearer ' + token }
    })
    .then(function (res) { return res.json() })
    .then(function (dados) {
        if (dados.message) {
            mostrarErro(dados.message)
            return
        }

        document.getElementById('resumoProdutos').textContent = dados.totalProdutos
        document.getElementById('resumoDisponiveis').textContent = dados.produtosDisponiveis
        document.getElementById('resumoPedidos').textContent = dados.totalPedidos
        document.getElementById('resumoFaturamento').textContent = Number(dados.faturamento || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    })
    .catch(function () {
        document.getElementById('resumoProdutos').textContent = VEICULOS_FIXOS.length
        document.getElementById('resumoDisponiveis').textContent = VEICULOS_FIXOS.length
        document.getElementById('resumoPedidos').textContent = '0'
        document.getElementById('resumoFaturamento').textContent = 'R$ 0,00'
    })
}

if (!token || !usuario) {
    window.location.href = 'login.html?redirect=admin.html'
} else if (usuario.tipo !== 'ADMIN') {
    window.location.href = 'perfil.html'
} else {
    document.getElementById('botaoSair').addEventListener('click', sair)
    document.getElementById('bloqueioAdmin').hidden = true
    document.getElementById('conteudoAdmin').hidden = false
    carregarResumo()
}
