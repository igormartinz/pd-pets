import { mostrarToast } from "./toast.js";

const URL_PRODUTOS = 'https://6a98614f7160beda2292eff8.mockapi.io/produtos';
const URL_CATEGORIAS = 'https://6a9872a37160beda2292ff4f.mockapi.io/categorias';

const PRODUTOS_POR_PAGINA = 6;

const CAMPOS_CADASTRO = {
    nome: 'prod-nome', categoria: 'prod-categoria', preco: 'prod-preco',
    estoque: 'prod-estoque', descricao: 'prod-descricao', status: 'prod-status'
};
const CAMPOS_EDICAO = {
    nome: 'edit-nome', categoria: 'edit-categoria', preco: 'edit-preco',
    estoque: 'edit-estoque', descricao: 'edit-descricao', status: 'edit-status'
};

let idProdutoEmEdicao = null;
let categoriasProntas = Promise.resolve();
let nomesCategorias = {};
let idProdutoEmExclusao = null;
let produtosDoLojista = [];
let produtosFiltrados = [];
let paginaAtual = 1;
let categoriaSelecionada = ""; // "" = todas as categorias

async function buscarProdutoDoLojista(idLojista) {
    const resp = await fetch(`${URL_PRODUTOS}?lojistaID=${idLojista}`);

    // No MockAPI, 404 com filtro vai ser igual a nenhum produto encontrado
    if (resp.status === 404) return [];
    if (!resp.ok) throw new Error("Erro ao buscar produtos");

    const produtos = await resp.json();

    // o filtro do MockAPI é parcial (lojistaID=1 traz 1, 10, 11...) então precisamos conferir o valor exato
    return produtos.filter(produto => {
        return String(produto.lojistaID) === String(idLojista);
    });
}


