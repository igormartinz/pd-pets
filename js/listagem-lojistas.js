import { mostrarToast } from "./toast.js";

const URL_USUARIOS = 'https://6aaac6cdff4dd5698b4f060c.mockapi.io/usuarios';
const LOJISTAS_POR_PAGINA = 9;

let lojistas = [];
let lojistasExibidos = [];
let paginaAtual = 1;

function formatarData(data) {
    if (!data) return '-';
    const [ano, mes, dia] = data.split('-');
    return `${dia}/${mes}/${ano}`;
}

function formatarTelefone(telefone) {
    const digitos = String(telefone ?? '').replace(/\D/g, '');

    if (digitos.length === 11) {
        return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 7)}-${digitos.slice(7)}`;
    }

    if (digitos.length === 10) {
        return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 6)}-${digitos.slice(6)}`;
    }

    return telefone || '-';
}

function formatarCNPJ(cnpj) {
    const digitos = String(cnpj ?? '').replace(/\D/g, '');

    if (digitos.length === 14) {
        return `${digitos.slice(0, 2)}.${digitos.slice(2, 5)}.${digitos.slice(5, 8)}/${digitos.slice(8, 12)}-${digitos.slice(12)}`;
    }

    return cnpj || '-';
}

function mostrarMensagemTabela(texto) {
    const corpo = document.getElementById('tabela-lojistas-lista');
    corpo.innerHTML = '';

    const linha = document.createElement('tr');
    const celula = document.createElement('td');

    celula.colSpan = 2;
    celula.className = 'text-center py-4';
    celula.textContent = texto;

    linha.append(celula);
    corpo.append(linha);
}

function criarLinhaLojista(lojista) {
    const linha = document.createElement('tr');

    linha.className = 'pedido-linha';

    // Nome da empresa
    const celulaNome = document.createElement('td');
    celulaNome.className = 'linha-celula nome-empresa linha-clicavel';
    celulaNome.textContent = lojista.nomeEmpresa || '-';

    celulaNome.dataset.usuarioId = lojista.id;
    celulaNome.dataset.bsToggle = 'modal';
    celulaNome.dataset.bsTarget = '#modalDetalhesUsuario';

    // Status do lojista
    const celulaStatus = document.createElement('td');
    celulaStatus.className = 'linha-celula status-switch';

    const container = document.createElement('div');
    container.className = 'form-field';

    const formCheck = document.createElement('div');
    formCheck.className = 'form-check form-switch';

    const switchStatus = document.createElement('input');
    switchStatus.className = 'form-check-input linha-clicavel';
    switchStatus.type = 'checkbox';
    switchStatus.role = 'switch';
    switchStatus.checked = lojista.status === 'Ativo';
    switchStatus.setAttribute('aria-label', `Status de ${lojista.nomeEmpresa || 'lojista'}`);
    switchStatus.addEventListener('change', () => {atualizarStatusLojista(lojista, switchStatus);});

    formCheck.append(switchStatus);
    container.append(formCheck);
    celulaStatus.append(container);

    linha.append(celulaNome, celulaStatus);

    return linha;
}

async function carregarLojistas() {
    mostrarMensagemTabela('Carregando...');

    try {
        const resposta = await fetch(URL_USUARIOS);

        if (!resposta.ok) {
            throw new Error('Falha ao buscar os usuários');
        }

        const usuarios = await resposta.json();

        lojistas = usuarios
            .filter(usuario => (usuario.perfis ?? []).includes('Lojista') && (usuario.status !== "Pendente"))
            .sort((a, b) => String(a.nomeEmpresa ?? '').localeCompare(String(b.nomeEmpresa ?? ''), 'pt-BR')
            );

        renderizarPagina(1);

    } catch (erro) {
        console.error(erro);
        mostrarMensagemTabela('Não foi possível carregar os lojistas.');
        mostrarToast('Erro', 'Não foi possível carregar os lojistas. Tente novamente.', 'erro');
    }
}

