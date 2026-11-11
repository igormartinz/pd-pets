import { mostrarToast } from "./toast.js";

const API_URL_CHAMADO = "https://6a98675a7160beda2292f7f2.mockapi.io";
const CHAMADOS_POR_PAGINA = 6;
const containerEstrelas = document.getElementById('avaliacao-estrelas');
const estrelas = containerEstrelas.querySelectorAll('i');

// Classes de status (Estavam no HTML estático)
const CLASSES_STATUS = {
    "Aberto": "bg-warning text-dark",
    "Em atendimento": "status-em-atendimento",
    "Resolvido": "bg-success"
};

let usuarioAtual = null;
let chamadosDoCliente = [];
let paginaAtual = 1;
let chamadoAberto = null; // o chamado que está no modal de detalhes para servir de auxílio ao botão "Responder"

// Guarda a nota do usuario
let notaSelecionada = 0;

// Pinta as estrelas visulmente até a quantidade informada
function pintarEstrelas(quantidade) {
    estrelas.forEach(function (estrela) {
        // Lê o valor numérico guardado no atributo data-nota de cada estrela
        const valor = parseInt(estrela.dataset.nota);

        if (valor <= quantidade) {
            // Estrela dentro da faixa selecionada fica preenchida
            estrela.classList.remove('ti-star');
            estrela.classList.add('ti-star-filled');
        } else {
            // Estrela fora da faixa: volta a ficar vazia
            estrela.classList.remove('ti-star-filled');
            estrela.classList.add('ti-star');
        }
    });
}

// Conecta os eventos de clique e hover em cada uma das 5 estrelas
estrelas.forEach(function (estrela) {
    // Clique: fixa a nota selecionada
    estrela.addEventListener('click', function () {
        notaSelecionada = parseInt(this.dataset.nota);
        pintarEstrelas(notaSelecionada);
    });

    // Hover: mostra prévia
    estrela.addEventListener('mouseenter', function () {
        pintarEstrelas(parseInt(this.dataset.nota));
    });
});

// Ao tirar o mouse de cima do grupo inteiro, volta a mostrar a nota realmente selecionada
containerEstrelas.addEventListener('mouseleave', function () {
    pintarEstrelas(notaSelecionada);
});

const botoesVerDetalhes = document.querySelectorAll(".btn-ver-detalhes");
const modalDetalhesChamado = new bootstrap.Modal(document.getElementById("modalDetalhesChamado"));

botoesVerDetalhes.forEach(botao => {
    botao.addEventListener("click", () => {
        modalDetalhesChamado.show();
    });
});

const botoesAvaliarChamado = document.querySelectorAll(".btn-avaliar-chamado");
const modalAvaliarChamado = new bootstrap.Modal(document.getElementById("modalAvaliarChamado"));

botoesAvaliarChamado.forEach(botao => {
    botao.addEventListener("click", () => {
        modalAvaliarChamado.show();
    });
});

async function buscarChamadosDoCliente(clienteID) {
    const resp = await fetch(`${API_URL_CHAMADO}/chamados?clienteID=${clienteID}`);

    if (resp.status === 404) return [];
    if (!resp.ok) throw new Error("Erro ao buscar os chamados");

    const chamados = await resp.json();

    return chamados.filter(chamado => String(chamado.clienteID) === String(clienteID));
}

async function buscarChamado(chamadoID) {
    const resp = await fetch(`${API_URL_CHAMADO}/chamados/${chamadoID}`);

    if (resp.status === 404) return [];
    if (!resp.ok) throw new Error("Erro ao buscar os chamados");

    const chamado = await resp.json();

    // Garante que o chamado é do cliente logado
    if (String(chamadoID) !== String(chamado.id)) throw new Error("Chamado de outro cliente");

    return chamado;
}

// Chamdos do mais recente ao mais antigo
function ordenarChamados() {
    chamadosDoCliente.sort((a, b) => {
        if (a.dataAbertura !== b.dataAbertura) {
            return a.dataAbertura < b.dataAbertura ? 1 : -1;
        }

        return Number(b.id) - Number(a.id);
    });
}

