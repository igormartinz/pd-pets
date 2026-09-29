import { mostrarToast } from "./toast.js";

const formCadastro = document.getElementById('form-cadastro');

formCadastro.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const nomeResponsavel = document.getElementById('nome-responsavel').value;
    const email = document.getElementById('email').value;
    const cnpj = document.getElementById('cnpj').value;
    const telefone = document.getElementById('telefone').value;
    const nomeEmpresa = document.getElementById('nome-empresa').value;
    const senha = document.getElementById('senha').value;
    const senhaConfirmacao = document.getElementById('senha-confirmacao').value;

    if (!nomeResponsavel) {
        mostrarToast('Campo Nome do Responsável', 'Preencha todos os campos.', 'erro');
        return;
    }

    if (!email) {
        mostrarToast('Campo Email', 'Preencha todos os campos.', 'erro');
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

    if (!senha) {
        mostrarToast('Campo Senha', 'Preencha todos os campos.', 'erro');
        return;
    }

    if (!senhaConfirmacao) {
        mostrarToast('Campo Confirmação de Senha', 'Preencha todos os campos.', 'erro');
        return;
    }

    if (senha.length < 8) {
        mostrarToast('Campo Senha', 'A senha deve conter no mínimo 8 caracteres', 'erro');
        return;
    }

    if (senha !== senhaConfirmacao) {
        mostrarToast('Campos de Senha', 'As senhas não coincidem.', 'erro');
        return;
    }


    try {
        // Cria o lojista
        const respostaLojista = await fetch(
            'https://6a9872a37160beda2292ff4f.mockapi.io/lojistas',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    nomeResponsavel,
                    email,
                    CNPJ: cnpj,
                    telefone,
                    nomeEmpresa,
                    senha,
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

        setTimeout(() => {
            window.location.href = '../pages/login.html';
        }, 3000);

    } catch (erro) {
        mostrarToast('Erro', 'Erro ao realizar o cadastro. Tente novamente.', 'erro');
    }

});