function formatarPreco(valor) {
    return Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function nomeCategoria(categoriaID) {
    return nomesCategorias[categoriaID] || "Sem categoria";
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
    celulaNome.className = "nome-produto-tabela text-truncate unidade-tabela-border-radius-esquerda";
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
    const celulaStatus = criarCelula("coluna-tabela-centro");
    const ativo = produto.status === "Ativo";
    celulaStatus.append(criarSelo(produto.status, ativo ? "status-ativo" : "status-inativo"));

    // Ações (editar e excluir)
    const celulaAcoes = criarCelula("coluna-tabela-centro unidade-tabela-border-radius-direita");
    celulaAcoes.innerHTML = `
            <div class="acoes-tabela">
                <button class="btn-pencil" data-bs-target="#modalEditarProduto" data-produto-id="${produto.id}" data-bs-toggle="modal">
                    <i class="ti ti-pencil" style="font-size: 24px;"></i>
                </button>
                <button class="btn-trash" data-produto-id="${produto.id}" data-bs-target="#modalExcluirProduto" data-bs-toggle="modal">
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
        document.getElementById("section-estoque").scrollIntoView({ behavior: "smooth" });
    }
}

function renderizarPaginacao() {
    const totalPaginas = Math.ceil(produtosFiltrados.length / PRODUTOS_POR_PAGINA);
    const paginacao = document.getElementById("paginacao");

    paginacao.innerHTML = "";

    if (totalPaginas <= 1) return null;

    paginacao.appendChild(criarSeta("left", paginaAtual - 1, paginaAtual === 1, "Página anterior"));

    for (let pagina = 1; pagina <= totalPaginas; pagina++) {
        paginacao.appendChild(criarNumero(pagina, pagina === paginaAtual));
    }

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

async function carregarEstoque(idLojista) {
    mostrarMensagemTabela("Carregando produtos...");

    try {
        produtosDoLojista = await buscarProdutoDoLojista(idLojista);
        produtosFiltrados = produtosDoLojista;
        renderizarPagina(1);
    } catch (erro) {
        console.error(erro);
        mostrarMensagemTabela("Não foi possível carregar os produtos.");
        mostrarToast("Erro", "Não foi possível carregar o estoque. Tente novamente.", "erro");
    }
}

function normalizarTexto(texto) {
    return String(texto)
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();
}

function selecionarCategoria(botao) {
    categoriaSelecionada = botao.dataset.categoria;

    aplicarFiltros();
}

// { nome: 'prod-nome', ... } -> { nome: <elemento>, ... }
function pegarCampos(ids) {
    return Object.fromEntries(
        Object.entries(ids).map(([chave, id]) => [chave, document.getElementById(id)])
    );
}

// Preenche o select dos DOIS modais com as categorias reais da API
async function popularCategoriasDosModais() {
    const selects = [document.getElementById('prod-categoria'), document.getElementById('edit-categoria')];
    const dropdown = document.getElementById('dropdown-categorias');

    try {
        const resposta = await fetch(URL_CATEGORIAS);
        if (!resposta.ok) throw new Error('Falha ao buscar as categorias');

        const categorias = await resposta.json();

        nomesCategorias = {};

        for (const categoria of categorias) {
            nomesCategorias[categoria.id] = categoria.nome;
        }

        const opcoes = '<option value="" selected disabled>Selecione a categoria</option>'
            + categorias.map(categoria => `<option value="${categoria.id}">${categoria.nome}</option>`).join('');

        for (const select of selects) select.innerHTML = opcoes;

        // Preenche o dropdown de filtros
        if (dropdown) {
            dropdown.innerHTML = '';

            const todasCategorias = document.createElement('button');
            todasCategorias.type = 'button';
            todasCategorias.className = 'dropdown-item';
            todasCategorias.textContent = 'Todas as categorias';
            todasCategorias.dataset.categoria = '';

            dropdown.appendChild(todasCategorias);

            for (const categoria of categorias) {
                const opcao = document.createElement('button');

                opcao.type = 'button';
                opcao.className = 'dropdown-item';
                opcao.textContent = categoria.nome;
                opcao.dataset.categoria = categoria.id;

                dropdown.appendChild(opcao);
            }
        }
    } catch (erro) {
        console.error(erro);
        for (const select of selects) {
            select.innerHTML = '<option value="" selected disabled>Não foi possível carregar as categorias</option>';
        }
    }
}

// Estoque: só dígitos. Bloqueia "-", letras, vírgula e ponto.
function conectarCampoEstoque() {
    for (const id of ['prod-estoque', 'edit-estoque']) {
        const campo = document.getElementById(id);
        campo.addEventListener('input', () => {
            campo.value = campo.value.replace(/\D/g, '');
        });
    }
}

function validarProduto(campos) {
    const nome = campos.nome.value.trim();
    const preco = Number(String(campos.preco.value).replace(',', '.'));
    const estoque = Number(campos.estoque.value.trim());
    const descricao = campos.descricao.value.trim();

    if (!nome) {
        return mostrarToast('Campo Nome', 'Informe o nome do produto.', 'erro');
    }
    if (!campos.categoria.value) {
        return mostrarToast('Campo Categoria', 'Selecione uma categoria.', 'erro');
    }
    if (!campos.preco.value || !(preco > 0)) {
        return mostrarToast('Campo Preço', 'Informe um preço maior que zero.', 'erro');
    }
    if (campos.estoque.value.trim() === '') {
        return mostrarToast('Campo Estoque', 'Informe o estoque.', 'erro');
    }
    if (!descricao) {
        return mostrarToast('Campo Descrição', 'Informe a descrição do produto.', 'erro');
    }

    return {
        nome: nome,
        categoriaID: Number(campos.categoria.value),
        descricao: descricao,
        preco: Math.round(preco * 100) / 100,
        estoque: estoque,
        status: campos.status.checked ? 'Ativo' : 'Inativo'
    };
}

function conectarCadastroDeProduto() {
    const modalElemento = document.getElementById('modalCriarProduto');
    const formulario = document.getElementById('form-produto');
    const botaoSalvar = document.getElementById('btn-salvar-produto');

    botaoSalvar.addEventListener('click', () => salvarProduto(modalElemento));

    formulario.addEventListener('submit', evento => evento.preventDefault());

    modalElemento.addEventListener('hidden.bs.modal', () => {
        formulario.reset();
    });
}

// Cadastro de produto
async function salvarProduto(modalElemento) {
    const lojista = pegarUsuarioLogado();
    if (!lojista) return;

    const dados = validarProduto(pegarCampos(CAMPOS_CADASTRO));
    if (!dados) return;

    try {
        const resposta = await fetch(URL_PRODUTOS, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...dados,
                imagemURL: [
                    'imagem-produto.png',
                    'imagem-produto.png',
                    'imagem-produto.png'
                ],
                lojistaID: Number(lojista.id)
            })
        });

        if (!resposta.ok) throw new Error('Falha ao cadastrar o produto');

        await recarregarEstoque();
        bootstrap.Modal.getOrCreateInstance(modalElemento).hide();
        mostrarToast('Produto cadastrado', 'Produto cadastrado com sucesso!', 'sucesso');

    } catch (erro) {
        console.error(erro);
        mostrarToast('Erro', 'Não foi possível cadastrar o produto. Tente novamente.', 'erro');
    }
}

function conectarEdicaoDeProduto() {
    const modalElemento = document.getElementById('modalEditarProduto');
    const formulario = document.getElementById('form-editar-produto');
    const botaoSalvar = document.getElementById('btn-salvar-edicao');
    const campos = pegarCampos(CAMPOS_EDICAO);

    modalElemento.addEventListener('show.bs.modal', function (evento) {
        idProdutoEmEdicao = evento.relatedTarget?.dataset.produtoId ?? null;

        if (!idProdutoEmEdicao) {
            evento.preventDefault();
            return;
        }

    });

    // Os dados são carregados depois da animação de abertura.
    modalElemento.addEventListener('shown.bs.modal', async function () {
        const idRequisitado = idProdutoEmEdicao;

        try {
            await categoriasProntas;

            const resposta = await fetch(`${URL_PRODUTOS}/${idRequisitado}`);
            if (!resposta.ok) throw new Error('Falha ao buscar o produto');

            const produto = await resposta.json();

            if (idRequisitado !== idProdutoEmEdicao) return;

            const lojista = pegarUsuarioLogado();
            if (String(produto.lojistaID) !== String(lojista?.id)) {
                bootstrap.Modal.getOrCreateInstance(modalElemento).hide();
                mostrarToast('Acesso negado', 'Você não pode editar este produto.', 'erro');
                return;
            }

            campos.nome.value = produto.nome ?? '';
            campos.categoria.value = String(produto.categoriaID);
            campos.preco.value = produto.preco;
            campos.estoque.value = produto.estoque;
            campos.descricao.value = produto.descricao ?? '';
            campos.status.checked = produto.status === 'Ativo';

        } catch (erro) {
            console.error(erro);
            bootstrap.Modal.getOrCreateInstance(modalElemento).hide();
            mostrarToast('Erro', 'Não foi possível carregar o produto. Tente novamente.', 'erro');
        }
    });

    botaoSalvar.addEventListener('click', () => salvarEdicao(modalElemento, campos));

    formulario.addEventListener('submit', evento => evento.preventDefault());

    modalElemento.addEventListener('hidden.bs.modal', () => {
        formulario.reset();
        idProdutoEmEdicao = null;
    });
}

async function salvarEdicao(modalElemento, campos) {
    if (!idProdutoEmEdicao) return;

    const dados = validarProduto(campos);
    if (!dados) return;

    try {
        const resposta = await fetch(`${URL_PRODUTOS}/${idProdutoEmEdicao}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados)
        });

        if (!resposta.ok) throw new Error('Falha ao atualizar o produto');

        await recarregarEstoque();
        bootstrap.Modal.getOrCreateInstance(modalElemento).hide();
        mostrarToast('Produto atualizado', 'Produto editado com sucesso!', 'sucesso');

    } catch (erro) {
        console.error(erro);
        mostrarToast('Erro', 'Não foi possível editar o produto. Tente novamente.', 'erro');
    }
}

