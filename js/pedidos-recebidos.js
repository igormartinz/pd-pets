import { mostrarToast } from "./toast.js";

const PROXIMO_STATUS = {
    'Pago': 'Separando',
    'Separando': 'Enviado',
    'Enviado': 'Entregue',
};

// Ordem de exibição dos pedidos.
const ORDEM_STATUS = ['Pago', 'Separando', 'Enviado', 'Entregue', 'Aguardando pagamento', 'Cancelado'];

const PEDIDOS_POR_PAGINA = 6;

let paginaAtual = 1;
let pedidosRecebidos = [];
let nomesClientes = {};
let nomesProdutos = {};
let statusFiltrado = null;

function formatarMoeda(valor) {
    return Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// "Aguardando pagamento" -> "aguardando-pagamento" (classe CSS do status)
function classeStatus(status) {
    return status
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/\s+/g, '-');
}

// "2026-08-28" -> "28/08/2026"
function formatarData(data) {
    if (!data) return '—';
    const [ano, mes, dia] = data.split('-');
    return `${dia}/${mes}/${ano}`;
}

async function carregarPedidosRecebidos() {
    const container = document.getElementById('lista-pedidos-recebidos');
    container.innerHTML = '<p class="w-100">Carregando...</p>';

    try {
        const lojista = pegarUsuarioLogado();
        if (!lojista) return;

        const [respostaPedidos, respostaProdutos, respostaUsuarios] = await Promise.all([
            fetch('https://6a98614f7160beda2292eff8.mockapi.io/pedidos'),
            fetch('https://6a98614f7160beda2292eff8.mockapi.io/produtos'),
            fetch('https://6aaac6cdff4dd5698b4f060c.mockapi.io/usuarios')
        ]);

        if (!respostaPedidos.ok || !respostaProdutos.ok || !respostaUsuarios.ok) {
            throw new Error('Falha ao buscar pedidos, produtos ou usuários');
        }

        const pedidos = await respostaPedidos.json();
        const produtos = await respostaProdutos.json();
        const usuarios = await respostaUsuarios.json();

        // Nomes dos produtos e conjunto com os ids dos produtos do lojista logado
        const meusProdutos = new Set();
        for (const produto of produtos) {
            nomesProdutos[produto.id] = produto.nome;
            if (String(produto.lojistaID) === String(lojista.id)) {
                meusProdutos.add(String(produto.id)); // String(): evita falha de comparação número x texto
            }
        }

        // Mapa id -> nome do cliente
        for (const usuario of usuarios) {
            nomesClientes[usuario.id] = usuario.nomeCompleto;
        }

        pedidosRecebidos = pedidos.filter(pedido => meusProdutos.has(String(pedido.produtoID)));

        renderizarPedidosRecebidos();

    } catch (erro) {
        console.error(erro);
        container.style.display = 'flex';
        container.innerHTML = '<p class="text-center w-100">Não foi possível carregar os pedidos recebidos. Tente novamente mais tarde.</p>';
    }
}

