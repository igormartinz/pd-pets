// CATÁLOGO DE PRODUTOS - lógica de listagem, filtro, ordenação, paginação e busca

const PRODUTOS_POR_PAGINA = 12;

let todosOsProdutos = [];
let produtosExibidos = [];
let mapaLojistas = {};
let mapaCategorias = {};
let paginaAtual = 1;
let criterioOrdenacaoAtual = null; // guarda a última ordenação escolhida, pra reaplicar após novo filtro
let termoPesquisaAtual = '';

// Formata um número para o padrão brasileiro.
function formatarMoeda(valor) {
    return Number(valor).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    });
}

/* Ponto de entrada da página: busca produtos, lojistas e categoriasve monta os mapas de consulta, popula os filtros e conecta todos os eventos da tela. */
async function carregarCatalogo() {
    const container = document.getElementById('lista-produtos');
    container.innerHTML = '<p class="w-100">Carregando...</p>';

    try {
        // As 3 chamadas saem juntas, em vez de uma atrás da outra
        // reduz o tempo total de espera e o número de requisições sequenciais
        const [respostaProdutos, respostaLojistas, respostaCategorias] = await Promise.all([
            fetch(`https://6a98614f7160beda2292eff8.mockapi.io/produtos`),
            fetch(`https://6a9872a37160beda2292ff4f.mockapi.io/lojistas`),
            fetch(`https://6a9872a37160beda2292ff4f.mockapi.io/categorias`)
        ]);

        const produtos = await respostaProdutos.json();
        const lojistas = await respostaLojistas.json();
        const categorias = await respostaCategorias.json();

        // Monta os mapas id -> nome pra consulta
        for (const lojista of lojistas) {
            mapaLojistas[lojista.id] = lojista.nomeEmpresa;
        }
        for (const categoria of categorias) {
            mapaCategorias[categoria.id] = categoria.nome;
        }

        // Só produtos "Ativo" entram no catálogo
        todosOsProdutos = produtos.filter(produto => produto.status === 'Ativo');

        // Cópia inicial, sem filtro nenhum aplicado ainda
        produtosExibidos = [...todosOsProdutos];

        popularCategorias(categorias);
        conectarEventosDeFiltro();
        conectarEventosDeOrdenacao();
        conectarBusca();
        verificarBuscaNaUrl();

        aplicarFiltros();

    } catch {
        container.innerHTML = '<p class="text-center w-100">Não foi possível carregar os produtos. Tente novamente mais tarde.</p>';
    }
}

// Preenche dinamicamente a lista de checkboxes de categoria no menu de filtros
function popularCategorias(categorias) {
    const lista = document.getElementById('lista-categorias');

    for (const categoria of categorias) {
        const item = document.createElement('li');
        item.className = 'd-flex gap-2 align-items-center';
        item.innerHTML = `
            <input type="checkbox" class="filtro-categoria" id="categoria-${categoria.id}" data-categoria-id="${categoria.id}">
            <label for="categoria-${categoria.id}" class="m-0">${categoria.nome}</label>
        `;
        lista.appendChild(item);
    }
}


// Conecta os filtros de categoria, avaliação e preço à função central
// aplicarFiltros(). Categoria e avaliação reagem a qualquer mudança de checkbox
function conectarEventosDeFiltro() {
    document.getElementById('lista-categorias').addEventListener('change', aplicarFiltros);
    document.getElementById('lista-avaliacoes').addEventListener('change', aplicarFiltros);

    document.querySelector('.btn-preco').addEventListener('click', function (evento) {
        evento.preventDefault();
        aplicarFiltros();
    });
}

/* Conecta os itens do dropdown "Ordenar" ao clicar, guarda o critério
escolhido e reaplica os filtros */
function conectarEventosDeOrdenacao() {
    const itensOrdenacao = document.querySelectorAll('[data-ordenar]');
    for (const item of itensOrdenacao) {
        item.addEventListener('click', function () {
            criterioOrdenacaoAtual = this.dataset.ordenar;
            aplicarFiltros();
        });
    }
}

