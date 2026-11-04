const listaAvaliacoes = document.getElementById("lista-avaliacoes");

// Formata a data para o padrão brasileiro.
function formatarData(data) {
    if (!data) return '—';
    const [ano, mes, dia] = data.split('-');
    return `${dia}/${mes}/${ano}`;
}

// Gera as estrelas conforme a nota da avaliação.
function gerarEstrelas(nota) {
    const notaValida = Math.min(5, Math.max(0, Number(nota) || 0));

    return Array.from({ length: 5 }, (_, indice) => {
        const posicao = indice + 1;
        let icone = "ti-star";

        if (posicao <= Math.floor(notaValida)) {
            icone = "ti-star-filled";
        } else if (
            notaValida % 1 >= 0.5 &&
            posicao === Math.ceil(notaValida)
        ) {
            icone = "ti-star-half-filled";
        }

        return `<i class="ti ${icone}" aria-hidden="true"></i>`;
    }).join("");
}

// Busca o nome do cliente que realizou a avaliação.
async function buscarNomeCliente(clienteID, cacheClientes) {
    const id = String(clienteID);

    if (!cacheClientes.has(id)) {
        const requisicao = fetch(`${"https://6aaac6cdff4dd5698b4f060c.mockapi.io/usuarios"}/${encodeURIComponent(id)}`)
            .then(async resposta => {
                if (!resposta.ok) {
                    throw new Error("Não foi possível buscar o cliente.");
                }

                return resposta.json();
            })
            .catch(erro => {
                console.error(`Erro ao buscar cliente ${id}:`, erro);
                return null;
            });

        cacheClientes.set(id, requisicao);
    }

    const cliente = await cacheClientes.get(id);

    if (!cliente) return "Cliente";

    // Exibe o primeiro nome e a inicial do sobrenome.
    const nomes = String(cliente.nomeCompleto ?? "")
        .trim()
        .split(/\s+/)
        .filter(Boolean);

    if (nomes.length === 0) return "Cliente";
    if (nomes.length === 1) return nomes[0];

    return `${nomes[0]} ${nomes[nomes.length - 1][0]}.`;
}

// Cria o HTML de cada avaliação.
function criarCardAvaliacao(produto, avaliacao, nomeCliente) {
    const nomeProduto = produto.nome;
    const imagem = produto.imagemURL[0] ? `../img-produtos/${produto.imagemURL[0]}` : "../img-produtos/produto-sem-imagem.png"
    const comentario = String(avaliacao.comentario ?? "").trim();
    const nota = Math.min(5, Math.max(0, Number(avaliacao.nota) || 0));

    return `
        <article class="card-avaliacao" data-nota="${nota}">
            <div class="card-conteudo">
                <div class="d-flex gap-2">
                    <img src="${imagem}" class="produto-img d-md-none" alt="${nomeProduto}">

                    <div class="d-flex flex-column min-w-0">
                        <h2 class="text-truncate mb-1 card-nome-produto">${nomeProduto}</h2>

                        <small>${formatarData(avaliacao.data)}</small>

                        <div class="d-flex flex-wrap align-items-center gap-2">
                            <p class="m-0">${nomeCliente}</p>
                            <div class="d-flex gap-1" aria-label="Nota ${nota} de 5">${gerarEstrelas(nota)}</div>
                        </div>
                    </div>
                </div>

                ${comentario ? `<p class="m-0 mt-2">${comentario}</p>` : ""}
            </div>

            <img src="${imagem}" class="produto-img d-none d-md-block" alt="${nomeProduto}">
        </article>
    `;
}