// Ordena e desenha a página atual. Também é chamada depois de cada mudança de status.
function renderizarPedidosRecebidos(rolar = false) {
    const container = document.getElementById('lista-pedidos-recebidos');

    if (pedidosRecebidos.length === 0) {
        container.style.display = 'flex';
        container.innerHTML = '<p class="text-center w-100">Você ainda não recebeu nenhum pedido.</p>';
        renderizarPaginacao(0); // limpa a paginação
        return;
    }

    // Aplica o filtro de status (null = todos)
    const pedidosFiltrados = statusFiltrado ? pedidosRecebidos.filter(pedido => classeStatus(pedido.status) === statusFiltrado) : pedidosRecebidos;

    if (pedidosFiltrados.length === 0) {
        container.style.display = 'flex';
        container.innerHTML = '<p class="text-center w-100">Nenhum pedido encontrado com esse status.</p>';
        renderizarPaginacao(0);
        return;
    }

    container.style.display = 'grid';

    // Por status, na ordem definida; dentro do mesmo status, mais recentes primeiro
    pedidosFiltrados.sort((a, b) =>
        posicaoStatus(a.status) - posicaoStatus(b.status)
        || b.data.localeCompare(a.data)
        || Number(b.id) - Number(a.id)
    );

    // Garante que a página atual existe (o filtro pode ter reduzido o total)
    const totalPaginas = Math.ceil(pedidosFiltrados.length / PEDIDOS_POR_PAGINA);
    paginaAtual = Math.min(paginaAtual, totalPaginas);

    const inicio = (paginaAtual - 1) * PEDIDOS_POR_PAGINA;
    const pedidosDaPagina = pedidosFiltrados.slice(inicio, inicio + PEDIDOS_POR_PAGINA);

    container.innerHTML = '';
    for (const pedido of pedidosDaPagina) {
        container.insertAdjacentHTML('beforeend', montarCardPedidoRecebido(
            pedido,
            nomesClientes[pedido.clienteID] ?? 'Cliente não encontrado',
            nomesProdutos[pedido.produtoID] ?? 'Produto não encontrado'
        ));
    }

    renderizarPaginacao(totalPaginas);

    // volta ao topo da lista ao trocar de página
    if (rolar) container.scrollIntoView({ behavior: 'smooth' });
}

// Posição do status na ordem
function posicaoStatus(status) {
    const posicao = ORDEM_STATUS.indexOf(status);
    return posicao === -1 ? ORDEM_STATUS.length : posicao;
}

function montarCardPedidoRecebido(pedido, nomeCliente, nomeProduto) {
    // O botão mostra o próximo status e só existe quando há um próximo passo
    const proximoStatus = PROXIMO_STATUS[pedido.status];
    const botaoStatus = proximoStatus ? `
                    <div class="container-btns-pedidos-lojista">
                        <a class="btn-alterar-status" id="btnAlterarStatus" data-pedido-id="${pedido.id}" data-proximo-status="${proximoStatus}">Alterar status para ${proximoStatus}</a>
                    </div>` : '';

    return `
            <div class="container-pedidos-info">
                <div class="header-pedidos-info">
                    <div class="Id-data-pedidos-info">
                        <p class="id-pedido">#${pedido.id}</p>
                        <p class="txt-data-pedido">Realizado em
                            <span class="data-pedido">${formatarData(pedido.data)}</span>
                        </p>
                    </div>
                    <span class="${classeStatus(pedido.status)}">${pedido.status}</span>
                </div>

                <div class="container-central-pedidos-info">
                    <div class="box-pedidos-info">
                        <h2 id="tituloCliente">${nomeCliente}</h2>
                        <p id="nomeProduto">${nomeProduto}</p>
                        <div class="container-valor-quantidade">
                            <div class="valor-produto">
                                <p>Valor</p>
                                <span id="valorProduto">${formatarMoeda(pedido.valor)}</span>
                            </div>

                            <div class="quantidade-produto">
                                <p>Quantidade</p>
                                <span id="quantidadeProduto">${pedido.quantidade}</span>
                            </div>
                        </div>
                    </div>
                    ${botaoStatus}
                </div>
            </div>
    `;
}

// Um único listener no container cobre todos os botões, inclusive os recriados a cada renderização
function conectarAlteracaoDeStatus() {
    document.getElementById('lista-pedidos-recebidos').addEventListener('click', function (evento) {
        const botao = evento.target.closest('.btn-alterar-status');
        if (!botao) return;

        evento.preventDefault();
        alterarStatus(botao.dataset.pedidoId, botao.dataset.proximoStatus);
    });
}

