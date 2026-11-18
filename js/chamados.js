import { mostrarToast } from "./toast.js";

const URL_CHAMADOS = 'https://6a98675a7160beda2292f7f2.mockapi.io/chamados';
const URL_USUARIOS = 'https://6aaac6cdff4dd5698b4f060c.mockapi.io/usuarios';

const ITENS_POR_PAGINA = 4;

let chamados = [];      // chamados de clientes, já normalizados e ordenados
let solicitacoes = [];  // lojistas com cadastro pendente
let nomesClientes = {}; // { usuarioId: nomeCompleto }

// Cada lista tem a sua página atual: ao alternar, cada uma volta de onde parou
const paginas = { chamados: 1, solicitacoes: 1 };

const CLASSE_STATUS_CHAMADO = {
    'Aberto': 'text-bg-warning',
    'Resolvido': 'text-bg-success'
};

const containerChamados = document.getElementById('chamados-clientes');
const modalChamado = document.getElementById('modalDetalhesChamado');

containerChamados.addEventListener('click', (evento) => {
    const botao = evento.target.closest('.ver-detalhes');

    if (!botao) return;

    const modal = bootstrap.Modal.getOrCreateInstance(modalChamado);
    modal.show();
});

let exibindoChamados = true; // a página abre nos chamados de clientes

// Mostra ou esconde um elemento. Limpa o display:none inline do HTML, se existir.
function definirVisivel(elemento, visivel) {
    elemento.style.display = '';
    elemento.classList.toggle('d-none', !visivel);
}

function conectarAlternancia() {
    const botao = document.getElementById('btn-alternar');
    const titulo = document.getElementById('titulo-pagina');
    const listaChamados = document.getElementById('chamados-clientes');
    const listaSolicitacoes = document.getElementById('solicitacoes-lojista');

    // Deixa a tela de acordo com a visão atual
    function aplicarVisao() {
        definirVisivel(listaChamados, exibindoChamados);
        definirVisivel(listaSolicitacoes, !exibindoChamados);

        titulo.textContent = exibindoChamados ? 'Chamados de Clientes' : 'Solicitações de Lojistas';
        botao.innerHTML = `<i class="ti ti-message-circle-plus"></i>` + (exibindoChamados ? 'Ver solicitações de lojistas' : 'Ver chamados de clientes');
    }

    botao.addEventListener('click', () => {
        exibindoChamados = !exibindoChamados;
        aplicarVisao();
    });
    
    aplicarVisao(); // também acerta o texto inicial do botão
}

// Escapa o texto antes de ir para o HTML. Assunto e descrição são digitados pelos clientes
// e o nome da empresa pelos lojistas: sem isso, um código HTML digitado executaria no navegador do administrador
function escaparHTML(texto) {
    return String(texto ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// "2026-08-04" -> "04/08/2026". Não usa new Date(), que leria a data como UTC e poderia mostrar o dia anterior
function formatarData(data) {
    if (!data) return '-';
    if (!/^\d{4}-\d{2}-\d{2}/.test(String(data))) return String(data);

    const [ano, mes, dia] = String(data).slice(0, 10).split('-');
    return `${dia}/${mes}/${ano}`;
}

// Aceita o telefone com ou sem máscara
function formatarTelefone(telefone) {
    const digitos = String(telefone ?? '').replace(/\D/g, '');

    if (digitos.length === 11) return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 7)}-${digitos.slice(7)}`;
    if (digitos.length === 10) return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 6)}-${digitos.slice(6)}`;

    return telefone || '-';
}

function formatarCNPJ(cnpj) {
    const digitos = String(cnpj ?? '').replace(/\D/g, '');

    if (digitos.length === 14) {
        return `${digitos.slice(0, 2)}.${digitos.slice(2, 5)}.${digitos.slice(5, 8)}/${digitos.slice(8, 12)}-${digitos.slice(12)}`;
    }

    return cnpj || '-';
}

// ---------- Dados ----------

// Campos do chamado como vêm da API -> campos usados na tela.
// Se o recurso `chamados` usar outros nomes, ajuste só aqui.
function normalizarChamado(bruto) {
    return {
        id: bruto.id,
        clienteID: bruto.clienteID ?? bruto.clienteId,
        titulo: bruto.assunto ?? bruto.titulo,
        descricao: bruto.descricao,
        data: bruto.dataAbertura ?? bruto.data,
        status: bruto.status
    };
}

