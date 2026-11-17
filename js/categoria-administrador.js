import { mostrarToast } from "./toast.js";

const API_URL_PRODUTOS = "https://6a98614f7160beda2292eff8.mockapi.io";
const API_URL_CATEGORIA = "https://6a9872a37160beda2292ff4f.mockapi.io";

let categorias = []; // lista do mockAPI
let idEmEdicao = null; // estado de edição
let categoriaParaExcluir = null // categoria escolhida para deletar

function mostrarMensagemLista(texto) {
    const lista = document.getElementById("lista-categorias");
    lista.innerHTML = "";

    const mensagem = document.createElement("p");
    mensagem.className = "col-12 text-center my-5";
    mensagem.textContent = texto;
    lista.append(mensagem);
}

async function buscarCategoria() {
    const resp = await fetch(`${API_URL_CATEGORIA}/categorias`);

    if (resp.status === 404) return [];
    if (!resp.ok) throw new Error("Não foi possível buscar a lista de categorias");

    return await resp.json();
}

async function carregarCategorias() {
    mostrarMensagemLista("Carregando categorias...");

    try {
        categorias = await buscarCategoria();
        renderizarCategorias();
    } catch (erro) {
        console.error(erro);
        mostrarMensagemLista("Não foi possível carregar as categorias");
        mostrarToast("Erro", "Não foi possível carregar as categorias. Tente novamente mais tarde", "erro");
    }
}

function criarBotaoIcone(icone, rotulo) {
    const botao = document.createElement("button");
    botao.type = "button";
    botao.className = "btn-icon";
    botao.setAttribute("aria-label", rotulo);

    const i = document.createElement("i");
    i.className = `ti ${icone}`;
    botao.append(i);

    return botao;
}

function criarItemCategoria(categoria) {
    const item = document.createElement("li");
    item.className = "item-categoria";

    const botoes = document.createElement("div");
    botoes.className = "position-btns";

    if (String(categoria.id) === String(idEmEdicao)) {
        // entra no modo de edição
        const campo = document.createElement("input");
        campo.type = "text";
        campo.className = "form-control input-edicao-categoria";
        campo.value = categoria.nome;
        campo.setAttribute("aria-label", campo.value);

        const botaoSalvar = criarBotaoIcone("ti-check", "Salvar");
        botaoSalvar.addEventListener("click", () => {
            salvarEdicao(categoria, campo.value, botaoSalvar);
        });

        const botaoCancelar = criarBotaoIcone("ti-x", "Cancelar");
        botaoCancelar.addEventListener("click", cancelarEdicao);

        campo.addEventListener("keydown", (e) => {
            if (e.key === "Enter") salvarEdicao(categoria, campo.value, botaoSalvar);
            if (e.key === "Escape") cancelarEdicao();
        });

        botoes.append(botaoSalvar, botaoCancelar);
        item.append(campo, botoes);
    } else {
        // modo de exibição
        const nome = document.createElement("span");
        nome.className = "nome-categoria";
        nome.textContent = categoria.nome;

        if (nome.length > 40) {
            mostrarToast("Nome muito longo", "O nome da categoria pode ter no máximo 40 caracteres.", "aviso");
            return;
        }

        const botaoEditar = criarBotaoIcone("ti-pencil", `Editar ${categoria.nome}`);
        botaoEditar.addEventListener("click", () => iniciarEdicao(categoria.id));

        const botaoExcluir = criarBotaoIcone("ti-trash", `Excluir ${categoria.nome}`);
        botaoExcluir.addEventListener("click", () => abrirModalExclusao(categoria));

        botoes.append(botaoEditar, botaoExcluir);
        item.append(nome, botoes);
    }

    return item;
}

function renderizarCategorias() {
    const lista = document.getElementById("lista-categorias");

    if (categorias.length === 0) {
        mostrarMensagemLista("Nenhuma categoria cadastrada.");
        return null;
    }

    categorias.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));

    lista.innerHTML = "";

    categorias.forEach(categoria => lista.append(criarItemCategoria(categoria)));

    const campoEdicao = lista.querySelector(".input-edicao-categoria");
    if (campoEdicao) campoEdicao.focus();
}

async function adicionarCategoria(e) {
    e.preventDefault();

    const campo = document.getElementById("input-nova-categoria");
    const nome = campo.value.trim();

    if (!nome) {
        mostrarToast("Campo obrigatório", "O nome da categoria é obrigatório.", "erro");
        return null;
    }

    const botao = e.submitter;
    if (botao) botao.disabled = true;

    try {
        const resp = await fetch(`${API_URL_CATEGORIA}/categorias`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nome: nome })
        });

        if (!resp.ok) throw new Error("Erro ao cadastrar a categoria.");

        const categoriaCriada = await resp.json();

        categorias.push(categoriaCriada);
        renderizarCategorias();

        campo.value = "";
        mostrarToast("Categoria cadastrada", "Categoria cadastrada com sucesso.", "sucesso");
    } catch (erro) {
        console.error(erro);
        mostrarToast("Erro", "Não foi possível cadastrar a categoria. Tente novamente mais tarde.", "erro");
    } finally {
        if (botao) botao.disabled = false;
    }
}

function iniciarEdicao(categoriaID) {
    idEmEdicao = categoriaID;
    renderizarCategorias();
}

function cancelarEdicao() {
    idEmEdicao = null;
    renderizarCategorias();
}

async function salvarEdicao(categoria, novoNome, botao) {
    const nome = novoNome.trim();

    if (!nome) {
        mostrarToast("Campo obrigatório", "Digite um nome válido para a categoria.", "erro");
        return null;
    }

    if (nome === categoria.nome) {
        cancelarEdicao();
        return null;
    }

    botao.disabled = true;

    try {
        const atualizada = JSON.parse(JSON.stringify(categoria));
        atualizada.nome = nome;

        const resp = await fetch(`${API_URL_CATEGORIA}/categorias/${categoria.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(atualizada)
        });

        if (!resp.ok) throw new Error("Não foi possível realizar a atualização dos dados.");

        const categoriaSalva = await resp.json();

        categorias = categorias.map(item => String(item.id) === String(categoriaSalva.id) ? categoriaSalva : item);
        idEmEdicao = null;
        renderizarCategorias();

        mostrarToast("Categoria atualizada", "Categoria atualizada com sucesso.", "sucesso");
    } catch (erro) {
        console.error(erro);
        botao.disabled = false;
        mostrarToast("Erro", "Não foi possível atualizar a categoria", "erro");
    }

}

document.addEventListener("DOMContentLoaded", (e) => {
    carregarCategorias();

    const addCategoria = document.getElementById("botao-adicionar-categoria");

    addCategoria.addEventListener("click", adicionarCategoria);
});