import { mostrarToast } from "./toast.js";

const URL_CHAMADOS = 'https://6a98675a7160beda2292f7f2.mockapi.io/chamados';
const URL_USUARIOS = 'https://6aaac6cdff4dd5698b4f060c.mockapi.io/usuarios';

const ITENS_POR_PAGINA = 4;

let chamados = [];      // chamados de clientes, já normalizados e ordenados
let solicitacoes = [];  // lojistas com cadastro pendente
let nomesClientes = {};
let exibindoChamados = true; // a página abre nos chamados de clientes

// Cada lista tem a sua página atual: ao alternar, cada uma volta de onde parou
const paginas = { chamados: 1, solicitacoes: 1 };

const CLASSE_STATUS_CHAMADO = {
    'Aberto': 'text-bg-warning',
    'Resolvido': 'text-bg-success'
};

let chamadoSelecionado = null;

const containerChamados = document.getElementById('chamados-clientes');
const modalChamado = document.getElementById('modalDetalhesChamado');

containerChamados.addEventListener('click', evento => {
    const botao = evento.target.closest('.ver-detalhes');

    if (!botao) return;

    const idChamado = botao.dataset.chamadoId;

    chamadoSelecionado = chamados.find(chamado => String(chamado.id) === String(idChamado));

    if (!chamadoSelecionado) {
        mostrarToast('Erro', 'Não foi possível localizar o chamado.', 'erro');
        return;
    }

    preencherModalChamado(chamadoSelecionado);

    const modal = bootstrap.Modal.getOrCreateInstance(modalChamado);
    modal.show();
});

function preencherModalChamado(chamado) {
    const titulo = modalChamado.querySelector('.modal-titulo');
    const conversa = document.getElementById('conversa-chamado');
    const campoResposta = document.getElementById('resposta-chamado');
    const botaoResponder = document.querySelector('#form-responder-chamado button[type="submit"]');

    titulo.textContent = `Chamado`;

    // Limpa a conversa anterior.
    conversa.innerHTML = '';

    // Primeira mensagem: descrição enviada pelo cliente ao abrir o chamado.
    adicionarMensagem('Cliente', chamado.descricao);

    // Mensagens posteriores da conversa.
    for (const resposta of chamado.respostasChamado) {
        adicionarMensagem(resposta.autor, resposta.mensagem);
    }

     // Bloqueia respostas em chamados resolvidos.
    const resolvido = chamado.status === 'Resolvido';

    campoResposta.disabled = resolvido;
    campoResposta.placeholder = resolvido ? 'Este chamado já foi resolvido.' : 'Resposta';

    botaoResponder.disabled = resolvido;
}

function adicionarMensagem(autor, mensagem) {
    const conversa = document.getElementById('conversa-chamado');
    const elemento = document.createElement('p');

    elemento.className = autor === 'Administrador' ? 'resposta-cliente' : 'resposta-adm';
    elemento.textContent = mensagem;

    conversa.appendChild(elemento);
}