async function alterarStatus(idPedido, proximoStatus) {
    const pedidoLocal = pedidosRecebidos.find(pedido => String(pedido.id) === String(idPedido));
    if (!pedidoLocal) return;

    try {
        const resposta = await fetch(`https://6a98614f7160beda2292eff8.mockapi.io/pedidos/${pedidoLocal.id}`);
        if (!resposta.ok) throw new Error('Falha ao consultar o pedido');

        const pedidoAtual = await resposta.json();

        // Só avança se o próximo status do status ATUAL for o que o botão pediu.
        // Assim o pedido nunca volta nem pula etapa, mesmo com a tela desatualizada
        if (PROXIMO_STATUS[pedidoAtual.status] !== proximoStatus) {
            pedidoLocal.status = pedidoAtual.status;
            renderizarPedidosRecebidos();
            mostrarToast('Status desatualizado', 'O status deste pedido mudou. A lista foi atualizada.', 'aviso');
            return;
        }

        const respostaAtualizacao = await fetch(`https://6a98614f7160beda2292eff8.mockapi.io/pedidos/${pedidoLocal.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: proximoStatus })
        });
        if (!respostaAtualizacao.ok) throw new Error('Falha ao atualizar o status');

        pedidoLocal.status = proximoStatus;
        renderizarPedidosRecebidos(); // O card muda de posição, pois a lista é ordenada por status
        mostrarToast('Status atualizado', `Pedido #${pedidoLocal.id} atualizado para ${proximoStatus}.`, 'sucesso');

    } catch (erro) {
        console.error(erro);
        mostrarToast('Erro', 'Não foi possível alterar o status do pedido. Tente novamente.', 'erro');
    }
}

// Troca de página pelo clique do usuário
function irParaPagina(pagina) {
    paginaAtual = pagina;
    renderizarPedidosRecebidos(true);
}

function renderizarPaginacao(totalPaginas) {
    const paginacao = document.getElementById('paginacao');
    paginacao.innerHTML = '';

    if (totalPaginas <= 1) return; // não mostra paginação se tudo cabe numa página só

    paginacao.appendChild(criarSeta('left', paginaAtual - 1, paginaAtual === 1, 'Previous'));
    for (let pagina = 1; pagina <= totalPaginas; pagina++) {
        paginacao.appendChild(criarNumero(pagina, pagina === paginaAtual));
    }
    paginacao.appendChild(criarSeta('right', paginaAtual + 1, paginaAtual === totalPaginas, 'Next'));
}

function criarSeta(direcao, pagina, desabilitado, aria) {
    const item = document.createElement('li');

    const link = document.createElement('a');
    link.className = 'page-link paginacao-seta';
    link.href = '#';
    link.setAttribute('aria-label', aria);
    link.innerHTML = `<span aria-hidden="true"><i class="ti ti-chevron-compact-${direcao}"></i></span>`;

    link.addEventListener('click', function (evento) {
        evento.preventDefault();
        if (!desabilitado) irParaPagina(pagina);
    });

    item.appendChild(link);
    return item;
}

function criarNumero(pagina, ativo) {
    const item = document.createElement('li');
    item.className = `page-item ${ativo ? 'ativo' : ''}`;

    const link = document.createElement('a');
    link.className = `page-link paginacao-numeracao ${ativo ? 'link-ativo' : ''}`;
    link.href = '#';
    link.textContent = pagina;

    link.addEventListener('click', function (evento) {
        evento.preventDefault();
        irParaPagina(pagina);
    });

    item.appendChild(link);
    return item;
}

function conectarFiltroDeStatus() {
    const itens = document.querySelectorAll('[data-ordenar]');

    for (const item of itens) {
        item.addEventListener('click', function () {
            // Minúsculas dos dois lados: "Separando" e "separando" passam a ser iguais
            const status = this.dataset.ordenar.toLowerCase();

            // Clicar no filtro que já está ativo (ou em "todos") limpa o filtro
            statusFiltrado = (status === 'todos' || status === statusFiltrado) ? null : status;

            // Marca visualmente o item ativo
            for (const outro of itens) {
                outro.classList.toggle('active', outro.dataset.ordenar.toLowerCase() === statusFiltrado);
            }

            paginaAtual = 1; // Todo novo filtro volta para a primeira página
            renderizarPedidosRecebidos();
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    carregarPedidosRecebidos();
    conectarAlteracaoDeStatus();
    conectarFiltroDeStatus();
});