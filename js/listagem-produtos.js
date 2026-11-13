const tabelaProdutos = document.getElementById('tabela-produtos-lista');
const modalDesativar = document.getElementById('modalDesativarProduto');

tabelaProdutos.addEventListener('click', (evento) => {
    const celula = evento.target.closest('.form-check-input');

    if (!celula) return;

    const modal = bootstrap.Modal.getOrCreateInstance(modalDesativar);
    modal.show();
});