import { mostrarToast } from "./toast.js";

const CHAVE_SESSAO = "usuarioLogado";

let LojistaAtual

async function buscarLojistaPorId(id) {
    try {
        const resp = await fetch(`https://6aaac6cdff4dd5698b4f060c.mockapi.io/usuarios/${id}`);
        if (!resp.ok) throw new Error("Lojista não encontrado");
        return await resp.json();
    } catch (erro) {
        console.error("Erro ao buscar Lojista:", erro);
        return null;
    }
}

function elementosPerfiL() {
    return {
        nomeHeader: document.querySelector(".nome-loja"),
        emailHeader: document.querySelector(".email-loja"),
        iniciais: document.querySelector(".abrev-nome"),
        nomeLoja: document.getElementById("nome-empresa"),
        nomeResponsavel: document.getElementById("nome-responsavel"),
        cnpj: document.getElementById("CNPJ"),
        email: document.getElementById("email"),
        telefone: document.getElementById("telefone"),
        cadeadoCnpj: document.getElementById("cadeado-cnpj"),
        cadeadoNomeResponsavel: document.getElementById("cadeado-nome-responsavel"),
        secaoPerfil: document.getElementById("section-form-dados-perfil"),
        botaoEditar: document.getElementById("btn-editar-perfil"),
        botaoSalvar: document.getElementById("btn-salvar-perfil"),
        botaoCancelar: document.getElementById("btn-cancelar-perfil")
    };
}

// Função que permite editar os campos válidos
function camposEditaveis() {
    const el = elementosPerfiL();
    return [el.telefone, el.email, el.nomeLoja];
}

// Verifica se o o email que o Lojista quer editar pertence a outro usuário
async function emailDeOutroLojista(email, idLojistaAtual) {
    const resp = await fetch(`https://6aaac6cdff4dd5698b4f060c.mockapi.io/usuarios?email=${encodeURIComponent(email)}`);

    if (resp.status === 404) return null;
    if (!resp.ok) throw new Error("Erro ao validar o e-mail.");

    const usuarios = await resp.json();

    return usuarios.some(
        (lojista) =>
            lojista.email?.toLowerCase() === email.toLowerCase() &&
            String(lojista.id) !== String(idLojistaAtual)
    );
}

async function atualizarLojista(id, dadosAtualizados) {
    const resp = await fetch(`https://6aaac6cdff4dd5698b4f060c.mockapi.io/usuarios/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dadosAtualizados)
    });

    if (!resp.ok) throw new Error("Erro ao atualizar Lojista.");
    return await resp.json();
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
function preencherPerfil(lojista) {
    const el = elementosPerfiL();

    el.nomeHeader.textContent = lojista.nomeCompleto.trim().split(" ").filter(Boolean).slice(0, 2).join(" ");
    el.emailHeader.textContent = lojista.email;
    el.iniciais.textContent = obterIniciais(lojista.nomeCompleto);

    el.nomeLoja.value = lojista.nomeEmpresa;
    el.nomeResponsavel.value = lojista.nomeCompleto;
    el.cnpj.value = lojista.cnpj;
    el.email.value = lojista.email;
    el.telefone.value = lojista.telefone;
}

// Atualiza a sessao do usuário no localStorage
function atualizarSessaoPerfil(lojista) {
    const sessao = JSON.parse(localStorage.getItem(CHAVE_SESSAO));
    if (!sessao) return null;

    sessao.email = lojista.email;
    localStorage.setItem(CHAVE_SESSAO, JSON.stringify(sessao));
}

// Cria o modo edição ao usuário, tirando o status do readOnly como true, deixando o usuário editar suas informações.
function alternarModoEdicao(ativo) {
    const el = elementosPerfiL();

    camposEditaveis().forEach(campo => campo.readOnly = !ativo);

    el.cnpj.readOnly = true;
    el.nomeResponsavel.readOnly = true;
    el.cadeadoCnpj.classList.toggle("d-none", !ativo);
    el.cadeadoNomeResponsavel.classList.toggle("d-none", !ativo);
    el.botaoEditar.classList.toggle("d-none", ativo);
    el.botaoSalvar.classList.toggle("d-none", !ativo);
    el.botaoCancelar.classList.toggle("d-none", !ativo);
    el.secaoPerfil.classList.toggle("editando", ativo);

    if (ativo) el.telefone.focus();
}

// Mantém os dados do perfil como estavam anteriormente e mantém o estado de edição
function cancelarEdicao(ativo) {
    preencherPerfil(LojistaAtual);
    alternarModoEdicao(false);
}

async function salvarAlteracoes() {
    const el = elementosPerfiL();

    const telefone = el.telefone.value.trim();
    const email = el.email.value.trim();
    const nomeEmpresa = el.nomeLoja.value.trim();

    if (!telefone || !email || !nomeEmpresa) {
        mostrarToast("Campos vazios", "Preencha todos os campos", "erro");
        return null;
    }

    if (!emailValido(email)) {
        mostrarToast("E-mail inválido", "Informe um e-mail válido.", "erro");
        return null;
    }

    el.botaoSalvar.disabled = true;

    try {
        const emailAlterado = email.toLowerCase() !== LojistaAtual.email.toLowerCase();

        if (emailAlterado && await emailDeOutroLojista(email, LojistaAtual.id)) {
            mostrarToast("E-mail indisponível.", "Este e-mail já está cadastrado em outro usuario.", "erro");
            return null;
        }

        const dadosAtualizados = {
            ...LojistaAtual,
            telefone,
            email,
            nomeEmpresa
        };

        const usuarioSalvo = await atualizarLojista(LojistaAtual.id, dadosAtualizados);

        LojistaAtual = usuarioSalvo;
        preencherPerfil(LojistaAtual);
        atualizarSessaoPerfil(LojistaAtual);
        alternarModoEdicao(false);

        mostrarToast("Edição dos dados", "Seus dados foram alternados com sucesso.", "sucesso");

    } catch (error) {
        console.error("Erro ao salvar as alterações:", error);
        mostrarToast("Erro ao salvar", "Não foi possível atualizar os seus dados. Tente mais tarde.", "erro");
    } finally {
        el.botaoSalvar.disabled = false;
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    const usuarioLogado = verificarAut("Lojista");

    if (!usuarioLogado) return null;

    const lojista = await buscarLojistaPorId(usuarioLogado.id);

    if (!lojista) {
        mostrarToast("Erro ao carregar", "Não foi possível carregar os dados do seu perfil.", "erro");
        return null;
    }

    LojistaAtual = lojista;
    preencherPerfil(LojistaAtual);
    alternarModoEdicao(false);

    const el = elementosPerfiL()

    el.botaoEditar.addEventListener("click", () => alternarModoEdicao(true));
    el.botaoCancelar.addEventListener("click", cancelarEdicao);
    el.botaoSalvar.addEventListener("click", salvarAlteracoes);

    // Enter dentro do formulário não recarrega a página
    document.querySelector(".form-perfil-lojista").addEventListener("submit", (e) => {
        e.preventDefault();
        salvarAlteracoes();
    });
})
