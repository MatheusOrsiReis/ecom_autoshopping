const API_URL = 'http://localhost:3000'
const tokenAdmin = localStorage.getItem('autoshopping_token')
let usuarioAdmin = null
let produtosAdmin = []
let categoriasAdmin = []
let produtoEmEdicao = null
let categoriaEmEdicao = null
const secoesCarregadas = new Set()

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

async function requisicao(caminho, opcoes) {
    const configuracao = opcoes || {}
    configuracao.headers = Object.assign({}, configuracao.headers, { Authorization: 'Bearer ' + tokenAdmin })
    if (configuracao.body) configuracao.headers['Content-Type'] = 'application/json'

    let resposta
    try {
        resposta = await fetch(API_URL + caminho, configuracao)
    } catch (erro) {
        throw new Error('Backend indisponível. Verifique se o servidor está ligado.')
    }

    if (resposta.status === 401) {
        sairAdmin()
        throw new Error('Sua sessão expirou.')
    }

    const conteudo = await resposta.json().catch(function () { return {} })
    if (!resposta.ok) throw new Error(conteudo.message || 'Não foi possível concluir a operação.')
    return conteudo
}

function mostrarAviso(texto, tipo) {
    const aviso = document.getElementById('mensagemAdmin')
    aviso.hidden = !texto
    aviso.className = 'aviso-admin ' + (tipo || '')
    aviso.textContent = texto || ''
}

function mostrarMensagemFormulario(id, texto, tipo) {
    const elemento = document.getElementById(id)
    elemento.className = 'mensagem-formulario campo-largo ' + (tipo || '')
    elemento.textContent = texto || ''
}

async function carregarResumo() {
    const resumo = await requisicao('/relatorio/resumo')
    document.getElementById('resumoProdutos').textContent = resumo.totalProdutos
    document.getElementById('resumoDisponiveis').textContent = resumo.produtosDisponiveis
    document.getElementById('resumoPedidos').textContent = resumo.totalPedidos
    document.getElementById('resumoFaturamento').textContent = formatarMoeda(resumo.faturamento)
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
            '<div class="acoes-linha"><button class="botao-texto editar-categoria" data-id="' + categoria.codCategoria + '" type="button">Editar</button>' +
            '<button class="botao-texto perigo excluir-categoria" data-id="' + categoria.codCategoria + '" type="button">Excluir</button></div></article>'
    }).join('')
}

async function carregarCategorias() {
    categoriasAdmin = await requisicao('/categorias')
    preencherSelectCategorias()
    renderizarCategorias()
    secoesCarregadas.add('categorias')
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
            '<td data-label="Ações"><div class="acoes-tabela"><button class="botao-texto editar-produto" data-id="' + produto.codProduto + '" type="button">Editar</button>' +
            '<button class="botao-texto alternar-produto" data-id="' + produto.codProduto + '" type="button">' + (produto.ativo ? 'Desativar' : 'Ativar') + '</button>' +
            '<button class="botao-texto perigo excluir-produto" data-id="' + produto.codProduto + '" type="button">Excluir</button></div></td></tr>'
    }).join('')
}

async function carregarProdutos() {
    produtosAdmin = await requisicao('/produtos')
    renderizarProdutos()
    secoesCarregadas.add('veiculos')
}