/* Função central de filtragem: recalcula produtosExibidos do zero, a
partir de todosOsProdutos, aplicando busca + categoria + preço +
avaliação de uma só vez. */
function aplicarFiltros() {
    const categoriasSelecionadas = Array.from(
        document.querySelectorAll('.filtro-categoria:checked')
    ).map(input => input.dataset.categoriaId);

    const precoMin = parseFloat(document.getElementById('preco-min').value) || null;
    const precoMax = parseFloat(document.getElementById('preco-max').value) || null;

    const avaliacoesSelecionadas = Array.from(
        document.querySelectorAll('.filtro-avaliacao:checked')
    ).map(input => parseInt(input.dataset.estrelas));

    // Se várias notas estiverem marcadas, usa a menor como corte mínimo
    const avaliacaoMinima = avaliacoesSelecionadas.length > 0
        ? Math.min(...avaliacoesSelecionadas)
        : null;

    const termoNormalizado = normalizarTexto(termoPesquisaAtual);

    produtosExibidos = todosOsProdutos.filter(produto => {

        // Busca por nome ou categoria
        if (termoNormalizado) {
            const nomeCategoria = mapaCategorias[produto.categoriaID] ?? '';
            const nomeCorresponde = normalizarTexto(produto.nome).includes(termoNormalizado);
            const categoriaCorresponde = normalizarTexto(nomeCategoria).includes(termoNormalizado);
            if (!nomeCorresponde && !categoriaCorresponde) return false;
        }

        // Categoria
        if (categoriasSelecionadas.length > 0 && !categoriasSelecionadas.includes(String(produto.categoriaID))) {
            return false;
        }

        // Faixa de preço
        if (precoMin !== null && produto.preco < precoMin) return false;
        if (precoMax !== null && produto.preco > precoMax) return false;

        // Avaliação mínima
        if (avaliacaoMinima !== null) {
            const media = parseFloat(calcularMediaAvaliacoes(produto.avaliacoesProduto)) || 0;
            if (media < avaliacaoMinima) return false;
        }

        return true;
    });

    // Se existe uma ordenação ativa, reaplica sobre o resultado já filtrado
    if (criterioOrdenacaoAtual) {
        ordenarProdutos(criterioOrdenacaoAtual);
    }

    atualizarTituloCatalogo();

    // Todo novo filtro/ordenação sempre volta pra página 1
    renderizarPagina(1); 
}

/* Renderiza a página especificada: fatia produtosExibidos de acordo com
PRODUTOS_POR_PAGINA */
function renderizarPagina(numeroPagina) {
    paginaAtual = numeroPagina;

    const inicio = (numeroPagina - 1) * PRODUTOS_POR_PAGINA;
    const fim = inicio + PRODUTOS_POR_PAGINA;
    const produtosDaPagina = produtosExibidos.slice(inicio, fim);

    renderizarCards(produtosDaPagina);
    renderizarPaginacao();

    const cabecalho = document.getElementById('cabecalho');
    if (cabecalho) cabecalho.scrollIntoView({ behavior: 'smooth' });
}

// Desenha os cards de produto na tela a partir de uma lista já paginada.
function renderizarCards(produtos) {
    const container = document.getElementById('lista-produtos');
    container.innerHTML = '';

    if (produtos.length === 0) {
        container.innerHTML = '<p class="text-center w-100">Nenhum produto encontrado.</p>';
        return;
    }

    for (const produto of produtos) {
        const mediaAvaliacoes = calcularMediaAvaliacoes(produto.avaliacoesProduto);

        const coluna = document.createElement('div');
        coluna.className = "col-12 col-md-6 col-xl-4";

        coluna.innerHTML = `
                <article class="card-produto">
                    <a href="detalhes-do-produto.html?id=${produto.id}">
                        <div class="produto-avaliacao">
                            <i class="ti ti-star-filled"></i>
                            <span>${mediaAvaliacoes ?? ''}</span>
                        </div>
                        <i class="ti ti-heart ti-heart-icon"></i>

                        <img src="../img-produtos/${produto.imagemURL[0]}" class="produto-img" alt="${produto.nome}">

                        <div>
                            <h3 class="text-truncate produto-nome mb-1 mt-2">${produto.nome}</h3>
                            <div class="d-flex justify-content-between">
                                <div>
                                    <p class="produto-lojista m-0">${mapaLojistas[produto.lojistaID]}</p>
                                    <small class="produto-categoria">${mapaCategorias[produto.categoriaID]}</small>
                                    <p class="produto-preco">${formatarMoeda(produto.preco)}</p>
                                </div>
                                <i class="ti ti-shopping-bag-plus"></i>
                            </div>
                        </div>
                    </a>
                </article>
            `;

        container.appendChild(coluna);
    }
}

/* Desenha os botões de paginação (setas + números) com base na
quantidade total de produtosExibidos. */
function renderizarPaginacao() {
    const totalPaginas = Math.ceil(produtosExibidos.length / PRODUTOS_POR_PAGINA);
    const paginacao = document.getElementById('paginacao');
    paginacao.innerHTML = '';

    // Não mostra paginação se tudo cabe numa página só
    if (totalPaginas <= 1) return; 

    paginacao.appendChild(criarSeta('left', paginaAtual - 1, paginaAtual === 1, 'Previous'));

    for (let pagina = 1; pagina <= totalPaginas; pagina++) {
        paginacao.appendChild(criarNumero(pagina, pagina === paginaAtual));
    }

    paginacao.appendChild(criarSeta('right', paginaAtual + 1, paginaAtual === totalPaginas, 'Next'));
}

