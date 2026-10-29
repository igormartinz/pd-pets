import { mostrarToast } from "./toast.js"

const URL_PEDIDOS = 'https://6a98614f7160beda2292eff8.mockapi.io/pedidos';
const URL_PRODUTOS = 'https://6a98614f7160beda2292eff8.mockapi.io/produtos';

// Em quais status cada botão aparece
const STATUS_COM_PAGAMENTO = ['Aguardando pagamento'];
const STATUS_COM_CANCELAMENTO = ['Aguardando pagamento', 'Pago'];
const STATUS_COM_AVALIACAO = ['Entregue'];

// Páginação
const PEDIDOS_POR_PAGINA = 6;

let pedidosDoCliente = [];
let nomesProdutos = {};
let paginaAtual = 1;

// IDs dos produtos que o cliente logado já avaliou
let produtosAvaliados;

function formatarMoeda(valor) {
    return Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// "2026-08-28" -> "28/08/2026"
function formatarData(dataISO) {
    if (!dataISO) return '—';
    const [ano, mes, dia] = dataISO.split('-');
    return `${dia}/${mes}/${ano}`;
}

// "Aguardando pagamento" -> "aguardando-pagamento"
function classeStatus(status) {
    return status
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // remove acentos
        .toLowerCase()
        .replace(/\s+/g, '-');
}

// Monta o HTML de um pedido, seguindo a estrutura da página
function montarCardPedido(pedido, nomeProduto) {
    const botaoPagamento = STATUS_COM_PAGAMENTO.includes(pedido.status) ? '<button class="link-fazer-pagamento">Fazer Pagamento</button>' : '';

    const botaoCancelar = STATUS_COM_CANCELAMENTO.includes(pedido.status) ? `<button id="btnCancelar" data-pedido-id="${pedido.id}" data-bs-target="#modalCancelarPedido" data-bs-toggle="modal">Cancelar pedido</button>` : '';

    const jaAvaliado = produtosAvaliados.has(String(pedido.produtoID));
    const botaoAvaliar = STATUS_COM_AVALIACAO.includes(pedido.status) ? (jaAvaliado ? '<button id="btnAvaliar" class="btnAvaliarProduto" disabled>Avaliado</button>' : `<button id="btnAvaliar" data-pedido-id="${pedido.id}" data-produto-id="${pedido.produtoID}" data-bs-toggle="modal" data-bs-target="#modalAvaliarProduto" class="btnAvaliarProduto">Avaliar pedido</button>`)
        : '';


    return `
        <div class="container-pedidos-info">
            <div class="header-pedidos-info">
                <div class="Id-data-pedidos-info">
                    <p id="idPedido">#${pedido.id}</p>
                    <p>Realizado em
                        <span id="dataPedido">${formatarData(pedido.data)}</span>
                    </p>
                </div>

                <span id="statusProduto" class="${classeStatus(pedido.status)}">${pedido.status}</span>
            </div>

            <div class="container-central-pedidos-info">
                <h2 id="tituloProduto">${nomeProduto ?? 'Produto não encontrado'}</h2>

                <div class="container-valor-quantidade">
                    <div class="valor-produto">
                        <p>Valor:</p>
                        <span id="valorProduto">${formatarMoeda(pedido.valor)}</span>
                    </div>

                    <div class="quantidade-produto">
                        <p>Quantidade:</p>
                        <span id="quantidadeProduto">${pedido.quantidade}</span>
                    </div>
                </div>

                ${botaoPagamento}

                <div class="container-btns-pedidos-cliente">
                    ${botaoCancelar}
                    ${botaoAvaliar}
                    <a href="detalhes-do-produto.html?id=${pedido.produtoID}" id="btnVerDetalhes">Ver detalhes</a>
                </div>
            </div>
        </div>
    `;
}

// Carrega os pedidos do usuario logado
async function carregarPedidos() {
    const container = document.getElementById('lista-pedidos');
    container.innerHTML = '<p class="w-100">Carregando...</p>';

    try {
        const usuario = pegarUsuarioLogado();

        const [respostaPedidos, respostaProdutos] = await Promise.all([
            fetch(URL_PEDIDOS),
            fetch(URL_PRODUTOS)
        ]);

        if (!respostaPedidos.ok || !respostaProdutos.ok) {
            throw new Error('Falha ao buscar pedidos ou produtos');
        }

        const todosOsPedidos = await respostaPedidos.json();
        const produtos = await respostaProdutos.json();

        pedidosDoCliente = todosOsPedidos.filter(pedido => pedido.clienteID == usuario.id);

        if (pedidosDoCliente.length === 0) {
            container.style.display = 'flex';
            container.innerHTML = '<p class="text-center w-100">Você ainda não realizou um pedido. Aproveite as ofertas e faça já o seu no <a href="/pages/catalogo-de-produtos.html" class="link-catalogo">Catálogo de Produtos</a></p>';
            return;
        }

        nomesProdutos = {};
        produtosAvaliados = new Set();
        for (const produto of produtos) {
            nomesProdutos[produto.id] = produto.nome;

            const jaAvaliou = avaliacoesReais(produto).some(avaliacao => avaliacao.clienteID == usuario.id);
            if (jaAvaliou) produtosAvaliados.add(produto.id);
        }

        // Mais recentes primeiro.
        pedidosDoCliente.sort((a, b) => b.data.localeCompare(a.data) || Number(b.id) - Number(a.id));

        renderizarPagina(1);

    } catch (erro) {
        console.error(erro);
        container.style.display = 'flex';
        container.innerHTML = '<p class="text-center w-100">Não foi possível carregar seus pedidos. Tente novamente mais tarde.</p>';
    }
}

// Desenha os cards da página pedida e atualiza a paginação.
function renderizarPagina(numeroPagina, rolar = false) {
    paginaAtual = numeroPagina;

    const inicio = (numeroPagina - 1) * PEDIDOS_POR_PAGINA;
    const pedidosDaPagina = pedidosDoCliente.slice(inicio, inicio + PEDIDOS_POR_PAGINA);

    const container = document.getElementById('lista-pedidos');
    container.innerHTML = '';

    for (const pedido of pedidosDaPagina) {
        container.insertAdjacentHTML('beforeend', montarCardPedido(pedido, nomesProdutos[pedido.produtoID]));
    }

    renderizarPaginacao();

}

// Renderiza o componente de páginação
function renderizarPaginacao() {
    const totalPaginas = Math.ceil(pedidosDoCliente.length / PEDIDOS_POR_PAGINA);
    const paginacao = document.getElementById('paginacao');
    paginacao.innerHTML = '';

    if (totalPaginas <= 1) return; // não mostra paginação se tudo cabe numa página só

    paginacao.appendChild(criarSeta('left', paginaAtual - 1, paginaAtual === 1, 'Previous'));
    for (let pagina = 1; pagina <= totalPaginas; pagina++) {
        paginacao.appendChild(criarNumero(pagina, pagina === paginaAtual));
    }
    paginacao.appendChild(criarSeta('right', paginaAtual + 1, paginaAtual === totalPaginas, 'Next'));
}

/* Cria o item <li> da seta de navegação (anterior/próximo). */
function criarSeta(direcao, pagina, desabilitado, aria) {
    const item = document.createElement('li');

    const link = document.createElement('a');
    link.className = 'page-link paginacao-seta';
    link.href = '#';
    link.setAttribute('aria-label', aria);
    link.innerHTML = `<span aria-hidden="true"><i class="ti ti-chevron-compact-${direcao}"></i></span>`;

    link.addEventListener('click', function (evento) {
        evento.preventDefault();
        if (!desabilitado) renderizarPagina(pagina, true);
    });

    item.appendChild(link);
    return item;
}

/* Cria o item <li> de número de página. */
function criarNumero(pagina, ativo) {
    const item = document.createElement('li');
    item.className = `page-item ${ativo ? 'ativo' : ''}`;

    const link = document.createElement('a');
    link.className = `page-link paginacao-numeracao ${ativo ? 'link-ativo' : ''}`;
    link.href = '#';
    link.textContent = pagina;

    link.addEventListener('click', function (evento) {
        evento.preventDefault();
        renderizarPagina(pagina, true);
    });

    item.appendChild(link);
    return item;
}

let idPedidoParaCancelar = null;

// Atalho para os PUTs desta funcionalidade
function atualizarRecurso(url, dados) {
    return fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados)
    });
}

