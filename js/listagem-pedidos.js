import { mostrarToast } from "./toast.js";

const URL_USUARIOS = "https://6aaac6cdff4dd5698b4f060c.mockapi.io/usuarios";
const URL_PEDIDOS = "https://6a98614f7160beda2292eff8.mockapi.io/pedidos";
const URL_PRODUTOS = "https://6a98614f7160beda2292eff8.mockapi.io/produtos";

let listaPedidos = [];
let listaUsuarios = [];
let listaProdutos = [];

async function buscarLista(url) {
    const resp = await fetch(url);

    if (resp.status === 404) return [];
    if (!resp.ok) throw new Error("Erro" + resp.status + "ao buscar" + url);

    return await resp.json();
}

function mostrarMensagemLista(texto) {
    const lista = document.getElementById("lista-pedidos");
    lista.innerHTML = "";

    const mensagem = document.createElement("p");
    mensagem.className = "col-12 text-center my-5";
    mensagem.textContent = texto;
    lista.append(mensagem);
}

async function carregarListaPedidos() {
    mostrarMensagemLista("Carregando...");

    try {
        const resultados = await Promise.all([
            buscarLista(URL_PEDIDOS),
            buscarLista(URL_USUARIOS),
            buscarLista(URL_PRODUTOS)
        ]);

        listaPedidos = resultados[0];
        listaUsuarios = resultados[1];
        listaProdutos = resultados[2];

        console.log("Pedidos:", listaPedidos.length, listaPedidos);
        console.log("Usuarios:", listaUsuarios.length, listaUsuarios);
        console.log("Usuarios:", listaProdutos.length, listaProdutos);
    } catch (error) {
        console.error(error);
        mostrarMensagemLista("Não foi possível carregar os pedidos.");
        mostrarToast("Erro", "Falha ao carregar os pedidos. Tente novamente mais tarde.", "erro");
    }
}



document.addEventListener("DOMContentLoaded", () => {
    carregarListaPedidos();
});