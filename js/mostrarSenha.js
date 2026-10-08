export function mostrarSenha() {
    const botoes = document.querySelectorAll('[data-mostrar-senha]');

    botoes.forEach(botao => {
        botao.addEventListener('click', () => {
            const inputId = botao.dataset.mostrarSenha;
            const input = document.getElementById(inputId);

            if (!input) return;

            const senhaVisivel = input.type === 'text';

            input.type = senhaVisivel ? 'password' : 'text';

            botao.innerHTML = senhaVisivel ? '<i class="ti ti-eye"></i>' : '<i class="ti ti-eye-off"></i>';
        });
    });
}