function conectarCancelamento() {
    const modalElemento = document.getElementById('modalCancelarPedido');
    const botaoConfirmar = document.getElementById('btn-confirmar-cancelamento');

    // Ao abrir, relatedTarget é o botão "Cancelar pedido" que foi clicado dele sai o id do pedido
    modalElemento.addEventListener('show.bs.modal', function (evento) {
        idPedidoParaCancelar = evento.relatedTarget?.dataset.pedidoId ?? null;
    });

    botaoConfirmar.addEventListener('click', () => cancelarPedido(modalElemento, botaoConfirmar));
}

async function cancelarPedido(modalElemento, botaoConfirmar) {
    if (!idPedidoParaCancelar) return;

    const pedidoLocal = pedidosDoCliente.find(pedido => pedido.id == idPedidoParaCancelar);
    if (!pedidoLocal) return;

    let statusParaRestaurar = null; // Só preenchido depois que o pedido foi marcado como cancelado

    try {
        // Lê o estado atual do pedido e do produto antes de alterar qualquer coisa
        const [respostaPedido, respostaProduto] = await Promise.all([
            fetch(`${URL_PEDIDOS}/${pedidoLocal.id}`),
            fetch(`${URL_PRODUTOS}/${pedidoLocal.produtoID}`)
        ]);

        if (!respostaPedido.ok || !respostaProduto.ok) {
            throw new Error('Falha ao consultar o pedido ou o produto');
        }

        const pedidoAtual = await respostaPedido.json();
        const produtoAtual = await respostaProduto.json();

        // Marca o pedido como cancelado
        const respostaCancelamento = await atualizarRecurso(
            `${URL_PEDIDOS}/${pedidoLocal.id}`,
            { status: 'Cancelado' }
        );

        if (!respostaCancelamento.ok) throw new Error('Falha ao cancelar o pedido');
        statusParaRestaurar = pedidoAtual.status;

        // Devolve a quantidade ao estoque, somando ao valor ATUAL do produto
        const novoEstoque = Number(produtoAtual.estoque) + Number(pedidoAtual.quantidade);
        const respostaEstoque = await atualizarRecurso(
            `${URL_PRODUTOS}/${pedidoAtual.produtoID}`,
            { estoque: novoEstoque }
        );
        if (!respostaEstoque.ok) throw new Error('Falha ao devolver o estoque');
        statusParaRestaurar = null;

        // Atualiza a tela sem recarregar a página
        pedidoLocal.status = 'Cancelado';
        renderizarPagina(paginaAtual);
        bootstrap.Modal.getOrCreateInstance(modalElemento).hide();
        mostrarToast('Pedido cancelado', `Pedido cancelado com sucesso.`, 'sucesso');

    } catch (erro) {
        console.error(erro);

        // O pedido chegou a ser cancelado, mas o estoque não foi devolvido: desfaz o cancelamento
        if (statusParaRestaurar) {
            try {
                await atualizarRecurso(`${URL_PEDIDOS}/${pedidoLocal.id}`, { status: statusParaRestaurar });
            } catch (erroRestauracao) {
                console.error(erroRestauracao);
            }
        }

        mostrarToast('Erro', 'Não foi possível cancelar o pedido. Tente novamente.', 'erro');
    }
}