async function responderChamado(evento) {
    evento.preventDefault();

    if (!chamadoSelecionado) return;

    const usuario = pegarUsuarioLogado();

    const campoResposta = document.getElementById('resposta-chamado');
    const mensagem = campoResposta.value.trim();

    if (!mensagem) {
        mostrarToast("Campo vazio", "Preencha o campo de resposta", "erro");
        return;
    }

    const botaoResponder = evento.submitter;
    botaoResponder.disabled = true;

    try {
        const novaResposta = {
            autor: 'Administrador',
            autorID: usuario.id,
            mensagem: mensagem
        };

        const respostasAtualizadas = [
            ...chamadoSelecionado.respostasChamado,
            novaResposta
        ];

        const dadosAtualizados = {
            respostasChamado: respostasAtualizadas,
            ultimaAtualizacao: dataDeHoje()
        };

        const resposta = await fetch(`${URL_CHAMADOS}/${chamadoSelecionado.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dadosAtualizados)
        });

        if (!resposta.ok) {
            throw new Error('Falha ao enviar resposta.');
        }

        // Atualiza o chamado na memória.
        chamadoSelecionado.respostasChamado = respostasAtualizadas;
        chamadoSelecionado.ultimaAtualizacao = dadosAtualizados.ultimaAtualizacao;

        // Atualiza a conversa exibida.
        adicionarMensagem('Administrador', mensagem);

        campoResposta.value = '';

        mostrarToast('Sucesso', 'Resposta enviada com sucesso!', 'sucesso');

    } catch (erro) {
        console.error(erro);

        mostrarToast('Erro', 'Não foi possível enviar a resposta.', 'erro');

    } finally {
        botaoResponder.disabled = false;
    }
}


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
        renderizarPaginacao()
    });

    aplicarVisao(); // também acerta o texto inicial do botão
}

// "2026-08-28" -> "28/08/2026"
function formatarData(data) {
    if (!data) return '-';
    const [ano, mes, dia] = data.split('-');
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

// Campos do chamado como vêm da API -> campos usados na tela.
function normalizarChamado(bruto) {
    return {
        id: bruto.id,
        clienteID: bruto.clienteID ?? bruto.clienteId,
        titulo: bruto.assunto ?? bruto.titulo,
        descricao: bruto.descricao,
        data: bruto.dataAbertura ?? bruto.data,
        status: bruto.status === 'Em atendimento' ? 'Aberto' : bruto.status,
        respostasChamado: bruto.respostasChamado ?? [],
        ultimaAtualizacao: bruto.ultimaAtualizacao
    };
}

function obterResponsavelChamado(chamado) {
    const primeiraRespostaAdm = chamado.respostasChamado.find(
        resposta => resposta.autor === 'Administrador' && resposta.autorID != null
    );

    return primeiraRespostaAdm?.autorID ?? null;
}

async function carregarPagina() {
    mostrarMensagem('chamados', 'Carregando chamados...');
    mostrarMensagem('solicitacoes', 'Carregando solicitações...');

    try {
        const [respostaChamados, respostaUsuarios] = await Promise.all([
            fetch(URL_CHAMADOS),
            fetch(URL_USUARIOS)
        ]);

        const usuario = pegarUsuarioLogado();

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
        chamados = chamadosBrutos.map(normalizarChamado)
            .filter(chamado => {
                const responsavelID = obterResponsavelChamado(chamado);

                // Chamados sem resposta administrativa ficam disponíveis para todos.
                if (responsavelID === null) return true;

                // Chamados respondidos aparecem somente para o administrador responsável.
                return String(responsavelID) === String(usuario.id);
            })
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
                    <p class="m-0 nome-cliente"><span>#${chamado.id} /</span> ${nomeCliente}</p>
                    <span class="chamado-status ${classeBadge} rounded-pill">${chamado.status || '-'}</span>
                </div>
                <small>Realizado em ${formatarData(chamado.data)}</small>
                <hr class="my-2">
                <h3 class="chamado-titulo">${chamado.titulo || '-'}</h3>
                <p class="chamado-descricao">${chamado.descricao}</p>
                <div class="d-flex gap-3 mt-auto">
                    <button class="botao w-100 ver-detalhes" data-chamado-id="${chamado.id}">Ver detalhes</button>
                    <div class="input-border-secundario d-flex align-items-center justify-content-center">
                        <select class="status-input" data-chamado-id="${chamado.id}" ${resolvido ? 'disabled' : ''}>
                            <option value="Aberto" ${resolvido ? '' : 'selected'}>Aberto</option>
                            <option value="Resolvido" ${resolvido ? 'selected' : ''}>Resolvido</option>
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
                    <h3 class="m-0">${lojista.nomeEmpresa || '-'}</h3>
                </div>
                <hr class="my-2">
                <p class="mb-2">Lojista: <span>${lojista.nomeCompleto || '-'}</span></p>
                <p class="mb-2">CNPJ: <span>${formatarCNPJ(lojista.cnpj)}</span></p>
                <p class="mb-2">Telefone: <span>${formatarTelefone(lojista.telefone)}</span></p>
                <p class="mb-3">E-mail: <span>${lojista.email || '-'}</span></p>
                <div class="d-flex gap-3 mt-auto">
                    <button class="botao px-5 btn-aprovar" data-usuario-id="${lojista.id}">Aprovar</button>
                    <button class="botao px-5 bg-danger btn-rejeitar" data-usuario-id="${lojista.id}">Rejeitar</button>
                </div>
            </article>
        </div>
    `;
}

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
    document.getElementById(CONFIG_VISAO[visao].idContainer).innerHTML = `<div class="col-12"><p class="text-center my-4">${texto}</p></div>`;
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

// Data de hoje no formato do MockAPI (AAAA-MM-DD), no fuso local.
// toISOString() usaria UTC e, à noite no Brasil, já devolveria o dia seguinte.
function dataDeHoje() {
    const hoje = new Date();
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    const dia = String(hoje.getDate()).padStart(2, '0');
    return `${hoje.getFullYear()}-${mes}-${dia}`;
}

// Tira a solicitação da lista e redesenha (a página se ajusta sozinha se a lista diminuir)
function removerSolicitacao(id) {
    solicitacoes = solicitacoes.filter(lojista => String(lojista.id) !== String(id));
    renderizarVisao('solicitacoes');
    renderizarPaginacao();
}

// Um único listener no container cobre todos os botões, inclusive os recriados a cada renderização
function conectarAnaliseDeLojistas() {
    document.getElementById('solicitacoes-lojista').addEventListener('click', evento => {
        const botao = evento.target.closest('.btn-aprovar, .btn-rejeitar');
        if (!botao) return;

        analisarSolicitacao(botao.dataset.usuarioId, botao.classList.contains('btn-aprovar'));
    });
}

async function analisarSolicitacao(idUsuario, aprovar) {
    const solicitacao = solicitacoes.find(lojista => String(lojista.id) === String(idUsuario));
    if (!solicitacao) return;

    const botoesDoCard = document.querySelectorAll(`#solicitacoes-lojista button[data-usuario-id="${idUsuario}"]`);
    botoesDoCard.forEach(botao => botao.disabled = true);

    const nome = solicitacao.nomeEmpresa || solicitacao.nomeCompleto;

    try {
        // Lê o cadastro ATUAL: a lista da tela pode estar desatualizada
        const resposta = await fetch(`${URL_USUARIOS}/${solicitacao.id}`);
        if (!resposta.ok) throw new Error('Falha ao consultar o lojista');

        const lojistaAtual = await resposta.json();

        // Se a solicitação já foi analisada, não grava nada
        if (lojistaAtual.status !== 'Pendente') {
            removerSolicitacao(solicitacao.id);
            mostrarToast('Solicitação desatualizada', 'Esta solicitação já foi analisada. A lista foi atualizada.', 'aviso');
            return;
        }

        // Aprovar: ativa a loja e registra a data (US048). Rejeitar: a loja fica "Inativo".
        const dados = aprovar
            ? { status: 'Ativo', dataAprovacao: dataDeHoje() }
            : { status: 'Inativo' };

        const respostaAtualizacao = await fetch(`${URL_USUARIOS}/${solicitacao.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados)
        });
        if (!respostaAtualizacao.ok) throw new Error('Falha ao atualizar o lojista');

        removerSolicitacao(solicitacao.id);

        if (aprovar) {
            mostrarToast('Lojista aprovado', `A loja ${nome} foi aprovada com sucesso.`, 'sucesso');
        } else {
            mostrarToast('Lojista rejeitado', `A solicitação da loja ${nome} foi rejeitada.`, 'sucesso');
        }

    } catch (erro) {
        console.error(erro);
        mostrarToast('Erro', 'Não foi possível concluir a ação. Tente novamente.', 'erro');
    }
}

async function atualizarStatusChamado(chamado, select) {
    const usuario = pegarUsuarioLogado();

    // Impede qualquer alteração se o chamado já estiver resolvido.
    if (chamado.status === 'Resolvido') {
        select.value = 'Resolvido';
        select.disabled = true;
        return;
    }

    const novoStatus = select.value;

    if (novoStatus !== 'Resolvido') return;
    
    select.disabled = true;

    try {
        // Consulta os dados atuais para evitar alterações em chamados desatualizados.
        const consulta = await fetch(`${URL_CHAMADOS}/${chamado.id}`);

        if (!consulta.ok) {
            throw new Error('Não foi possível consultar o chamado.');
        }

        const chamadoAtual = await consulta.json();

        if (chamadoAtual.status === 'Resolvido') {
            throw new Error('Este chamado já foi resolvido.');
        }

        // Verifica se o chamado pertence a outro administrador.
        const respostasAtuais = chamadoAtual.respostasChamado ?? [];
        const responsavelID = obterResponsavelChamado({respostasChamado: respostasAtuais});

        if (responsavelID !== null && String(responsavelID) !== String(usuario.id)) {
            throw new Error('Este chamado pertence a outro administrador.');
        }

        const resposta = await fetch(`${URL_CHAMADOS}/${chamado.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                status: 'Resolvido',
                ultimaAtualizacao: dataDeHoje()
            })
        });

        if (!resposta.ok) {
            throw new Error('Não foi possível atualizar o status.');
        }

        // Atualiza os dados locais.
        chamado.status = 'Resolvido';

        mostrarToast('Sucesso', 'Chamado resolvido com sucesso!','sucesso');

        // Atualiza o card e desabilita definitivamente o select.
        renderizarVisao('chamados');
        renderizarPaginacao();

    } catch (erro) {
        console.error(erro);

        // Retorna o select para Aberto.
        select.value = 'Aberto';
        mostrarToast('Erro', 'Não foi possível resolver o chamado.', 'erro');
        select.disabled = false;
    }
}

function conectarStatusChamados() {
    containerChamados.addEventListener('change', evento => {
        const select = evento.target.closest('.status-input');

        if (!select) return;

        const chamado = chamados.find(item => String(item.id) === String(select.dataset.chamadoId));

        if (!chamado) return;

        atualizarStatusChamado(chamado, select);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    carregarPagina();
    conectarAlternancia();
    conectarAnaliseDeLojistas();
    conectarStatusChamados();

    document.getElementById('form-responder-chamado').addEventListener('submit', responderChamado);
});