const botoesLixeira = document.querySelectorAll(".btn-lixeira");
const modalRemover = new bootstrap.Modal(document.getElementById("modalRemover"));

botoesLixeira.forEach(botao => {
    botao.addEventListener("click", () => {
        modalRemover.show();
    });
});