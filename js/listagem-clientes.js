const tabelaClientes = document.getElementById('tabela-clientes-lista');
const modalDetalhes = document.getElementById('modalDetalhesUsuario');

tabelaClientes.addEventListener('click', (evento) => {
    const celula = evento.target.closest('.linha-celula');

    if (!celula) return;

    const modal = bootstrap.Modal.getOrCreateInstance(modalDetalhes);
    modal.show();
});