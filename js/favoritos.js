const botoesLixeira = document.querySelectorAll(".btn-lixeira");
const modalRemover = new bootstrap.Modal(document.getElementById("modalRemover"));

console.log(botoesLixeira)

botoesLixeira.forEach(botao => {
    botao.addEventListener("click", () => {
        modalRemover.show();
    });
});