async function carregarPagina() {
    mostrarMensagem('chamados', 'Carregando chamados...');
    mostrarMensagem('solicitacoes', 'Carregando solicitações...');

    try {
        const [respostaChamados, respostaUsuarios] = await Promise.all([
            fetch(URL_CHAMADOS),
            fetch(URL_USUARIOS)
        ]);

        if (!respostaChamados.ok || !respostaUsuarios.ok) {
            throw new Error('Falha ao buscar chamados ou usuários');
        }

        const chamadosBrutos = await respostaChamados.json();
        const usuarios = await respostaUsuarios.json();

        nomesClientes = {};
        for (const usuario of usuarios) {
            nomesClientes[usuario.id] = usuario.nomeCompleto;
        }

        // Em aberto primeiro; dentro de cada grupo, os mais recentes primeiro
        chamados = chamadosBrutos
            .map(normalizarChamado)
            .sort((a, b) =>
                Number(a.status === 'Resolvido') - Number(b.status === 'Resolvido')
                || String(b.data).localeCompare(String(a.data))
                || Number(b.id) - Number(a.id)
            );

        // Lojistas que se cadastraram e aguardam a aprovação, em ordem alfabética da empresa
        solicitacoes = usuarios
            .filter(usuario => (usuario.perfis ?? []).includes('Lojista') && usuario.status === 'Pendente')
            .sort((a, b) => String(a.nomeEmpresa).localeCompare(String(b.nomeEmpresa), 'pt-BR'));

        renderizarVisao('chamados');
        renderizarVisao('solicitacoes');
        renderizarPaginacao();

    } catch (erro) {
        console.error(erro);
        mostrarMensagem('chamados', 'Não foi possível carregar os chamados.');
        mostrarMensagem('solicitacoes', 'Não foi possível carregar as solicitações.');
        mostrarToast('Erro', 'Não foi possível carregar os dados. Tente novamente.', 'erro');
    }
}

// ---------- Cards ----------

function montarCardChamado(chamado) {
    const resolvido = chamado.status === 'Resolvido';
    const classeBadge = CLASSE_STATUS_CHAMADO[chamado.status] ?? 'text-bg-secondary';
    const nomeCliente = nomesClientes[chamado.clienteID] ?? 'Cliente não encontrado';

    return `
        <div class="col-12 col-lg-6">
            <article class="chamado d-flex flex-column" data-chamado-id="${chamado.id}">
                <div class="d-flex justify-content-between align-items-center">
                    <p class="m-0 nome-cliente"><span>#${escaparHTML(chamado.id)} /</span> ${escaparHTML(nomeCliente)}</p>
                    <span class="chamado-status ${classeBadge} rounded-pill">${escaparHTML(chamado.status || '-')}</span>
                </div>
                <small>Realizado em ${formatarData(chamado.data)}</small>
                <hr class="my-2">
                <h3 class="chamado-titulo">${escaparHTML(chamado.titulo || '-')}</h3>
                <p class="chamado-descricao">${escaparHTML(chamado.descricao)}</p>
                <div class="d-flex gap-3 mt-auto">
                    <button class="botao w-100 ver-detalhes" data-chamado-id="${chamado.id}">Ver detalhes</button>
                    <div class="input-border-secundario d-flex align-items-center justify-content-center">
                        <select id="status-input" data-chamado-id="${chamado.id}">
                            <option value="aberto"${resolvido ? '' : ' selected'}>Aberto</option>
                            <option value="resolvido"${resolvido ? ' selected' : ''}>Resolvido</option>
                        </select>
                    </div>
                </div>
            </article>
        </div>
    `;
}

