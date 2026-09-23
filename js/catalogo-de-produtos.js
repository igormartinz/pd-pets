async function buscarProdutos() {
    try {
        const resposta = await fetch('https://6a98614f7160beda2292eff8.mockapi.io/produtos');

        const produtos = await resposta.json();
        console.log(produtos);
        return produtos;

    } catch (erro) {
        console.log('erro');
    }
}


function formatarMoeda(valor) {
    return Number(valor).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    });
}

async function carregarCatalogo() {
    const container = document.getElementById('lista-produtos');

    try {
        // busca produtos, lojistas e categorias em paralelo
        const [respostaProdutos, respostaLojistas, respostaCategorias] = await Promise.all([
            fetch(`https://6a98614f7160beda2292eff8.mockapi.io/produtos`),
            fetch(`https://6a9872a37160beda2292ff4f.mockapi.io/lojistas`),
            fetch(`https://6a9872a37160beda2292ff4f.mockapi.io/categorias`)
        ]);

        const produtos = await respostaProdutos.json();
        const lojistas = await respostaLojistas.json();
        const categorias = await respostaCategorias.json();


        
        const mapaLojistas = {};
        for (const lojista of lojistas) {
            mapaLojistas[lojista.id] = lojista.nomeEmpresa;
        }
        console.log(mapaLojistas);
        
        const mapaCategorias = {};
        for (const categoria of categorias) {
            mapaCategorias[categoria.id] = categoria.nome;
        }

        for (const produto of produtos) {
            if (produto.status == 'inativo') continue;

            const coluna = document.createElement('div');
            coluna.className = "col-12 col-md-6 col-xl-4";

            coluna.innerHTML = `
                <article class="card-produto">
                    <div class="produto-avaliacao">
                        <i class="ti ti-star-filled"></i>
                        <span>5,0</span>
                    </div>
                    <i class="ti ti-heart ti-heart-icon"></i>

                    <img src="../img-produtos/${produto.imagemURL[0]}" class="produto-img" alt="${produto.nome}">

                    <div>
                        <h3 class="text-truncate produto-nome mb-1 mt-2">${produto.nome}</h3>
                        <div class="d-flex justify-content-between">
                            <div>
                                <p class="produto-lojista m-0">${mapaLojistas[produto.lojistaID]}</p>
                                <small class="produto-categoria">${mapaCategorias[produto.categoriaID]}</small>
                                <p class="produto-preco">${formatarMoeda(produto.preco)}</p>
                            </div>
                            <i class="ti ti-shopping-bag-plus"></i>
                        </div>
                    </div>
                </article>
            `

            container.appendChild(coluna);
        }

    } catch {
        container.innerHTML = '<p class="text-center w-100">Não foi possível carregar os produtos. Tente novamente mais tarde.</p>';
    }
}

document.addEventListener('DOMContentLoaded', carregarCatalogo);