function renderizarConversa(chamado) {
    const mensagens = document.getElementById("detalhes-mensagens");
    mensagens.innerHTML = "";

    // Mensagem definida que o cliente escreveu ao abrir o chamado
    mensagens.append(criarMensagem(chamado.descricao, "resposta-cliente"));

    // Respostas, na ordem da lista, ignorando as vazias
    const respostas = (chamado.respostasChamado || []).filter(resposta => { return String(resposta.mensagem || "").trim() !== "" });

    respostas.forEach(resposta => {
        const doCliente = resposta.autor === "Cliente";
        mensagens.append(criarMensagem(resposta.mensagem, doCliente ? "resposta-cliente" : "resposta-adm"));
    });

    const admRespondeu = respostas.some(resposta => resposta.autor === "Administrador");

    if (!admRespondeu) {
        mensagens.append(criarMensagem("Aguardando resposta do suporte.", "text-center aviso-adm"));
    }
}

function formatarData(dataIso) {
    if (!dataIso || dataIso === "0000-00-00") return "-";
    const partes = dataIso.split("-");
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function criarCardChamado(chamado) {
    const coluna = document.createElement("div");
    coluna.className = "col-12 col-md-6";

    coluna.innerHTML = `
        <article class="card-atendimento">
            <div class="d-flex flex-column-reverse flex-lg-row justify-content-between">
                <div>
                    <small class="atendimento-data"></small>
                    <h2 class="atendimento-assunto mt-lg-1"></h2>
                </div>
                <p class="badge rounded-pill mb-2 p-2 px-4 status-atendimento align-self-start"></p>
            </div>
            <p class="atendimento-descricao"></p>
            <div class="d-flex flex-column-reverse flex-lg-row gap-2 mt-auto acoes-chamado">
                <button type="button" class="botao px-3 w-100 w-lg-auto ms-auto btn-ver-detalhes">Ver detalhes</button>
            </div>
        </article>`;

    // Dados do MockAPI são preenchidos com o textContent
    coluna.querySelector(".atendimento-data").textContent = `Realizado em ${formatarData(chamado.dataAbertura)}`;
    coluna.querySelector(".atendimento-assunto").textContent = chamado.assunto;
    coluna.querySelector(".atendimento-descricao").textContent = chamado.descricao;

    const selo = coluna.querySelector(".status-atendimento");
    selo.textContent = chamado.status;
    selo.className += " " + (CLASSES_STATUS[chamado.status] || "bg-secondary");

    const botaoDetalhes = coluna.querySelector(".btn-ver-detalhes");
    botaoDetalhes.addEventListener("click", () => abrirDetalhes(chamado.id));

    if (chamado.status === "Resolvido") {
        const botaoAvaliar = document.createElement("button");
        botaoAvaliar.type = "button";
        botaoAvaliar.className = "botao-secundario px-3 w-100 w-lg-auto ms-auto btn-avaliar-chamado";
        botaoAvaliar.textContent = "Avaliar atendimento";
        botaoAvaliar.setAttribute("data-bs-toggle", "modal");
        botaoAvaliar.setAttribute("data-bs-target", "#modalAvaliarChamado");

        botaoDetalhes.classList.remove("ms-auto");
        coluna.querySelector(".acoes-chamado").prepend(botaoAvaliar);
    }

    return coluna;
}

function mostrarMensagemLista(texto) {
    const lista = document.getElementById("lista-chamados");
    lista.innerHTML = "";

    const mensagem = document.createElement("p");
    mensagem.className = "col-12 text-center my-5";
    mensagem.textContent = texto;
    lista.append(mensagem);
}

function renderizarPagina(pagina, rolar) {
    if (chamadosDoCliente.length === 0) {
        mostrarMensagemLista("Você ainda não possui um chamado em aberto.");
        return null;
    }
    renderizarPaginacao();

    const totalPaginas = Math.ceil(chamadosDoCliente.length / CHAMADOS_POR_PAGINA);
    if (pagina < 1) pagina = 1;
    if (pagina > totalPaginas) pagina = totalPaginas;
    paginaAtual = pagina;

    const inicio = (paginaAtual - 1) * CHAMADOS_POR_PAGINA;
    const chamadosDaPagina = chamadosDoCliente.slice(inicio, inicio + CHAMADOS_POR_PAGINA);

    const lista = document.getElementById("lista-chamados");
    lista.innerHTML = "";
    chamadosDaPagina.forEach(chamado => lista.append(criarCardChamado(chamado)));

    renderizarPaginacao();

    if (rolar) lista.scrollIntoView({ behavior: "smooth" });
}

function renderizarPaginacao() {
    const totalPaginas = Math.ceil(chamadosDoCliente.length / CHAMADOS_POR_PAGINA);
    const paginacao = document.getElementById("paginacao");
    paginacao.innerHTML = "";

    if (totalPaginas <= 1) return null;

    paginacao.append(criarSeta("left", paginaAtual - 1, paginaAtual === 1, "Página Anterior"));
    for (let pagina = 1; pagina <= totalPaginas; pagina++) {
        paginacao.append(criarNumero(pagina, pagina === paginaAtual));
    }
    paginacao.append(criarSeta("right", paginaAtual + 1, paginaAtual === totalPaginas, "Proxima Página"));
}

function criarSeta(direcao, pagina, desabilitado, aria) {
    const item = document.createElement("li");
    item.className = desabilitado ? "page-item" : "page-item";

    const link = document.createElement("a");
    link.className = "page-link paginacao-seta";
    link.href = "#";
    link.setAttribute("aria-label", aria);
    link.innerHTML = `<span aria-hidden="true"><i class="ti ti-chevron-compact-${direcao}"></i></span>`;

    link.addEventListener("click", (e) => {
        e.preventDefault();
        if (!desabilitado) renderizarPagina(pagina, true);
    });

    item.appendChild(link);
    return item;
}

function criarNumero(pagina, ativo) {
    const item = document.createElement("li");
    item.className = `page-item ${ativo ? "ativo" : ''}`;

    const link = document.createElement("a");
    link.className = `page-link paginacao-numeracao ${ativo ? "link-ativo" : ''}`;
    link.href = "#";
    link.textContent = pagina;

    if (ativo) link.setAttribute("aria-current", "page");

    link.addEventListener("click", (e) => {
        e.preventDefault();
        renderizarPagina(pagina, true);
    });

    item.appendChild(link);
    return item;
}

async function carregarChamados() {
    mostrarMensagemLista("Carregando seus chamados...");

    try {
        chamadosDoCliente = await buscarChamadosDoCliente(usuarioAtual.id);
        ordenarChamados();
        renderizarPagina(1);

    } catch (erro) {
        console.error(erro);
        mostrarMensagemLista("Não foi possível carregar os chamados");
        mostrarToast("Erro", "Não foi possível carregar os seus chamados. Tente Novamente.", "erro");
    }
}

// Data seguindo com base no fuso do Brasil
function dataHoje() {
    const hoje = new Date();
    const mes = String(hoje.getMonth() + 1).padStart(2, "0");
    const dia = String(hoje.getDate()).padStart(2, "0");
    return `${hoje.getFullYear()}-${mes}-${dia}`;
}

async function enviarChamado() {
    const campoAssunto = document.getElementById("assunto");
    const campoDescricao = document.getElementById("descricao");
    const assunto = campoAssunto.value.trim();
    const descricao = campoDescricao.value.trim();

    if (!assunto || !descricao) {
        mostrarToast("Campos obrigatórios", "Preencha o assunto e a descrição.", "erro");
        return null;
    }

    const novoChamado = {
        clienteID: Number(usuarioAtual.id),
        assunto: assunto,
        descricao: descricao,
        status: "Aberto",
        dataAbertura: dataHoje(),
        ultimaAtualizacao: dataHoje(),
        respostasChamado: [],
        avaliacoesAtendimento: []
    };

    const botao = document.getElementById("btn-enviar-chamado");
    botao.disabled = true;

    try {
        const resp = await fetch(`${API_URL_CHAMADO}/chamados`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(novoChamado)
        });

        if (!resp.ok) throw new Error("Erro ao abrir o chamado");

        const chamadoCriado = await resp.json();

        // Entra na lista sem recarregar a página
        chamadosDoCliente.push(chamadoCriado);
        ordenarChamados();
        renderizarPagina(1);

        document.getElementById("form-chamado").reset();
        bootstrap.Modal.getOrCreateInstance("#modalAbrirChamado").hide();
        mostrarToast("Chamado aberto", `Seu chamado de nº ${chamadoCriado.id} foi aberto com sucesso.`, "sucesso");

    } catch (erro) {
        console.error(erro);
        mostrarToast("Erro", "Não foi possível abrir o chamado. Tente novamente.", "erro");
    } finally {
        botao.disabled = false;
    }
}

