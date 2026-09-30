document.addEventListener('DOMContentLoaded', function () {
    const formPesquisa = document.getElementById('form-pesquisa');
    const inputPesquisa = document.getElementById('input-pesquisa');

    // Clique na lupa
    formPesquisa.addEventListener('submit', function (evento) {
        
        evento.preventDefault();
        const termo = inputPesquisa.value.trim();
        redirecionarOuFiltrar(termo);
    });

    // busca em tempo real (só tem efeito se já estiver no catálogo)
    let temporizador;
    inputPesquisa.addEventListener('input', function () {
        if (typeof window.filtrarCatalogoPorBusca !== 'function') return; // não está no catálogo
        clearTimeout(temporizador);
        temporizador = setTimeout(() => {
            window.filtrarCatalogoPorBusca(this.value);
        }, 300);
    });

    function redirecionarOuFiltrar(termo) {
        // se a função do catálogo existir na página atual, usa ela
        if (typeof window.filtrarCatalogoPorBusca === 'function') {
            window.filtrarCatalogoPorBusca(termo);
        } else {
            // senão, redireciona pro catálogo levando o termo
            window.location.href = `/pages/catalogo-de-produtos.html?busca=${encodeURIComponent(termo)}`;
        }
    }
});