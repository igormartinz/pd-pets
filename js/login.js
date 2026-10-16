import { mostrarSenha } from "./mostrarSenha.js";
mostrarSenha();

// Toasts reutilizados para a página de login
function mostrarToast(tipo, título, mensagem) {
    const toastId = tipo === "sucesso" ? "toast-sucesso" : "toast-erro";

    const toastElemento = document.getElementById(toastId);

    toastElemento.querySelector(".toast-header strong").textContent = título;
    toastElemento.querySelector(".toast-body").textContent = mensagem;

    const toast = bootstrap.Toast.getOrCreateInstance(toastElemento);
    toast.show();
}

// busca o perfil pelo e-mail cadastrado no MockAPI
async function BuscarUsuarioPorCredenciais(email, senha) {
    try {
        const resp = await fetch(`https://6aaac6cdff4dd5698b4f060c.mockapi.io/usuarios`);

        if (!resp.ok) throw new Error("Erro ao consultar o usuário");

        const usuarios = await resp.json();

        return usuarios.find(usuario =>
            usuario.email?.toLowerCase() === email.toLowerCase() && usuario.senha === senha
        );

    } catch (error) {
        console.error("Erro ao buscar o usuário no MockAPI", error);
        return null;
    }
}


// Salva a sessão do usuário no localStorage (Não salva a senha)
function salvarSessao(usuario, perfil) {
    const dadosSessao = {
        id: usuario.id,
        nome: usuario.nomeCompleto,
        email: usuario.email,
        perfil: usuario.perfis
    };

    localStorage.setItem(CHAVE_SESSAO, JSON.stringify(dadosSessao));
}

async function iniciarLogin(email, senha) {

    const usuario = await BuscarUsuarioPorCredenciais(email, senha);

    if (!usuario) {
        mostrarToast("erro", "Erro de login", "E-mail, senha incorreto.");
        return null;
    }

    salvarSessao(usuario);
    window.location.href = "dashboard-cliente.html";
}

document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector(".entrar form");

    if (!form) return null;

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const email = document.getElementById("email").value.trim();
        const senha = document.getElementById("senha").value.trim();

        // campos obrigatórios
        if (!email || !senha) {
            mostrarToast("erro", "Campos vazios", "Preencha todos os campos.");
            return;
        }

        await iniciarLogin(email, senha);
    });
});