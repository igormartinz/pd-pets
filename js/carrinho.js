import { mostrarToast } from "./toast.js";

import { buscarUsuario, buscarProduto, salvarCarrinho, contarItens } from "./carrinho-api.js";

const API_URL_ENDERECO = "https://6aaac6cdff4dd5698b4f060c.mockapi.io";

const API_URL_PEDIDO = "https://6a98614f7160beda2292eff8.mockapi.io";

const API_URL_PRODUTO = "https://6a98614f7160beda2292eff8.mockapi.io";

function copiarObjeto(objeto) {
    return JSON.parse(JSON.stringify(objeto));
}

async function atualizarRecurso(url, dados) {
    const resp = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dados)
    });
    if (!resp.ok) throw new Error(`Erro ao atualizar ${url}`);
    return await resp.json();
}

let usuarioAtual = null;
let produtosPorId = {};
let idItemParaRemover = null;
let pedidosPendentes = [];
let enderecoSelecionado = null;

function mostrarCarregando() {
    const lista = document.getElementById("lista-carrinho");
    lista.innerHTML = '<p id="carrinho-carregando">Carregando seu carrinho...</p>'
}

async function carregarProdutos(carrinho) {
    const ids = carrinho.map(item => { return item.produtoID });

    const produtos = await Promise.all(ids.map(id => {
        return buscarProduto(id).catch(() => { return null; });
    }))

    produtosPorId = {};
    for (const produto of produtos) {
        if (produto) produtosPorId[String(produto.id)] = produto;
    }
}

