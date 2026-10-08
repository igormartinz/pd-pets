const API_URL_PRODUTO = "https://6a98614f7160beda2292eff8.mockapi.io";
const API_URL_CATEGORIA_LOJISTA = "https://6a9872a37160beda2292ff4f.mockapi.io";
const API_URL_CLIENTE = "https://6aaac6cdff4dd5698b4f060c.mockapi.io";

// Pegar o ID do produto a partir da URL

function pegarProdutoIdUrl() {
    const params = new URLSearchParams(window.location.search);

    return params.get("id");
}

// Buscar o produto no MockAPI

async function buscarProduto(id) {
    try {
        const resp = await fetch(`${API_URL_PRODUTO}/produtos/${id}`);
        if (!resp.ok) {
            throw new Error("Produto não encontrado.");
        }

        return await resp.json();

    } catch (error) {
        console.error("Erro ao buscar produto:", error);
        return null;
    }
}

// Buscar a categoria do produto no MockAPI

async function buscarCategoria(id) {
    try {
        const resp = await fetch(`${API_URL_CATEGORIA_LOJISTA}/categorias/${id}`);
        if (!resp.ok) {
            throw new Error("categoria não encontrada.");
        }

        return await resp.json();

    } catch (error) {
        console.error("Erro ao buscar a categoria:", error);
        return null;
    }
}

// Buscar o lojista no MockAPI

async function buscarLojista(id) {
    try {
        const resp = await fetch(`${API_URL_CATEGORIA_LOJISTA}/lojistas/${id}`);
        if (!resp.ok) {
            throw new Error("lojista não encontrado (a).");
        }

        return await resp.json();

    } catch (error) {
        console.error("Erro ao buscar o (a) lojista:", error);
        return null;
    }
}

// Buscar o cliente no MockAPI

async function buscarCliente(id) {
    try {
        const resposta = await fetch(`${API_URL_CLIENTE}/clientes/${id}`);
        if (!resposta.ok) {
            throw new Error("Cliente não encontrado");
        }
        return await resposta.json();
    } catch (erro) {
        console.error("Erro ao buscar cliente:", erro);
        return null;
    }
}

async function anexarNomesClientes(avaliacoesProduto) {
    // Vai buscar cada cliente uma única vez, mesmo que ele apareça em outras avaliações

    const idsUnicos = [...new Set(avaliacoesProduto.map((a) => a.clienteID).filter(Boolean))];

    const clientes = await Promise.all(idsUnicos.map((id) => buscarCliente(id)));

    const nomesId = {};
    idsUnicos.forEach((id, index) => {
        nomesId[id] = clientes[index]?.nomeCompleto;
    });

    return avaliacoesProduto.map((avaliacao) => ({
        ...avaliacao,
        nomeCliente: nomesId[avaliacao.clienteID]
    }));
}

// Verificar e formatar a numeração de estoque no container de informações do produto

function formTextoEstoque(estoque) {
    const elementoEstoqueTexto = document.querySelector(".estoque-produto");
    const elementoEstoqueNumero = document.getElementById("estoque");
    const botaoAddCarrinho = document.getElementById("botao-estoque");

    if (estoque === 0) {
        // Remove o número entre parênteses e troca para "Esgotado"
        elementoEstoqueTexto.innerHTML = "Esgotado";
        elementoEstoqueTexto.classList.add("esgotado");

        // Impede adicionar ao carrinho caso o produto esteja esgotado
        if (botaoAddCarrinho) {
            botaoAddCarrinho.disabled = true;
            botaoAddCarrinho.textContent = "Produto esgotado";
            botaoAddCarrinho.classList.remove("botao");
            botaoAddCarrinho.classList.add("botao-desabilitado");
        }
    } else {
        elementoEstoqueTexto.firstChild.textContent = "Em estoque ";
        elementoEstoqueNumero.textContent = `(${estoque})`;
    }
}

// Popular as imagens dinamicamente

function popularImagens(imagens) {
    const imagensCarrosel = document.querySelectorAll(".imagem-carrossel-produto");
    const imagemGrande = document.querySelector(".imagem-detalhes-produto-grande");
    const imagensPequenas = document.querySelectorAll(".imagem-detalhes-produto-pequeno");

    if (imagens && imagens.length > 0) {
        imagemGrande.src = `/img-produtos/${imagens[0]}`;
    }

    imagensCarrosel.forEach((imagemCarrosel, index) => {
        if (imagens[index]) {
            imagemCarrosel.src = `/img-produtos/${imagens[index]}`;
        }
    })

    imagensPequenas.forEach((imagemPequena, index) => {
        if (imagens[index]) {
            imagemPequena.src = `/img-produtos/${imagens[index]}`;
        }
    });

    // Ao clicar na imagem pequena, transforma em imagem grande
    imagensPequenas.forEach(imagemPequena => {
        imagemPequena.addEventListener("click", () => {
            imagemGrande.src = imagemPequena.src;
        })
    });
}

