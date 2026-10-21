import { mostrarToast } from "./toast.js";

const modalElemento = document.getElementById("modalRemover");
const modalRemover = new bootstrap.Modal(modalElemento);
const botaoConfirmarRemocao = document.getElementById("confirmarRemocao");
const listaFavoritos = document.getElementById("lista-favoritos");

let produtoParaRemover = null;
let cardParaRemover = null;

async function carregarFavoritos() {
    const listaFavoritos = document.getElementById("lista-favoritos");

    const usuario = pegarUsuarioLogado();

    if (!usuario) {
        window.location.href = "/pages/login.html";
        return;
    }

    try {
        // Busca os dados atualizados do usuário
        const respostaUsuario = await fetch(
            `https://6aaac6cdff4dd5698b4f060c.mockapi.io/usuarios/${usuario.id}`
        );

        if (!respostaUsuario.ok) {
            throw new Error("Não foi possível buscar o usuário.");
        }

        const dadosUsuario = await respostaUsuario.json();

        const idsFavoritos = dadosUsuario.favoritos.map(String);

        // Busca os produtos cadastrados
        const respostaProdutos = await fetch(`https://6a98614f7160beda2292eff8.mockapi.io/produtos`);

        if (!respostaProdutos.ok) {
            throw new Error("Não foi possível buscar os produtos.");
        }

        const produtos = await respostaProdutos.json();

        // Mantém somente os produtos favoritados pelo usuário
        const produtosFavoritos = produtos.filter(produto => idsFavoritos.includes(produto.id));

        if (produtosFavoritos.length === 0) {
            listaFavoritos.innerHTML = '<p class="text-center">Nenhum produto foi adicionado aos favoritos.</p>';
            return;
        }

        listaFavoritos.innerHTML = produtosFavoritos.map(produto => {
            const imagem = produto.imagemURL[0] ?? "";
            const preco = Number(produto.preco).toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL"
            });

            return `
                <div class="col-12 col-md-6 col-lg-3">
                    <article class="card-produto h-100">
                        <a href="/pages/detalhes-do-produto.html?id=${encodeURIComponent(produto.id)}">
                            <img src="../img-produtos/${imagem}" class="produto-img" alt="${produto.nome}">
                            
                            <div class="d-flex flex-column flex-grow-1">
                                <h3 class="text-truncate produto-nome mb-2 mt-2">${produto.nome}</h3>
                                <p class="produto-preco">${preco}</p>
                            </div>
                        </a>

                        <button type="button" class="btn-lixeira" data-produto-id="${produto.id}">
                            <i class="ti ti-trash"></i>
                        </button>
                    </article>
                </div>
            `;
        }).join("");

    } catch (erro) {
        console.error("Erro ao carregar favoritos:", erro);
        listaFavoritos.innerHTML = '<p class="text-center">Ocorreu um erro ao carregar seus favoritos. Tente novamente.</p>';
    }
}

// Abre o modal ao clicar na lixeira
listaFavoritos.addEventListener("click", evento => {
    const botaoLixeira = evento.target.closest(".btn-lixeira");

    if (!botaoLixeira) return;

    evento.preventDefault();

    produtoParaRemover = String(botaoLixeira.dataset.produtoId);
    cardParaRemover = botaoLixeira.closest(".col-12");

    modalRemover.show();
});

// Confirma a remoção do favorito
botaoConfirmarRemocao.addEventListener("click", async () => {
    if (!produtoParaRemover) return;

    const usuario = pegarUsuarioLogado()

    try {
        // Busca a lista atualizada de favoritos
        const respostaUsuario = await fetch(`https://6aaac6cdff4dd5698b4f060c.mockapi.io/usuarios/${usuario.id}`);
        const dadosUsuario = await respostaUsuario.json();

        const favoritosAtuais = Array.isArray(dadosUsuario.favoritos) ? dadosUsuario.favoritos : [];

        // Remove apenas o ID selecionado
        const novosFavoritos = favoritosAtuais.filter(id => id !== produtoParaRemover);

        // Atualiza o MockAPI
        const respostaAtualizacao = await fetch(
            `https://6aaac6cdff4dd5698b4f060c.mockapi.io/usuarios/${usuario.id}`,
            {
                method: "PUT",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({favoritos: novosFavoritos})
            }
        );

        if (!respostaAtualizacao.ok) {
            throw new Error("Não foi possível remover o favorito.");
        }

        // Atualiza a interface após salvar com sucesso
        cardParaRemover?.remove();

        // Atualiza a variável local, se ela existir neste arquivo
        if (typeof favoritos !== "undefined") {
            favoritos = novosFavoritos.map(String);
        }

        modalRemover.hide();

        // Exibe mensagem caso não existam mais cards
        if (!listaFavoritos.querySelector(".card-produto")) {
            listaFavoritos.innerHTML = '<p class="text-center">Você ainda não possui produtos favoritos.</p>';
        }

        produtoParaRemover = null;
        cardParaRemover = null;
        
        mostrarToast("Sucesso", "Produto removido de favoritos.", "sucesso");

    } catch (erro) {
        console.error("Erro ao remover favorito:", erro);
        mostrarToast("Erro", "Não foi possível remover o produto dos favoritos.", "erro");
    }
});

document.addEventListener("DOMContentLoaded", carregarFavoritos);