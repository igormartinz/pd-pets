import { mostrarToast } from "./toast.js";

const API_URL_CLIENTE = "https://6aaac6cdff4dd5698b4f060c.mockapi.io";

let clienteAtual;

let idPetEmEdicao;

let idPetParaExcluir;

async function buscarClientePorId(id) {
    try {
        const resp = await fetch(`${API_URL_CLIENTE}/clientes/${id}`);
        if (!resp.ok) throw new Error("Cliente não encontrado");
        return await resp.json();
    } catch (erro) {
        console.error("Erro ao buscar cliente:", erro);
        return null;
    }
}

async function salvarAnimais(novosAnimais) {
    const resp = await fetch(`${API_URL_CLIENTE}/clientes/${clienteAtual.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...clienteAtual, animais: novosAnimais })
    });

    if (!resp.ok) throw new Error("Erro ao salvar os pets");

    clienteAtual = await resp.json();
}

function criarLinhaInfo(info, valor) {
    const linha = document.createElement("div");
    linha.className = "d-flex align-items-center justify-content-between";

    const dt = document.createElement("dt");
    dt.textContent = info;

    const dd = document.createElement("dd");
    dd.textContent = valor;

    linha.append(dt, dd);
    return linha;
}

function criarCardPet(pet) {
    const coluna = document.createElement("div");
    coluna.className = "col-12 col-md-6 col-lg-3";

    const card = document.createElement("article");
    card.className = "card-pet";

    const nome = document.createElement("h2");
    nome.className = "text-center nome-pet";
    nome.textContent = pet.nome;

    const lista = document.createElement("dl");
    lista.append(
        criarLinhaInfo("Espécie", pet.especie),
        criarLinhaInfo("Raça", pet.raca),
        criarLinhaInfo("Idade", `${pet.idade} ${Number(pet.idade) === 1 ? "ano" : "anos"}`),
        criarLinhaInfo("Peso", `${Number(pet.peso).toLocaleString("pt-BR")} kg`)
    );

    const acoes = document.createElement("div");
    acoes.className = "d-flex justify-content-end gap-2";

    const botaoEditar = document.createElement("button");
    botaoEditar.type = "button";
    botaoEditar.className = "botao-acao";
    botaoEditar.setAttribute("aria-label", `Editar ${pet.nome}`);
    botaoEditar.innerHTML = '<i class="ti ti-edit"></i>';
    botaoEditar.addEventListener("click", () => abrirModalEdicao(pet.id));

    const botaoExcluir = document.createElement("button");
    botaoExcluir.type = "button";
    botaoExcluir.className = "bg-danger botao-acao";
    botaoExcluir.setAttribute("aria-label", `Excluir ${pet.nome}`);
    botaoExcluir.innerHTML = '<i class="ti ti-trash"></i>';
    botaoExcluir.addEventListener("click", () => abrirModalExclusao(pet.id));

    acoes.append(botaoEditar, botaoExcluir);
    card.append(nome, lista, acoes);
    coluna.append(card);
    return coluna;
}

function renderizarPets() {
    const lista = document.getElementById("lista-pets");
    const mensagemVazia = document.getElementById("sem-pets");
    const animais = clienteAtual ?? [];
    lista.innerHTML = "";
    mensagemVazia.classList.toggle("d-none", animais.length > 0);
    animais.forEach(pet => lista.append(criarCardPet(pet)));
}

function camposFormulario() {
    return {
        titulo: document.getElementById("titulo-modal-pet"),
        nome: document.getElementById("pet-nome"),
        especie: document.getElementById("pet-especie"),
        raca: document.getElementById("pet-raca"),
        idade: document.getElementById("pet-idade"),
        peso: document.getElementById("pet-peso")
    };
}

function abrirModalCadastro() {
    const campos = camposFormulario();
    idPetEmEdicao = null;
    campos.titulo.textContent = "Cadastrar Pet";
    document.getElementById("form-pet").reset();

    bootstrap.Modal.getOrCreateInstance("#modalCriarPet").show();
}

function abrirModalEdicao(idPet) {
    const pet = clienteAtual.animais.find((animal) => String(animal.id) === String(idPet));
    if (!pet) return null;

    const campos = camposFormulario();

    idPetEmEdicao = pet.id;
    campos.titulo.textContent = "Editar Pet";
    campos.nome.value = pet.nome;
    campos.especie.value = pet.especie;
    campos.raca.value = pet.raca;
    campos.idade.value = pet.idade;
    campos.peso.value = pet.peso;

    bootstrap.Modal.getOrCreateInstance("#modalPet").show();
}

function lerFormulario() {
    const campos = camposFormulario();
    return {
        nome: campos.nome.value.trim(),
        especie: campos.especie.value.trim(),
        raca: campos.raca.value.trim(),
        idade: campos.idade.value.trim(),
        peso: campos.peso.value.trim().replace(",", ".")
    };
}

function validarFormPets(dados) {
    if (!dados.nome || !dados.especie || !dados.raca || !dados.idade || !dados.peso) {
        return "Preencha todos os campos.";
    }

    const idade = Number(dados.idade);
    if (!Number.isInteger(idade) || idade < 0) {
        return "Informe a idade em anos, com um número inteiro.";
    }

    const peso = Number(dados.peso);
    if (isNaN(peso) || peso <= 0) {
        return "Informe um peso maior que zero.";
    }

    return null;
}

function gerarNovoId(animais) {
    const maiorId = Math.max(0, ...animais.map((animal) => Number(animal.id)));
    return maiorId + 1;
}

async function salvarPet() {
    const dados = lerFormulario();
    const erro = validarFormPets(dados);

    if (erro) {
        mostrarToast("Campos inválidos", erro, "erro");
        return null;
    }

    const pet = {
        nome: dados.nome,
        especie: dados.especie,
        raca: dados.raca,
        idade: Number(dados.idade),
        peso: Number(dados.peso),
    }

    const animaisAtuais = clienteAtual.animais ?? [];
    const estaEditando = idPetEmEdicao !== null;

    const novosAnimais = estaEditando
        ? animais.map(animal => String(animal.id) === string(idPetEmEdicao) ? { ...animal, ...pet } : animal)

        : [...animaisAtuais, { id: gerarNovoId(animaisAtuais), ...pet }];

    const botaoSalvar = document.getElementById("btn-salvar-pet");
    botaoSalvar.disabled = true; 
}