function abrirFormularioProduto(produto) {
    if (!categoriasAdmin.length) {
        mostrarAviso('Cadastre pelo menos uma categoria antes de adicionar um veículo.', 'erro')
        trocarSecao('categorias')
        document.getElementById('categoriaNome').focus()
        return
    }
    produtoEmEdicao = produto || null
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
    document.getElementById('formProduto').hidden = true
    document.getElementById('formProduto').reset()
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

async function salvarProduto(evento) {
    evento.preventDefault()
    const botao = document.getElementById('botaoSalvarProduto')
    const dados = dadosFormularioProduto()
    botao.disabled = true
    botao.textContent = 'Salvando...'
    mostrarMensagemFormulario('mensagemProduto', '', '')

    try {
        if (produtoEmEdicao) {
            const quantidade = dados.quantidadeEstoque
            delete dados.quantidadeEstoque
            await requisicao('/produto/' + produtoEmEdicao.codProduto, { method: 'PUT', body: JSON.stringify(dados) })
            if (produtoEmEdicao.estoqueProduto) {
                await requisicao('/estoque/' + produtoEmEdicao.estoqueProduto.codEstoque, { method: 'PUT', body: JSON.stringify({ quantidade: quantidade }) })
            } else {
                await requisicao('/estoque', { method: 'POST', body: JSON.stringify({ idProduto: produtoEmEdicao.codProduto, quantidade: quantidade }) })
            }
            mostrarAviso('Veículo atualizado com sucesso!', 'sucesso')
        } else {
            await requisicao('/produto', { method: 'POST', body: JSON.stringify(dados) })
            mostrarAviso('Veículo cadastrado com sucesso!', 'sucesso')
        }
        fecharFormularioProduto()
        await Promise.all([carregarProdutos(), carregarResumo()])
    } catch (erro) {
        mostrarMensagemFormulario('mensagemProduto', erro.message, 'erro')
    } finally {
        botao.disabled = false
        botao.textContent = 'Salvar veículo'
    }
}

async function acaoTabelaProdutos(evento) {
    const botao = evento.target.closest('button[data-id]')
    if (!botao) return
    const produto = produtosAdmin.find(function (item) { return item.codProduto === Number(botao.dataset.id) })
    if (!produto) return

    if (botao.classList.contains('editar-produto')) return abrirFormularioProduto(produto)

    try {
        if (botao.classList.contains('alternar-produto')) {
            await requisicao('/produto/' + produto.codProduto, { method: 'PUT', body: JSON.stringify({ ativo: !produto.ativo }) })
            mostrarAviso('Status do veículo atualizado.', 'sucesso')
        } else if (botao.classList.contains('excluir-produto')) {
            if (!confirm('Excluir definitivamente o veículo "' + produto.nome + '"?')) return
            await requisicao('/produto/' + produto.codProduto, { method: 'DELETE' })
            mostrarAviso('Veículo excluído com sucesso.', 'sucesso')
        }
        await Promise.all([carregarProdutos(), carregarResumo()])
    } catch (erro) {
        mostrarAviso(erro.message, 'erro')
    }
}

function limparFormularioCategoria() {
    categoriaEmEdicao = null
    document.getElementById('formCategoria').reset()
    document.getElementById('tituloFormCategoria').textContent = 'Nova categoria'
    document.getElementById('botaoCancelarCategoria').hidden = true
    mostrarMensagemFormulario('mensagemCategoria', '', '')
}

async function salvarCategoria(evento) {
    evento.preventDefault()
    const botao = document.getElementById('botaoSalvarCategoria')
    const dados = { nome: document.getElementById('categoriaNome').value.trim(), descricao: document.getElementById('categoriaDescricao').value.trim() || null }
    botao.disabled = true
    try {
        const caminho = categoriaEmEdicao ? '/categoria/' + categoriaEmEdicao.codCategoria : '/categoria'
        await requisicao(caminho, { method: categoriaEmEdicao ? 'PUT' : 'POST', body: JSON.stringify(dados) })
        mostrarAviso(categoriaEmEdicao ? 'Categoria atualizada com sucesso!' : 'Categoria cadastrada com sucesso!', 'sucesso')
        limparFormularioCategoria()
        await carregarCategorias()
    } catch (erro) {
        mostrarMensagemFormulario('mensagemCategoria', erro.message, 'erro')
    } finally {
        botao.disabled = false
    }
}

async function acaoListaCategorias(evento) {
    const botao = evento.target.closest('button[data-id]')
    if (!botao) return
    const categoria = categoriasAdmin.find(function (item) { return item.codCategoria === Number(botao.dataset.id) })
    if (!categoria) return

    if (botao.classList.contains('editar-categoria')) {
        categoriaEmEdicao = categoria
        document.getElementById('tituloFormCategoria').textContent = 'Editar categoria'
        document.getElementById('categoriaNome').value = categoria.nome
        document.getElementById('categoriaDescricao').value = categoria.descricao || ''
        document.getElementById('botaoCancelarCategoria').hidden = false
        document.getElementById('formCategoria').scrollIntoView({ behavior: 'smooth' })
        return
    }

    if (botao.classList.contains('excluir-categoria') && confirm('Excluir a categoria "' + categoria.nome + '"?')) {
        try {
            await requisicao('/categoria/' + categoria.codCategoria, { method: 'DELETE' })
            mostrarAviso('Categoria excluída com sucesso.', 'sucesso')
            await carregarCategorias()
        } catch (erro) {
            mostrarAviso(erro.message, 'erro')
        }
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
            '<div class="gestao-admin-acoes"><label>Status<select class="status-pedido-admin">' + opcoesStatusPedido(pedido.status) + '</select></label>' +
            '<button class="botao botao-primario botao-menor salvar-status-pedido" data-id="' + pedido.codPedido + '" type="button">Atualizar status</button>' +
            '<button class="botao-texto perigo excluir-pedido" data-id="' + pedido.codPedido + '" type="button">Excluir pedido</button></div></article>'
    }).join('')
}

async function carregarPedidos() {
    const status = document.getElementById('filtroStatusPedido').value
    const pedidos = await requisicao('/pedidos' + (status ? '?status=' + encodeURIComponent(status) : ''))
    renderizarPedidos(pedidos)
    secoesCarregadas.add('pedidos')
}

