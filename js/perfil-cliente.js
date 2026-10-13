import { mostrarToast } from "./toast.js";

const API_URL_CLIENTE = "https://6aaac6cdff4dd5698b4f060c.mockapi.io";

const CHAVE_SESSAO = "usuarioLogado";

// foi criada pra guardar os dados do cliente anterior e poder utilizar o botão "Cancelar"

let clienteAtual

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

function elementosPerfiL() {
    return {
        nomeHeader: document.querySelector(".nome-usuario"),
        emailHeader: document.querySelector(".email-usuario"),
        iniciais: document.querySelector(".abrev-nome"),
        cpf: document.getElementById("CPF"),
        dataNascimento: document.getElementById("data-nascimento"),
        email: document.getElementById("email"),
        telefone: document.getElementById("telefone"),
        senha: document.getElementById("senha"),
        cadeadoCpf: document.getElementById("cadeado-cpf"),
        cadeadoDataNascimento: document.getElementById("cadeado-data-nascimento"),
        secaoPerfil: document.getElementById("section-form-dados-perfil"),
        botaoEditar: document.getElementById("btn-editar-perfil"),
        botaoSalvar: document.getElementById("btn-salvar-perfil"),
        botaoCancelar: document.getElementById("btn-cancelar-perfil")
    };
}

// função que permite editar os campos válidos

function camposEditaveis() {
    const el = elementosPerfiL();
    return [el.telefone, el.email, el.senha];
}

// Verifica se o o email que o cliente quer editar pertence a outro usuário

async function emailDeOutroCliente(email, idClienteAtual) {
    const resp = await fetch(`${API_URL_CLIENTE}/clientes?email=${encodeURIComponent(email)}`);

    if (resp.status === 404) return null;
    if (!resp.ok) throw new Error("Erro ao validar o e-mail.");

    const clientes = await resp.json();

    return clientes.some(
        (cliente) =>
            cliente.email?.toLowerCase() === email.toLowerCase() &&
            String(cliente.id) !== String(idClienteAtual)
    );
}

async function atualizarCliente(id, dadosAtualizados) {
    const resp = await fetch(`${API_URL_CLIENTE}/clientes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dadosAtualizados)
    });

    if (!resp.ok) throw new Error("Erro ao atualizar cliente.");
    return await resp.json();
}

function formatarDataNascimento(data) {
    if (!data) return "";
    const [ano, mes, dia] = data.split("T")[0].split("-");
    return `${dia}/${mes}/${ano}`;
}

function obterIniciais(nomeCompleto) {
    if (!nomeCompleto) return "";
    const partes = nomeCompleto.trim().split(" ").filter(Boolean);
    const primeira = partes[0]?.[0] ?? "";
    const ultima = partes.length > 1 ? partes[partes.length - 1][0] : "";
    return (primeira + ultima).toUpperCase();
}

function emailValido(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Populando as informações do cliente logado no seu perfil

function preencherPerfil(cliente) {
    const el = elementosPerfiL();

    el.nomeHeader.textContent = cliente.nomeCompleto.trim().split(" ").filter(Boolean).slice(0, 2).join(" ");
    el.emailHeader.textContent = cliente.email;
    el.iniciais.textContent = obterIniciais(cliente.nomeCompleto);

    el.cpf.value = cliente.cpf;
    el.dataNascimento.value = formatarDataNascimento(cliente.dataNascimento);
    el.email.value = cliente.email;
    el.telefone.value = cliente.telefone;

    el.senha.value = "";
}

// Atualiza a sessao do usuário no localStorage

function atualizarSessaoPerfil(cliente) {
    const sessao = JSON.parse(localStorage.getItem(CHAVE_SESSAO));
    if (!sessao) return null;

    sessao.email = cliente.email;
    localStorage.setItem(CHAVE_SESSAO, JSON.stringify(sessao));
}

// Cria o modo edição ao usuário, tirando o status do readOnly como true, deixando o usuário editar suas informações.

function alternarModoEdicao(ativo) {
    const el = elementosPerfiL();

    camposEditaveis().forEach(campo => campo.readOnly = !ativo);

    el.cpf.readOnly = true;
    el.dataNascimento.readOnly = true;
    el.cadeadoCpf.classList.toggle("d-none", !ativo);
    el.cadeadoDataNascimento.classList.toggle("d-none", !ativo);
    el.senha.placeholder = ativo ? "Digite uma nova senha (opcional)" : "••••••••••••••••";
    el.botaoEditar.classList.toggle("d-none", ativo);
    el.botaoSalvar.classList.toggle("d-none", !ativo);
    el.botaoCancelar.classList.toggle("d-none", !ativo);
    el.secaoPerfil.classList.toggle("editando", ativo);

    if (ativo) el.telefone.focus();
}

// Mantém os dados do perfil como estavam anteriormente e mantém o estado de edição

function cancelarEdicao(ativo) {
    preencherPerfil(clienteAtual);
    alternarModoEdicao(false);
}

async function salvarAlteracoes() {
    const el = elementosPerfiL();

    const telefone = el.telefone.value.trim();
    const email = el.email.value.trim();
    const novaSenha = el.senha.value.trim();

    if (!telefone || !email) {
        mostrarToast("Campos vazios", "Preencha telefone e e-mail.", "erro");
        return null;
    }

    if (!emailValido(email)) {
        mostrarToast("E-mail inválido", "Informe um e-mail válido.", "erro");
        return null;
    }

    if (novaSenha && novaSenha.length < 8) {
        mostrarToast("Senha inválida", "A senha deve ter no mínimo 8 caracteres.", "erro");
        return null;
    }

    el.botaoSalvar.disabled = true;

    try {
        const emailAlterado = email.toLowerCase() !== clienteAtual.email.toLowerCase();

        if (emailAlterado && await emailDeOutroCliente(email, clienteAtual.id)) {
            mostrarToast("E-mail indisponível.", "Este e-mail já está cadastrado em outro cliente.", "erro");
            return null;
        }

        const dadosAtualizados = {
            ...clienteAtual,
            telefone,
            email,
            senha: novaSenha || clienteAtual.senha
        };

        const clienteSalvo = await atualizarCliente(clienteAtual.id, dadosAtualizados);

        clienteAtual = clienteSalvo;
        preencherPerfil(clienteAtual);
        atualizarSessaoPerfil(clienteAtual);
        alternarModoEdicao(false);

        mostrarToast("Edição dos dados de usuário", "Seus dados foram alternados com sucesso.", "sucesso");

    } catch (error) {
        console.error("Erro ao salvar as alterações:", error);
        mostrarToast("Erro ao salvar", "Não foi possível atualizar os seus dados. Tente mais tarde.", "erro");
    } finally {
        el.botaoSalvar.disabled = false;
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    const usuarioLogado = verificarAut("cliente");

    if (!usuarioLogado) return null;

    const cliente = await buscarClientePorId(usuarioLogado.id);

    if (!cliente) {
        mostrarToast("Erro ao carregar", "Não foi possível carregar os dados do seu perfil.", "erro");
        return null;
    }

    clienteAtual = cliente;
    preencherPerfil(clienteAtual);
    alternarModoEdicao(false);

    const el = elementosPerfiL()

    el.botaoEditar.addEventListener("click", () => alternarModoEdicao(true));
    el.botaoCancelar.addEventListener("click", cancelarEdicao);
    el.botaoSalvar.addEventListener("click", salvarAlteracoes);

    // Enter dentro do formulário não recarrega a página
    document.querySelector(".form-perfil-cliente").addEventListener("submit", (e) => {
        e.preventDefault();
        salvarAlteracoes();
    });
})
