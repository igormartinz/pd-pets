const usuario = pegarUsuarioLogado();

const URL_PRODUTOS = 'https://6a98614f7160beda2292eff8.mockapi.io/produtos';
const URL_PEDIDOS = 'https://6a98614f7160beda2292eff8.mockapi.io/pedidos';

const IDS_DASHBOARD = [
    'dash-produtos',
    'dash-sem-estoque',
    'dash-pedidos-recebidos',
    'dash-pedidos-entregues',
    'dash-faturamento'
];

const nomeUsuarioPerfil = document.getElementById('nome-usuario-perfil');
nomeUsuarioPerfil.innerHTML = usuario.nome;

const nomeUsuario = document.getElementById('nome-usuario');
nomeUsuario.textContent = usuario.nome.split(' ').slice(0, 2).join(' ');

function formatarMoeda(valor) {
    return Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// Escreve o valor no elemento
function mostrarNumero(id, texto) {
    const elemento = document.getElementById(id);
    if (elemento) elemento.textContent = texto;
}

async function carregarDashboardLojista() {
    if (!usuario) return;

    try {
        const [respostaProdutos, respostaPedidos] = await Promise.all([
            fetch(URL_PRODUTOS),
            fetch(URL_PEDIDOS)
        ]);

        if (!respostaProdutos.ok || !respostaPedidos.ok) {
            throw new Error('Falha ao buscar produtos ou pedidos');
        }

        const produtos = await respostaProdutos.json();
        const pedidos = await respostaPedidos.json();

        // Produtos do lojista logado
        const meusProdutos = produtos.filter(
            produto => String(produto.lojistaID) === String(usuario.id)
        );

        // Preenche o relatório de vendas
        renderizarRelatorioVendas(produtos, pedidos);

        const idsMeusProdutos = new Set(meusProdutos.map(produto => String(produto.id)));

        const semEstoque = meusProdutos.filter(produto => Number(produto.estoque) === 0).length;

        // Pedidos com itens do lojista
        let pedidosRecebidos = 0;
        let pedidosEntregues = 0;
        let faturamento = 0;

        for (const pedido of pedidos) {
            const itensDoLojista = (pedido.itens ?? []).filter(
                item => idsMeusProdutos.has(String(item.produtoID))
            );
            if (itensDoLojista.length === 0) continue; // Nenhum produto deste lojista no pedido

            pedidosRecebidos++;

            if (pedido.status === 'Entregue') {
                pedidosEntregues++;

                // Só o que o lojista vendeu, e não o valor total do pedido
                faturamento += itensDoLojista.reduce(
                    (soma, item) => soma + Number(item.quantidade) * Number(item.valorUnitario), 0
                );
            }
        }

        mostrarNumero('dash-produtos', meusProdutos.length);
        mostrarNumero('dash-sem-estoque', semEstoque);
        mostrarNumero('dash-pedidos-recebidos', pedidosRecebidos);
        mostrarNumero('dash-pedidos-entregues', pedidosEntregues);
        mostrarNumero('dash-faturamento', formatarMoeda(faturamento));

    } catch (erro) {
        console.error(erro);
        mostrarToast('Erro', 'Não foi possível carregar o dashboard. Tente novamente.', 'erro');
    }
}

function renderizarRelatorioVendas(produtos, pedidos) {
    const tabela = document.getElementById('tabela-relatorio-vendas');

    if (!tabela) return;

    // Produtos pertencentes ao lojista
    const meusProdutos = produtos.filter(
        produto => String(produto.lojistaID) === String(usuario.id)
    );

    // Mapa para consultar os produtos pelo ID
    const mapaProdutos = new Map(
        meusProdutos.map(produto => [String(produto.id), produto])
    );

    // Pedidos entregues que possuem produtos do lojista
    const pedidosEntregues = pedidos.filter(pedido =>
        pedido.status === 'Entregue' && (pedido.itens ?? []).some(item => mapaProdutos.has(String(item.produtoID)))
    );

    // Quantidade total de pedidos entregues
    const totalPedidosEntregues = pedidosEntregues.length;

    // Agrupa as vendas por produto
    const vendasPorProduto = new Map();

    for (const pedido of pedidosEntregues) {
        for (const item of pedido.itens ?? []) {
            const produtoID = String(item.produtoID);
            const produto = mapaProdutos.get(produtoID);

            if (!produto) continue;

            const quantidade = Number(item.quantidade) || 0;
            const valorUnitario = Number(item.valorUnitario) || 0;
            const valorTotal = quantidade * valorUnitario;

            if (!vendasPorProduto.has(produtoID)) {
                vendasPorProduto.set(produtoID, {
                    produto,
                    quantidadeVendida: 0,
                    valorTotal: 0
                });
            }

            const venda = vendasPorProduto.get(produtoID);

            venda.quantidadeVendida += quantidade;
            venda.valorTotal += valorTotal;
        }
    }

    // Ordena do produto mais vendido para o menos vendido
    const produtosMaisVendidos = [...vendasPorProduto.values()].sort((a, b) => b.quantidadeVendida - a.quantidadeVendida).slice(0, 5);

    // Exibe mensagem caso não existam vendas
    if (produtosMaisVendidos.length === 0) {
        tabela.innerHTML = `
            <tr>
                <td colspan="4" class="text-center">
                    Nenhuma venda entregue encontrada.
                </td>
            </tr>
        `;
        return;
    }

    // Monta as linhas da tabela
    tabela.innerHTML = '';

    produtosMaisVendidos.forEach((venda, indice) => {
        const ticketMedio = totalPedidosEntregues > 0 ? venda.valorTotal / totalPedidosEntregues : 0;
        const linha = document.createElement('tr');

        const colunaProduto = document.createElement('th');
        colunaProduto.scope = 'row';
        colunaProduto.className = 'text-truncate';

        const numero = document.createElement('span');
        numero.className = 'numero-produto-vendas';
        numero.textContent = indice + 1;

        colunaProduto.append(
            numero,
            document.createTextNode(` ${venda.produto.nome}`)
        );

        const colunaQuantidade = document.createElement('td');
        colunaQuantidade.className = 'text-center';
        colunaQuantidade.textContent = venda.quantidadeVendida;

        const colunaValor = document.createElement('td');
        colunaValor.className = 'text-center';
        colunaValor.textContent = formatarMoeda(venda.valorTotal);

        const colunaTicket = document.createElement('td');
        colunaTicket.className = 'text-center';
        colunaTicket.textContent = formatarMoeda(ticketMedio);

        linha.append(
            colunaProduto,
            colunaQuantidade,
            colunaValor,
            colunaTicket
        );

        tabela.appendChild(linha);
    });
}

function exibeDashboardsSidebar() {
    
    const perfis = usuario.perfil;
    const linksDashboards = document.querySelectorAll('[data-perfil]');

    linksDashboards.forEach(link => {
        const perfilNecessario = link.dataset.perfil;
        const possuiPerfil = perfis.includes(perfilNecessario);

        const lojistaAtivo = perfilNecessario !== "Lojista" || usuario.status === "Ativo";

        link.style.display = possuiPerfil && lojistaAtivo ? "" : "none";
    });
}

document.addEventListener('DOMContentLoaded', () => {
    exibeDashboardsSidebar();
    carregarDashboardLojista();
});