import { mostrarToast } from "./toast.js";

// endpoints de recursos
const API_URL_PRODUTOS = "https://6a98614f7160beda2292eff8.mockapi.io";
const API_URL_CATEGORIAS = "https://6a9872a37160beda2292ff4f.mockapi.io";
const API_URL_USUARIOS = "https://6aaac6cdff4dd5698b4f060c.mockapi.io";

const PRODUTOS_POR_PAGINA = 9;

let produtos = []; // todos os produtos cadastrados no MockAPI
let produtosFiltrados = []; // os que passaram na pesquisa
let paginaAtual = 1;
let nomesCategorias = {};
let nomesLojistas = {};
let produtoParaDesativar = null;

async function buscarProdutos() {
    const resp = await fetch(`${API_URL_PRODUTOS}/produtos`);
    if (resp.status === 404) return [];
    if (!resp.ok) throw new Error("Erro ao buscar os produtos da plataforma.");

    return await resp.json();
}

async function buscarCategorias() {
    try {
        const resp = await fetch(`${API_URL_CATEGORIAS}/categorias`);
        if (resp.status === 404) return [];
        if (!resp.ok) throw new Error("Erro ao buscar as categorias da plataforma.");

        const categorias = await resp.json();
        nomesCategorias = {};
        categorias.forEach(categoria => {
            nomesCategorias[String(categoria.id)] = categoria.nome;
        });
    } catch (erro) {
        console.error(erro);
    }
}

async function buscarLojistas() {
    try {
        const resp = await fetch(`${API_URL_USUARIOS}/usuarios`);
        if (resp.status === 404) return [];
        if (!resp.ok) throw new Error("Erro ao buscar o lojista");

        const usuarios = await resp.json();
        nomesLojistas = {};
        usuarios.forEach(usuario => {
            nomesLojistas[String(usuario.id)] = usuario.nomeResponsavel || usuario.nomeCompleto || usuario.nome;
        });
    } catch (erro) {
        console.error(erro);
    }
}

function nomeCategoria(id) {
    return nomesCategorias[String(id)] || "Sem categoria";
}

function nomeLojista(id) {
    return nomesLojistas[String(id)] || "Não informado";
}

function txtEstoque(estoque) {
    const quantidade = Number(estoque);
    return quantidade > 0 ? `Em estoque ${estoque}` : "Esgotado";
}

function criarCelula(texto, classe) {
    const celula = document.createElement("td");
    celula.className = classe || "linha-celula";
    if (texto !== undefined) celula.textContent = texto;
    return celula;
}

function criarLinhaProduto(produto) {
    const linha = document.createElement("tr");
    linha.className = "pedido-linha";

    // estoque com o selo
    const celulaEstoque = criarCelula(undefined, "linha-celula text-center");
    const selo = document.createElement("span");
    const esgotado = Number(produto.estoque) <= 0;
    selo.className = esgotado ? "produto-estoque esgotado" : "produto-estoque";
    selo.textContent = txtEstoque(produto.estoque);
    celulaEstoque.append(selo);

    // Switch de ativação
    const ativo = produto.status === "Ativo";
    const celulaStatus = criarCelula(undefined, "linha-celula status-switch");
    const campo = document.createElement("div");
    campo.className = "form-field";
    const formSwitch = document.createElement("div");
    formSwitch.className = "form-check form-switch";

    const chave = document.createElement("input");
    chave.className = "form-check-input";
    chave.type = "checkbox";
    chave.setAttribute("role", "switch");
    chave.id = `switch-produto-${produto.id}`;
    chave.checked = ativo;
    chave.setAttribute("aria-label", `${ativo ? "Desativar" : "Ativar"} ${produto.nome}`);
    chave.addEventListener("change", () => alterarSwitch(produto, chave));

    formSwitch.append(chave);
    campo.append(formSwitch);
    celulaStatus.append(campo);

    linha.append(
        criarCelula(produto.nome, "linha-celula text-truncate linha-nome"),
        criarCelula(nomeLojista(produto.lojistaID)),
        criarCelula(nomeCategoria(produto.categoriaID)),
        celulaEstoque,
        celulaStatus
    )

    return linha;
}

function mostrarMensagemTabela(texto) {
    const corpo = document.getElementById("tabela-produtos-lista");
    corpo.innerHTML = "";

    const linha = document.createElement("tr");
    const celula = document.createElement("td");
    celula.colSpan = 9;
    celula.className = "linha-celula text-center py-4";
    celula.textContent = texto;

    linha.append(celula);
    corpo.append(linha);
}

function renderizarPagina(pagina, rolar) {
    const corpo = document.getElementById("tabela-produtos-lista");

    if (produtosFiltrados.length === 0) {
        mostrarMensagemTabela("Nenhum produto foi encontrado.");
        renderizarPaginacao();
        return null;
    }

    paginaAtual = pagina;

    const inicio = (paginaAtual - 1) * PRODUTOS_POR_PAGINA;
    const fim = inicio + PRODUTOS_POR_PAGINA;
    const produtosDaPagina = produtosFiltrados.slice(inicio, fim);

    corpo.innerHTML = "";

    for (const produto of produtosDaPagina) {
        corpo.append(criarLinhaProduto(produto));
    }

    renderizarPaginacao();

    if (rolar) {
        document.getElementById("section-listagem-produtos").scrollIntoView({ behavior: "smooth" });
    }
}

