const API_URL = 'http://localhost:3000'

let resposta = document.getElementById('mensagemCadastro')
let cadastrar = document.getElementById('botaoCadastrar')
let carrinho = JSON.parse(localStorage.getItem('autoshopping_carrinho') || '[]')

document.getElementById('contadorCarrinho').textContent = carrinho.length

if (localStorage.getItem('autoshopping_token')) {
    window.location.href = 'perfil.html'
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

document.getElementById('cpf').addEventListener('input', function(e) {
    e.target.value = formatarCpf(e.target.value)
})

document.getElementById('cep').addEventListener('input', function(e) {
    e.target.value = formatarCep(e.target.value)

    if (e.target.value.replace(/\D/g, '').length === 8) {
        consultarCep()
    }
})

document.getElementById('formCadastro').addEventListener('submit', function(e) {
    e.preventDefault()

    let cpf = document.getElementById('cpf').value.replace(/\D/g, '')
    let soma = 0

    if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) {
        resposta.textContent = 'Informe um CPF válido!'
        return
    }

    for (let i = 0; i < 9; i++) {
        soma += Number(cpf[i]) * (10 - i)
    }

    let primeiroDigito = 11 - (soma % 11)
    if (primeiroDigito >= 10) primeiroDigito = 0

    soma = 0
    for (let i = 0; i < 10; i++) {
        soma += Number(cpf[i]) * (11 - i)
    }

    let segundoDigito = 11 - (soma % 11)
    if (segundoDigito >= 10) segundoDigito = 0

    if (primeiroDigito !== Number(cpf[9]) || segundoDigito !== Number(cpf[10])) {
        resposta.textContent = 'Informe um CPF válido!'
        return
    }

    const valores = {
        nome: document.getElementById('nome').value,
        cpf: document.getElementById('cpf').value,
        email: document.getElementById('email').value,
        senha: document.getElementById('senha').value,
        telefone: document.getElementById('telefone').value,
        cep: document.getElementById('cep').value,
        rua: document.getElementById('rua').value,
        numero: document.getElementById('numero').value,
        bairro: document.getElementById('bairro').value,
        cidade: document.getElementById('cidade').value,
        uf: document.getElementById('uf').value
    }

    cadastrar.disabled = true
    cadastrar.textContent = 'Criando conta...'

    fetch(`${API_URL}/usuario`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(valores)
    })
    .then(function(res) {
        return res.json()
    })
    .then(function(dados) {
        if (dados.message && !dados.codUsuario) {
            resposta.textContent = dados.message
            cadastrar.disabled = false
            cadastrar.textContent = 'Criar minha conta'
            return
        }

        resposta.textContent = 'Conta criada com sucesso!'
        window.location.href = `login.html?email=${encodeURIComponent(valores.email)}`
    })
    .catch(function() {
        resposta.textContent = 'Erro ao cadastrar usuário!'
        cadastrar.disabled = false
        cadastrar.textContent = 'Criar minha conta'
    })
})
