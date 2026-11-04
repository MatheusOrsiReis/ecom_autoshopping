const API_URL = 'http://localhost:3000'
const token = localStorage.getItem('autoshopping_token')
const usuarioLogado = JSON.parse(localStorage.getItem('autoshopping_usuario') || 'null')
let usuarioEmEdicao = null
let resposta = document.getElementById('mensagemAdmin')

function sair() {
    localStorage.removeItem('autoshopping_token')
    localStorage.removeItem('autoshopping_usuario')
    window.location.href = 'login.html?redirect=admin.html'
}

function mostrarAviso(texto, tipo) {
    resposta.hidden = false
    resposta.className = 'aviso-admin ' + tipo
    resposta.textContent = texto
}

function mostrarOperacao(operacao) {
    document.getElementById('botaoCadastrarUsuario').classList.remove('ativo')
    document.getElementById('botaoListarUsuario').classList.remove('ativo')
    document.getElementById('botaoConsultarUsuario').classList.remove('ativo')
    document.getElementById('botaoAtualizarUsuario').classList.remove('ativo')
    document.getElementById('botaoApagarUsuario').classList.remove('ativo')
    document.getElementById('painelFormularioUsuario').hidden = true
    document.getElementById('painelListarUsuario').hidden = true
    document.getElementById('painelConsultarUsuario').hidden = true
    document.getElementById('painelAtualizarUsuario').hidden = true
    document.getElementById('painelApagarUsuario').hidden = true

    if (operacao === 'cadastrar') {
        document.getElementById('botaoCadastrarUsuario').classList.add('ativo')
        document.getElementById('painelFormularioUsuario').hidden = false
    }
    if (operacao === 'listar') {
        document.getElementById('botaoListarUsuario').classList.add('ativo')
        document.getElementById('painelListarUsuario').hidden = false
    }
    if (operacao === 'consultar') {
        document.getElementById('botaoConsultarUsuario').classList.add('ativo')
        document.getElementById('painelConsultarUsuario').hidden = false
    }
    if (operacao === 'atualizar') {
        document.getElementById('botaoAtualizarUsuario').classList.add('ativo')
        document.getElementById('painelAtualizarUsuario').hidden = false
    }
    if (operacao === 'apagar') {
        document.getElementById('botaoApagarUsuario').classList.add('ativo')
        document.getElementById('painelApagarUsuario').hidden = false
    }
}

function mostrarUsuarios(usuarios, local) {
    let corpo = document.getElementById(local)
    corpo.innerHTML = ''

    if (usuarios.length === 0) {
        corpo.innerHTML = '<tr><td colspan="6" class="estado-tabela">Nenhum usuário cadastrado.</td></tr>'
        return
    }

    usuarios.forEach(function (usuario) {
        corpo.innerHTML += '<tr><td>' + usuario.codUsuario + '</td><td><strong>' + usuario.nome + '</strong></td><td>' + usuario.email + '<small>' + usuario.telefone + '</small></td><td>' + usuario.cpf + '</td><td>' + usuario.cidade + '/' + usuario.uf + '</td><td>' + usuario.tipo + '</td></tr>'
    })
}

function listarUsuarios() {
    fetch(API_URL + '/usuarios', { headers: { Authorization: 'Bearer ' + token } })
    .then(function (res) { return res.json() })
    .then(function (dados) {
        if (dados.message) mostrarAviso(dados.message, 'erro')
        else mostrarUsuarios(dados, 'corpoTabelaUsuarios')
    })
    .catch(function () { mostrarAviso('Erro ao listar usuários.', 'erro') })
}

function abrirCadastro() {
    usuarioEmEdicao = null
    document.getElementById('formUsuario').reset()
    document.getElementById('tituloFormUsuario').textContent = 'Cadastrar usuário'
    document.getElementById('usuarioSenha').required = true
    mostrarOperacao('cadastrar')
}

function dadosFormulario() {
    let valores = {
        nome: document.getElementById('usuarioNome').value,
        cpf: document.getElementById('usuarioCpf').value,
        email: document.getElementById('usuarioEmail').value,
        telefone: document.getElementById('usuarioTelefone').value,
        identidade: document.getElementById('usuarioIdentidade').value,
        cep: document.getElementById('usuarioCep').value,
        rua: document.getElementById('usuarioRua').value,
        numero: document.getElementById('usuarioNumero').value,
        bairro: document.getElementById('usuarioBairro').value,
        cidade: document.getElementById('usuarioCidade').value,
        uf: document.getElementById('usuarioUf').value,
        tipo: document.getElementById('usuarioTipo').value
    }

    let senha = document.getElementById('usuarioSenha').value
    if (senha) valores.senha = senha
    return valores
}

function salvarUsuario(evento) {
    evento.preventDefault()
    let valores = dadosFormulario()
    let caminho = usuarioEmEdicao ? '/usuario/' + usuarioEmEdicao.codUsuario : '/usuario'
    let metodo = usuarioEmEdicao ? 'PUT' : 'POST'

    fetch(API_URL + caminho, {
        method: metodo,
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify(valores)
    })
    .then(function (res) { return res.json() })
    .then(function (dados) {
        if (dados.message && !dados.codUsuario) {
            mostrarAviso(dados.message, 'erro')
            return
        }
        mostrarAviso(usuarioEmEdicao ? 'Usuário atualizado com sucesso.' : 'Usuário cadastrado com sucesso.', 'sucesso')
        usuarioEmEdicao = null
        mostrarOperacao('listar')
        listarUsuarios()
    })
    .catch(function () { mostrarAviso('Erro ao salvar usuário.', 'erro') })
}