// Recalcula produtosFiltrados a partir da busca e da categoria atuais
function filtrarProdutos() {
    const termoNormalizado = normalizarTexto(document.getElementById("input-pesquisa").value);

    produtosFiltrados = produtosDoLojista.filter(produto => {
        const combinaNome = normalizarTexto(produto.nome).includes(termoNormalizado);
        const combinaCategoria = categoriaSelecionada === "" || String(produto.categoriaID) === categoriaSelecionada;

        return combinaNome && combinaCategoria;
    });
}

function aplicarFiltros() {
    filtrarProdutos();
    renderizarPagina(1);
}

// Refaz a busca dos produtos do lojista, mantendo busca, categoria e página
async function recarregarEstoque() {
    const lojista = pegarUsuarioLogado();
    if (!lojista) return;

    try {
        produtosDoLojista = await buscarProdutoDoLojista(lojista.id);
        filtrarProdutos();
        renderizarPagina(paginaAtual);
    } catch (erro) {
        console.error(erro);
        mostrarToast('Erro', 'Não foi possível atualizar a lista de produtos.', 'erro');
    }
}

function conectarExclusaoDeProduto() {
    const modalElemento = document.getElementById('modalExcluirProduto');
    const botaoConfirmar = document.getElementById('btn-confirmar-exclusao-produto');

    // Identifica o produto selecionado ao abrir o modal
    modalElemento.addEventListener('show.bs.modal', evento => {
        idProdutoEmExclusao = evento.relatedTarget?.dataset.produtoId ?? null;

        if (!idProdutoEmExclusao) {
            evento.preventDefault();
            mostrarToast('Erro', 'Não foi possível identificar o produto.', 'erro');
        }
    });

    // Executa a exclusão ao confirmar
    botaoConfirmar.addEventListener('click', async () => {
        if (!idProdutoEmExclusao) return;

        try {
            const resposta = await fetch(`${URL_PRODUTOS}/${idProdutoEmExclusao}`, {
                method: 'DELETE'
            });

            if (!resposta.ok) {
                throw new Error('Falha ao remover o produto');
            }

            // Fecha o modal
            bootstrap.Modal.getOrCreateInstance(modalElemento).hide();

            // Atualiza o estoque
            const lojista = pegarUsuarioLogado();
            await carregarEstoque(lojista.id);
            mostrarToast('Produto excluído', 'Produto removido com sucesso!', 'sucesso');

        } catch (erro) {
            console.error(erro);
            mostrarToast('Erro', 'Não foi possível remover o produto. Tente novamente.', 'erro');
        }
    });

    // Limpa o ID ao fechar o modal
    modalElemento.addEventListener('hidden.bs.modal', () => {
        idProdutoEmExclusao = null;
    });
}