let notaSelecionada = 0;
let produtoParaAvaliar = null; // Produto cujo modal de avaliação está aberto

// Os produtos sem avaliação guardam um item de preenchimento com data vazia.
function avaliacoesReais(produto) {
    return (produto.avaliacoesProduto ?? []).filter(avaliacao => avaliacao.data);
}

// Data de hoje no formato do MockAPI (AAAA-MM-DD), no fuso local.
function dataDeHoje() {
    const hoje = new Date();
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    const dia = String(hoje.getDate()).padStart(2, '0');
    return `${hoje.getFullYear()}-${mes}-${dia}`;
}

function conectarAvaliacao() {
    const modalElemento = document.getElementById('modalAvaliarProduto');
    const containerEstrelas = document.getElementById('avaliacao-estrelas');
    const estrelas = containerEstrelas.querySelectorAll('i');
    const campoComentario = document.getElementById('comentario');
    const botaoEnviar = document.getElementById('btn-enviar-avaliacao');

    // Pinta as estrelas até a nota informada: cheia, meia ou vazia
    function pintarEstrelas(nota) {
        estrelas.forEach(function (estrela) {
            const valor = Number(estrela.dataset.nota);

            estrela.classList.remove('ti-star', 'ti-star-filled', 'ti-star-half-filled');

            if (nota >= valor) {
                estrela.classList.add('ti-star-filled');
            } else if (nota >= valor - 0.5) {
                estrela.classList.add('ti-star-half-filled');
            } else {
                estrela.classList.add('ti-star');
            }
        });
    }

    // Metade esquerda da estrela = x,5; metade direita = x inteiro
    function notaPelaPosicao(estrela, evento) {
        const retangulo = estrela.getBoundingClientRect();
        const valor = Number(estrela.dataset.nota);
        const metadeEsquerda = evento.clientX - retangulo.left < retangulo.width / 2;
        return metadeEsquerda ? valor - 0.5 : valor;
    }

    estrelas.forEach(function (estrela) {
        // Clique: fixa a nota
        estrela.addEventListener('click', function (evento) {
            notaSelecionada = notaPelaPosicao(estrela, evento);
            pintarEstrelas(notaSelecionada);
        });

        // Movimento do mouse: prévia que acompanha a metade da estrela
        estrela.addEventListener('mousemove', function (evento) {
            pintarEstrelas(notaPelaPosicao(estrela, evento));
        });
    });

    // Ao sair do grupo, volta a mostrar a nota realmente selecionada
    containerEstrelas.addEventListener('mouseleave', function () {
        pintarEstrelas(notaSelecionada);
    });

    // Ao abrir, guarda o produto do botão clicado e limpa o que sobrou da avaliação anterior
    modalElemento.addEventListener('show.bs.modal', function (evento) {
        produtoParaAvaliar = evento.relatedTarget?.dataset.produtoId ?? null;
        notaSelecionada = 0;
        pintarEstrelas(0);
        campoComentario.value = '';
    });

    botaoEnviar.addEventListener('click', function () {
        enviarAvaliacao(modalElemento, botaoEnviar, campoComentario);
    });
}

