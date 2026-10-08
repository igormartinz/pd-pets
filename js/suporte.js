const containerEstrelas = document.getElementById('avaliacao-estrelas');
const estrelas = containerEstrelas.querySelectorAll('i');

// Guarda a nota do usuario
let notaSelecionada = 0;

// Pinta as estrelas visulmente até a quantidade informada
function pintarEstrelas(quantidade) {
    estrelas.forEach(function (estrela) {
        // Lê o valor numérico guardado no atributo data-nota de cada estrela
        const valor = parseInt(estrela.dataset.nota);

        if (valor <= quantidade) {
            // Estrela dentro da faixa selecionada fica preenchida
            estrela.classList.remove('ti-star');
            estrela.classList.add('ti-star-filled');
        } else {
            // Estrela fora da faixa: volta a ficar vazia
            estrela.classList.remove('ti-star-filled');
            estrela.classList.add('ti-star');
        }
    });
}

// Conecta os eventos de clique e hover em cada uma das 5 estrelas
estrelas.forEach(function (estrela) {
    // Clique: fixa a nota selecionada
    estrela.addEventListener('click', function () {
        notaSelecionada = parseInt(this.dataset.nota);
        pintarEstrelas(notaSelecionada);
    });

    // Hover: mostra prévia
    estrela.addEventListener('mouseenter', function () {
        pintarEstrelas(parseInt(this.dataset.nota));
    });
});

// Ao tirar o mouse de cima do grupo inteiro, volta a mostrar a nota realmente selecionada
containerEstrelas.addEventListener('mouseleave', function () {
    pintarEstrelas(notaSelecionada);
});