function consultarUsuario(evento) {
    evento.preventDefault()
    let id = document.getElementById('codigoConsultarUsuario').value
    fetch(API_URL + '/usuario/' + id, { headers: { Authorization: 'Bearer ' + token } })
    .then(function (res) { return res.json() })
    .then(function (dados) {
        if (dados.message) mostrarAviso(dados.message, 'erro')
        else mostrarUsuarios([dados], 'resultadoConsultaUsuario')
    })
    .catch(function () { mostrarAviso('Erro ao consultar usuário.', 'erro') })
}

function preencherFormulario(usuario) {
    usuarioEmEdicao = usuario
    document.getElementById('tituloFormUsuario').textContent = 'Atualizar usuário'
    document.getElementById('usuarioNome').value = usuario.nome || ''
    document.getElementById('usuarioCpf').value = usuario.cpf || ''
    document.getElementById('usuarioEmail').value = usuario.email || ''
    document.getElementById('usuarioSenha').value = ''
    document.getElementById('usuarioSenha').required = false
    document.getElementById('usuarioTelefone').value = usuario.telefone || ''
    document.getElementById('usuarioIdentidade').value = usuario.identidade || ''
    document.getElementById('usuarioCep').value = usuario.cep || ''
    document.getElementById('usuarioRua').value = usuario.rua || ''
    document.getElementById('usuarioNumero').value = usuario.numero || ''
    document.getElementById('usuarioBairro').value = usuario.bairro || ''
    document.getElementById('usuarioCidade').value = usuario.cidade || ''
    document.getElementById('usuarioUf').value = usuario.uf || ''
    document.getElementById('usuarioTipo').value = usuario.tipo || 'CLIENTE'
    mostrarOperacao('atualizar')
    document.getElementById('painelAtualizarUsuario').hidden = true
    document.getElementById('painelFormularioUsuario').hidden = false
}

function buscarParaAtualizar(evento) {
    evento.preventDefault()
    let id = document.getElementById('codigoAtualizarUsuario').value
    fetch(API_URL + '/usuario/' + id, { headers: { Authorization: 'Bearer ' + token } })
    .then(function (res) { return res.json() })
    .then(function (dados) {
        if (dados.message) mostrarAviso(dados.message, 'erro')
        else preencherFormulario(dados)
    })
    .catch(function () { mostrarAviso('Erro ao consultar usuário.', 'erro') })
}

function apagarUsuario(evento) {
    evento.preventDefault()
    let id = Number(document.getElementById('codigoApagarUsuario').value)

    if (id === usuarioLogado.codUsuario) {
        mostrarAviso('Você não pode apagar a própria conta.', 'erro')
        return
    }
    if (!confirm('Deseja realmente apagar este usuário?')) return

    fetch(API_URL + '/usuario/' + id, { method: 'DELETE', headers: { Authorization: 'Bearer ' + token } })
    .then(function (res) { return res.json() })
    .then(function (dados) {
        mostrarAviso(dados.message, dados.message.includes('sucesso') ? 'sucesso' : 'erro')
        mostrarOperacao('listar')
        listarUsuarios()
    })
    .catch(function () { mostrarAviso('Erro ao apagar usuário.', 'erro') })
}

function buscarCep() {
    let cep = document.getElementById('usuarioCep').value.replace(/\D/g, '')
    if (cep.length !== 8) return

    fetch('https://viacep.com.br/ws/' + cep + '/json/')
    .then(function (res) { return res.json() })
    .then(function (endereco) {
        if (endereco.erro) {
            mostrarAviso('CEP não encontrado.', 'erro')
            return
        }
        document.getElementById('usuarioRua').value = endereco.logradouro
        document.getElementById('usuarioBairro').value = endereco.bairro
        document.getElementById('usuarioCidade').value = endereco.localidade
        document.getElementById('usuarioUf').value = endereco.uf
        document.getElementById('usuarioNumero').focus()
    })
    .catch(function () { mostrarAviso('Erro ao consultar CEP.', 'erro') })
}

function iniciar() {
    if (!token || !usuarioLogado) {
        window.location.href = 'login.html?redirect=adminUsuarios.html'
        return
    }
    if (usuarioLogado.tipo !== 'ADMIN') {
        window.location.href = 'perfil.html'
        return
    }

    document.getElementById('botaoSair').addEventListener('click', sair)
    document.getElementById('botaoCadastrarUsuario').addEventListener('click', abrirCadastro)
    document.getElementById('botaoListarUsuario').addEventListener('click', function () { mostrarOperacao('listar'); listarUsuarios() })
    document.getElementById('botaoConsultarUsuario').addEventListener('click', function () { mostrarOperacao('consultar') })
    document.getElementById('botaoAtualizarUsuario').addEventListener('click', function () { mostrarOperacao('atualizar') })
    document.getElementById('botaoApagarUsuario').addEventListener('click', function () { mostrarOperacao('apagar') })
    document.getElementById('formUsuario').addEventListener('submit', salvarUsuario)
    document.getElementById('formConsultarUsuario').addEventListener('submit', consultarUsuario)
    document.getElementById('formAtualizarUsuario').addEventListener('submit', buscarParaAtualizar)
    document.getElementById('formApagarUsuario').addEventListener('submit', apagarUsuario)
    document.getElementById('botaoCancelarUsuario').addEventListener('click', function () { mostrarOperacao('listar') })
    document.getElementById('usuarioCep').addEventListener('blur', buscarCep)
    document.getElementById('bloqueioAdmin').hidden = true
    document.getElementById('conteudoAdmin').hidden = false
    listarUsuarios()
}

iniciar()
