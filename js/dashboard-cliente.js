const usuario = pegarUsuarioLogado();

const nomeUsuarioPerfil = document.getElementById('nome-usuario-perfil');
nomeUsuarioPerfil.innerHTML = usuario.nome;

const nomeUsuario = document.getElementById('nome-usuario');

// Divide em um array por espaço, pega os 2 primeiros e junta de volta
nomeUsuario.textContent = usuario.nome.split(' ').slice(0, 2).join(' ');

async function buscaUsuario(id) {

    try {
        // Busca os dados do cliente e os pedidos dele em paralelo
        const [respostaCliente, respostaPedidos] = await Promise.all([
            fetch(`https://6aaac6cdff4dd5698b4f060c.mockapi.io/clientes?id=${id}`),
            fetch(`https://6a98614f7160beda2292eff8.mockapi.io/pedidos`)
        ]);

        const usuarioLogado = await respostaCliente.json();
        const todosOsPedidos = await respostaPedidos.json();

        const pedidosDoCliente = todosOsPedidos.filter(pedido => pedido.clienteID == id);
        console.log(usuarioLogado)

        const quantidadeAnimais = document.getElementById('quantidade-animais');
        quantidadeAnimais.textContent = usuarioLogado[0].animais.length;
        
        const quantidadePedidos = document.getElementById('quantidade-pedidos');
        quantidadePedidos.textContent = pedidosDoCliente.length;

        carregarPedidosRecentes(id);

    } catch (erro) {
        console.error(erro);
    }

}

const CLASSE_STATUS = {
    'Pago': 'text-bg-success',
    'Entregue': 'text-bg-primary',
    'Separando': 'text-bg-warning',
    'Enviado': 'text-bg-dark',
    'Cancelado': 'text-bg-danger'
};

// Formata um número para o padrão brasileiro.
function formatarMoeda(valor) {
    return Number(valor).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    });
}

async function carregarPedidosRecentes(clienteId) {
    const container = document.getElementById('lista-pedidos-recentes');

    try {
        // Busca todos os pedidos do cliente e todos os produtos, em paralelo
        const [respostaPedidos, respostaProdutos] = await Promise.all([
            fetch('https://6a98614f7160beda2292eff8.mockapi.io/pedidos'),
            fetch('https://6a98614f7160beda2292eff8.mockapi.io/produtos')
        ]);

        const todosOsPedidos = await respostaPedidos.json();
        const produtos = await respostaProdutos.json();

        
        // Filtra
        const pedidosDoCliente = todosOsPedidos.filter(pedido => pedido.clienteID == clienteId);
        
        if (pedidosDoCliente.length === 0) {
            container.innerHTML = `
            <tr>
            <td class="text-center py-4">Você ainda não fez nenhum pedido.</td>
            </tr>
            `;
            return;
        }

        // Monta o mapa id -> nome do produto
        const mapaProdutos = {};
        for (const produto of produtos) {
            mapaProdutos[produto.id] = produto.nome;
        }
        
        // Ordena do mais recente pro mais antigo e pega só os 6 primeiros
        const pedidosRecentes = pedidosDoCliente.sort((a, b) => new Date(b.data) - new Date(a.data)).slice(0, 6);
        
        renderizarPedidosRecentes(pedidosRecentes, mapaProdutos);

    } catch (erro) {
        container.innerHTML = `
      <tr>
        <td class="text-center py-4">Não foi possível carregar seus pedidos. Tente novamente mais tarde.</td>
      </tr>
    `;
    }
}

function renderizarPedidosRecentes(pedidos, mapaProdutos) {
    const container = document.getElementById('lista-pedidos-recentes');
    container.innerHTML = '';

    for (const pedido of pedidos) {
        const nomeProduto = mapaProdutos[pedido.produtoID] ?? 'Produto não encontrado';
        const classeBadge = CLASSE_STATUS[pedido.status];

        const linha = document.createElement('tr');
        linha.innerHTML = `
      <td>
        <div class="pedido-linha">
          <span class="produto-nome"><i class="ti ti-shopping-bag icone-tabela"></i> ${nomeProduto}</span>
          <span class="produto-preco">${formatarMoeda(pedido.valor)}</span>
          <span class="produto-status badge rounded-pill ${classeBadge}">${pedido.status}</span>
        </div>
      </td>
    `;

        container.appendChild(linha);
    }
}

buscaUsuario(usuario.id);