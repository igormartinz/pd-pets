const usuario = pegarUsuarioLogado();

const URL_USUARIOS = 'https://6aaac6cdff4dd5698b4f060c.mockapi.io/usuarios';
const URL_PRODUTOS = 'https://6a98614f7160beda2292eff8.mockapi.io/produtos';
const URL_PEDIDOS = 'https://6a98614f7160beda2292eff8.mockapi.io/pedidos';
const URL_CHAMADOS = 'https://6a98675a7160beda2292f7f2.mockapi.io/chamados';

const IDS_DASHBOARD = [
    'dash-clientes',
    'dash-lojistas',
    'dash-sem-estoque',
    'dash-pedidos',
    'dash-chamados-abertos',
    'dash-produtos',
    'dash-pedidos-total',
    'dash-chamados',
    'dash-lojistas-ativos',
];

const nomeUsuarioPerfil = document.getElementById('nome-usuario-perfil');
nomeUsuarioPerfil.innerHTML = usuario.nome;

const nomeUsuario = document.getElementById('nome-usuario');
nomeUsuario.textContent = usuario.nome.split(' ').slice(0, 2).join(' ');

// Escreve o valor no elemento
function mostrarNumero(id, texto) {
    const elemento = document.getElementById(id);
    if (elemento) elemento.textContent = texto;
}

async function carregarDashboardAdministrativo() {
    if (!usuario) return;

    try {
        const [respostaProdutos, respostaPedidos, respostaUsuarios, respostaChamados] = await Promise.all([
            fetch(URL_PRODUTOS),
            fetch(URL_PEDIDOS),
            fetch(URL_USUARIOS),
            fetch(URL_CHAMADOS)
        ]);

        if (!respostaProdutos.ok || !respostaPedidos.ok || !respostaUsuarios.ok || !respostaChamados.ok) {
            throw new Error('Falha ao buscar produtos, pedidos, usuários ou chamados');
        }

        const produtos = await respostaProdutos.json();
        const pedidos = await respostaPedidos.json();
        const usuarios = await respostaUsuarios.json();
        const chamados = await respostaChamados.json();

        const semEstoque = produtos.filter(produto => Number(produto.estoque) === 0).length;
        const lojistas = usuarios.filter(usuario => usuario.perfis.includes("Lojista") && usuario.status !== "Pendente");
        const chamadosAbertos = chamados.filter(chamado => chamado.status === "Aberto");
        const pedidosEntregues = pedidos.filter(pedido => pedido.status === "Entregue");
        const chamadosResolvidos = chamados.filter(chamado => chamado.status === "Resolvido");
        const lojistasAtivos = lojistas.filter(lojista => lojista.status === "Ativo");

        mostrarNumero('dash-clientes', usuarios.length);
        mostrarNumero('dash-lojistas', lojistas.length);
        mostrarNumero('dash-sem-estoque', semEstoque);
        mostrarNumero('dash-pedidos', pedidos.length);
        mostrarNumero('dash-chamados-abertos', chamadosAbertos.length);
        mostrarNumero('dash-produtos', produtos.length);
        mostrarNumero('dash-pedidos-entregues', pedidosEntregues.length);
        mostrarNumero('dash-chamados-resolvidos', chamadosResolvidos.length);
        mostrarNumero('dash-lojistas-ativos', lojistasAtivos.length);

    } catch (erro) {
        console.error(erro);
        mostrarToast('Erro', 'Não foi possível carregar o dashboard. Tente novamente.', 'erro');
    }
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
    carregarDashboardAdministrativo();
});