function formatarPreco(valor) {
    return Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function calcularSubTotal(item) {
    const produto = produtosPorId[String(item.produtoID)];
    return Number(produto.preco) * Number(item.quantidade);
}

function itensValidos() {
    return usuarioAtual.carrinho.filter(item => {
        return produtosPorId[String(item.produtoID)] !== undefined;
    });
}

function criarCardItem(item) {
    const produto = produtosPorId[String(item.produtoID)];

    const coluna = document.createElement("div");
    coluna.className = "col-12";

    const card = document.createElement("article");
    card.className = "item-carrinho d-flex gap-2 w-100";
    card.dataset.itemId = item.id;

    const imagem = document.createElement("img");
    imagem.className = "img-item";
    imagem.src = `/img-produtos/${produto.imagemURL[0]}`;
    imagem.alt = produto.nome;

    const conteudo = document.createElement("div");
    conteudo.className = "conteudo-item d-flex flex-column justify-content-between w-100";

    const linhaSuperior = document.createElement("div");
    linhaSuperior.className = "d-flex align-items-center justify-content-between";

    const textos = document.createElement("div");
    textos.className = "min-w-0";

    const nome = document.createElement("h3");
    nome.className = "nome-produto text-truncate mb-1"
    nome.textContent = produto.nome;

    const precoUnitario = document.createElement("p");
    precoUnitario.className = "preco-unitario-produto text-truncate m-0";
    precoUnitario.textContent = `Preço unitário: ${formatarPreco(produto.preco)}`;

    textos.append(nome, precoUnitario);

    const botaoRemover = document.createElement("button");
    botaoRemover.type = "button";
    botaoRemover.className = "align-self-start botao-lixeira";
    botaoRemover.setAttribute("aria-label", `Remover ${produto.nome}`);
    botaoRemover.innerHTML = '<i class="ti ti-trash"></i>';
    botaoRemover.addEventListener("click", () => {
        abrirModalRemocao(item.id);
    });

    linhaSuperior.append(textos, botaoRemover);

    const linhaInferior = document.createElement("div");
    linhaInferior.className = "d-flex align-items-center justify-content-between";

    const subTotal = document.createElement("p");
    subTotal.className = "preco-total-produto m-0";
    subTotal.textContent = formatarPreco(calcularSubTotal(item));

    const controles = document.createElement("div");
    controles.className = "d-flex gap-3 align-items-center";

    const botaoMais = document.createElement("button");
    botaoMais.type = "button";
    botaoMais.className = "botao-quantidade";
    botaoMais.setAttribute("aria-label", "Aumentar quantidade");
    botaoMais.innerHTML = '<i class="ti ti-plus"></i>';
    botaoMais.addEventListener("click", () => {
        alterarQuantidade(item.id, 1);
    });

    const quantidade = document.createElement("p");
    quantidade.className = "quantidade-produto m-0";
    quantidade.textContent = item.quantidade;

    const botaoMenos = document.createElement("button");
    botaoMenos.type = "button";
    botaoMenos.className = "botao-quantidade";
    botaoMenos.setAttribute("aria-label", "Diminuir quantidade");
    botaoMenos.innerHTML = '<i class="ti ti-minus"></i>';
    botaoMenos.addEventListener("click", () => {
        alterarQuantidade(item.id, -1);
    });

    controles.append(botaoMais, quantidade, botaoMenos);
    linhaInferior.append(subTotal, controles);
    conteudo.append(linhaSuperior, linhaInferior);
    card.append(imagem, conteudo);
    coluna.append(card);
    return coluna;
}

function renderizarCarrinho() {
    const lista = document.getElementById("lista-carrinho");
    const itens = itensValidos();
    lista.innerHTML = "";

    if (itens.length === 0) {
        lista.innerHTML = '<p class="text-center my-5" id="carrinho-vazio">Seu carrinho está vazio. <a href="/pages/catalogo-de-produtos.html" class="link-ver-produtos">Ver produtos</a></p>';
    } else {
        for (const item of itens) {
            lista.append(criarCardItem(item));
        }
    }

    atualizarResumo();
}

function calcularTotais() {
    const itens = itensValidos();

    let valorProdutos = 0;
    for (const item of itens) {
        valorProdutos = valorProdutos + calcularSubTotal(item);
    }

    return {
        quantidade: contarItens(itens),
        valorProdutos: valorProdutos,
        total: valorProdutos
    };
}

function atualizarResumo() {
    const totais = calcularTotais();
    document.getElementById("resumo-produtos-titulo").textContent = `Produtos (${totais.quantidade})`;
    document.getElementById("resumo-produtos-valor").textContent = formatarPreco(totais.valorProdutos);
    document.getElementById("resumo-total").textContent = formatarPreco(totais.total);

    document.getElementById("btn-finalizar").disabled = totais.quantidade === 0;
}

function marcarCarregando(idItem, ativo) {
    const card = document.querySelector(`[data-item-id="${idItem}"]`);
    const resumo = document.querySelector(".resumo-compra");

    if (card) card.classList.toggle("carregando", ativo);
    resumo.classList.toggle("carregando", ativo);
}

async function alterarQuantidade(idItem, mudanca) {
    const item = usuarioAtual.carrinho.find(i => {
        return String(i.id) === String(idItem);
    });
    const produto = produtosPorId[String(item.produtoID)];

    const novaQuantidade = Number(item.quantidade) + mudanca;

    if (novaQuantidade < 1) {
        abrirModalRemocao(idItem);
        return null;
    }

    if (novaQuantidade > Number(produto.estoque)) {
        mostrarToast("Limite de estoque", "Quantidade máxima do estoque atingida.", "aviso");
        return null;
    }

    const novoCarrinho = usuarioAtual.carrinho.map(i => {
        if (String(i.id) === String(idItem)) {
            return { id: i.id, produtoID: Number(i.produtoID), quantidade: novaQuantidade };
        }
        return i;
    });

    marcarCarregando(idItem, true);

    try {
        usuarioAtual = await salvarCarrinho(usuarioAtual, novoCarrinho);
        renderizarCarrinho();
    } catch (erro) {
        console.error(erro);
        mostrarToast("Erro", "Não foi possível alterar a quantidade.", "erro");
    } finally {
        marcarCarregando(idItem, false);
    }
}

function abrirModalRemocao(idItem) {
    idItemParaRemover = idItem;
    bootstrap.Modal.getOrCreateInstance("#modalExcluir").show();
}

async function confirmarRemocao() {
    const novoCarrinho = usuarioAtual.carrinho.filter(i => {
        return String(i.id) !== String(idItemParaRemover);
    });

    const botao = document.getElementById("btn-confirmar-remocao");
    botao.disabled = true;

    try {
        usuarioAtual = await salvarCarrinho(usuarioAtual, novoCarrinho);
        renderizarCarrinho();
        bootstrap.Modal.getOrCreateInstance("#modalExcluir").hide();
        mostrarToast("Produto Removido", "Produto removido do carrinho com sucesso.", "sucesso");
    } catch (erro) {
        console.error(erro);
        mostrarToast("Erro", "Não foi possível remover o produto.", "erro");
    } finally {
        botao.disabled = false;
        idItemParaRemover = null;
    }
}

async function buscarEnderecoPrincipal(idUsuario) {
    const resp = await fetch(`${API_URL_ENDERECO}/enderecos?clienteId=${idUsuario}`);
    if (resp.status === 404) return null;
    if (!resp.ok) throw new Error("Erro ao buscar os endereços");

    const enderecos = await resp.json();
    const doUsuario = enderecos.filter(e => {
        return String(e.clienteId) === String(idUsuario);
    });
    const principal = doUsuario.find(e => {
        return e.principal === true;
    });
    return principal || doUsuario[0] || null;
}

function montarPedido(item, endereco) {
    const produto = produtosPorId[String(item.produtoID)];

    const valor = produto.preco * item.quantidade;

    return {
        clienteID: Number(usuarioAtual.id),
        enderecoID: Number(endereco),
        data: new Date().toISOString().slice(0, 10),
        status: "Aguardando pagamento",
        produtoID: Number(item.produtoID),
        quantidade: Number(item.quantidade),
        valor: Number(valor.toFixed(2))
    }
}

async function criarPedido(pedido) {
    const resp = await fetch(`${API_URL_PEDIDO}/pedidos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pedido)
    });
    if (!resp.ok) throw new Error("Erro ao criar o pedido.");
    return await resp.json();
}

function preencherModalFinalizacao(totais, quantidadeItens, endereco) {
    document.getElementById("finalizar-produtos-titulo").textContent = `Produtos (${quantidadeItens})`;
    document.getElementById("finalizar-produtos-valor").textContent = formatarPreco(totais.valorProdutos);
    document.getElementById("finalizar-total").textContent = formatarPreco(totais.valorProdutos);
    document.getElementById("finalizar-endereco-linha-1").textContent = `${endereco.rua}, ${endereco.numero} - ${endereco.bairro}`;
    document.getElementById("finalizar-endereco-linha-2").textContent = `${endereco.cidade} - ${endereco.estado}, ${endereco.cep}`;
}

async function finalizarCompra() {
    const botao = document.getElementById("btn-finalizar");
    botao.disabled = true;
    const itens = itensValidos();
    const totais = calcularTotais();
    const quantidadeItens = contarItens(itens);

    try {
        const endereco = await buscarEnderecoPrincipal(usuarioAtual.id);

        if (!endereco) {
            mostrarToast("Endereço necessário", "Cadastre um endereco no seu perfil antes de finalizar.", "aviso");
            botao.disabled = false
            return null;
        }

        preencherModalFinalizacao(totais, quantidadeItens, endereco);

        enderecoSelecionado = endereco;
        pedidosPendentes = [];

        for (const item of itens) {
            const pedido = montarPedido(item, endereco.id);

            const pedidoSalvo = await criarPedido(pedido);

            pedidosPendentes.push(pedidoSalvo);
        }

        usuarioAtual = await salvarCarrinho(usuarioAtual, []);
        renderizarCarrinho();
        bootstrap.Modal.getOrCreateInstance("#modalFinalizar").show();
    } catch (erro) {
        console.error(erro);
        mostrarToast("Erro", "Não foi possível criar o pedido. Tente mais tarde.", "erro");
        botao.disabled = false;
    }
}

function continuarPagamento() {
    const selecionado = document.querySelector('input[name="pagamento"]:checked');

    if (!selecionado) {
        mostrarToast("Forma de pagamento", "Selecione uma forma de pagamento para prosseguir.", "aviso");
        return null;
    }

    const modalFinalizar = document.getElementById("modalFinalizar");

    modalFinalizar.addEventListener("hidden.bs.modal", () => {
        bootstrap.Modal.getOrCreateInstance(`#${selecionado.value}`).show();
    }, { once: true });

    bootstrap.Modal.getOrCreateInstance(modalFinalizar).hide();
}

