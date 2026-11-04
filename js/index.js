import { ligarBotoesCarrinho } from "./carrinho-api.js";
import { mostrarToast } from "./toast.js";

const URL_PRODUTOS = 'https://6a98614f7160beda2292eff8.mockapi.io/produtos';
const URL_CATEGORIAS = 'https://6a9872a37160beda2292ff4f.mockapi.io/categorias';
const URL_USUARIOS = 'https://6aaac6cdff4dd5698b4f060c.mockapi.io/usuarios';

const usuario = pegarUsuarioLogado();
let favoritos = [];

ligarBotoesCarrinho();

// Produtos exibidos em "Produtos em Destaque", aparece de acordo com a ordem de IDs dentro do Array.
const IDS_DESTAQUE = [1, 61, 10, 5]

function formatarMoeda(valor) {
    return Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// Média das avaliações
function calcularMediaAvaliacoes(avaliacoes) {
    if (!avaliacoes || avaliacoes.length === 0) {
        return null;
    }

    let somaNotas = 0;
    for (const avaliacao of avaliacoes) {
        somaNotas += avaliacao.nota;
    }

    const media = somaNotas / avaliacoes.length;
    return media.toFixed(1);
}

// Busca um recurso e devolve null se ele não existir ou a requisição falhar,
// para um produto removido não derrubar os demais
async function buscarOuNulo(url) {
    try {
        const resposta = await fetch(url);
        return resposta.ok ? await resposta.json() : null;
    } catch {
        return null;
    }
}

async function carregarProdutosDestaque() {
    const container = document.getElementById('lista-produtos-destaque');
    container.innerHTML = '<p class="text-center w-100">Carregando...</p>';

    try {
        // 1) Só os 4 produtos (um GET por id, em paralelo) e a lista de categorias
        const [produtosBuscados, categorias] = await Promise.all([
            Promise.all(IDS_DESTAQUE.map(id => buscarOuNulo(`${URL_PRODUTOS}/${id}`))),
            buscarOuNulo(URL_CATEGORIAS)
        ]);

        // Descarta os que não existem mais e os inativos (RN027/RN032)
        const produtos = produtosBuscados.filter(produto => produto && produto.status === 'Ativo');

        if (produtos.length === 0) {
            container.innerHTML = '<p class="text-center w-100">Não foi possível carregar os produtos em destaque.</p>';
            return;
        }

        // 2) Só os lojistas desses produtos, em vez de baixar todos os usuários
        const idsLojistas = [...new Set(produtos.map(produto => produto.lojistaID))];
        const lojistas = await Promise.all(idsLojistas.map(id => buscarOuNulo(`${URL_USUARIOS}/${id}`)));

        // Mapas id -> nome, para consulta rápida na hora de montar os cards
        const nomesLojistas = {};
        for (const lojista of lojistas) {
            if (lojista) nomesLojistas[lojista.id] = lojista.nomeEmpresa;
        }

        const nomesCategorias = {};
        for (const categoria of categorias ?? []) {
            nomesCategorias[categoria.id] = categoria.nome;
        }

        if (usuario) {
            const dadosUsuario = await buscarOuNulo(`${URL_USUARIOS}/${usuario.id}`);
            favoritos = (dadosUsuario?.favoritos ?? []).map(String);

        } else {
            favoritos = [];
        }

        container.innerHTML = '';
        for (const produto of produtos) {
            container.insertAdjacentHTML('beforeend', montarCardDestaque(
                produto,
                nomesLojistas[produto.lojistaID],
                nomesCategorias[produto.categoriaID]
            ));
        }

    } catch (erro) {
        console.error(erro);
        container.innerHTML = '<p class="text-center w-100">Não foi possível carregar os produtos em destaque.</p>';
    }
}

// Mesma estrutura do card estático, com os dados vindos da API
function montarCardDestaque(produto, nomeLojista, nomeCategoria) {
    const favoritado = favoritos.includes(produto.id);
    const media = calcularMediaAvaliacoes(produto.avaliacoesProduto);

    return `
        <div class="col-12 col-md-6 col-lg-3">
            <article class="card-produto h-100" data-produto-id="${produto.id}">
                <a href="pages/detalhes-do-produto.html?id=${produto.id}">
                    <div class="produto-avaliacao">
                        <i class="ti ti-star-filled"></i>
                        <span>${media ?? ''}</span>
                    </div>
                    <i class="ti ${favoritado ? 'ti-heart-filled' : 'ti-heart'} ti-heart-icon" data-produto-id="${produto.id}"></i>

                    <img src="./img-produtos/${produto.imagemURL?.[0] ?? ''}" class="produto-img" alt="${produto.nome}">

                    <div class="d-flex flex-column flex-grow-1">
                        <h3 class="text-truncate produto-nome mb-1 mt-2">${produto.nome}</h3>
                        <div class="d-flex justify-content-between mt-auto">
                            <div>
                                <p class="produto-lojista m-0">${nomeLojista ?? 'Loja não encontrada'}</p>
                                <small class="produto-categoria">${nomeCategoria ?? 'Sem categoria'}</small>
                                <p class="produto-preco">${formatarMoeda(produto.preco)}</p>
                            </div>
                            <i class="ti ti-shopping-bag-plus"></i>
                        </div>
                    </div>
                </a>
            </article>
        </div>
    `;
}

document.getElementById('form-contato').addEventListener('submit', function (evento) {
    evento.preventDefault(); // Impede o recarregamento da página

    const campos = this.querySelectorAll('input[required], textarea[required]');
    let todosPreenchidos = true;

    for (const campo of campos) {
        if (campo.value.trim() === '') {
            todosPreenchidos = false;
            break;
        }
    }

    const toastSucessoEl = document.getElementById('toast-sucesso');
    const toastErroEl = document.getElementById('toast-erro');

    if (todosPreenchidos) {
        const toastSucesso = bootstrap.Toast.getOrCreateInstance(toastSucessoEl);
        toastSucesso.show();
        this.reset(); // Limpa o formulário após o envio
    } else {
        const toastErro = bootstrap.Toast.getOrCreateInstance(toastErroEl);
        toastErro.show();
    }
});

function marcarFavorito(icone) {
    icone.classList.remove("ti-heart");
    icone.classList.add("ti-heart-filled");

}

document.getElementById('lista-produtos-destaque').addEventListener('click', async evento => {
        const icone = evento.target.closest('.ti-heart-icon');

        if (!icone) return;

        evento.preventDefault();

        await adicionarFavorito(icone);
    });

// Adiciona o produto aos favoritos.
async function adicionarFavorito(icone) {
    if (!usuario) {
        window.location.href = '/pages/login.html';
        return;
    }

    const produtoId = String(icone.dataset.produtoId);

    if (favoritos.includes(produtoId)) {
        mostrarToast('Produto já favoritado', 'Produto já adicionado aos favoritos.', 'erro');
        return;
    }

    try {
        const novosFavoritos = [...favoritos, produtoId];

        const resposta = await fetch(`${URL_USUARIOS}/${usuario.id}`,{
                method: 'PUT',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({favoritos: novosFavoritos})
            }
        );

        if (!resposta.ok) {
            throw new Error('Erro ao salvar favorito.');
        }

        favoritos = novosFavoritos;

        marcarFavorito(icone);
        mostrarToast('Favoritado', 'Produto adicionado aos favoritos.', 'sucesso');

    } catch (erro) {
        console.error('Erro ao adicionar favorito:', erro);

        mostrarToast('Erro', 'Não foi possível favoritar o produto.', 'erro');
    }
}

document.addEventListener('DOMContentLoaded', carregarProdutosDestaque);