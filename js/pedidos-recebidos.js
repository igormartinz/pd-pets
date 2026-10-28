const CLASSE_STATUS = {
    'Aguardando pagamento': 'badge-aguardando-pagamento',
    'Pago': 'text-bg-success',
    'Entregue': 'text-bg-primary',
    'Separando': 'text-bg-warning',
    'Enviado': 'text-bg-dark',
    'Cancelado': 'text-bg-danger'
};

const PROXIMO_STATUS = {
    'Pago': 'Separando',
    'Separando': 'Enviado',
    'Enviado': 'Entregue',
};

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
        const nomesProdutos = {};
        const meusProdutos = new Set();
        for (const produto of produtos) {
            nomesProdutos[produto.id] = produto.nome;
            if (String(produto.lojistaID) === String(lojista.id)) {
                meusProdutos.add(String(produto.id)); // String(): evita falha de comparação número x texto
            }
        }

        // Mapa id -> nome do cliente
        const nomesClientes = {};
        for (const usuario of usuarios) {
            nomesClientes[usuario.id] = usuario.nomeCompleto;
        }

        const pedidosRecebidos = pedidos.filter(pedido => meusProdutos.has(String(pedido.produtoID)));

        if (pedidosRecebidos.length === 0) {
            container.innerHTML = '<p class="text-center w-100">Você ainda não recebeu nenhum pedido.</p>';
            return;
        }

        // Mais recentes primeiro (data); empate decidido pelo id
        pedidosRecebidos.sort((a, b) => b.data.localeCompare(a.data) || Number(b.id) - Number(a.id));

        container.innerHTML = '';
        for (const pedido of pedidosRecebidos) {
            container.insertAdjacentHTML('beforeend', montarCardPedidoRecebido(
                pedido,
                nomesClientes[pedido.clienteID] ?? 'Cliente não encontrado',
                nomesProdutos[pedido.produtoID] ?? 'Produto não encontrado'
            ));
        }

    } catch (erro) {
        console.error(erro);
        container.innerHTML = '<p class="text-center w-100">Não foi possível carregar os pedidos recebidos. Tente novamente mais tarde.</p>';
    }
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

document.addEventListener('DOMContentLoaded', carregarPedidosRecebidos);