const PRODUTOS_POR_PAGINA = 12;

let todosOsProdutos = [];
let produtosExibidos = [];
let mapaLojistas = {};
let mapaCategorias = {};
let paginaAtual = 1;
let criterioOrdenacaoAtual = null;

function formatarMoeda(valor) {
    return Number(valor).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    });
}

async function carregarCatalogo() {
    const container = document.getElementById('lista-produtos');

    container.innerHTML = '<p class="w-100">Carregando...</p>';

    try {
        // busca produtos, lojistas e categorias em paralelo
        const [respostaProdutos, respostaLojistas, respostaCategorias] = await Promise.all([
            fetch(`https://6a98614f7160beda2292eff8.mockapi.io/produtos`),
            fetch(`https://6a9872a37160beda2292ff4f.mockapi.io/lojistas`),
            fetch(`https://6a9872a37160beda2292ff4f.mockapi.io/categorias`)
        ]);

        const produtos = await respostaProdutos.json();
        const lojistas = await respostaLojistas.json();
        const categorias = await respostaCategorias.json();

        for (const lojista of lojistas) {
            mapaLojistas[lojista.id] = lojista.nomeEmpresa;
        }

        for (const categoria of categorias) {
            mapaCategorias[categoria.id] = categoria.nome;
        }

        // filtra produtos inativos uma única vez, na origem
        todosOsProdutos = produtos.filter(produto => produto.status === 'Ativo');
        produtosExibidos = [...todosOsProdutos];

        popularCategorias(categorias);
        conectarEventosDeFiltro();
        conectarEventosDeOrdenacao();

        renderizarPagina(1);

    } catch {
        container.innerHTML = '<p class="text-center w-100">Não foi possível carregar os produtos. Tente novamente mais tarde.</p>';
    }
}

function popularCategorias(categorias) {
    const lista = document.getElementById('lista-categorias');

    for (const categoria of categorias) {

        const item = document.createElement('li');
        item.className = 'd-flex gap-2 align-items-center';
        item.innerHTML = `
            <input type="checkbox" class="filtro-categoria" id="categoria-${categoria.id}" data-categoria-id="${categoria.id}">
            <label for="categoria-${categoria.id}" class="m-0">${categoria.nome}</label>
        `

        lista.appendChild(item);
    }
}

function conectarEventosDeFiltro() {
    // categorias: aplica assim que marca/desmarca
    document.getElementById('lista-categorias').addEventListener('change', aplicarFiltros);

    // avaliação: aplica assim que marca/desmarca
    document.getElementById('lista-avaliacoes').addEventListener('change', aplicarFiltros);

    // preço: só aplica ao clicar no botão (setinha)
    document.querySelector('.btn-preco').addEventListener('click', function (evento) {
        evento.preventDefault();
        aplicarFiltros();
    });
}

function conectarEventosDeOrdenacao() {
    const itensOrdenacao = document.querySelectorAll('[data-ordenar]');
    for (const item of itensOrdenacao) {
        item.addEventListener('click', function () {
            criterioOrdenacaoAtual = this.dataset.ordenar;
            aplicarFiltros(); // reaplica filtro + já ordena o resultado
        });
    }
}

function aplicarFiltros() {
    const categoriasSelecionadas = Array.from(
        document.querySelectorAll('.filtro-categoria:checked')
    ).map(input => input.dataset.categoriaId);

    const precoMin = parseFloat(document.getElementById('preco-min').value) || null;
    const precoMax = parseFloat(document.getElementById('preco-max').value) || null;

    const avaliacoesSelecionadas = Array.from(
        document.querySelectorAll('.filtro-avaliacao:checked')
    ).map(input => parseInt(input.dataset.estrelas));

    const avaliacaoMinima = avaliacoesSelecionadas.length > 0
        ? Math.min(...avaliacoesSelecionadas)
        : null;

    produtosExibidos = todosOsProdutos.filter(produto => {

        // categoria (se nenhuma marcada, não filtra)
        if (categoriasSelecionadas.length > 0 && !categoriasSelecionadas.includes(String(produto.categoriaID))) {
            return false;
        }

        // preço
        if (precoMin !== null && produto.preco < precoMin) return false;
        if (precoMax !== null && produto.preco > precoMax) return false;

        // avaliação (produto precisa ter média >= menor valor marcado)
        if (avaliacaoMinima !== null) {
            const media = parseFloat(calcularMediaAvaliacoes(produto.avaliacoesProduto)) || 0;
            if (media < avaliacaoMinima) return false;
        }

        return true;
    });

    if (criterioOrdenacaoAtual) {
        ordenarProdutos(criterioOrdenacaoAtual);
    }

    renderizarPagina(1); // todo novo filtro/ordenação volta pra página 1
}

function renderizarPagina(numeroPagina) {
    paginaAtual = numeroPagina;

    const inicio = (numeroPagina - 1) * PRODUTOS_POR_PAGINA;
    const fim = inicio + PRODUTOS_POR_PAGINA;
    const produtosDaPagina = produtosExibidos.slice(inicio, fim);

    renderizarCards(produtosDaPagina);
    renderizarPaginacao();

    // volta o scroll pro topo do catálogo ao trocar de página
    document.getElementById('cabecalho').scrollIntoView({ behavior: 'smooth' });
}

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
            `

        container.appendChild(coluna);
    }
}

function renderizarPaginacao() {
    const totalPaginas = Math.ceil(produtosExibidos.length / PRODUTOS_POR_PAGINA);
    const paginacao = document.getElementById('paginacao');
    paginacao.innerHTML = '';

    if (totalPaginas <= 1) return;

    // seta "Anterior"
    paginacao.appendChild(criarSeta('left', paginaAtual - 1, paginaAtual === 1, 'Previous'));
    for (let pagina = 1; pagina <= totalPaginas; pagina++) {
        paginacao.appendChild(criarNumero(pagina, pagina === paginaAtual));
    }
    paginacao.appendChild(criarSeta('right', paginaAtual + 1, paginaAtual === totalPaginas, 'Next'));
}

function criarSeta(direcao, pagina, desabilitado, aria) {
    const item = document.createElement('li');
    item.className = `page-item ${desabilitado ? 'disabled' : ''}`;

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

function calcularMediaAvaliacoes(avaliacoes) {

    if (!avaliacoes || avaliacoes[0].data === '0000-00-00') {
        return null; // sem avaliações ainda
    }

    let somaNotas = 0;
    for (const avaliacao of avaliacoes) {
        somaNotas += avaliacao.nota;
    }

    const media = somaNotas / avaliacoes.length;
    return media.toFixed(1);
}

const itensOrdenacao = document.querySelectorAll('[data-ordenar]');
for (const item of itensOrdenacao) {
    item.addEventListener('click', function () {
        ordenarProdutos(this.dataset.ordenar);
    });
}

function ordenarProdutos(criterio) {
    switch (criterio) {
        case 'menor-preco':
            todosOsProdutos.sort((a, b) => a.preco - b.preco);
            break;

        case 'maior-preco':
            todosOsProdutos.sort((a, b) => b.preco - a.preco);
            break;

        case 'melhor-avaliacao':
            todosOsProdutos.sort((a, b) => {
                const mediaA = parseFloat(calcularMediaAvaliacoes(a.avaliacoesProduto)) || 0;
                const mediaB = parseFloat(calcularMediaAvaliacoes(b.avaliacoesProduto)) || 0;
                return mediaB - mediaA;
            });
            break;

        case 'alfabetica':
            todosOsProdutos.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
            break;
    }

    renderizarPagina(1);
}

document.addEventListener('DOMContentLoaded', carregarCatalogo);