// Realiza o cálculo de média das avaliações

function calcularMediaAvaliacoes(avaliacoesProduto) {
    if (!avaliacoesProduto || avaliacoesProduto.length === 0) {
        return { media: 0, quantidade: 0 };
    }

    const somaNotas = avaliacoesProduto.reduce((total, avaliacao) => total + avaliacao.nota, 0);
    const media = somaNotas / avaliacoesProduto.length;

    return {
        media: media.toFixed(1),
        quantidade: avaliacoesProduto.length
    };
}

// Renderizar a lista de avaliações na sua respectiva seção

function renderizarAvaliacoes(avaliacoesProduto) {
    const secao = document.getElementById("section-avaliacao-produto");

    // Limpa cards estáticos do HTML e o que foi renderizado antes
    secao.querySelectorAll(".container-avaliacao-usuario, #section-sem-avaliacao").forEach(el => el.remove());

    if (avaliacoesProduto.length > 0) {
        avaliacoesProduto.forEach(avaliacao => secao.append(criarCardAvaliacao(avaliacao)));
        return;
    }

    secao.classList.toggle("sem-avaliacoes-produto", avaliacoesProduto.length === 0);

    const semAvaliacao = document.createElement("div");
    semAvaliacao.id = "section-sem-avaliacao";

    const mensagem = document.createElement("p");
    mensagem.classList.add("sem-avaliacoes", "mt-4", "mb-4");
    mensagem.textContent = "Seja o primeiro a avaliar esse produto.";

    semAvaliacao.append(mensagem);
    secao.append(semAvaliacao);
}

// Cria a estrutura dinâmica de um novo card a seção de avaliação

function criarCardAvaliacao(avaliacao) {
    const container = document.createElement("div");
    container.classList.add("container-avaliacao-usuario");

    const nomeUsuario = document.createElement("h2");
    nomeUsuario.classList.add("nome-usuario");
    nomeUsuario.textContent = avaliacao.nomeCliente ?? "Cliente PD Pets";

    const dataAvaliacao = document.createElement("p");
    dataAvaliacao.classList.add("data-avaliacao");
    dataAvaliacao.textContent = formatarData(avaliacao.data);

    const containerNotas = document.createElement("div");
    containerNotas.classList.add("container-notas-usuario");
    containerNotas.appendChild(criarEstrelas(avaliacao.nota));

    container.appendChild(nomeUsuario);
    container.appendChild(dataAvaliacao);
    container.appendChild(containerNotas);

    // Cria o parágrafo de comentário se ele existir e não estiver vazio
    if (avaliacao.comentario && avaliacao.comentario.trim() !== "") {
        const comentario = document.createElement("p");
        comentario.classList.add("comentario-produto", "mt-4", "mb-4");
        comentario.textContent = avaliacao.comentario;
        container.appendChild(comentario);
    } else {
        const comentarioVazio = document.createElement("p");
        comentarioVazio.classList.add("comentario-vazio", "mt-4", "mb-4");
        comentarioVazio.textContent = "Nenhum comentário.";
        container.appendChild(comentarioVazio);
    }

    return container;
}

function criarSvgEstrela() {
    const estrela = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    estrela.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    estrela.setAttribute("width", "24");
    estrela.setAttribute("height", "20");
    estrela.setAttribute("viewBox", "0 0 24 24");
    estrela.setAttribute("fill", "currentColor");
    estrela.classList.add("icon-tabler-star");

    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", "M8.243 7.34l-6.38 .925l-.113 .023a1 1 0 0 0 -.44 1.684l4.622 4.499l-1.09 6.355l-.013 .11a1 1 0 0 0 1.464 .944l5.706 -3l5.693 3l.1 .046a1 1 0 0 0 1.352 -1.1l-1.091 -6.355l4.624 -4.5l.078 -.085a1 1 0 0 0 -.633 -1.62l-6.38 -.926l-2.852 -5.78a1 1 0 0 0 -1.794 0l-2.853 5.78z");
    estrela.appendChild(path);

    return estrela;
}

function criarEstrelas(nota) {
    const wrapper = document.createElement("div");

    for (let i = 1; i <= 5; i++) {
        const estrela = criarSvgEstrela();
        if (i > nota) {
            estrela.style.opacity = "0.25"; // estilizar como estrela vazia
        }

        wrapper.appendChild(estrela);
    }

    return wrapper;
}

// Funcionalide de acompanhar o preenchimento das estrelas conforme a avaliação média