function renderizarPaginacao() {
    const totalPaginas = Math.ceil(produtosFiltrados.length / PRODUTOS_POR_PAGINA);
    const paginacao = document.getElementById("paginacao");

    paginacao.innerHTML = "";

    if (totalPaginas <= 1) return null;

    paginacao.appendChild(criarSeta("left", paginaAtual - 1, paginaAtual === 1, "Página anterior"));

    paginasVisiveis(totalPaginas, paginaAtual).forEach(pagina => {
        if (pagina === "...") {
            paginacao.append(criarReticencias());
        } else {
            paginacao.appendChild(criarNumero(pagina, pagina === paginaAtual));
        }
    });

    paginacao.appendChild(criarSeta("right", paginaAtual + 1, paginaAtual === totalPaginas, "Proxima página"));
}

function criarSeta(direcao, pagina, desabilitado, aria) {
    const item = document.createElement("li");
    item.className = "page-item"

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

async function carregarListaProdutos() {
    mostrarMensagemTabela("Carregando produtos...");

    try {
        const resultados = await Promise.all([
            buscarProdutos(),
            buscarCategorias(),
            buscarLojistas()
        ]);

        produtos = resultados[0];
        produtosFiltrados = produtos;
        renderizarPagina(1);
    } catch (erro) {
        console.error(erro);
        mostrarMensagemTabela("Não foi possível carregar os produtos");
        mostrarToast("Erro", "Não foi possível carregar os produtos. Tente novamente mais tarde", "erro");
    }
}

function normalizarTexto(texto) {
    return String(texto)
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();
}

function aplicarPesquisa() {
    const termo = normalizarTexto(document.getElementById("input-pesquisa").value);

    produtosFiltrados = produtos.filter(produto => normalizarTexto(produto.nome).includes(termo));
    renderizarPagina(1);
}

function alterarSwitch(produto, chave) {

    if (chave.checked) {
        // Ligou: produto ativado
        salvarStatusProduto(produto, "Ativo", chave);
        return null;
    }

    // Desligou: produto inativo
    chave.checked = true;
    produtoParaDesativar = produto;
    document.getElementById("nome-produto-desativar").textContent = produto.nome;
    bootstrap.Modal.getOrCreateInstance("#modalDesativarProduto").show();
}

async function salvarStatusProduto(produto, novoStatus, chave) {
    if (chave) chave.disabled = true;

    try {
        const atualizado = JSON.parse(JSON.stringify(produto));
        atualizado.status = novoStatus;

        const resp = await fetch(`${API_URL_PRODUTOS}/produtos/${produto.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(atualizado)
        });

        if (!resp.ok) throw new Error("Não foi possível alterar o status do produto.");

        const produtoSalvo = await resp.json();

        // atualiza a lista em memória e redesenha a página
        produtos = produtos.map(item => String(item.id) === String(produtoSalvo.id) ? produtoSalvo : item);
        produtosFiltrados = produtosFiltrados.map(item => String(item.id) === String(produtoSalvo.id) ? produtoSalvo : item);
        renderizarPagina(paginaAtual);

        const acao = novoStatus === "Ativo" ? "ativado" : "desativado";
        mostrarToast(`Produto ${acao}`, `O ${produtoSalvo.nome} foi ${acao} com sucesso.`, "sucesso");
        return true;

    } catch (erro) {
        console.error(erro);
        renderizarPagina(paginaAtual); // volta o switch pro estado real
        mostrarToast("Erro", "Não foi possível alterar o status do produto. Tente novamente.", "erro");
        return false;
    }
}

async function confirmarDesativar() {
    if (!produtoParaDesativar) return null;

    const botao = document.getElementById("btn-confirmar-desativar");
    botao.disabled = true;

    const deuCerto = await salvarStatusProduto(produtoParaDesativar, "Inativo");

    botao.disabled = false;

    if (deuCerto) {
        bootstrap.Modal.getOrCreateInstance("#modalDesativarProduto").hide();
        produtoParaDesativar = null;
    }
}

function paginasVisiveis(totalPaginas, atual) {
    const paginas = [];

    if (totalPaginas <= 5) {
        for (let pagina = 1; pagina <= totalPaginas; pagina++) paginas.push(pagina);
        return paginas;
    }

    const inicio = Math.max(2, atual - 1);
    const fim = Math.min(totalPaginas - 1, atual + 1);

    paginas.push(1);
    if (inicio > 2) paginas.push("...");

    for (let pagina = inicio; pagina <= fim; pagina++) paginas.push(pagina);

    if (fim < totalPaginas - 1) paginas.push("...");
    paginas.push(totalPaginas);

    return paginas;
}

function criarReticencias() {
    const item = document.createElement("li");
    item.className = "page-item disabled page-reticencia";
    const texto = document.createElement("span");
    texto.className = "page-link paginacao-numeracao page-txt-reticencia";
    texto.textContent = "...";
    texto.setAttribute("arian-hidden", "true");

    item.append(texto);
    return item;
}

document.addEventListener("DOMContentLoaded", () => {
    const usuarioLogado = verificarAut("Administrador");
    if (!usuarioLogado);

    carregarListaProdutos();

    const inputPesquisa = document.getElementById("input-pesquisa");
    inputPesquisa.addEventListener("input", aplicarPesquisa);

    document.getElementById("form-pesquisa").addEventListener("submit", (e) => {
        e.preventDefault();
        aplicarPesquisa();
    });

    document.getElementById("btn-confirmar-desativar").addEventListener("click", confirmarDesativar);
})