async function enviarAvaliacao(modalElemento, botaoEnviar, campoComentario) {
    if (!produtoParaAvaliar) return;

    if (notaSelecionada === 0) {
        mostrarToast('Nota obrigatória', 'Selecione uma nota de 1 a 5 estrelas.', 'erro');
        return;
    }

    const usuario = pegarUsuarioLogado();
    if (!usuario) return;

    try {
        // Lê o produto atual: a lista da tela pode estar desatualizada
        const resposta = await fetch(`${URL_PRODUTOS}/${produtoParaAvaliar}`);
        if (!resposta.ok) throw new Error('Falha ao consultar o produto');

        const produto = await resposta.json();
        const avaliacoes = avaliacoesReais(produto); // já descarta o item de preenchimento

        // Um cliente só avalia o mesmo produto uma vez
        if (avaliacoes.some(avaliacao => String(avaliacao.clienteID) === String(usuario.id))) {
            produtosAvaliados.add(String(produto.id));
            renderizarPagina(paginaAtual);
            bootstrap.Modal.getOrCreateInstance(modalElemento).hide();
            mostrarToast('Produto já avaliado', 'Você já avaliou este produto.', 'aviso');
            return;
        }

        const proximoId = avaliacoes.reduce((maior, avaliacao) => Math.max(maior, Number(avaliacao.id)), 0) + 1;

        avaliacoes.push({
            id: proximoId,
            clienteID: Number(usuario.id),
            produtoID: Number(produto.id),
            nota: notaSelecionada,
            comentario: campoComentario.value.trim(),
            data: dataDeHoje()
        });

        const respostaAtualizacao = await atualizarRecurso(
            `${URL_PRODUTOS}/${produto.id}`,
            { avaliacoesProduto: avaliacoes }
        );
        if (!respostaAtualizacao.ok) throw new Error('Falha ao salvar a avaliação');

        // Atualiza a tela: o botão do produto passa a "Avaliado"
        produtosAvaliados.add(String(produto.id));
        renderizarPagina(paginaAtual);
        bootstrap.Modal.getOrCreateInstance(modalElemento).hide();
        mostrarToast('Avaliação enviada', 'Avaliação enviada com sucesso!', 'sucesso');

    } catch (erro) {
        console.error(erro);
        mostrarToast('Erro', 'Não foi possível enviar sua avaliação. Tente novamente.', 'erro');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    carregarPedidos();
    conectarCancelamento();
    conectarAvaliacao();
});