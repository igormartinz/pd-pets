export function mostrarToast(titulo, mensagem, tipo) {
    const toastElemento = document.getElementById('toast');
    const indicador = document.getElementById('toast-indicador');
    const tituloElemento = document.getElementById('toast-titulo');
    const mensagemElemento = document.getElementById('toast-mensagem');

    tituloElemento.textContent = titulo;
    mensagemElemento.textContent = mensagem;

    indicador.className = 'rounded-1';

    // Remove classes anteriores
    tituloElemento.classList.remove(
        'text-success',
        'text-danger',
        'text-warning',
        'text-primary'
    );

    // Define o estilo de acordo com o tipo
    switch (tipo) {
        case 'sucesso':
            indicador.classList.add('bg-success');
            tituloElemento.classList.add('text-success');
            break;

        case 'erro':
            indicador.classList.add('bg-danger');
            tituloElemento.classList.add('text-danger');
            break;

        case 'aviso':
            indicador.classList.add('bg-warning');
            tituloElemento.classList.add('text-warning');
            break;

        case 'info':
            indicador.classList.add('bg-primary');
            tituloElemento.classList.add('text-primary');
            break;
    }

    const toast = bootstrap.Toast.getOrCreateInstance(toastElemento);
    toast.show();
}