async function acaoListaPedidos(evento) {
    const botao = evento.target.closest('button[data-id]')
    if (!botao) return
    try {
        if (botao.classList.contains('salvar-status-pedido')) {
            const status = botao.closest('.gestao-admin-acoes').querySelector('.status-pedido-admin').value
            await requisicao('/pedido/' + botao.dataset.id, { method: 'PUT', body: JSON.stringify({ status: status }) })
            mostrarAviso('Status do pedido atualizado com sucesso.', 'sucesso')
        } else if (botao.classList.contains('excluir-pedido')) {
            if (!confirm('Excluir definitivamente este pedido? O estoque será restaurado quando necessário.')) return
            await requisicao('/pedido/' + botao.dataset.id, { method: 'DELETE' })
            mostrarAviso('Pedido excluído com sucesso.', 'sucesso')
        }
        await Promise.all([carregarPedidos(), carregarResumo()])
    } catch (erro) {
        mostrarAviso(erro.message, 'erro')
    }
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
            '<div class="form-entrega-admin"><label>Status<select class="status-entrega-admin">' + opcoesStatusEntrega(entrega.status) + '</select></label>' +
            '<label>Rastreio<input class="rastreio-entrega-admin" maxlength="50" value="' + escapar(entrega.codigoRastreio || '') + '" placeholder="Opcional"></label>' +
            '<label>Previsão<input class="previsao-entrega-admin" type="date" value="' + escapar(entrega.previsao || '') + '"></label>' +
            '<button class="botao botao-primario botao-menor salvar-entrega" data-id="' + entrega.codEntrega + '" type="button">Salvar entrega</button></div></article>'
    }).join('')
}

async function carregarEntregas() {
    const entregas = await requisicao('/entregas')
    renderizarEntregas(entregas)
    secoesCarregadas.add('entregas')
}

async function acaoListaEntregas(evento) {
    const botao = evento.target.closest('.salvar-entrega')
    if (!botao) return
    const linha = botao.closest('.form-entrega-admin')
    const dados = {
        status: linha.querySelector('.status-entrega-admin').value,
        codigoRastreio: linha.querySelector('.rastreio-entrega-admin').value.trim() || null,
        previsao: linha.querySelector('.previsao-entrega-admin').value || null
    }
    try {
        await requisicao('/entrega/' + botao.dataset.id, { method: 'PUT', body: JSON.stringify(dados) })
        mostrarAviso('Entrega atualizada com sucesso.', 'sucesso')
        await carregarEntregas()
    } catch (erro) {
        mostrarAviso(erro.message, 'erro')
    }
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

async function carregarUsuarios() {
    renderizarUsuarios(await requisicao('/usuarios'))
    secoesCarregadas.add('usuarios')
}

async function trocarSecao(nome) {
    const nomes = ['veiculos', 'categorias', 'pedidos', 'entregas', 'usuarios']
    if (!nomes.includes(nome)) nome = 'veiculos'
    document.querySelectorAll('.aba-admin').forEach(function (aba) { aba.classList.toggle('ativo', aba.dataset.secao === nome) })
    nomes.forEach(function (secao) { document.getElementById('secao-' + secao).hidden = secao !== nome })
    history.replaceState(null, '', '#' + nome)

    try {
        if (nome === 'categorias' && !secoesCarregadas.has(nome)) await carregarCategorias()
        if (nome === 'pedidos') await carregarPedidos()
        if (nome === 'entregas') await carregarEntregas()
        if (nome === 'usuarios' && !secoesCarregadas.has(nome)) await carregarUsuarios()
    } catch (erro) {
        mostrarAviso(erro.message, 'erro')
    }
}

function configurarEventos() {
    document.getElementById('botaoSair').addEventListener('click', sairAdmin)
    document.querySelector('.abas-admin').addEventListener('click', function (evento) {
        const aba = evento.target.closest('.aba-admin')
        if (aba) trocarSecao(aba.dataset.secao)
    })
    document.getElementById('botaoNovoProduto').addEventListener('click', function () { abrirFormularioProduto(null) })
    document.getElementById('botaoCancelarProduto').addEventListener('click', fecharFormularioProduto)
    document.getElementById('formProduto').addEventListener('submit', salvarProduto)
    document.getElementById('corpoTabelaProdutos').addEventListener('click', acaoTabelaProdutos)
    document.getElementById('formCategoria').addEventListener('submit', salvarCategoria)
    document.getElementById('botaoCancelarCategoria').addEventListener('click', limparFormularioCategoria)
    document.getElementById('listaCategoriasAdmin').addEventListener('click', acaoListaCategorias)
    document.getElementById('filtroStatusPedido').addEventListener('change', carregarPedidos)
    document.getElementById('listaPedidosAdmin').addEventListener('click', acaoListaPedidos)
    document.getElementById('listaEntregasAdmin').addEventListener('click', acaoListaEntregas)
}

async function iniciarAdmin() {
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

    try {
        await Promise.all([carregarResumo(), carregarCategorias(), carregarProdutos()])
        const inicial = window.location.hash.replace('#', '') || 'veiculos'
        await trocarSecao(inicial)
    } catch (erro) {
        mostrarAviso(erro.message, 'erro')
    }
}

iniciarAdmin()
