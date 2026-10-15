import { mostrarToast } from "./toast.js";

const API_URL_USUARIO_ENDERECO = "https://6aaac6cdff4dd5698b4f060c.mockapi.io";
const CAMPO_CLIENTE_ID = "clienteId";

let idUsuario = null;
let enderecos = [];
let idEnderecoEmEdicao = null;
let idEnderecoParaExcluir = null;

async function buscarEnderecos(id) {
    const resp = await fetch(`${API_URL_USUARIO_ENDERECO}/enderecos?${CAMPO_CLIENTE_ID}=${id}`);

    if (resp.status === 404) return [];
    if (!resp.ok) throw new Error("Usuário não encontrado");

    const listaEnd = await resp.json();

    return listaEnd.filter(endereco => String(endereco[CAMPO_CLIENTE_ID]) === String(id));
}

function criarCardEndereco(endereco) {
    const card = document.createElement("div");
    card.className = "container-item-endereco";
    if (enderecos.principal) card.classList.add(principal);

    const info = document.createElement("div");
    info.className = "container-info-endereco";

    if (endereco.principal) {
        const badge = document.createElement("p");
        badge.className = "badge-principal";
        badge.textContent = "principal";
        info.append(badge);
    }

    const ruaNumero = document.createElement("h3");
    ruaNumero.className = "nome-rua-numero-endereco";
    ruaNumero.textContent = `${endereco.rua}, ${endereco.numero}`;

    const bairroCidade = document.createElement("p");
    bairroCidade.className = "bairro-estado-UF-endereco";
    bairroCidade.textContent = `${endereco.bairro} · ${endereco.cidade}`;

    const cepCompleto = document.createElement("p");
    cepCompleto.className = "bairro-estado-UF-endereco";
    cepCompleto.textContent = endereco.complemento ? `CEP ${endereco.cep} · ${endereco.complemento}` : `CEP ${endereco.cep}`;

    info.append(ruaNumero, bairroCidade, cepCompleto);

    const acoes = document.createElement("div");
    acoes.className = "container-btn-acoes";

    const botaoEditar = document.createElement("button");
    botaoEditar.type = "button";
    botaoEditar.className = "btn-pencil";
    botaoEditar.setAttribute("aria-label", "Editar endereço");
    botaoEditar.innerHTML = '<i class="ti ti-pencil" style="font-size: 24px;"></i>';
    botaoEditar.addEventListener("click", () => abrirModalEdicao(endereco.id));

    const botaoExcluir = document.createElement("button");
    botaoExcluir.type = "button";
    botaoExcluir.className = "btn-trash";
    botaoExcluir.setAttribute("aria-label", "Excluir endereço");
    botaoExcluir.innerHTML = '<i class="ti ti-trash" style="font-size: 24px;"></i>';
    botaoExcluir.addEventListener("click", () => abrirModalExclusao(endereco.id));

    acoes.append(botaoEditar, botaoExcluir);
    card.append(info, acoes);
    return card;
}

function renderizarEnderecos() {
    const lista = document.getElementById("lista-enderecos");
    lista.innerHTML = "";

    if (enderecos.length === 0) {
        const vazio = document.createElement("p");
        vazio.className = "txt-vazio-endereco";
        vazio.textContent = "Nenhum endereço cadastrado.";
        lista.append(vazio);
        return vazio;
    }

    const ordenados = [...enderecos].sort((a, b) => Number(b.principal) - Number(a.principal));
    ordenados.forEach(endereco => lista.append(criarCardEndereco(endereco)));
}

function camposEndereco() {
    return {
        titulo: document.getElementById("titulo-modal-endereco"),
        cep: document.getElementById("end-cep"),
        rua: document.getElementById("end-rua"),
        numero: document.getElementById("end-numero"),
        complemento: document.getElementById("end-complemento"),
        bairro: document.getElementById("end-bairro"),
        cidade: document.getElementById("end-cidade"),
        estado: document.getElementById("end-estado"),
        principal: document.getElementById("end-principal")
    }
}

function abrirModalNovo() {
    idEnderecoEmEdicao = null;
    camposEndereco().titulo.textContent = "Novo Endereço";
    document.getElementById("form-endereco").reset();
    bootstrap.Modal.getOrCreateInstance("#modalEndereco").show();
}

function abrirModalEdicao(idEndereco) {
    const endereco = enderecos.find(e => String(e.id) === String(idEndereco));
    if (!endereco) return null;

    const campos = camposEndereco();
    idEnderecoEmEdicao = endereco.id;
    campos.titulo.textContent = "Editar Endereço";
    campos.cep.value = endereco.cep;
    campos.rua.value = endereco.rua;
    campos.numero.value = endereco.numero;
    campos.complemento.value = endereco.complemento ?? "";
    campos.bairro.value = endereco.bairro;
    campos.cidade.value = endereco.cidade;
    campos.estado.value = endereco.estado;
    campos.principal.checked = Boolean(endereco.principal);

    bootstrap.Modal.getOrCreateInstance("#modalEndereco").show();
}

document.addEventListener("DOMContentLoaded", async () => {
    const usuarioLogado = verificarAut("cliente");
    if (!usuarioLogado) return null;
    idUsuario = usuarioLogado.id;

    enderecos = await buscarEnderecos(idUsuario);
    renderizarEnderecos();

    document.getElementById("btn-novo-endereco").addEventListener("click", () => abrirModalNovo());

    document.querySelector(".btn-pencil").addEventListener("click", () => abrirModalEdicao());
});

function lerFormularioEndereco() {
    const campos = camposEndereco();
    return {
        cep: campos.cep.value.trim(),
        rua: campos.rua.value.trim(),
        numero: campos.numero.value.trim(),
        complemento: campos.complemento.value.trim(),
        bairro: campos.bairro.value.trim(),
        cidade: campos.cidade.value.trim(),
        estado: campos.estado.value.trim().toUpperCase(),
        principal: campos.principal.checked
    };
}

