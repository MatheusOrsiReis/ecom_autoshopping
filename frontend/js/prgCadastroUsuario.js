const API_URL = 'http://localhost:3000'
let ultimoCepConsultado = ''

function atualizarContadorCarrinho() {
    let carrinho = []
    try {
        carrinho = JSON.parse(localStorage.getItem('autoshopping_carrinho')) || []
    } catch (erro) {
        carrinho = []
    }
    document.getElementById('contadorCarrinho').textContent = carrinho.length
}

function mostrarMensagemCadastro(texto, tipo) {
    const mensagem = document.getElementById('mensagemCadastro')
    mensagem.className = 'mensagem-formulario ' + tipo
    mensagem.textContent = texto
}

function somenteNumeros(valor) {
    return valor.replace(/\D/g, '')
}

function formatarCpf(valor) {
    return somenteNumeros(valor).slice(0, 11)
        .replace(/^(\d{3})(\d)/, '$1.$2')
        .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
        .replace(/\.(\d{3})(\d)/, '.$1-$2')
}

function formatarCep(valor) {
    return somenteNumeros(valor).slice(0, 8).replace(/^(\d{5})(\d)/, '$1-$2')
}

function cpfValido(valor) {
    const cpf = somenteNumeros(valor)
    if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false

    function calcularDigito(tamanho) {
        let soma = 0
        for (let indice = 0; indice < tamanho; indice++) {
            soma += Number(cpf[indice]) * (tamanho + 1 - indice)
        }
        const resto = (soma * 10) % 11
        return resto === 10 ? 0 : resto
    }

    return calcularDigito(9) === Number(cpf[9]) && calcularDigito(10) === Number(cpf[10])
}

function mostrarEstadoCampo(idMensagem, input, texto, tipo) {
    const mensagem = document.getElementById(idMensagem)
    mensagem.className = 'mensagem-campo ' + (tipo || '')
    mensagem.textContent = texto || ''
    input.classList.toggle('invalido', tipo === 'erro')
}

function validarCampoCpf() {
    const input = document.getElementById('cpf')
    const valido = cpfValido(input.value)
    mostrarEstadoCampo('mensagemCpf', input, valido ? 'CPF válido.' : 'Informe um CPF válido.', valido ? 'sucesso' : 'erro')
    input.setCustomValidity(valido ? '' : 'Informe um CPF válido.')
    return valido
}

function limparEndereco() {
    ;['rua', 'bairro', 'cidade', 'uf'].forEach(function (id) {
        document.getElementById(id).value = ''
    })
}

async function consultarCep() {
    const input = document.getElementById('cep')
    const cep = somenteNumeros(input.value)
    input.value = formatarCep(input.value)

    if (cep.length !== 8) {
        ultimoCepConsultado = ''
        mostrarEstadoCampo('mensagemCep', input, cep ? 'O CEP deve possuir 8 dígitos.' : '', cep ? 'erro' : '')
        input.setCustomValidity(cep ? 'Informe um CEP válido.' : '')
        return false
    }

    if (cep === ultimoCepConsultado) return !input.classList.contains('invalido')
    ultimoCepConsultado = cep
    mostrarEstadoCampo('mensagemCep', input, 'Consultando CEP...', 'carregando')

    try {
        const resposta = await fetch('https://viacep.com.br/ws/' + cep + '/json/')
        if (!resposta.ok) throw new Error('CONSULTA_INDISPONIVEL')
        const endereco = await resposta.json()
        if (endereco.erro) {
            ultimoCepConsultado = ''
            limparEndereco()
            mostrarEstadoCampo('mensagemCep', input, 'CEP não encontrado.', 'erro')
            input.setCustomValidity('CEP não encontrado.')
            return false
        }

        if (somenteNumeros(input.value) !== cep) return false
        input.value = endereco.cep || formatarCep(cep)
        document.getElementById('rua').value = endereco.logradouro || ''
        document.getElementById('bairro').value = endereco.bairro || ''
        document.getElementById('cidade').value = endereco.localidade || ''
        document.getElementById('uf').value = endereco.uf || ''
        input.setCustomValidity('')
        mostrarEstadoCampo('mensagemCep', input, 'Endereço preenchido automaticamente.', 'sucesso')
        document.getElementById('numero').focus()
        return true
    } catch (erro) {
        ultimoCepConsultado = ''
        mostrarEstadoCampo('mensagemCep', input, 'Não foi possível consultar o CEP. Preencha o endereço manualmente.', 'erro')
        input.setCustomValidity('')
        return false
    }
}

function cadastrarUsuario(evento) {
    evento.preventDefault()

    if (!validarCampoCpf()) {
        document.getElementById('cpf').focus()
        return
    }

    if (somenteNumeros(document.getElementById('cep').value).length !== 8) {
        mostrarEstadoCampo('mensagemCep', document.getElementById('cep'), 'Informe um CEP válido.', 'erro')
        document.getElementById('cep').focus()
        return
    }

    const botao = document.getElementById('botaoCadastrar')
    const dados = {
        nome: document.getElementById('nome').value.trim(),
        cpf: formatarCpf(document.getElementById('cpf').value),
        email: document.getElementById('email').value.trim(),
        senha: document.getElementById('senha').value,
        telefone: document.getElementById('telefone').value.trim(),
        cep: formatarCep(document.getElementById('cep').value),
        rua: document.getElementById('rua').value.trim(),
        numero: document.getElementById('numero').value.trim(),
        bairro: document.getElementById('bairro').value.trim(),
        cidade: document.getElementById('cidade').value.trim(),
        uf: document.getElementById('uf').value.trim().toUpperCase()
    }

    botao.disabled = true
    botao.textContent = 'Criando conta...'
    mostrarMensagemCadastro('', '')

    fetch(API_URL + '/usuario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados)
    })
    .then(function (resposta) {
        return resposta.json().then(function (conteudo) {
            if (!resposta.ok) {
                throw new Error(conteudo.message || 'Não foi possível criar a conta.')
            }
            return conteudo
        })
    })
    .then(function () {
        mostrarMensagemCadastro('Conta criada com sucesso! Redirecionando para o login...', 'sucesso')
        setTimeout(function () {
            window.location.href = 'login.html?email=' + encodeURIComponent(dados.email)
        }, 900)
    })
    .catch(function (erro) {
        mostrarMensagemCadastro(erro.message === 'Failed to fetch'
            ? 'Backend indisponível. Verifique se o servidor está ligado.'
            : erro.message, 'erro')
        botao.disabled = false
        botao.textContent = 'Criar minha conta'
    })
}

if (localStorage.getItem('autoshopping_token')) {
    window.location.href = 'perfil.html'
} else {
    document.getElementById('cpf').addEventListener('input', function (evento) {
        evento.target.value = formatarCpf(evento.target.value)
        evento.target.setCustomValidity('')
        mostrarEstadoCampo('mensagemCpf', evento.target, '', '')
    })
    document.getElementById('cpf').addEventListener('blur', validarCampoCpf)
    document.getElementById('cep').addEventListener('input', function (evento) {
        evento.target.value = formatarCep(evento.target.value)
        evento.target.setCustomValidity('')
        if (somenteNumeros(evento.target.value).length === 8) consultarCep()
        else mostrarEstadoCampo('mensagemCep', evento.target, '', '')
    })
    document.getElementById('cep').addEventListener('blur', consultarCep)
    document.getElementById('formCadastro').addEventListener('submit', cadastrarUsuario)
    atualizarContadorCarrinho()
}
