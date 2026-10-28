const usuario = pegarUsuarioLogado();

function exibeDashboardsSidebar() {
    
    const perfis = usuario.perfil;
    const linksDashboards = document.querySelectorAll('[data-perfil]');

    linksDashboards.forEach(link => {
        const perfilNecessario = link.dataset.perfil;
        const possuiPerfil = perfis.includes(perfilNecessario);

        const lojistaAtivo = perfilNecessario !== "Lojista" || usuario.status === "Ativo";

        link.style.display = possuiPerfil && lojistaAtivo ? "" : "none";
    });
}

document.addEventListener('DOMContentLoaded', exibeDashboardsSidebar)