function configurarUpload(idCampo, idArea) {
    const campoImagem = document.getElementById(idCampo);
    const areaUpload = document.getElementById(idArea);

    if (!campoImagem || !areaUpload) return;

    function mostrarArquivoCarregado(arquivo) {
        if (!arquivo) return;

        areaUpload.classList.add('arquivo-carregado');

        areaUpload.querySelector('.conteudo-upload p').textContent = arquivo.name;
        areaUpload.querySelector('.txt-capacidade-upload').textContent =
            'Arquivo carregado com sucesso!';
    }

    // Seleção pelo explorador de arquivos
    campoImagem.addEventListener('change', () => {
        mostrarArquivoCarregado(campoImagem.files?.[0]);
    });

    // Arrastar arquivo sobre a área
    areaUpload.addEventListener('dragover', (evento) => {
        evento.preventDefault();
    });

    // Soltar arquivo na área
    areaUpload.addEventListener('drop', (evento) => {
        evento.preventDefault();

        const arquivo = evento.dataTransfer?.files?.[0];

        if (!arquivo) return;

        // Associa o arquivo arrastado ao input
        const transferencia = new DataTransfer();
        transferencia.items.add(arquivo);
        campoImagem.files = transferencia.files;

        mostrarArquivoCarregado(arquivo);
    });

    // Sair da área de upload
    areaUpload.addEventListener('dragleave', () => {
        areaUpload.classList.remove('arquivo-carregado');
    });
}

// Modal de cadastro
configurarUpload('prod-imagem', 'area-upload');

// Modal de edição
configurarUpload('prod-imagem-editar', 'area-upload-editar');

document.addEventListener("DOMContentLoaded", () => {
    const usuarioLogado = verificarAut("Lojista");
    if (!usuarioLogado) return null;

    categoriasProntas.then(() => carregarEstoque(usuarioLogado.id));

    const formPesquisa = document.getElementById("form-pesquisa");
    const inputPesquisa = document.getElementById("input-pesquisa");

    inputPesquisa.addEventListener("input", () => {
        aplicarFiltros(inputPesquisa.value);
    });

    formPesquisa.addEventListener("submit", (e) => {
        e.preventDefault();
        aplicarFiltros(inputPesquisa.value);
    });

    const dropdownCategorias = document.getElementById('dropdown-categorias');

    dropdownCategorias.addEventListener('click', evento => {
        const opcao = evento.target.closest('[data-categoria]');

        if (!opcao) return;

        selecionarCategoria(opcao);
    });
});

document.addEventListener('DOMContentLoaded', () => {
    categoriasProntas = popularCategoriasDosModais();
    conectarCampoEstoque();
    conectarCadastroDeProduto();
    conectarEdicaoDeProduto();
    conectarExclusaoDeProduto();
});