function conectarDetalhes() {
    const modalElemento = document.getElementById('modalDetalhesUsuario');

    modalElemento.addEventListener('show.bs.modal', function (evento) {
        const idLojista = evento.relatedTarget?.dataset.usuarioId;

        const lojista = lojistas.find(item => String(item.id) === String(idLojista));

        if (!lojista) {
            evento.preventDefault();
            return;
        }

        document.getElementById('tituloDetalhesUsuario').textContent = lojista.nomeEmpresa || '-';
        document.getElementById('detalhes-usuario-responsavel').textContent = lojista.nomeCompleto || '-';
        document.getElementById('detalhes-usuario-email').textContent = lojista.email || '-';
        document.getElementById('detalhes-usuario-cnpj').textContent = formatarCNPJ(lojista.cnpj);
        document.getElementById('detalhes-usuario-telefone').textContent = formatarTelefone(lojista.telefone);
        document.getElementById('detalhes-usuario-aprovacao').textContent = formatarData(lojista.dataAprovacao);
    });
}

function renderizarPagina(pagina, listaLojistas = lojistas) {
    const corpo = document.getElementById('tabela-lojistas-lista');

    paginaAtual = pagina;
    lojistasExibidos = listaLojistas;

    if (listaLojistas.length === 0) {
        mostrarMensagemTabela('Nenhum lojista encontrado.');
        renderizarPaginacao(0);
        return;
    }

    const inicio = (paginaAtual - 1) * LOJISTAS_POR_PAGINA;
    const fim = inicio + LOJISTAS_POR_PAGINA;
    const lojistasPagina = listaLojistas.slice(inicio, fim);

    corpo.innerHTML = '';

    for (const lojista of lojistasPagina) {
        corpo.append(criarLinhaLojista(lojista));
    }

    renderizarPaginacao(listaLojistas.length);

    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

function renderizarPaginacao(totalLojistas = lojistas.length) {
    const totalPaginas = Math.ceil(totalLojistas / LOJISTAS_POR_PAGINA);
    const paginacao = document.getElementById('paginacao');

    paginacao.innerHTML = '';

    if (totalPaginas <= 1) return;

    paginacao.appendChild(criarSeta('left', paginaAtual - 1, paginaAtual === 1, 'Página anterior'));

    for (let pagina = 1; pagina <= totalPaginas; pagina++) {
        paginacao.appendChild(criarNumero(pagina, pagina === paginaAtual));
    }

    paginacao.appendChild(criarSeta('right', paginaAtual + 1, paginaAtual === totalPaginas, 'Próxima página'));
}

function criarSeta(direcao, pagina, desabilitado, aria) {
    const item = document.createElement('li');
    item.className = 'page-item';

    const link = document.createElement('a');
    link.className = 'page-link paginacao-seta';
    link.href = '#';
    link.setAttribute('aria-label', aria);

    link.innerHTML = `<span aria-hidden="true"><i class="ti ti-chevron-compact-${direcao}"></i></span>`;

    link.addEventListener('click', evento => {
        evento.preventDefault();

        if (!desabilitado) {
            renderizarPagina(pagina, lojistasExibidos);
        }
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

    if (ativo) {
        link.setAttribute('aria-current', 'page');
    }

    link.addEventListener('click', evento => {
        evento.preventDefault();
        renderizarPagina(pagina, lojistasExibidos);
    });

    item.appendChild(link);

    return item;
}

function filtrarLojistas() {
    const campoPesquisa = document.getElementById('filtro-lojistas');
    const pesquisa = campoPesquisa.value.trim().toLowerCase();

    const lojistasFiltrados = lojistas.filter(lojista => {
        const nomeEmpresa = String(lojista.nomeEmpresa ?? '').toLowerCase();

        return nomeEmpresa.includes(pesquisa);
    });

    renderizarPagina(1, lojistasFiltrados);
}

async function atualizarStatusLojista(lojista, switchStatus) {
    const statusAnterior = lojista.status;
    const novoStatus = switchStatus.checked ? 'Ativo' : 'Inativo';

    // Evita novas alterações enquanto a requisição está em andamento.
    switchStatus.disabled = true;

    try {
        const resposta = await fetch(`${URL_USUARIOS}/${lojista.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({status: novoStatus})
        });

        if (!resposta.ok) {
            throw new Error('Falha ao atualizar o status do lojista.');
        }

        lojista.status = novoStatus;

        mostrarToast('Sucesso', `Status alterado com sucesso`, 'sucesso');

    } catch (erro) {
        console.error(erro);

        // Retorna o switch ao estado anterior.
        switchStatus.checked = statusAnterior === 'Ativo';
        mostrarToast('Erro', 'Não foi possível atualizar o status do lojista.', 'erro');

    } finally {
        switchStatus.disabled = false;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    carregarLojistas();
    conectarDetalhes();

    document.getElementById('filtro-lojistas').addEventListener('input', filtrarLojistas);
});
