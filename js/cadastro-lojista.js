import { mostrarToast } from "./toast.js";
import { mostrarSenha } from "./mostrarSenha.js";

const usuarioLogado = pegarUsuarioLogado();

mostrarSenha();

async function preencherFormularioLojista() {
    try {
        const resposta = await fetch(`https://6aaac6cdff4dd5698b4f060c.mockapi.io/usuarios/${usuarioLogado.id}`);

        const usuario = await resposta.json();

        document.getElementById("nome-responsavel").value = usuario.nomeCompleto;
        document.getElementById("email").value = usuario.email;
        document.getElementById("telefone").value = usuario.telefone;

    } catch (erro) {
        console.error("Erro ao carregar usuário");
        mostrarToast("Erro", "Não foi possível carregar seus dados. Tente novamente.", "erro");
    }
}

document.addEventListener("DOMContentLoaded", preencherFormularioLojista);

const formCadastro = document.getElementById('form-cadastro');

formCadastro.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const nomeCompleto = document.getElementById('nome-responsavel').value;
    const telefone = document.getElementById('telefone').value;
    const cnpj = document.getElementById('cnpj').value;
    const nomeEmpresa = document.getElementById('nome-empresa').value;

    if (!nomeCompleto) {
        mostrarToast('Campo Nome do Responsável', 'Preencha todos os campos.', 'erro');
        return;
    }
    
    if (!cnpj) {
        mostrarToast('Campo CNPJ', 'Preencha todos os campos.', 'erro');
        return;
    }

    if (!telefone) {
        mostrarToast('Campo Telefone', 'Preencha todos os campos.', 'erro');
        return;
    }
    
    if (!nomeEmpresa) {
        mostrarToast('Campo Nome da Empresa', 'Preencha todos os campos.', 'erro');
        return;
    }

    try {
        // Altera para lojista
        const respostaLojista = await fetch(
            `https://6aaac6cdff4dd5698b4f060c.mockapi.io/usuarios/${usuarioLogado.id}`,
            {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    nomeCompleto,
                    perfis: ["Cliente", "Lojista"],
                    cnpj,
                    telefone,
                    nomeEmpresa,
                    dataAprovacao: '',
                    status: "Pendente"
                })
            }
        );

        if (!respostaLojista.ok) {
            mostrarToast('Erro', 'Não foi possível realizar o cadastro', 'erro');
            return;
        }
        
        mostrarToast('Sucesso', 'Sua solicitação de parceria com a PD Pets foi realizada, aguarde a validação do administrador', 'sucesso');

        formCadastro.reset();

        localStorage.removeItem(CHAVE_SESSAO);
        
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 3000);

    } catch (erro) {
        mostrarToast('Erro', 'Erro ao realizar o cadastro. Tente novamente.', 'erro');
    }

});