function montarCardSolicitacao(lojista) {
    return `
        <div class="col-12 col-lg-6">
            <article class="solicitacao d-flex flex-column" data-usuario-id="${lojista.id}">
                <div class="d-flex gap-2 align-items-center">
                    <i class="ti ti-building-store"></i>
                    <h3 class="m-0">${escaparHTML(lojista.nomeEmpresa || '-')}</h3>
                </div>
                <hr class="my-2">
                <p class="mb-2">Lojista: <span>${escaparHTML(lojista.nomeCompleto || '-')}</span></p>
                <p class="mb-2">CNPJ: <span>${escaparHTML(formatarCNPJ(lojista.cnpj))}</span></p>
                <p class="mb-2">Telefone: <span>${escaparHTML(formatarTelefone(lojista.telefone))}</span></p>
                <p class="mb-3">E-mail: <span>${escaparHTML(lojista.email || '-')}</span></p>
                <div class="d-flex gap-3 mt-auto">
                    <button class="botao px-5 btn-aprovar" data-usuario-id="${lojista.id}">Aprovar</button>
                    <button class="botao px-5 bg-danger btn-rejeitar" data-usuario-id="${lojista.id}">Rejeitar</button>
                </div>
            </article>
        </div>
    `;
}

// ---------- Listas e paginação ----------

const CONFIG_VISAO = {
    chamados: {
        idContainer: 'chamados-clientes',
        lista: () => chamados,
        montarCard: montarCardChamado,
        vazio: 'Nenhum chamado encontrado.'
    },
    solicitacoes: {
        idContainer: 'solicitacoes-lojista',
        lista: () => solicitacoes,
        montarCard: montarCardSolicitacao,
        vazio: 'Nenhuma solicitação pendente.'
    }
};

// Mensagem ocupando a lista inteira (carregando, vazio ou erro)
function mostrarMensagem(visao, texto) {
    document.getElementById(CONFIG_VISAO[visao].idContainer).innerHTML =
        `<div class="col-12"><p class="text-center my-4">${escaparHTML(texto)}</p></div>`;
}

function renderizarVisao(visao) {
    const { idContainer, lista, montarCard, vazio } = CONFIG_VISAO[visao];
    const itens = lista();

    if (itens.length === 0) {
        mostrarMensagem(visao, vazio);
        return;
    }

    // Garante que a página guardada ainda existe (a lista pode ter diminuído)
    const totalPaginas = Math.ceil(itens.length / ITENS_POR_PAGINA);
    paginas[visao] = Math.min(paginas[visao], totalPaginas);

    const inicio = (paginas[visao] - 1) * ITENS_POR_PAGINA;
    document.getElementById(idContainer).innerHTML = itens
        .slice(inicio, inicio + ITENS_POR_PAGINA)
        .map(montarCard)
        .join('');
}

// A paginação é uma só e acompanha a lista que está visível
function renderizarPaginacao() {
    const visao = exibindoChamados ? 'chamados' : 'solicitacoes';
    const totalPaginas = Math.ceil(CONFIG_VISAO[visao].lista().length / ITENS_POR_PAGINA);
    const paginacao = document.getElementById('paginacao');
    paginacao.innerHTML = '';

    if (totalPaginas <= 1) return;

    const atual = paginas[visao];

    paginacao.appendChild(criarSeta('left', atual - 1, atual === 1, 'Previous'));
    for (let pagina = 1; pagina <= totalPaginas; pagina++) {
        paginacao.appendChild(criarNumero(pagina, pagina === atual));
    }
    paginacao.appendChild(criarSeta('right', atual + 1, atual === totalPaginas, 'Next'));
}

// Troca de página pelo clique do usuário
function irParaPagina(pagina) {
    const visao = exibindoChamados ? 'chamados' : 'solicitacoes';

    paginas[visao] = pagina;
    renderizarVisao(visao);
    renderizarPaginacao();

    document.getElementById(CONFIG_VISAO[visao].idContainer).scrollIntoView({ behavior: 'smooth' });
}

function criarSeta(direcao, pagina, desabilitado, aria) {
    const item = document.createElement('li');

    const link = document.createElement('a');
    link.className = 'page-link paginacao-seta';
    link.href = '#';
    link.setAttribute('aria-label', aria);
    link.innerHTML = `<span aria-hidden="true"><i class="ti ti-chevron-compact-${direcao}"></i></span>`;

    link.addEventListener('click', evento => {
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
    if (ativo) link.setAttribute('aria-current', 'page');

    link.addEventListener('click', evento => {
        evento.preventDefault();
        irParaPagina(pagina);
    });

    item.appendChild(link);
    return item;
}

document.addEventListener('DOMContentLoaded', () => {
    carregarPagina();
    conectarAlternancia();
});