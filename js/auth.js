// chave usada no localStorage
const CHAVE_SESSAO = "usuarioLogado";

// Recupera os dados do usuário autenticado, transformando os dados em formato JSON ou se não houver, nulo.

function pegarUsuarioLogado() {
    const dados = localStorage.getItem(CHAVE_SESSAO);
    return dados ? JSON.parse(dados) : null;
}

// Proteção de rota conforme o perfil do usuário

function verificarAut(perfilValido) {
    const usuario = pegarUsuarioLogado();

    // Não autenticado manda pra página de login

    if (!usuario) {
        window.location.href = "/pages/login.html";
        return null;
    }

    // Verifica se possui o perfil exigido

    if (!usuario.perfil.includes(perfilValido)) {
        window.location.href = "/pages/login.html";
        return null;
    }

    // Verifica se o lojista foi aprovado

    if (perfilValido === "Lojista" && usuario.status !== "Ativo") {
        sessionStorage.setItem("statusLojista", usuario.status);

        window.location.href = "/pages/dashboard-cliente.html";
        return null;
    }

    return usuario;
}

function logOut() {
    localStorage.removeItem(CHAVE_SESSAO);
    window.location.href = "/index.html";
}

document.addEventListener("DOMContentLoaded", () => {
    const linkPerfil = document.getElementById("link-perfil");
    if (linkPerfil) linkPerfil.href = "dashboard-cliente.html";
});