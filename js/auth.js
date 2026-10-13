// chave usada no localStorage
const CHAVE_SESSAO = "usuarioLogado";

// Direcionamento para os dashboards
const DASHBOARDS = {
    cliente: "/pages/dashboard-cliente.html",
    lojista: "/pages/dashboard-lojista.html",
    administrador: "/pages/dashboard-administrador.html"
};

// Recupera os dados do usuário autenticado, transformando os dados em formato JSON ou se não houver, nulo.

function pegarUsuarioLogado() {
    const dados = localStorage.getItem(CHAVE_SESSAO);
    return dados ? JSON.parse(dados) : null;
}

// Retorna o dashboard do usuário conforme o seu devido perfil logado

function pegarDashboardUsuario() {
    const usuario = pegarUsuarioLogado();
    if (!usuario) return "/pages/login.html";
    return DASHBOARDS[usuario.perfil] ?? "/pages/login.html";

}

// Proteção de rota conforme o perfil do usuário

function verificarAut(perfilValido) {
    const usuario = pegarUsuarioLogado();

    // Não autenticado manda pra página de login

    if (!usuario) {
        window.location.href = "/pages/login.html";
        return null;
    }
    // Autenticado mas com o perfil errado pra página, manda pro login

    if (perfilValido && usuario.perfil !== perfilValido) {
        window.location.href = "/pages/login.html";
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
    if (linkPerfil) linkPerfil.href = pegarDashboardUsuario();
});