async function buscarProdutosDosPedidos() {
    return await Promise.all(pedidosPendentes.map(pedido => {
        return buscarProduto(pedido.produtoID);
    }));
}

function temEstoqueSuficiente(produtos) {
    for (let i = 0; i < pedidosPendentes.length; i++) {
        const pedido = pedidosPendentes[i];
        const produto = produtos[i];

        if (Number(produto.estoque) < Number(pedido.quantidade)) {
            return false;
        }
    }

    return true;
}

function formValidarCartao(modal) {
    const form = modal.querySelector("form");
    if (!form) return true;

    const campos = form.querySelectorAll("[required]");
    let valido = true;

    for (const campo of campos) {
        const vazio = campo.value.trim() === "";
        campo.classList.toggle("is-invalid", vazio);
        if (vazio) valido = false;
    }

    if (!valido) {
        mostrarToast("Dados do cartão", "Preencha todos os campos para continuar.", "aviso");
        form.querySelector(".is-invalid").focus();
    }

    return valido;
}

async function confirmarPagamento(e) {
    const botao = e.currentTarget;
    const modal = botao.closest(".modal");

    if (!formValidarCartao(modal)) return null;

    if (pedidosPendentes.length === 0) {
        mostrarToast("Nenhum pedido pendente", "Nenhum pedido aguardando pagamento.", "erro");
        return null;
    }

    botao.disabled = true;

    const alteracoes = [];

    try {
        const produtos = await buscarProdutosDosPedidos();

        if (!temEstoqueSuficiente(produtos)) {
            mostrarToast("Estoque insuficiente", "Estoque insuficiente para concluir o pagamento.", "erro");
            return null;
        }

        for (let i = 0; i < pedidosPendentes.length; i++) {
            const pedido = pedidosPendentes[i];
            const produto = produtos[i];
            const url = `${API_URL_PRODUTO}/produtos/${produto.id}`;

            const atualizado = copiarObjeto(produto);

            atualizado.estoque = Number(produto.estoque) - Number(pedido.quantidade);

            await atualizarRecurso(url, atualizado);
            alteracoes.push({ url: url, original: produto });
        }

        for (const pedido of pedidosPendentes) {
            const url = `${API_URL_PEDIDO}/pedidos/${pedido.id}`;

            const atualizado = copiarObjeto(pedido);
            atualizado.enderecoID = Number(enderecoSelecionado.id);
            atualizado.status = "Pago";

            await atualizarRecurso(url, atualizado);
            alteracoes.push({ url: url, original: pedido });
        }

        pedidosPendentes = [];
        bootstrap.Modal.getOrCreateInstance(modal).hide();
        mostrarToast("Pagamento concluído", "Seu pedido foi pago com sucesso. Veja em Meus Pedidos.", "sucesso");

    } catch (erro) {
        console.error(erro);
        await desfazerAlteracoes(alteracoes);
        mostrarToast("Erro no pagamento", "Não foi possível concluir o pagamento. Tente novamente.", "erro");
    } finally {
        botao.disabled = false;
    }
}

