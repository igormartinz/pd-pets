const containerChamados = document.getElementById('chamados-clientes');
const modalChamado = document.getElementById('modalDetalhesChamado');

containerChamados.addEventListener('click', (evento) => {
    const botao = evento.target.closest('.ver-detalhes');

    if (!botao) return;

    const modal = bootstrap.Modal.getOrCreateInstance(modalChamado);
    modal.show();
});

const ICONE_BOTAO = '<i class="ti ti-message-circle-plus"></i> ';

let exibindoChamados = true; // a página abre nos chamados de clientes

// Mostra ou esconde um elemento. Limpa o display:none inline do HTML, se existir.
function definirVisivel(elemento, visivel) {
    elemento.style.display = '';
    elemento.classList.toggle('d-none', !visivel);
}

function conectarAlternancia() {
    const botao = document.getElementById('btn-alternar');
    const titulo = document.getElementById('titulo-pagina');
    const listaChamados = document.getElementById('chamados-clientes');
    const listaSolicitacoes = document.getElementById('solicitacoes-lojista');

    // Deixa a tela de acordo com a visão atual
    function aplicarVisao() {
        definirVisivel(listaChamados, exibindoChamados);
        definirVisivel(listaSolicitacoes, !exibindoChamados);

        titulo.textContent = exibindoChamados ? 'Chamados de Clientes' : 'Solicitações de Lojistas';
        botao.innerHTML = ICONE_BOTAO + (exibindoChamados ? 'Ver solicitações de lojistas' : 'Ver chamados de clientes');
    }

    botao.addEventListener('click', () => {
        exibindoChamados = !exibindoChamados;
        aplicarVisao();
    });

    aplicarVisao(); // também acerta o texto inicial do botão
}

document.addEventListener('DOMContentLoaded', conectarAlternancia);