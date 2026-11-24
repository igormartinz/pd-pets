import { mostrarToast } from "./toast.js";

const URL_USUARIOS = "https://6aaac6cdff4dd5698b4f060c.mockapi.io/usuarios";
const URL_PEDIDOS = "https://6a98614f7160beda2292eff8.mockapi.io/pedidos";
const URL_PRODUTOS = "https://6a98614f7160beda2292eff8.mockapi.io/produtos";

const MENSAGEM_SEM_PEDIDOS = "Ainda não possui pedidos registrados por um lojista.";
const MENSAGEM_BUSCA_VAZIA = "Sua busca não retornou nenhum pedido. Simplifique sua pesquisa para encontrar um resultado.";

const ITENS_POR_PAGINA = 9;

let paginaAtual = 1;

let listaPedidos = [];
let pedidosFiltrados = [];
let dicionarioUsuarios = [];
let dicionarioProdutos = [];

const CLASSES_STATUS = ["aguardando-pagamento", "pago", "separando", "enviado", "entregue", "cancelado"];

async function buscarLista(url) {
    const resp = await fetch(url);

    if (resp.status === 404) return [];
    if (!resp.ok) throw new Error("Erro" + resp.status + "ao buscar" + url);

    return await resp.json();
}

function mostrarMensagemLista(texto) {
    const lista = document.getElementById("lista-pedidos");
    lista.innerHTML = "";

    const mensagem = document.createElement("p");
    mensagem.className = "col-12 text-center my-5 txt-aviso";
    mensagem.textContent = texto;
    lista.append(mensagem);
}

function montarDicionario(lista) {
    const dicionario = {};

    lista.forEach(item => {
        dicionario[String(item.id)] = item;
    });

    return dicionario;
}

function formatarData(data) {
    if (!data) {
        return "-";
    }
    const partes = data.split("-");
    return partes[2] + "/" + partes[1] + "/" + partes[0];
}

