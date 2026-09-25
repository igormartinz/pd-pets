document.getElementById('form-contato').addEventListener('submit', function (evento) {
    evento.preventDefault(); // impede o recarregamento da página


    const campos = this.querySelectorAll('input[required], textarea[required]');
    let todosPreenchidos = true;

    for (const campo of campos) {
        if (campo.value.trim() === '') {
            todosPreenchidos = false;
            break;
        }
    }

    const toastSucessoEl = document.getElementById('toast-sucesso');
    const toastErroEl = document.getElementById('toast-erro');

    if (todosPreenchidos) {
        const toastSucesso = bootstrap.Toast.getOrCreateInstance(toastSucessoEl);
        toastSucesso.show();
        this.reset(); // limpa o formulário após o envio
    } else {
        const toastErro = bootstrap.Toast.getOrCreateInstance(toastErroEl);
        toastErro.show();
    }
});