// Busca e renderiza todas as avaliações dos produtos do lojista.
async function carregarAvaliacoes() {
    try {
        const usuarioLogado = pegarUsuarioLogado();

        listaAvaliacoes.innerHTML = '<p>Carregando...</p>';

        const resposta = await fetch('https://6a98614f7160beda2292eff8.mockapi.io/produtos');

        if (!resposta.ok) {
            throw new Error("Não foi possível buscar os produtos.");
        }

        const produtos = await resposta.json();

        // Considera apenas os produtos pertencentes ao lojista logado.
        const produtosLojista = produtos.filter(produto => String(produto.lojistaID) === String(usuarioLogado.id));

        // Reúne todas as avaliações e mantém a referência ao produto.
        const avaliacoes = produtosLojista.flatMap(produto =>
            (Array.isArray(produto.avaliacoesProduto) ? produto.avaliacoesProduto : []).filter(avaliacao => avaliacao.data.trim() !== "").map(avaliacao => ({ produto, avaliacao }))
        );

        if (avaliacoes.length === 0) {
            listaAvaliacoes.innerHTML = '<p class="text-center">Nenhuma avaliação foi encontrada.</p>';
            return;
        }

        // Ordena da mais recente para a mais antiga.
        avaliacoes.sort((a, b) => String(b.avaliacao.data).localeCompare(String(a.avaliacao.data)));

        // Reutiliza a consulta quando um cliente avaliou mais de um produto.
        const cacheClientes = new Map();

        const cards = await Promise.all(
            avaliacoes.map(async ({ produto, avaliacao }) => {
                const nomeCliente = await buscarNomeCliente(
                    avaliacao.clienteID,
                    cacheClientes
                );

                return criarCardAvaliacao(
                    produto,
                    avaliacao,
                    nomeCliente
                );
            })
        );

        listaAvaliacoes.innerHTML = cards.join("");

    } catch (erro) {
        console.error("Erro ao carregar avaliações:", erro);
        listaAvaliacoes.innerHTML = '<p class="text-center">Não foi possível carregar as avaliações. Tente novamente.</p>';
    }
}

// Normaliza o texto para facilitar a pesquisa.
function normalizarTexto(texto) {
    return String(texto ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();
}

// Filtra as avaliações pelo nome do produto.
function pesquisarAvaliacoes(termo) {
    aplicarFiltrosAvaliacoes(termo);
}

// Filtra as avaliações pela nota selecionada.
function filtrarAvaliacoes(nota) {
    notaSelecionada = nota;
    aplicarFiltrosAvaliacoes(inputPesquisa.value);
}

// Aplica os critérios ativos de pesquisa e nota.
function aplicarFiltrosAvaliacoes(termo) {
    const pesquisa = normalizarTexto(termo);
    const cards = listaAvaliacoes.querySelectorAll(".card-avaliacao");
    let quantidadeEncontrada = 0;

    cards.forEach(card => {
        const nomeProduto =
            card.querySelector(".card-nome-produto")?.textContent ?? "";

        const notaCard = Number(card.dataset.nota);

        const correspondePesquisa =
            normalizarTexto(nomeProduto).includes(pesquisa);

        const correspondeNota =
            notaSelecionada === null ||
            notaCard === notaSelecionada;

        const corresponde = correspondePesquisa && correspondeNota;

        card.classList.toggle("d-none", !corresponde);

        if (corresponde) {
            quantidadeEncontrada++;
        }
    });

    let mensagem = document.getElementById("mensagem-avaliacoes-vazias");

    if (!mensagem) {
        mensagem = document.createElement("p");
        mensagem.id = "mensagem-avaliacoes-vazias";
        mensagem.className = "text-center mt-3";
        listaAvaliacoes.appendChild(mensagem);
    }

    if (quantidadeEncontrada === 0) {
        if (pesquisa && notaSelecionada !== null) {
            mensagem.textContent =
                "Nenhuma avaliação encontrada para essa pesquisa e quantidade de estrelas.";
        } else if (notaSelecionada !== null) {
            mensagem.textContent =
                `Nenhuma avaliação encontrada com ${notaSelecionada} estrela${notaSelecionada > 1 ? "s" : ""}.`;
        } else {
            mensagem.textContent =
                "Nenhuma avaliação encontrada para esse produto.";
        }

        mensagem.classList.remove("d-none");
    } else {
        mensagem.classList.add("d-none");
    }
}

const botoesFiltro = document.querySelectorAll("[data-filtrar]");
const formularioPesquisa = document.getElementById("form-pesquisa");
const inputPesquisa = document.getElementById("input-pesquisa");

let notaSelecionada = null

// Pesquisa ao enviar o formulário.
formularioPesquisa.addEventListener("submit", evento => {
    evento.preventDefault();
    pesquisarAvaliacoes(inputPesquisa.value);
});

// Atualiza os resultados enquanto o usuário digita.
inputPesquisa.addEventListener("input", () => {
    pesquisarAvaliacoes(inputPesquisa.value);
});

// Filtra pela quantidade de estrelas.
botoesFiltro.forEach(botao => {
    botao.addEventListener("click", () => {
        const filtro = botao.dataset.filtrar;

        const nota = filtro === "todas" ? null : Number(filtro.split("-")[0]);

        filtrarAvaliacoes(nota);
    });
});

document.addEventListener("DOMContentLoaded", carregarAvaliacoes);