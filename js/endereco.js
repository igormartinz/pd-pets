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
    if (endereco.principal) card.classList.add("principal");

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
    bairroCidade.textContent = `${endereco.bairro} · ${endereco.cidade} - ${endereco.estado}`;

    const cepCompleto = document.createElement("p");
    cepCompleto.className = "bairro-estado-UF-endereco";
    cepCompleto.textContent = endereco.complemento ? `CEP ${formatarCEP(endereco.cep)} · ${endereco.complemento}` : `CEP ${formatarCEP(endereco.cep)}`;

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
    campos.cep.value = formatarCEP(endereco.cep);
    campos.rua.value = endereco.rua;
    campos.numero.value = endereco.numero;
    campos.complemento.value = endereco.complemento ?? "";
    campos.bairro.value = endereco.bairro;
    campos.cidade.value = endereco.cidade;
    campos.estado.value = endereco.estado;
    campos.principal.checked = Boolean(endereco.principal);

    bootstrap.Modal.getOrCreateInstance("#modalEndereco").show();
}

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

function validarEndereco(dados) {
    const { cep, rua, numero, bairro, cidade, estado } = dados;

    if (!cep || !rua || !numero || !bairro || !cidade || !estado) {
        return "Preencha todos os campos obrigatórios. Só o complemento é opcional.";
    }

    if (!/^\d{5}-\d{3}$/.test(cep)) {
        return "Informe um CEP válido, com 8 números.";
    }

    if (!Number.isInteger(Number(numero)) || Number(numero) <= 0) {
        return "O número deve ser um número inteiro maior que zero.";
    }

    if (!/^[A-Z]{2}$/.test(estado)) {
        return "Informe a sigla do estado.";
    }

    return null;
}

async function enviarEndereco(metodo, url, corpo) {
    const resp = await fetch(url, {
        method: metodo,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(corpo)
    });
    if (!resp.ok) throw new Error(`Erro na requisição ${metodo}`);
    return await resp.json();
}

async function desmarcarOutrosPrincipais(idPrincipal) {
    const outrosPrincipais = enderecos.filter(e => e.principal && String(e.id) !== String(idPrincipal));

    for (const endereco of outrosPrincipais) {
        await enviarEndereco("PUT", `${API_URL_USUARIO_ENDERECO}/enderecos/${endereco.id}`, { ...endereco, principal: false });
    }
}

async function salvarEndereco() {
    const dados = lerFormularioEndereco();
    const erro = validarEndereco(dados);
    if (erro) {
        mostrarToast("Campos inválidos", erro, "erro");
        return null;
    }

    const endereco = { ...dados, numero: Number(dados.numero), [CAMPO_CLIENTE_ID]: idUsuario };
    const estaEditando = idEnderecoEmEdicao !== null;

    const botaoSalvar = document.getElementById("btn-salvar-endereco");
    botaoSalvar.disabled = true;

    try {
        const salvo = estaEditando
            ? await enviarEndereco("PUT", `${API_URL_USUARIO_ENDERECO}/enderecos/${idEnderecoEmEdicao}`, endereco)
            : await enviarEndereco("POST", `${API_URL_USUARIO_ENDERECO}/enderecos`, endereco);

        if (salvo.principal) await desmarcarOutrosPrincipais(salvo.id);
        enderecos = await buscarEnderecos(idUsuario);
        renderizarEnderecos();
        bootstrap.Modal.getOrCreateInstance("#modalEndereco").hide();
        mostrarToast(estaEditando ? "Endereço atualizado" : "Endereço cadastrado", "Seu endereço foi salvo com sucesso.", "sucesso");
    } catch (erroSalvar) {
        console.error(erroSalvar);
        mostrarToast("Erro ao salvar", "Não foi possível salvar o endereço informado.", "erro");
    } finally {
        botaoSalvar.disabled = false;
    }
}

function abrirModalExclusao(idEndereco) {
    if (enderecos.length <= 1) {
        mostrarToast("Ação não permitida", "Você precisa ter pelomenos um endereço cadastrado.", "aviso");
        return null;
    }

    idEnderecoParaExcluir = idEndereco;
    bootstrap.Modal.getOrCreateInstance("#modalExcluirEndereco").show();
}

async function confirmarExclusao() {
    const removido = enderecos.find(e => String(e.id) === String(idEnderecoParaExcluir));
    const botaoRemover = document.getElementById("btn-confirmar-exclusao-endereco");
    botaoRemover.disabled = true;

    try {
        const resp = await fetch(`${API_URL_USUARIO_ENDERECO}/enderecos/${idEnderecoParaExcluir}`, { method: "DELETE" });
        if (!resp.ok) throw new Error("Erro ao excluir endereço");
        enderecos = enderecos.filter(e => String(e.id) !== String(idEnderecoParaExcluir));

        if (removido?.principal && enderecos.length > 0) {
            const novoPrincipal = await enviarEndereco("PUT", `${API_URL_USUARIO_ENDERECO}/enderecos/${enderecos[0].id}`, { ...enderecos[0], principal: true });
            enderecos[0] = novoPrincipal;
        }

        renderizarEnderecos();
        bootstrap.Modal.getOrCreateInstance("#modalExcluirEndereco").hide();
        mostrarToast("Endereço removido", "O endereço foi removido com sucesso.", "sucesso");
    } catch (erro) {
        console.error(erro);
        mostrarToast("Erro ao remover", "Não foi possível remover o endereço. Tente mais tarde.", "erro");
    } finally {
        botaoRemover.disabled = false;
        idEnderecoParaExcluir = null;
    }
}

function formatarCEP(valor) {
    const numeros = String(valor).replace(/\D/g, "").slice(0.8);
    if (numeros.length <= 5) return numeros;
    return `${numeros.slice(0, 5)}-${numeros.slice(5)}`;
}

function maskCEP() {
    const seletorCEP = document.getElementById("end-cep");
    seletorCEP.addEventListener("input", () => {
        seletorCEP.value = formatarCEP(seletorCEP.value);
    })
}

document.addEventListener("DOMContentLoaded", async () => {
    const usuarioLogado = verificarAut("Cliente");
    if (!usuarioLogado) return null;
    idUsuario = usuarioLogado.id;

    try {
        enderecos = await buscarEnderecos(idUsuario);
        renderizarEnderecos();
    } catch (erro) {
        console.error(erro);
        mostrarToast("Erro ao carregar", "Não foi possível carregar os endereços.", "erro")
    }

    document.getElementById("btn-novo-endereco").addEventListener("click", () => abrirModalNovo());
    document.getElementById("btn-salvar-endereco").addEventListener("click", () => salvarEndereco())
    document.getElementById("form-endereco").addEventListener("submit", e => {
        e.preventDefault();
        salvarEndereco();
    });
    document.getElementById("btn-confirmar-exclusao-endereco").addEventListener("click", () => {
        confirmarExclusao();
    })
    maskCEP();
});