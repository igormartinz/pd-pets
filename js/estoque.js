import { mostrarToast } from "./toast.js";

const API_URL_PRODUTO = "https://6a98614f7160beda2292eff8.mockapi.io";

const PRODUTOS_POR_PAGINA = 6;

const NOMES_CATEGORIAS = {
    1: "Ração e Petiscos",
    2: "Higiene",
    3: "Brinquedos",
    4: "Acessórios",
    5: "Medicamentos",
    6: "Roupas",
    7: "Camas e Casinhas"
}

let produtosDoLojista = [];
let produtosFiltrados = [];

async function buscarProdutoDoLojista(idLojista) {
    const resp = await fetch(`${API_URL_PRODUTO}/produtos?lojistaID=${idLojista}`);

    // No MockAPI, 404 com filtro vai ser igual a nenhum produto encontrado
    if (resp.status === 404) return [];
    if (!resp.ok) throw new Error("Erro ao buscar produtos");

    const produtos = await resp.json();

    // o filtro do MockAPI é parcial (lojistaID=1 traz 1, 10, 11...) então precisamos conferir o valor exato
    return produtos.filter(produto => {
        return String(produto.lojistaID) === String(idLojista);
    })
}

function formatarPreco(valor) {
    return Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function nomeCategoria(categoriaID) {
    return NOMES_CATEGORIAS[categoriaID] || "Sem categoria";
}

function criarCelula(classe) {
    const celula = document.createElement("td");
    if (classe) celula.className = classe;
    return celula;
}

function criarSelo(texto, classe) {
    const selo = document.createElement("span");
    selo.className = classe;
    selo.textContent = texto;
    return selo;
}

function criarLinhaProduto(produto) {
    const linha = document.createElement("tr");
    linha.className = "corpo-tabela-linha";

    // nome do produto
    const celulaNome = criarCelula();
    celulaNome.className = "nome-produto-tabela text-truncate";
    celulaNome.textContent = produto.nome;

    // Categoria e preco
    const celulaCategoria = criarCelula();
    celulaCategoria.textContent = nomeCategoria(produto.categoriaID);

    const celulaPreco = criarCelula();
    celulaPreco.textContent = formatarPreco(produto.preco);

    // Estoque = 0 vira "Esgotado"
    const celulaEstoque = criarCelula("coluna-tabela-centro");
    if (Number(produto.estoque) === 0) {
        celulaEstoque.append(criarSelo("Esgotado", "estoque-esgotado"));
    } else {
        celulaEstoque.textContent = produto.estoque;
    }

    // Status. Se ativo = true fica com o selo verde, senão selo vermelho
    const celulaStatus = criarCelula("coluna-tabela-centro unidade-tabela-border-radius-direita");
    const ativo = produto.status === "Ativo";
    celulaStatus.append(criarSelo(produto.status, ativo ? "status-ativo" : "status-inativo"));

    // Ações (editar e excluir)
    const celulaAcoes = criarCelula("coluna-tabela-centro");
    celulaAcoes.innerHTML = `
    <div class="acoes-tabela">
                <button class="btn-pencil" data-bs-target="#modalEditarProduto" data-bs-toggle="modal">
                    <i class="ti ti-pencil" style="font-size: 24px;"></i>
                </button>
                <button class="btn-trash" data-bs-target="#modalExcluirProduto" data-bs-toggle="modal">
                    <i class="ti ti-trash" style="font-size: 24px;"></i>
                </button>
            </div>
    `

    linha.append(celulaNome, celulaCategoria, celulaPreco, celulaEstoque, celulaStatus, celulaAcoes);

    return linha;
}

function mostrarMensagemTabela(texto) {
    const corpo = document.getElementById("corpo-tabela-estoque");
    corpo.innerHTML = "";

    const linha = document.createElement("tr");
    const celula = document.createElement("td");
    celula.colSpan = 6;
    celula.className = "text center py-4 message-error";
    celula.textContent = texto;

    linha.append(celula);
    corpo.append(linha);
}

function renderizarPagina(pagina, rolar) {
    const corpo = document.getElementById("corpo-tabela-estoque");

    if (produtosFiltrados.length === 0) {
        mostrarMensagemTabela("Nenhum produto encontrado");
        renderizarPaginacao();
        return null;
    }

    const inicio = (pagina - 1) * PRODUTOS_POR_PAGINA;
    const fim = inicio + PRODUTOS_POR_PAGINA;
    const produtosDaPagina = produtosFiltrados.slice(inicio, fim);

    corpo.innerHTML = "";
    for (const produto of produtosDaPagina) {
        corpo.append(criarLinhaProduto(produto));
    }

    renderizarPaginacao();

    if (rolar) {
        document.getElementById("section-estoque").scrollIntoView({ behavior: "smooth" });
    }
}

function renderizarPaginacao() {
    const totalPaginas = Math.ceil(produtosFiltrados.length) / PRODUTOS_POR_PAGINA;
}

buscarProdutoDoLojista(1).then(lista => {
    document.getElementById("corpo-tabela-estoque").append(criarLinhaProduto(lista[0]));
});