async function desfazerAlteracoes(alteracoes) {
    for (const alteracao of alteracoes) {
        try {
            await atualizarRecurso(alteracao.url, alteracao.original);
        } catch (erro) {
            console.error("Não foi possível desfazer", alteracao.url, erro);

        }
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    const usuarioLogado = verificarAut("Cliente");
    if (!usuarioLogado) return null;

    mostrarCarregando();
    try {
        const botoesPagamento = document.querySelectorAll(".btn-confirmar-pagamento");
        for (const botaoPagamento of botoesPagamento) {
            botaoPagamento.addEventListener("click", confirmarPagamento);
        }

        usuarioAtual = await buscarUsuario(usuarioLogado.id);
        await carregarProdutos(usuarioAtual.carrinho || []);
        renderizarCarrinho();
    } catch (error) {
        console.error(error);
        document.getElementById("lista-carrinho").innerHTML = '<p class="text-center my-5">Não foi possível carregar seu carrinho.</p>';
    }

    document.getElementById("btn-confirmar-remocao").addEventListener("click", confirmarRemocao);
    document.getElementById("btn-finalizar").addEventListener("click", finalizarCompra);
    document.getElementById("btn-continuar-pagamento").addEventListener("click", continuarPagamento);

    const camposCartao = document.querySelectorAll(".modal form [required]");
    for (const campo of camposCartao) {
        campo.addEventListener("input", () => {
            campo.classList.remove("is-invalid");
        })
    }
});