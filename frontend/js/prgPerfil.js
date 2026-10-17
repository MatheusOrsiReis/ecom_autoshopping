const API_URL = 'http://localhost:3000'

let token = localStorage.getItem('autoshopping_token')
let usuario = JSON.parse(localStorage.getItem('autoshopping_usuario') || 'null')
let resposta = document.getElementById('mensagemPerfil')
let atualizar = document.getElementById('botaoSalvarPerfil')
let carrinho = JSON.parse(localStorage.getItem('autoshopping_carrinho') || '[]')

if (!token || !usuario) {
    window.location.href = 'login.html?redirect=perfil.html'
}

document.getElementById('contadorCarrinho').textContent = carrinho.length

if (usuario && usuario.tipo === 'ADMIN') {
    document.getElementById('linkAdmin').hidden = false
    document.getElementById('linkAdminConta').hidden = false
}

function sair() {
    localStorage.removeItem('autoshopping_token')
    localStorage.removeItem('autoshopping_usuario')
    window.location.href = '../index.html'
}

function formatarCpf(valor) {
    return valor.replace(/\D/g, '').slice(0, 11)
        .replace(/^(\d{3})(\d)/, '$1.$2')
        .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
        .replace(/\.(\d{3})(\d)/, '.$1-$2')
}

function formatarCep(valor) {
    return valor.replace(/\D/g, '').slice(0, 8).replace(/^(\d{5})(\d)/, '$1-$2')
}

function consultarCep() {
    let cep = document.getElementById('cep').value.replace(/\D/g, '')

    if (cep.length !== 8) {
        return
    }

    document.getElementById('mensagemCep').textContent = 'Consultando CEP...'

    fetch(`https://viacep.com.br/ws/${cep}/json/`)
    .then(function(res) {
        return res.json()
    })
    .then(function(endereco) {
        if (endereco.erro) {
            document.getElementById('mensagemCep').textContent = 'CEP não encontrado.'
            return
        }

        document.getElementById('rua').value = endereco.logradouro || ''
        document.getElementById('bairro').value = endereco.bairro || ''
        document.getElementById('cidade').value = endereco.localidade || ''
        document.getElementById('uf').value = endereco.uf || ''
        document.getElementById('mensagemCep').textContent = 'Endereço preenchido automaticamente.'
        document.getElementById('numero').focus()
    })
    .catch(function() {
        document.getElementById('mensagemCep').textContent = 'Não foi possível consultar o CEP.'
    })
}

fetch(`${API_URL}/usuario/${usuario ? usuario.codUsuario : ''}`, {
    headers: { 'Authorization': `Bearer ${token}` }
})
.then(function(res) {
    if (res.status === 401) sair()
    return res.json()
})
.then(function(perfil) {
    document.getElementById('nome').value = perfil.nome || ''
    document.getElementById('cpf').value = formatarCpf(perfil.cpf || '')
    document.getElementById('telefone').value = perfil.telefone || ''
    document.getElementById('email').value = perfil.email || ''
    document.getElementById('cep').value = formatarCep(perfil.cep || '')
    document.getElementById('rua').value = perfil.rua || ''
    document.getElementById('numero').value = perfil.numero || ''
    document.getElementById('bairro').value = perfil.bairro || ''
    document.getElementById('cidade').value = perfil.cidade || ''
    document.getElementById('uf').value = perfil.uf || ''
    document.getElementById('carregandoPerfil').hidden = true
    document.getElementById('formPerfil').hidden = false
})
.catch(function() {
    document.getElementById('carregandoPerfil').textContent = 'Erro ao carregar o perfil!'
})

document.getElementById('cpf').addEventListener('input', function(e) {
    e.target.value = formatarCpf(e.target.value)
})

document.getElementById('cep').addEventListener('input', function(e) {
    e.target.value = formatarCep(e.target.value)

    if (e.target.value.replace(/\D/g, '').length === 8) {
        consultarCep()
    }
})

document.getElementById('formPerfil').addEventListener('submit', function(e) {
    e.preventDefault()

    const valores = {
        nome: document.getElementById('nome').value,
        cpf: document.getElementById('cpf').value,
        telefone: document.getElementById('telefone').value,
        email: document.getElementById('email').value,
        cep: document.getElementById('cep').value,
        rua: document.getElementById('rua').value,
        numero: document.getElementById('numero').value,
        bairro: document.getElementById('bairro').value,
        cidade: document.getElementById('cidade').value,
        uf: document.getElementById('uf').value
    }

    if (document.getElementById('senha').value) {
        valores.senha = document.getElementById('senha').value
    }

    atualizar.disabled = true
    atualizar.textContent = 'Salvando...'

    fetch(`${API_URL}/usuario/${usuario.codUsuario}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(valores)
    })
    .then(function(res) {
        return res.json()
    })
    .then(function(perfil) {
        if (perfil.message && !perfil.codUsuario) {
            resposta.textContent = perfil.message
        } else {
            usuario.nome = perfil.nome
            usuario.email = perfil.email
            localStorage.setItem('autoshopping_usuario', JSON.stringify(usuario))
            document.getElementById('senha').value = ''
            resposta.textContent = 'Perfil atualizado com sucesso!'
        }

        atualizar.disabled = false
        atualizar.textContent = 'Salvar alterações'
    })
    .catch(function() {
        resposta.textContent = 'Erro ao atualizar o perfil!'
        atualizar.disabled = false
        atualizar.textContent = 'Salvar alterações'
    })
})

document.getElementById('botaoSair').addEventListener('click', sair)
