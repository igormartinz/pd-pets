import { mostrarToast } from "./toast.js";

const API_URL_USUARIO = "https://6aaac6cdff4dd5698b4f060c.mockapi.io";
const API_URL_PRODUTO = "https://6a98614f7160beda2292eff8.mockapi.io";

export async function buscarUsuario(id) {
    const resp = await fetch(`${API_URL_USUARIO}/usuarios/${id}`);
    if (!resp.ok) throw new Error("Uusário não encontrado.");
    return await resp.json();
}

export async function buscarProduto(id) {
    const resp = await fetch(`${API_URL_PRODUTO}/produtos/${id}`);
    if (!resp.ok) throw new Error("Produto não encontrado.");
    return resp.json();
}

export async function salvarCarrinho(usuario, novoCarrinho) {
    const carrinhoAntigo = usuario.carrinho;
    usuario.carrinho = novoCarrinho;

    const resp = await fetch(`${API_URL_USUARIO}/usuarios/${usuario.id}`, {
        method: "PUT",
        headers: { "Content-Type": "Application/json" },
        body: JSON.stringify(usuario)
    });

    if (!resp.ok) {
        usuario.carrinho = carrinhoAntigo;
        throw new Error("Erro ao salvar o carrinho.");
    }

    return await resp.json();
}

export function contarItens(carrinho) {
    let total = 0;
    for (const item of carrinho) {
        total = total + Number(item.quantidade);
    }
    return total;
}

let adicionandoAoCarrinho = false;

export async function addProdutoCarrinho(produto, quantidade, botao) {
    const usuarioLogado = verificarAut("Cliente");
    if (!usuarioLogado) return null;

    if (!quantidade || quantidade < 1) {
        mostrarToast("Quantidade inválida", "Informe ao menos 1 unidade.", "aviso");
        return null;
    }

    adicionandoAoCarrinho = true;
    if (botao) botao.classList.add("adicionando");

    try {
        const usuario = await buscarUsuario(usuarioLogado.id);

        const carrinho = usuario.carrinho || [];

        const itemExistente = carrinho.find(item => {
            return String(item.produtoID) === String(produto.id);
        });

        const quantidadeCarrinho = itemExistente ? Number(itemExistente.quantidade) : 0;
        const novaQuantidade = quantidadeCarrinho + quantidade;

        if (novaQuantidade > Number(produto.estoque)) {
            mostrarToast("Limite de estoque", "Quantidade máxima do estoque atingida.", "aviso");
            return null;
        }

        let novoCarrinho;
        if (itemExistente) {
            novoCarrinho = carrinho.map(item => {
                if (item === itemExistente) {
                    return { id: item.id, produtoID: Number(item.produtoID), quantidade: novaQuantidade };
                }
                return item;
            });
        } else {
            let maiorId = 0;
            for (const item of carrinho) {
                if (Number(item.id) > maiorId) maiorId = Number(item.id);
            }
            novoCarrinho = carrinho.concat([{ id: maiorId + 1, produtoID: produto.id, quantidade: quantidade }]);
        }
        await salvarCarrinho(usuario, novoCarrinho);
        mostrarToast("Adicionado ao carrinho", `${produto.nome} foi adicionado ao carrinho.`, "sucesso");
    } catch (error) {
        console.error(error);
        mostrarToast("Erro", "Não foi possível adicionar ao carrinho.", "erro");
    } finally {
        botao.classList.remove("adicionando");
    }
}

export function ligarBotoesCarrinho() {
    document.addEventListener("click", async (e) => {
        const icone = e.target.closest(".ti-shopping-bag-plus");
        if (!icone) return null;

        e.preventDefault();

        const botao = icone.closest("button") || icone;
        const card = icone.closest("[data-produto-id]");

        if (!card) {
            console.error("Card sem data produto-id", icone);
            return null;
        }

        try {
            const produto = await buscarProduto(card.dataset.produtoId);
            
            await addProdutoCarrinho(produto, 1, botao);
        } catch (erro) {
            console.error(erro);
            mostrarToast("Erro", "Não foi possível adicionar ao carrinho. Tente mais tarde", "erro")
        }
    });
}