function criarMensagem(texto, classe) {
    const mensagem = document.createElement("p");
    mensagem.className = classe;
    mensagem.textContent = texto;
    return mensagem;
}

function preencherDetalhes(chamado) {
    document.getElementById("detalhes-titulo").textContent = `Chamado nº ${chamado.id} · ${chamado.assunto}`;

    const status = document.getElementById("detalhes-status");
    status.className += " " + CLASSES_STATUS[chamado.status] || "bg-secondary";

    status.textContent = chamado.status;

    document.getElementById("detalhes-abertura").textContent = `Aberto em ${formatarData(chamado.dataAbertura)}`;
    document.getElementById("detalhes-atualizacao").textContent = `Última atualização em ${formatarData(chamado.ultimaAtualizacao)}`;

    renderizarConversa(chamado);

    const resolvido = chamado.status === "Resolvido";
    document.getElementById("form-resposta").classList.toggle("d-none", resolvido);
    document.getElementById("aviso-resolvido").classList.toggle("d-none", !resolvido);
}

async function abrirDetalhes(chamadoID) {
    const modal = bootstrap.Modal.getOrCreateInstance("#modalDetalhesChamado");
    const mensagens = document.getElementById("detalhes-mensagens");

    chamadoAberto = null;
    document.getElementById("resposta").value = "";
    mensagens.innerHTML = "";
    mensagens.append(criarMensagem("Carregando chamado...", "text-center"));
    modal.show();

    try {
        chamadoAberto = await buscarChamado(chamadoID);
        preencherDetalhes(chamadoAberto);

    } catch (erro) {
        console.error(erro);
        modal.hide();
        mostrarToast("Erro", "Não foi possível carregar os detalhes do chamado.", "erro");
    }
}

