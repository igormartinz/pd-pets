// chave usada no localStorage
const CHAVE_SESSAO = "usuarioLogado";

const LOGIN = "/pages/login.html";
const DASHBOARD_CLIENTE = "/pages/dashboard-cliente.html";

// Recupera os dados do usuário autenticado, transformando os dados em formato JSON ou se não houver, nulo.

function pegarUsuarioLogado() {
    const dados = localStorage.getItem(CHAVE_SESSAO);
    return dados ? JSON.parse(dados) : null;
}

// replace() não deixa a página no histórico, o botão Voltar não leva de volta a ela.
function redirecionar(destino) {
    window.location.replace(destino);
    return null;
}

// Destino padrão de quem tentou acessar uma página sem permissão, o dashboard de cliente, caso não houver usuario, vai para Login
function irParaDashboardCliente(usuario) {
    return redirecionar(usuario.perfil.includes("Cliente") ? DASHBOARD_CLIENTE : LOGIN);
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
        return irParaDashboardCliente(usuario);
    }

    // Verifica se o lojista foi aprovado

    if (perfilValido === "Lojista" && usuario.status !== "Ativo") {
        sessionStorage.setItem("statusLojista", usuario.status);

        return irParaDashboardCliente(usuario);
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