/* Cria o item <li> da seta de navegação (anterior/próximo). */
function criarSeta(direcao, pagina, desabilitado, aria) {
    const item = document.createElement('li');

    const link = document.createElement('a');
    link.className = 'page-link paginacao-seta';
    link.href = '#';
    link.setAttribute('aria-label', aria);
    link.innerHTML = `<span aria-hidden="true"><i class="ti ti-chevron-compact-${direcao}"></i></span>`;

    link.addEventListener('click', function (evento) {
        evento.preventDefault();
        if (!desabilitado) renderizarPagina(pagina);
    });

    item.appendChild(link);
    return item;
}

/* Cria o item <li> de número de página. */
function criarNumero(pagina, ativo) {
    const item = document.createElement('li');
    item.className = `page-item ${ativo ? 'ativo' : ''}`;

    const link = document.createElement('a');
    link.className = `page-link paginacao-numeracao ${ativo ? 'link-ativo' : ''}`;
    link.href = '#';
    link.textContent = pagina;

    link.addEventListener('click', function (evento) {
        evento.preventDefault();
        renderizarPagina(pagina);
    });

    item.appendChild(link);
    return item;
}

/* Calcula a média das notas de um produto a partir do array
avaliacoesProduto embutido nele. */
function calcularMediaAvaliacoes(avaliacoes) {
    if (!avaliacoes || avaliacoes[0].data === '') {
        return null;
    }

    let somaNotas = 0;
    for (const avaliacao of avaliacoes) {
        somaNotas += avaliacao.nota;
    }

    const media = somaNotas / avaliacoes.length;
    return media.toFixed(1);
}

/* Ordena produtosExibidos de acordo com o critério escolhido no dropdown "Ordenar". */
function ordenarProdutos(criterio) {
    switch (criterio) {
        case 'menor-preco':
            produtosExibidos.sort((a, b) => a.preco - b.preco);
            break;

        case 'maior-preco':
            produtosExibidos.sort((a, b) => b.preco - a.preco);
            break;

        case 'melhor-avaliacao':
            produtosExibidos.sort((a, b) => {
                const mediaA = parseFloat(calcularMediaAvaliacoes(a.avaliacoesProduto)) || 0;
                const mediaB = parseFloat(calcularMediaAvaliacoes(b.avaliacoesProduto)) || 0;
                return mediaB - mediaA;
            });
            break;

        case 'alfabetica':
            produtosExibidos.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
            break;
    }
}

/* Remove acentos e normaliza para minúsculas, pra comparação de busca
não ser sensível a maiúsculas/acentuação (ex: "Ração" == "racao"). */
function normalizarTexto(texto) {
    return texto
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();
}

/* Conecta a busca em tempo real do campo do header só tem efeito
quando a página atual é o catálogo */
function conectarBusca() {
    const formPesquisa = document.getElementById('form-pesquisa');
    const inputPesquisa = document.getElementById('input-pesquisa');

    if (!formPesquisa) return;

    const estaNoCatalogo = document.getElementById('lista-produtos') !== null;

    if (estaNoCatalogo) {
        let temporizador;
        inputPesquisa.addEventListener('input', function () {
            clearTimeout(temporizador);
            temporizador = setTimeout(() => {
                termoPesquisaAtual = this.value;
                aplicarFiltros();
            }, 300);
        });
    }
}

// Atualiza o título da página de acordo com o estado da busca
function atualizarTituloCatalogo() {
    const titulo = document.getElementById('titulo-catalogo');

    if (termoPesquisaAtual.trim() === '') {
        titulo.textContent = 'Catálogo de Produtos';
    } else {
        titulo.innerHTML = `Resultados para <span class='resultados-valor'>"${termoPesquisaAtual}" (${produtosExibidos.length})</span>`;
    }
}

/* Ao carregar o catálogo, verifica se a URL trouxe um termo de busca
vindo de um redirecionamento feito em outra página. */
function verificarBuscaNaUrl() {
    const parametros = new URLSearchParams(window.location.search);
    const termo = parametros.get('busca');

    if (termo) {
        document.getElementById('input-pesquisa').value = termo;
        termoPesquisaAtual = termo;
    }
}

// Exibe a função de busca do catálogo para o script global
// Conseguir chamá-la quando o usuário estiver nesta página.
window.filtrarCatalogoPorBusca = function (termo) {
    termoPesquisaAtual = termo;
    aplicarFiltros();
};

document.addEventListener('DOMContentLoaded', carregarCatalogo);