function criarEstrelasMedia(media) {
    const wrapper = document.createElement("div");
    wrapper.classList.add("container-estrelas-media");

    for (let i = 1; i <= 5; i++) {

        const percentual = Math.max(0, Math.min(1, media - (i - 1))) * 100;

        const estrelaContainer = document.createElement("div");
        estrelaContainer.classList.add("estrela-media");

        estrelaContainer.appendChild(criarSvgEstrela());

        const preenchidaWrapper = document.createElement("div");
        preenchidaWrapper.classList.add("estrela-preenchida-wrapper");
        preenchidaWrapper.style.width = `${percentual}%`;
        preenchidaWrapper.appendChild(criarSvgEstrela());

        estrelaContainer.appendChild(preenchidaWrapper);
        wrapper.appendChild(estrelaContainer);
    }

    return wrapper;
}

function formatarData(dataIso) {
    if (!dataIso) return "";
    const [ano, mes, dia] = dataIso.split("-");
    return `${dia}/${mes}/${ano}`;
}

function popularInfoProduto(produto, categoria, lojista, avaliacoesProduto) {
    document.getElementById("nome-produto").textContent = produto.nome;
    document.querySelector(".categoria-produto").textContent = categoria?.nome ?? "Sem categoria";
    document.getElementById("nome-loja").querySelector("strong").textContent = lojista?.nomeEmpresa ?? "PD Pets";
    document.getElementById("preco").textContent = `R$ ${produto.preco.toFixed(2).replace(".", ",")}`;
    document.querySelector(".produto-descricao").textContent = produto.descricao;
    document.querySelectorAll("#nome-produto-descricao").forEach(el => {
        el.textContent = produto.nome
    })

    formTextoEstoque(produto.estoque);
    popularImagens(produto.imagemURL);

    const { media, quantidade } = calcularMediaAvaliacoes(avaliacoesProduto);
    document.getElementById("avaliacao-media").textContent = media;
    document.getElementById("quantidade-avaliacoes").textContent = quantidade;

    const containerNotas = document.querySelector(".container-notas");
    containerNotas.innerHTML = "";
    containerNotas.appendChild(criarEstrelasMedia(Number(media)));

    renderizarAvaliacoes(avaliacoesProduto);
}

function statusPagina(estado, mensagem) {
    const main = document.getElementById("main-detalhes-produto");
    const rodape = document.getElementById("rodape-produto");
    main.classList.remove("carregando", "erro");
    rodape.classList.remove("carregando", "erro");

    if (estado) main.classList.add(estado);
    if (estado) rodape.classList.add(estado);
    if (mensagem) document.getElementById("texto-status-produto").textContent = mensagem;
}

// Incrementar e decrementar a quantidade do produto

function configurarQuantidade(estoque) {
    const input = document.getElementById("input-quantidade");
    const botaoMais = document.getElementById("btn-mais");
    const botaoMenos = document.getElementById("btn-menos");

    if (estoque === 0) {
        input.value = 0;
        input.disabled = true;
        botaoMais.disabled = true;
        botaoMenos.disabled = true;
    }

    input.max = estoque;

    // Limita a quantidade entre 1 e o estoque
    function limitarQuantidade(valor) {
        const numero = parseInt(valor, 10);
        console.log(numero);


        if (isNaN(numero) || numero < 1) return 1;
        if (numero > estoque) return estoque;

        return numero;
    }

    botaoMais.addEventListener("click", () => {
        input.value = limitarQuantidade(Number(input.value) + 1);
    });

    botaoMenos.addEventListener("click", () => {
        input.value = limitarQuantidade(Number(input.value) - 1);
    });
}

// Inicialização das funções

document.addEventListener("DOMContentLoaded", async () => {
    const produtoId = pegarProdutoIdUrl();

    // Pegar o produto a partir da URL
    if (!produtoId) {
        statusPagina("erro", "Produto não identificado.");
        return null;
    }

    // Requisição para retornar o id do Produto com suas informações
    const produto = await buscarProduto(produtoId);

    // Mensagem de erro caso o produto não seja encontrado
    if (!produto) {
        statusPagina("erro", "Produto não encontrado.");
        return null;
    }

    try {

        const avaliacoesBrutas = (Array.isArray(produto.avaliacoesProduto) ? produto.avaliacoesProduto : [])
            .filter(avaliacao => !isNaN(new Date(avaliacao.data)));

        // Busca categoria e lojista
        const [categoria, lojista, avaliacoesProduto] = await Promise.all([
            buscarCategoria(produto.categoriaID),
            buscarLojista(produto.lojistaID),
            anexarNomesClientes(avaliacoesBrutas),
            configurarQuantidade(produto.estoque)
        ]);

        popularInfoProduto(produto, categoria, lojista, avaliacoesProduto);


        statusPagina(null);

    } catch (error) {
        console.error("Erro ao montar a página:", error);
        statusPagina("erro", "Ocorreu um erro ao carregar o produto.");
    }
});