function formatarMoeda(valor) {
    return Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function normalizarTexto(texto) {
    return String(texto)
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}

function classeStatus(status) {
    const classe = normalizarTexto(status).trim().split(" ").join("-");

    if (CLASSES_STATUS.includes(classe)) return classe;

    return "";
}

function nomeCliente(pedido) {
    const cliente = dicionarioUsuarios[String(pedido.clienteID)];

    if (!cliente) return "Cliente desconhecido";

    return cliente.nomeCompleto;
}

function nomeEmpresaProduto(produtoID) {
    const produto = dicionarioProdutos[String(produtoID)];
    if (!produto) return "Lojista desconhecido.";

    const lojista = dicionarioUsuarios[String(produto.lojistaID)];
    if (!lojista || !lojista.nomeEmpresa) return "Lojista desconhecido.";

    return lojista.nomeEmpresa;
}

function totalItens(pedido) {
    const itens = pedido.itens || [];

    return itens.length;
}

function criarElemento(tag, classe, texto) {
    const elemento = document.createElement(tag);

    if (classe) elemento.className = classe;

    if (texto !== undefined) elemento.textContent = texto;

    return elemento;
}

function criarBloco(classeBox, rotulo, valor, classeValor) {
    const bloco = criarElemento("div", classeBox);
    bloco.appendChild(criarElemento("p", "", rotulo));
    bloco.appendChild(criarElemento("p", classeValor, valor));

    return bloco;
}

function criarCardPedido(pedido) {
    const coluna = criarElemento("div", "col-12 col-md-6 col-lg-4");
    const card = criarElemento("article", "card-pedido");

    // Número (ID), cliente, status
    const cabecalho = criarElemento("div", "header-card-pedido");
    const info = criarElemento("div", "Id-nome-pedidos-info");
    info.appendChild(criarElemento("p", "id-pedido", "#" + pedido.id));
    info.appendChild(criarElemento("p", "nome-pedido text-truncate", nomeCliente(pedido)));
    cabecalho.appendChild(info);
    cabecalho.appendChild(criarElemento("span", classeStatus(pedido.status), pedido.status));

    // Data e valor
    const infoPedido = criarElemento("div", "container-info-pedido-adm");
    infoPedido.appendChild(criarBloco("box-data", "Data", formatarData(pedido.data), "data-pedido"));
    infoPedido.appendChild(criarBloco("box-valor-total", "Valor total", formatarMoeda(pedido.valorTotal), "valor-total-pedido"));
    infoPedido.appendChild(criarBloco("box-itens", "Itens", totalItens(pedido), "itens-pedido"));

    // Botão (Ver produtos)
    const botao = criarElemento("button", "botao-secundario btn-ver-produtos", "Ver produtos");
    botao.type = "button";
    botao.dataset.pedidoId = pedido.id;

    card.appendChild(cabecalho);
    card.appendChild(infoPedido);
    card.appendChild(botao);
    coluna.appendChild(card);

    return coluna;
}


function ordenarPorData(lista) {
    lista.sort((a, b) => {
        if (a.data !== b.data) {
            return String(b.data).localeCompare(String(a.data));
        }

        return Number(b.id) - Number(a.id);
    });

}

function renderizarLista(lista) {
    const container = document.getElementById("lista-pedidos");
    container.innerHTML = "";

    lista.forEach(pedido => {
        container.appendChild(criarCardPedido(pedido));
    })
}

function pedidoCombinaComTermo(pedido, termo) {
    const cliente = normalizarTexto(nomeCliente(pedido));
    const numero = String(pedido.id);
    const status = normalizarTexto(pedido.status);
    const termoSemHashtag = termo.split("#").join("");

    return cliente.includes(termo)
        || numero.includes(termoSemHashtag)
        || status.includes(termo);
}

function aplicarPesquisa() {
    if (listaPedidos.length === 0) return null;

    const termo = normalizarTexto(document.getElementById("input-pesquisa").value).trim();
    if (termo === "") pedidosFiltrados = listaPedidos;
    else pedidosFiltrados = listaPedidos.filter(pedido => pedidoCombinaComTermo(pedido, termo));

    renderizarPagina(1, false);
}

function renderizarPagina(pagina, rolar) {
    if (pedidosFiltrados.length === 0) {
        mostrarMensagemLista(MENSAGEM_BUSCA_VAZIA);
        renderizarPaginacao();
        return null;
    }

    const totalPaginas = Math.ceil(pedidosFiltrados.length / ITENS_POR_PAGINA);
    paginaAtual = Math.max(1, Math.min(pagina, totalPaginas));

    const inicio = (paginaAtual - 1) * ITENS_POR_PAGINA;
    const fim = inicio + ITENS_POR_PAGINA;
    const pedidosDaPagina = pedidosFiltrados.slice(inicio, fim);

    renderizarLista(pedidosDaPagina);
    renderizarPaginacao();

    if (rolar) document.getElementById("lista-pedidos-adm").scrollIntoView({ behavior: "smooth" });
}

function renderizarPaginacao() {
    const totalPaginas = Math.ceil(pedidosFiltrados.length / ITENS_POR_PAGINA);
    const paginacao = document.getElementById("paginacao");

    paginacao.innerHTML = "";

    if (totalPaginas <= 1) return null;

    paginacao.appendChild(criarSeta("left", paginaAtual - 1, paginaAtual === 1, "Página anterior"));

    paginasVisiveis(totalPaginas, paginaAtual).forEach(pagina => {
        if (pagina === "...") {
            paginacao.appendChild(criarReticencias());
        } else {
            paginacao.appendChild(criarNumero(pagina, pagina === paginaAtual));
        }
    });

    paginacao.appendChild(criarSeta("right", paginaAtual + 1, paginaAtual === totalPaginas, "Próxima página"));
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
    texto.setAttribute("aria-hidden", "true");

    item.append(texto);
    return item;
}

async function buscarPedido(id) {
    const resp = await fetch(URL_PEDIDOS + "/" + id);

    if (resp.status === 404) return null;
    if (!resp.ok) throw new Error("Erro" + resp.status + "ao buscar o pedido" + id);

    return await resp.json();
}

function criarItemProduto(item) {
    const produto = dicionarioProdutos[String(item.produtoID)];
    let nomeProduto = "Produto desconhecido";
    if (produto) nomeProduto = produto.nome;

    const quantidade = Number(item.quantidade);
    const subTotal = Number(item.valorUnitario) * quantidade;

    const artigo = criarElemento("article", "produto");

    const vendidoPor = criarElemento("h3", "nome-empresa", "vendido por");
    vendidoPor.appendChild(criarElemento("p", "nomeEmpresa", nomeEmpresaProduto(produto.lojistaID)));

    const nome = criarElemento("h4", "text-truncate", nomeProduto);
    nome.title = nomeProduto;
    const txtQuantidade = criarElemento("p", "produto-quantidade", "Quantidade: ");
    txtQuantidade.appendChild(criarElemento("span", "", quantidade));

    const preco = criarElemento("p", "produto-preco-total", formatarMoeda(subTotal));

    artigo.appendChild(vendidoPor);
    artigo.appendChild(nome);
    artigo.appendChild(txtQuantidade);
    artigo.appendChild(preco);

    return artigo;
}

function preencherInfoModal(pedido, data, valorTotal) {
    document.getElementById("modalPedidoId").textContent = pedido;
    document.getElementById("modalData").textContent = data;
    document.getElementById("modalValorTotal").textContent = valorTotal;
}

function preencherModal(pedido) {
    preencherInfoModal(
        "#" + pedido.id,
        formatarData(pedido.data),
        formatarMoeda(pedido.valorTotal)
    );

    const container = document.getElementById("detalhes-produtos");
    container.innerHTML = "";

    const itens = pedido.itens || [];
    if (itens.length === 0) {
        container.append(criarElemento("p", "", "Este pedido não possui produtos."));
        return null;
    }

    itens.forEach(item => {
        container.appendChild(criarItemProduto(item));
    });
}

async function abrirDetalhesPedido(botao) {
    const id = botao.dataset.pedidoId;
    const modal = bootstrap.Modal.getOrCreateInstance("#modalVerDetalhes");

    preencherInfoModal("", "", "")

    const container = document.getElementById("detalhes-produtos");
    container.innerHTML = "";
    container.appendChild(criarElemento("p", "txt-aviso", "Carregando..."));
    modal.show();

    botao.disabled = true;

    try {
        const pedido = await buscarPedido(id);

        if (!pedido) {
            modal.hide();
            mostrarToast("Aviso", "Este pedido não foi encontrado.", "aviso");
            return null;
        }

        preencherModal(pedido);
    } catch (erro) {
        console.error(erro);
        modal.hide();
        mostrarToast("Erro", "Não foi possível carregar os produtos do pedido.", "erro");
    } finally {
        botao.disabled = false;
    }
}

async function carregarListaPedidos() {
    mostrarMensagemLista("Carregando...");

    try {
        const resultados = await Promise.all([
            buscarLista(URL_PEDIDOS),
            buscarLista(URL_USUARIOS),
            buscarLista(URL_PRODUTOS)
        ]);

        listaPedidos = resultados[0];
        dicionarioUsuarios = montarDicionario(resultados[1]);
        dicionarioProdutos = montarDicionario(resultados[2]);

        if (listaPedidos.length === 0) {
            mostrarMensagemLista(MENSAGEM_SEM_PEDIDOS);
            renderizarPaginacao();
            return null;
        }
        ordenarPorData(listaPedidos);
        pedidosFiltrados = listaPedidos;
        renderizarPagina(1, false);

    } catch (error) {
        console.error(error);
        mostrarMensagemLista("Não foi possível carregar os pedidos.");
        mostrarToast("Erro", "Falha ao carregar os pedidos. Tente novamente mais tarde.", "erro");
        renderizarPaginacao();
    }
}

document.addEventListener("DOMContentLoaded", () => {
    carregarListaPedidos();

    document.getElementById("input-pesquisa").addEventListener("input", () => aplicarPesquisa());

    document.getElementById("form-pesquisa").addEventListener("submit", (e) => {
        e.preventDefault();
        aplicarPesquisa();
    });

    document.getElementById("lista-pedidos").addEventListener("click", (e) => {
        const botao = e.target.closest(".btn-ver-produtos");
        if (botao) abrirDetalhesPedido(botao);
    })
});
