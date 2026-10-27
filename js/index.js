import { ligarBotoesCarrinho } from "./carrinho-api.js";
import { mostrarToast } from "./toast.js";

ligarBotoesCarrinho();

document.getElementById('form-contato').addEventListener('submit', function (evento) {
    evento.preventDefault(); // impede o recarregamento da página


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
        this.reset(); // limpa o formulário após o envio
    } else {
        const toastErro = bootstrap.Toast.getOrCreateInstance(toastErroEl);
        toastErro.show();
    }
});

const usuario = pegarUsuarioLogado();
let favoritos = [];

async function carregarFavoritos() {
    if (!usuario) return;

    try {
        const resposta = await fetch(`https://6aaac6cdff4dd5698b4f060c.mockapi.io/usuarios/${usuario.id}`);
        const dadosUsuario = await resposta.json();

        favoritos = dadosUsuario.favoritos.map(String);

        document.querySelectorAll(".ti-heart-icon").forEach(icone => {
            const produtoId = String(icone.dataset.produtoId);

            if (favoritos.includes(produtoId)) {
                marcarFavorito(icone);
            }
        });

    } catch (erro) {
        console.error("Erro ao carregar favoritos:", erro);
    }
}

document.querySelectorAll(".ti-heart-icon").forEach(icone => {
    icone.addEventListener("click", evento => {
        evento.preventDefault();

        adicionarFavorito(icone);
    });
});

function marcarFavorito(icone) {
    icone.classList.remove("ti-heart");
    icone.classList.add("ti-heart-filled");

}

async function adicionarFavorito(icone) {
    if (!usuario) {
        window.location.href = "/pages/login.html";
        return;
    }

    const produtoId = String(icone.dataset.produtoId);

    // Não permite remover nem duplicar favoritos
    if (favoritos.includes(produtoId)) {
        mostrarToast('Produto já favoritado', 'Produto já adicionado aos favoritos.', 'erro');
        return
    };

    try {
        const novosFavoritos = [...favoritos, produtoId];

        const resposta = await fetch(`https://6aaac6cdff4dd5698b4f060c.mockapi.io/usuarios/${usuario.id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ favoritos: novosFavoritos })
        });

        if (!resposta.ok) {
            throw new Error("Erro ao salvar favorito.");
        }

        favoritos = novosFavoritos;
        marcarFavorito(icone);
        mostrarToast('Favoritado', 'Produto adicionado aos favoritos.', 'sucesso');

    } catch (erro) {
        console.error("Erro ao adicionar favorito:", erro);
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    document.querySelectorAll(".ti-heart-icon").forEach(icone => {
        icone.addEventListener("click", () => adicionarFavorito(icone));

        icone.addEventListener("keydown", evento => {
            evento.preventDefault();
            adicionarFavorito(icone);
        });
    });

    await carregarFavoritos();
});