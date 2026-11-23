import { mostrarToast } from "./toast.js";

const URL_USUARIOS = "https://6aaac6cdff4dd5698b4f060c.mockapi.io/usuarios";
const URL_PEDIDOS = "https://6a98614f7160beda2292eff8.mockapi.io/pedidos";
const URL_PRODUTOS = "https://6a98614f7160beda2292eff8.mockapi.io/produtos";

const MENSAGEM_SEM_PEDIDOS = "Ainda não possui pedidos registrados por um lojista.";
const MENSAGEM_BUSCA_VAZIA = "Sua busca não retornou nenhum pedido. Simplifique sua pesquisa para encontrar um resultado.";

const ITENS_POR_PAGINA = 6;

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
    mensagem.className = "col-12 text-center my-5";
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
    let total = 0;
    const itens = pedido.itens || [];

    itens.forEach(item => total = total + Number(item.quantidade));

    return total;
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
    botao.dataset.idPedido = pedido.id;

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

function mostrarResultado() {
    if (pedidosFiltrados.length === 0) {
        mostrarMensagemLista(MENSAGEM_BUSCA_VAZIA);
        return null;
    }

    renderizarLista(pedidosFiltrados);
}

function aplicarPesquisa() {
    if (listaPedidos.length === 0) return null;

    const termo = normalizarTexto(document.getElementById("input-pesquisa").value).trim();
    if (termo === "") pedidosFiltrados = listaPedidos;
    else pedidosFiltrados = listaPedidos.filter(pedido => pedidoCombinaComTermo(pedido, termo));

    mostrarResultado();
}

function renderizarPagina(pagina, rolar) {
    const totalPaginas = Math.ceil(pedidosFiltrados.length / CHAMADOS_POR_PAGINA);
    if (pagina < 1) pagina = 1;
    if (pagina > totalPaginas) pagina = totalPaginas;

    paginaAtual = pagina;

    const inicio = (paginaAtual - 1) * ITENS_POR_PAGINA;
    const pedidosDaPagina = pedidosFiltrados.slice(inicio, inicio + ITENS_POR_PAGINA);

    renderizarLista(pedidosDaPagina);
    renderizarPaginacao(totalPaginas);

    if (rolar) lista.scrollIntoView({ behavior: "smooth" });
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
            return null;
        }
        ordenarPorData(listaPedidos);
        pedidosFiltrados = listaPedidos;
        mostrarResultado();

    } catch (error) {
        console.error(error);
        mostrarMensagemLista("Não foi possível carregar os pedidos.");
        mostrarToast("Erro", "Falha ao carregar os pedidos. Tente novamente mais tarde.", "erro");
    }
}

document.addEventListener("DOMContentLoaded", () => {
    carregarListaPedidos();

    document.getElementById("input-pesquisa").addEventListener("input", () => aplicarPesquisa());

    document.getElementById("form-pesquisa").addEventListener("submit", (e) => {
        e.preventDefault();
        aplicarPesquisa();
    });
});
