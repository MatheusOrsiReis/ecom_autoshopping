const API_URL = 'http://localhost:3000'
const tokenAdmin = localStorage.getItem('autoshopping_token')
let usuarioAdmin = null
let produtosAdmin = []
let categoriasAdmin = []
let produtoEmEdicao = null
let categoriaEmEdicao = null
let categoriasCarregadas = false
let usuariosCarregados = false
let resposta = document.getElementById('mensagemAdmin')
let cadastrar = document.getElementById('botaoNovoProduto')
let formularioProduto = document.getElementById('formProduto')
let abas = document.getElementById('abasAdmin')

function lerUsuarioAdmin() {
    try {
        return JSON.parse(localStorage.getItem('autoshopping_usuario'))
    } catch (erro) {
        return null
    }
}

function escapar(texto) {
    return String(texto == null ? '' : texto)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;')
}

function formatarMoeda(valor) {
    return Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatarData(valor) {
    if (!valor) return 'Não informada'
    return new Date(valor).toLocaleDateString('pt-BR')
}

function nomeStatus(status) {
    const nomes = {
        PENDENTE_PAGAMENTO: 'Pendente de pagamento', PAGO: 'Pago', ENVIADO: 'Enviado',
        ENTREGUE: 'Entregue', CANCELADO: 'Cancelado', AGUARDANDO: 'Aguardando',
        EM_TRANSITO: 'Em trânsito', SAIU_PARA_ENTREGA: 'Saiu para entrega', EXTRAVIADO: 'Extraviado'
    }
    return nomes[status] || status
}

function classeStatus(status) {
    return 'status-pedido status-' + String(status || '').toLowerCase().replaceAll('_', '-')
}

function sairAdmin() {
    localStorage.removeItem('autoshopping_token')
    localStorage.removeItem('autoshopping_usuario')
    window.location.href = 'login.html?redirect=admin.html'
}

function requisicao(caminho, opcoes) {
    const configuracao = opcoes || {}
    if (!configuracao.headers) configuracao.headers = {}
    configuracao.headers.Authorization = 'Bearer ' + tokenAdmin
    if (configuracao.body) configuracao.headers['Content-Type'] = 'application/json'

    return fetch(API_URL + caminho, configuracao)
    .then(function (respostaHttp) {
        if (respostaHttp.status === 401) {
            sairAdmin()
            throw new Error('Sua sessão expirou.')
        }

        return respostaHttp.json().then(function (conteudo) {
            if (!respostaHttp.ok) {
                throw new Error(conteudo.message || 'Não foi possível concluir a operação.')
            }
            return conteudo
        })
    })
}

function mostrarAviso(texto, tipo) {
    resposta.hidden = !texto
    resposta.className = 'aviso-admin ' + (tipo || '')
    resposta.textContent = texto || ''
}

function mostrarMensagemFormulario(id, texto, tipo) {
    const elemento = document.getElementById(id)
    elemento.className = 'mensagem-formulario campo-largo ' + (tipo || '')
    elemento.textContent = texto || ''
}

function carregarResumo() {
    return requisicao('/relatorio/resumo').then(function (resumo) {
        document.getElementById('resumoProdutos').textContent = resumo.totalProdutos
        document.getElementById('resumoDisponiveis').textContent = resumo.produtosDisponiveis
        document.getElementById('resumoPedidos').textContent = resumo.totalPedidos
        document.getElementById('resumoFaturamento').textContent = formatarMoeda(resumo.faturamento)
    })
}

function preencherSelectCategorias() {
    const select = document.getElementById('produtoCategoria')
    const valorAtual = select.value
    const textoInicial = categoriasAdmin.length ? 'Selecione' : 'Cadastre uma categoria primeiro'
    select.innerHTML = '<option value="">' + textoInicial + '</option>' + categoriasAdmin.map(function (categoria) {
        return '<option value="' + categoria.codCategoria + '">' + escapar(categoria.nome) + '</option>'
    }).join('')
    select.disabled = categoriasAdmin.length === 0
    select.value = valorAtual
}

function renderizarCategorias() {
    const lista = document.getElementById('listaCategoriasAdmin')
    if (!categoriasAdmin.length) {
        lista.innerHTML = '<div class="mensagem mensagem-vazia">Nenhuma categoria cadastrada.</div>'
        return
    }

    lista.innerHTML = categoriasAdmin.map(function (categoria) {
        return '<article class="item-lista-admin">' +
            '<div><strong>' + escapar(categoria.nome) + '</strong><p>' + escapar(categoria.descricao || 'Sem descrição') + '</p></div>' +
            '<div class="acoes-linha"><button class="botao-texto" onclick="editarCategoria(' + categoria.codCategoria + ')" type="button">Editar</button>' +
            '<button class="botao-texto perigo" onclick="excluirCategoria(' + categoria.codCategoria + ')" type="button">Excluir</button></div></article>'
    }).join('')
}

function carregarCategorias() {
    return requisicao('/categorias').then(function (categorias) {
        categoriasAdmin = categorias
        preencherSelectCategorias()
        renderizarCategorias()
        categoriasCarregadas = true
    })
}

function renderizarProdutos() {
    const corpo = document.getElementById('corpoTabelaProdutos')
    if (!produtosAdmin.length) {
        corpo.innerHTML = '<tr><td colspan="6" class="estado-tabela">Nenhum veículo cadastrado. Use o botão acima para começar.</td></tr>'
        return
    }

    corpo.innerHTML = produtosAdmin.map(function (produto) {
        const estoque = produto.estoqueProduto ? produto.estoqueProduto.quantidade : 0
        const categoria = produto.categoriaProduto ? produto.categoriaProduto.nome : 'Sem categoria'
        return '<tr><td data-label="Veículo"><strong>' + escapar(produto.marca + ' ' + produto.modelo) + '</strong><small>' + escapar(produto.nome) + ' · ' + escapar(produto.ano) + '</small></td>' +
            '<td data-label="Categoria">' + escapar(categoria) + '</td><td data-label="Preço"><strong>' + formatarMoeda(produto.preco) + '</strong></td>' +
            '<td data-label="Estoque"><span class="selo-estoque ' + (estoque > 0 ? 'disponivel' : 'zerado') + '">' + estoque + '</span></td>' +
            '<td data-label="Status"><span class="selo-status ' + (produto.ativo ? 'ativo' : 'inativo') + '">' + (produto.ativo ? 'Ativo' : 'Inativo') + '</span></td>' +
            '<td data-label="Ações"><div class="acoes-tabela"><button class="botao-texto" onclick="editarProduto(' + produto.codProduto + ')" type="button">Atualizar</button>' +
            '<button class="botao-texto" onclick="alternarProduto(' + produto.codProduto + ')" type="button">' + (produto.ativo ? 'Desativar' : 'Ativar') + '</button>' +
            '<button class="botao-texto perigo" onclick="excluirProduto(' + produto.codProduto + ')" type="button">Apagar</button></div></td></tr>'
    }).join('')
}

function carregarProdutos() {
    return requisicao('/produtos').then(function (produtos) {
        produtosAdmin = produtos
        renderizarProdutos()
    })
}

function trocarOperacaoProduto(operacao) {
    document.getElementById('abaCadastrarProduto').classList.remove('ativo')
    document.getElementById('abaListarProdutos').classList.remove('ativo')
    document.getElementById('abaConsultarProduto').classList.remove('ativo')

    document.getElementById('formProduto').hidden = true
    document.getElementById('painelListarProdutos').hidden = true
    document.getElementById('painelConsultarProduto').hidden = true

    if (operacao === 'cadastrar') {
        document.getElementById('abaCadastrarProduto').classList.add('ativo')
        document.getElementById('formProduto').hidden = false
    }

    if (operacao === 'listar') {
        document.getElementById('abaListarProdutos').classList.add('ativo')
        document.getElementById('painelListarProdutos').hidden = false
    }

    if (operacao === 'consultar') {
        document.getElementById('abaConsultarProduto').classList.add('ativo')
        document.getElementById('painelConsultarProduto').hidden = false
    }
}

function consultarProduto(evento) {
    evento.preventDefault()

    const id = document.getElementById('codigoConsultaProduto').value
    const resultado = document.getElementById('resultadoConsultaProduto')
    resultado.innerHTML = '<div class="mensagem carregando">Consultando veículo...</div>'

    fetch(API_URL + '/produto/' + id)
    .then(function (res) {
        return res.json()
    })
    .then(function (produto) {
        if (produto.message) {
            resultado.innerHTML = '<div class="mensagem mensagem-erro">' + produto.message + '</div>'
            return
        }

        const categoria = produto.categoriaProduto ? produto.categoriaProduto.nome : 'Sem categoria'
        const estoque = produto.estoqueProduto ? produto.estoqueProduto.quantidade : 0

        resultado.innerHTML = `
            <article class="card-gestao-admin">
                <div class="gestao-admin-topo">
                    <div>
                        <span class="sobretitulo">Veículo #${produto.codProduto}</span>
                        <h3>${produto.marca} ${produto.modelo}</h3>
                        <p>${produto.nome}</p>
                    </div>
                    <strong>${formatarMoeda(produto.preco)}</strong>
                </div>
                <p>Categoria: ${categoria}</p>
                <p>Ano: ${produto.ano} | Cor: ${produto.cor} | Estoque: ${estoque}</p>
                <div class="acoes-linha">
                    <button class="botao botao-primario botao-menor" onclick="editarProduto(${produto.codProduto})" type="button">Atualizar</button>
                    <button class="botao-texto perigo" onclick="excluirProduto(${produto.codProduto})" type="button">Apagar</button>
                </div>
            </article>
        `
    })
    .catch(function () {
        resultado.innerHTML = '<div class="mensagem mensagem-erro">Erro ao consultar o veículo!</div>'
    })
}

function abrirFormularioProduto(produto) {
    if (!categoriasAdmin.length) {
        mostrarAviso('Cadastre pelo menos uma categoria antes de adicionar um veículo.', 'erro')
        trocarSecao('categorias')
        document.getElementById('categoriaNome').focus()
        return
    }
    produtoEmEdicao = produto || null
    trocarOperacaoProduto('cadastrar')
    const form = document.getElementById('formProduto')
    form.reset()
    document.getElementById('produtoAtivo').checked = true
    document.getElementById('produtoEstoque').value = '1'
    document.getElementById('produtoQuilometragem').value = '0'
    mostrarMensagemFormulario('mensagemProduto', '', '')

    if (produto) {
        document.getElementById('tituloFormProduto').textContent = 'Editar veículo'
        document.getElementById('produtoCategoria').value = produto.idCategoria
        document.getElementById('produtoNome').value = produto.nome || ''
        document.getElementById('produtoMarca').value = produto.marca || ''
        document.getElementById('produtoModelo').value = produto.modelo || ''
        document.getElementById('produtoVersao').value = produto.versao || ''
        document.getElementById('produtoAno').value = produto.ano || ''
        document.getElementById('produtoPreco').value = produto.preco || ''
        document.getElementById('produtoQuilometragem').value = produto.quilometragem || 0
        document.getElementById('produtoCombustivel').value = produto.combustivel || ''
        document.getElementById('produtoCambio').value = produto.cambio || ''
        document.getElementById('produtoCor').value = produto.cor || ''
        document.getElementById('produtoEstoque').value = produto.estoqueProduto ? produto.estoqueProduto.quantidade : 0
        document.getElementById('produtoImagem').value = produto.imagem || ''
        document.getElementById('produtoDescricao').value = produto.descricao || ''
        document.getElementById('produtoAtivo').checked = Boolean(produto.ativo)
    } else {
        document.getElementById('tituloFormProduto').textContent = 'Cadastrar veículo'
    }

    form.hidden = false
    form.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function fecharFormularioProduto() {
    produtoEmEdicao = null
    document.getElementById('formProduto').reset()
    trocarOperacaoProduto('listar')
}

function dadosFormularioProduto() {
    return {
        idCategoria: Number(document.getElementById('produtoCategoria').value),
        nome: document.getElementById('produtoNome').value.trim(),
        marca: document.getElementById('produtoMarca').value.trim(),
        modelo: document.getElementById('produtoModelo').value.trim(),
        versao: document.getElementById('produtoVersao').value.trim() || null,
        ano: Number(document.getElementById('produtoAno').value),
        preco: Number(document.getElementById('produtoPreco').value),
        quilometragem: Number(document.getElementById('produtoQuilometragem').value),
        combustivel: document.getElementById('produtoCombustivel').value,
        cambio: document.getElementById('produtoCambio').value,
        cor: document.getElementById('produtoCor').value.trim(),
        imagem: document.getElementById('produtoImagem').value.trim() || null,
        descricao: document.getElementById('produtoDescricao').value.trim() || null,
        ativo: document.getElementById('produtoAtivo').checked,
        quantidadeEstoque: Number(document.getElementById('produtoEstoque').value)
    }
}

function salvarProduto(evento) {
    evento.preventDefault()
    const botao = document.getElementById('botaoSalvarProduto')
    const dados = dadosFormularioProduto()
    botao.disabled = true
    botao.textContent = 'Salvando...'
    mostrarMensagemFormulario('mensagemProduto', '', '')

    let operacao

    if (produtoEmEdicao) {
        const quantidade = dados.quantidadeEstoque
        delete dados.quantidadeEstoque
        operacao = requisicao('/produto/' + produtoEmEdicao.codProduto, {
            method: 'PUT', body: JSON.stringify(dados)
        })
        .then(function () {
            if (produtoEmEdicao.estoqueProduto) {
                return requisicao('/estoque/' + produtoEmEdicao.estoqueProduto.codEstoque, {
                    method: 'PUT', body: JSON.stringify({ quantidade: quantidade })
                })
            }
            return requisicao('/estoque', {
                method: 'POST',
                body: JSON.stringify({ idProduto: produtoEmEdicao.codProduto, quantidade: quantidade })
            })
        })
    } else {
        operacao = requisicao('/produto', { method: 'POST', body: JSON.stringify(dados) })
    }

    operacao.then(function () {
        mostrarAviso(produtoEmEdicao ? 'Veículo atualizado com sucesso!' : 'Veículo cadastrado com sucesso!', 'sucesso')
        fecharFormularioProduto()
        carregarProdutos()
        carregarResumo()
        botao.disabled = false
        botao.textContent = 'Salvar veículo'
    })
    .catch(function (erro) {
        mostrarMensagemFormulario('mensagemProduto', erro.message, 'erro')
        botao.disabled = false
        botao.textContent = 'Salvar veículo'
    })
}

function editarProduto(id) {
    const produto = produtosAdmin.find(function (item) { return item.codProduto === id })
    if (!produto) return
    abrirFormularioProduto(produto)
}

function alternarProduto(id) {
    const produto = produtosAdmin.find(function (item) { return item.codProduto === id })
    if (!produto) return
    requisicao('/produto/' + id, {
        method: 'PUT', body: JSON.stringify({ ativo: !produto.ativo })
    })
    .then(function () {
        mostrarAviso('Status do veículo atualizado.', 'sucesso')
        carregarProdutos()
        carregarResumo()
    })
    .catch(function (erro) {
        mostrarAviso(erro.message, 'erro')
    })
}

function excluirProduto(id) {
    const produto = produtosAdmin.find(function (item) { return item.codProduto === id })
    if (!produto || !confirm('Excluir definitivamente o veículo "' + produto.nome + '"?')) return

    requisicao('/produto/' + id, { method: 'DELETE' })
    .then(function () {
        mostrarAviso('Veículo excluído com sucesso.', 'sucesso')
        document.getElementById('resultadoConsultaProduto').innerHTML = ''
        trocarOperacaoProduto('listar')
        carregarProdutos()
        carregarResumo()
    })
    .catch(function (erro) {
        mostrarAviso(erro.message, 'erro')
    })
}

function limparFormularioCategoria() {
    categoriaEmEdicao = null
    document.getElementById('formCategoria').reset()
    document.getElementById('tituloFormCategoria').textContent = 'Nova categoria'
    document.getElementById('botaoCancelarCategoria').hidden = true
    mostrarMensagemFormulario('mensagemCategoria', '', '')
}

function salvarCategoria(evento) {
    evento.preventDefault()
    const botao = document.getElementById('botaoSalvarCategoria')
    const dados = { nome: document.getElementById('categoriaNome').value.trim(), descricao: document.getElementById('categoriaDescricao').value.trim() || null }
    botao.disabled = true
    const editando = categoriaEmEdicao !== null
    const caminho = editando ? '/categoria/' + categoriaEmEdicao.codCategoria : '/categoria'

    requisicao(caminho, { method: editando ? 'PUT' : 'POST', body: JSON.stringify(dados) })
    .then(function () {
        mostrarAviso(categoriaEmEdicao ? 'Categoria atualizada com sucesso!' : 'Categoria cadastrada com sucesso!', 'sucesso')
        limparFormularioCategoria()
        carregarCategorias()
        botao.disabled = false
    })
    .catch(function (erro) {
        mostrarMensagemFormulario('mensagemCategoria', erro.message, 'erro')
        botao.disabled = false
    })
}

function editarCategoria(id) {
    const categoria = categoriasAdmin.find(function (item) { return item.codCategoria === id })
    if (!categoria) return

    categoriaEmEdicao = categoria
    document.getElementById('tituloFormCategoria').textContent = 'Editar categoria'
    document.getElementById('categoriaNome').value = categoria.nome
    document.getElementById('categoriaDescricao').value = categoria.descricao || ''
    document.getElementById('botaoCancelarCategoria').hidden = false
    document.getElementById('formCategoria').scrollIntoView()
}

function excluirCategoria(id) {
    const categoria = categoriasAdmin.find(function (item) { return item.codCategoria === id })
    if (categoria && confirm('Excluir a categoria "' + categoria.nome + '"?')) {
        requisicao('/categoria/' + categoria.codCategoria, { method: 'DELETE' })
        .then(function () {
            mostrarAviso('Categoria excluída com sucesso.', 'sucesso')
            carregarCategorias()
        })
        .catch(function (erro) {
            mostrarAviso(erro.message, 'erro')
        })
    }
}

function opcoesStatusPedido(atual) {
    return ['PENDENTE_PAGAMENTO', 'PAGO', 'ENVIADO', 'ENTREGUE', 'CANCELADO'].map(function (status) {
        return '<option value="' + status + '"' + (status === atual ? ' selected' : '') + '>' + nomeStatus(status) + '</option>'
    }).join('')
}

function renderizarPedidos(pedidos) {
    const lista = document.getElementById('listaPedidosAdmin')
    if (!pedidos.length) {
        lista.innerHTML = '<div class="mensagem mensagem-vazia">Nenhum pedido encontrado.</div>'
        return
    }

    lista.innerHTML = pedidos.map(function (pedido) {
        const cliente = pedido.usuarioPedido || {}
        const itens = (pedido.itensPedido || []).map(function (item) {
            return '<span>' + escapar(item.produtoItem ? item.produtoItem.nome : 'Produto') + ' <b>x' + item.quantidade + '</b></span>'
        }).join('')
        return '<article class="card-gestao-admin"><div class="gestao-admin-topo"><div><span class="sobretitulo">Pedido #' + pedido.codPedido + '</span><h3>' + escapar(cliente.nome || 'Cliente não identificado') + '</h3><p>' + escapar(cliente.email || '') + ' · ' + formatarData(pedido.dataPedido) + '</p></div><strong>' + formatarMoeda(pedido.valorTotal) + '</strong></div>' +
            '<div class="resumo-itens-admin">' + (itens || '<span>Sem itens</span>') + '</div>' +
            '<div class="gestao-admin-acoes"><label>Status<select id="statusPedido' + pedido.codPedido + '" class="status-pedido-admin">' + opcoesStatusPedido(pedido.status) + '</select></label>' +
            '<button class="botao botao-primario botao-menor" onclick="atualizarStatusPedido(' + pedido.codPedido + ')" type="button">Atualizar status</button>' +
            '<button class="botao-texto perigo" onclick="excluirPedido(' + pedido.codPedido + ')" type="button">Excluir pedido</button></div></article>'
    }).join('')
}

function carregarPedidos() {
    const status = document.getElementById('filtroStatusPedido').value
    return requisicao('/pedidos' + (status ? '?status=' + status : ''))
    .then(function (pedidos) {
        renderizarPedidos(pedidos)
    })
}

function atualizarStatusPedido(id) {
    const status = document.getElementById('statusPedido' + id).value
    requisicao('/pedido/' + id, { method: 'PUT', body: JSON.stringify({ status: status }) })
    .then(function () {
        mostrarAviso('Status do pedido atualizado com sucesso.', 'sucesso')
        carregarPedidos()
        carregarResumo()
    })
    .catch(function (erro) {
        mostrarAviso(erro.message, 'erro')
    })
}

function excluirPedido(id) {
    if (!confirm('Excluir definitivamente este pedido? O estoque será restaurado quando necessário.')) return

    requisicao('/pedido/' + id, { method: 'DELETE' })
    .then(function () {
        mostrarAviso('Pedido excluído com sucesso.', 'sucesso')
        carregarPedidos()
        carregarResumo()
    })
    .catch(function (erro) {
        mostrarAviso(erro.message, 'erro')
    })
}

function opcoesStatusEntrega(atual) {
    return ['AGUARDANDO', 'EM_TRANSITO', 'SAIU_PARA_ENTREGA', 'ENTREGUE', 'EXTRAVIADO'].map(function (status) {
        return '<option value="' + status + '"' + (status === atual ? ' selected' : '') + '>' + nomeStatus(status) + '</option>'
    }).join('')
}

function renderizarEntregas(entregas) {
    const lista = document.getElementById('listaEntregasAdmin')
    if (!entregas.length) {
        lista.innerHTML = '<div class="mensagem mensagem-vazia">Nenhuma entrega cadastrada.</div>'
        return
    }
    lista.innerHTML = entregas.map(function (entrega) {
        const endereco = entrega.tipo === 'RETIRADA' ? 'Retirada na loja' : [entrega.logradouro || entrega.endereco, entrega.numero, entrega.bairro, entrega.localidade, entrega.uf].filter(Boolean).join(', ')
        return '<article class="card-gestao-admin"><div class="gestao-admin-topo"><div><span class="sobretitulo">Entrega #' + entrega.codEntrega + ' · Pedido #' + entrega.idPedido + '</span><h3>' + escapar(entrega.tipo === 'RETIRADA' ? 'Retirada' : 'Entrega') + '</h3><p>' + escapar(endereco || 'Endereço não informado') + '</p></div><span class="' + classeStatus(entrega.status) + '">' + nomeStatus(entrega.status) + '</span></div>' +
            '<div class="form-entrega-admin"><label>Status<select id="statusEntrega' + entrega.codEntrega + '" class="status-entrega-admin">' + opcoesStatusEntrega(entrega.status) + '</select></label>' +
            '<label>Rastreio<input id="rastreioEntrega' + entrega.codEntrega + '" class="rastreio-entrega-admin" maxlength="50" value="' + escapar(entrega.codigoRastreio || '') + '" placeholder="Opcional"></label>' +
            '<label>Previsão<input id="previsaoEntrega' + entrega.codEntrega + '" class="previsao-entrega-admin" type="date" value="' + escapar(entrega.previsao || '') + '"></label>' +
            '<button class="botao botao-primario botao-menor" onclick="salvarEntrega(' + entrega.codEntrega + ')" type="button">Salvar entrega</button></div></article>'
    }).join('')
}

function carregarEntregas() {
    return requisicao('/entregas').then(function (entregas) {
        renderizarEntregas(entregas)
    })
}

function salvarEntrega(id) {
    const dados = {
        status: document.getElementById('statusEntrega' + id).value,
        codigoRastreio: document.getElementById('rastreioEntrega' + id).value.trim() || null,
        previsao: document.getElementById('previsaoEntrega' + id).value || null
    }
    requisicao('/entrega/' + id, { method: 'PUT', body: JSON.stringify(dados) })
    .then(function () {
        mostrarAviso('Entrega atualizada com sucesso.', 'sucesso')
        carregarEntregas()
    })
    .catch(function (erro) {
        mostrarAviso(erro.message, 'erro')
    })
}

function renderizarUsuarios(usuarios) {
    const corpo = document.getElementById('corpoTabelaUsuarios')
    if (!usuarios.length) {
        corpo.innerHTML = '<tr><td colspan="5" class="estado-tabela">Nenhum usuário cadastrado.</td></tr>'
        return
    }
    corpo.innerHTML = usuarios.map(function (usuario) {
        return '<tr><td data-label="Nome"><strong>' + escapar(usuario.nome) + '</strong></td><td data-label="Contato">' + escapar(usuario.email) + '<small>' + escapar(usuario.telefone) + '</small></td>' +
            '<td data-label="CPF">' + escapar(usuario.cpf) + '</td><td data-label="Cidade">' + escapar(usuario.cidade + '/' + usuario.uf) + '</td>' +
            '<td data-label="Tipo"><span class="selo-status ' + (usuario.tipo === 'ADMIN' ? 'administrador' : 'cliente') + '">' + escapar(usuario.tipo) + '</span></td></tr>'
    }).join('')
}

function carregarUsuarios() {
    return requisicao('/usuarios').then(function (usuarios) {
        renderizarUsuarios(usuarios)
        usuariosCarregados = true
    })
}

function trocarSecao(nome) {
    const nomes = ['veiculos', 'categorias', 'pedidos', 'entregas', 'usuarios']
    if (!nomes.includes(nome)) nome = 'veiculos'

    document.getElementById('abaVeiculos').classList.remove('ativo')
    document.getElementById('abaCategorias').classList.remove('ativo')
    document.getElementById('abaPedidos').classList.remove('ativo')
    document.getElementById('abaEntregas').classList.remove('ativo')
    document.getElementById('abaUsuarios').classList.remove('ativo')

    const nomesAbas = {
        veiculos: 'abaVeiculos',
        categorias: 'abaCategorias',
        pedidos: 'abaPedidos',
        entregas: 'abaEntregas',
        usuarios: 'abaUsuarios'
    }
    document.getElementById(nomesAbas[nome]).classList.add('ativo')

    nomes.forEach(function (secao) {
        document.getElementById('secao-' + secao).hidden = secao !== nome
    })
    if (nome === 'categorias' && !categoriasCarregadas) carregarCategorias().catch(function (erro) { mostrarAviso(erro.message, 'erro') })
    if (nome === 'pedidos') carregarPedidos().catch(function (erro) { mostrarAviso(erro.message, 'erro') })
    if (nome === 'entregas') carregarEntregas().catch(function (erro) { mostrarAviso(erro.message, 'erro') })
    if (nome === 'usuarios' && !usuariosCarregados) carregarUsuarios().catch(function (erro) { mostrarAviso(erro.message, 'erro') })
}

function configurarEventos() {
    document.getElementById('botaoSair').addEventListener('click', sairAdmin)
    document.getElementById('abaVeiculos').addEventListener('click', function () { trocarSecao('veiculos') })
    document.getElementById('abaCategorias').addEventListener('click', function () { trocarSecao('categorias') })
    document.getElementById('abaPedidos').addEventListener('click', function () { trocarSecao('pedidos') })
    document.getElementById('abaEntregas').addEventListener('click', function () { trocarSecao('entregas') })
    document.getElementById('abaUsuarios').addEventListener('click', function () { trocarSecao('usuarios') })
    cadastrar.addEventListener('click', function () { abrirFormularioProduto(null) })
    document.getElementById('abaCadastrarProduto').addEventListener('click', function () { abrirFormularioProduto(null) })
    document.getElementById('abaListarProdutos').addEventListener('click', function () { trocarOperacaoProduto('listar') })
    document.getElementById('abaConsultarProduto').addEventListener('click', function () { trocarOperacaoProduto('consultar') })
    document.getElementById('formConsultarProduto').addEventListener('submit', consultarProduto)
    document.getElementById('botaoCancelarProduto').addEventListener('click', fecharFormularioProduto)
    formularioProduto.addEventListener('submit', salvarProduto)
    document.getElementById('formCategoria').addEventListener('submit', salvarCategoria)
    document.getElementById('botaoCancelarCategoria').addEventListener('click', limparFormularioCategoria)
    document.getElementById('filtroStatusPedido').addEventListener('change', carregarPedidos)
}

function iniciarAdmin() {
    usuarioAdmin = lerUsuarioAdmin()
    if (!tokenAdmin || !usuarioAdmin) {
        window.location.href = 'login.html?redirect=admin.html'
        return
    }
    if (usuarioAdmin.tipo !== 'ADMIN') {
        window.location.href = 'perfil.html'
        return
    }

    configurarEventos()
    document.getElementById('bloqueioAdmin').hidden = true
    document.getElementById('conteudoAdmin').hidden = false

    carregarResumo().catch(function (erro) { mostrarAviso(erro.message, 'erro') })
    carregarCategorias().catch(function (erro) { mostrarAviso(erro.message, 'erro') })
    carregarProdutos().catch(function (erro) { mostrarAviso(erro.message, 'erro') })

    trocarSecao('veiculos')
    trocarOperacaoProduto('listar')
}

iniciarAdmin()
