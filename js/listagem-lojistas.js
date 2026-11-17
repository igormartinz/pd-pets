const tabelaClientes = document.getElementById('tabela-lojista-lista');
const modalDetalhes = document.getElementById('modalDetalhesUsuario');

tabelaClientes.addEventListener('click', (evento) => {
    const celula = evento.target.closest('.nome-empresa');

    if (!celula) return;

    const modal = bootstrap.Modal.getOrCreateInstance(modalDetalhes);
    modal.show();
});