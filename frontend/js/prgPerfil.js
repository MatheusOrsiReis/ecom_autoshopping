const API_URL = 'http://localhost:3000'
const token = localStorage.getItem('autoshopping_token')
let usuario = null
let ultimoCepConsultado = ''

function lerUsuario() {
    try {
        return JSON.parse(localStorage.getItem('autoshopping_usuario'))
    } catch (erro) {
        return null
    }
}

function atualizarContadorCarrinho() {
    try {
        const carrinho = JSON.parse(localStorage.getItem('autoshopping_carrinho')) || []
        document.getElementById('contadorCarrinho').textContent = carrinho.length
    } catch (erro) {
        document.getElementById('contadorCarrinho').textContent = '0'
    }
}

function sair() {
    localStorage.removeItem('autoshopping_token')
    localStorage.removeItem('autoshopping_usuario')
    window.location.href = '../index.html'
}

function mostrarMensagem(texto, tipo) {
    const mensagem = document.getElementById('mensagemPerfil')
    mensagem.className = 'mensagem-formulario campo-largo ' + tipo
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

function tratarNaoAutorizado(resposta) {
    if (resposta.status === 401) {
        sair()
        throw new Error('SESSAO_EXPIRADA')
    }
}

function preencherPerfil(perfil) {
    const campos = ['nome', 'cpf', 'telefone', 'email', 'cep', 'uf', 'rua', 'numero', 'bairro', 'cidade']
    campos.forEach(function (campo) {
        document.getElementById(campo).value = perfil[campo] || ''
    })
    document.getElementById('cpf').value = formatarCpf(perfil.cpf || '')
    document.getElementById('cep').value = formatarCep(perfil.cep || '')
    document.getElementById('carregandoPerfil').hidden = true
    document.getElementById('formPerfil').hidden = false
}

function carregarPerfil() {
    fetch(API_URL + '/usuario/' + usuario.codUsuario, {
        headers: { Authorization: 'Bearer ' + token }
    })
    .then(function (resposta) {
        tratarNaoAutorizado(resposta)
        if (!resposta.ok) throw new Error('Não foi possível carregar o perfil.')
        return resposta.json()
    })
    .then(preencherPerfil)
    .catch(function (erro) {
        if (erro.message !== 'SESSAO_EXPIRADA') {
            const carregando = document.getElementById('carregandoPerfil')
            carregando.className = 'mensagem mensagem-erro'
            carregando.textContent = erro.message === 'Failed to fetch'
                ? 'Backend indisponível. Verifique se o servidor está ligado.'
                : erro.message
        }
    })
}

function salvarPerfil(evento) {
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
    const botao = document.getElementById('botaoSalvarPerfil')
    const dados = {}
    const campos = ['nome', 'cpf', 'telefone', 'email', 'cep', 'rua', 'numero', 'bairro', 'cidade']

    campos.forEach(function (campo) {
        dados[campo] = document.getElementById(campo).value.trim()
    })
    dados.cpf = formatarCpf(dados.cpf)
    dados.cep = formatarCep(dados.cep)
    dados.uf = document.getElementById('uf').value.trim().toUpperCase()

    const senha = document.getElementById('senha').value
    if (senha) dados.senha = senha

    botao.disabled = true
    botao.textContent = 'Salvando...'
    mostrarMensagem('', '')

    fetch(API_URL + '/usuario/' + usuario.codUsuario, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify(dados)
    })
    .then(function (resposta) {
        tratarNaoAutorizado(resposta)
        return resposta.json().then(function (conteudo) {
            if (!resposta.ok) throw new Error(conteudo.message || 'Não foi possível atualizar o perfil.')
            return conteudo
        })
    })
    .then(function (perfil) {
        usuario.nome = perfil.nome
        usuario.email = perfil.email
        localStorage.setItem('autoshopping_usuario', JSON.stringify(usuario))
        document.getElementById('senha').value = ''
        mostrarMensagem('Perfil atualizado com sucesso!', 'sucesso')
    })
    .catch(function (erro) {
        if (erro.message !== 'SESSAO_EXPIRADA') {
            mostrarMensagem(erro.message === 'Failed to fetch'
                ? 'Backend indisponível. Verifique se o servidor está ligado.'
                : erro.message, 'erro')
        }
    })
    .finally(function () {
        botao.disabled = false
        botao.textContent = 'Salvar alterações'
    })
}

if (!token || !lerUsuario()) {
    window.location.href = 'login.html?redirect=perfil.html'
} else {
    usuario = lerUsuario()
    if (usuario.tipo === 'ADMIN') {
        document.getElementById('linkAdmin').hidden = false
        document.getElementById('linkAdminConta').hidden = false
    }
    document.getElementById('botaoSair').addEventListener('click', sair)
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
    document.getElementById('formPerfil').addEventListener('submit', salvarPerfil)
    atualizarContadorCarrinho()
    carregarPerfil()
}