function gerarIdResposta(respostas) {
    let maiorId = 0;
    respostas.forEach(resposta => {
        if (Number(resposta.id) > maiorId) maiorId = Number(resposta.id);

        return maiorId + 1;
    });
}

async function salvarChamado(chamado) {
    const resp = await fetch(`${API_URL_CHAMADO}/chamados/${chamado.id}`, {
        method: "PUT",
        headers: { "Content-type": "Application/json" },
        body: JSON.stringify(chamado)
    });

    if (!resp.ok) throw new Error("Erro ao salvar o chamado.");

    return await resp.json();
}

async function enviarResposta() {
    if (!chamadoAberto) return;

    const campo = document.getElementById("resposta");
    const texto = campo.value.trim();

    if (!texto) {
        mostrarToast("Resposta vazia", "Digite uma mensagem para responder", "aviso");
        return null;
    }

    const botao = document.getElementById("btn-enviar-resposta");

    botao.disabled = true;

    try {
        // Versão mais recente do chamado (Porque pode acontecer de o administrador já ter respondido)
        console.log(chamadoAberto.id);
        
        const chamadoAtual = await buscarChamado(chamadoAberto.id);

        if (chamadoAtual.status === "Resolvido") {
            chamadoAberto = chamadoAtual;
            preencherDetalhes(chamadoAberto);
            mostrarToast("Chamado resolvido", "Este chamado não necebe novas respostas.", "erro");
            return null;
        }

        // Lança a resposta do cliente
        const respostas = chamadoAtual.respostasChamado || [];

        // cria uma lista nova em cima do que já estava criado, acumulando as respostas e mostrando no final
        chamadoAtual.respostasChamado = respostas.concat([{
            id: gerarIdResposta(respostas),
            autor: "Cliente",
            autorID: Number(usuarioAtual.id),
            mensagem: texto
        }]);

        // Salva o chamado novo e retorna a conversa atualizada
        chamadoAberto = await salvarChamado(chamadoAtual);
        campo.value = "";
        preencherDetalhes(chamadoAberto);
        mostrarToast("Resposta enviada", "Sua mensagem foi enviada ao suporte com sucesso.", "sucesso");
    } catch (erro) {
        console.error(erro);
        mostrarToast("Erro", "Não foi possível enviar a resposta ao suporte. Tente novamente mais tarde. ", "erro");
    } finally {
        botao.disabled = false;
    }
}

document.addEventListener("DOMContentLoaded", () => {
    usuarioAtual = verificarAut("Cliente");
    if (!usuarioAtual) return null;

    carregarChamados();
    document.getElementById("btn-enviar-chamado").addEventListener("click", enviarChamado);

    document.getElementById("btn-enviar-resposta").addEventListener("click", enviarResposta);

    document.getElementById("form-resposta").addEventListener("submit", (e) => {
        e.preventDefault();
        enviarResposta();
    })
});