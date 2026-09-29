import { mostrarToast } from "./toast.js";

const formRecuperarSenha = document.getElementById('form-recuperar-senha');
const formNovaSenha = document.getElementById('form-nova-senha');
const modalElemento = document.getElementById('modal');
const modal = new bootstrap.Modal(modalElemento);

// Guarda quem foi encontrado, pra usar na hora de salvar a nova senha
let usuarioEncontrado = null;

formRecuperarSenha.addEventListener('submit', async function (evento) {
    evento.preventDefault();

    const email = document.getElementById('email').value;

    if (!email) {
        mostrarToast('Campo E-mail', 'Informe seu e-mail.', 'erro');
        return;
    }

    try {
        // busca nos três recursos em paralelo
        const [respostaClientes, respostaLojistas, respostaAdministradores] = await Promise.all([
            fetch(`https://6aaac6cdff4dd5698b4f060c.mockapi.io/clientes`),
            fetch(`https://6a9872a37160beda2292ff4f.mockapi.io/lojistas`),
            fetch(`https://6a98675a7160beda2292f7f2.mockapi.io/administradores`)
        ]);

        const clientes = await respostaClientes.json();
        const lojistas = await respostaLojistas.json();
        const administradores = await respostaAdministradores.json();

        const usuarios = [...clientes.map(usuario => ({
            urlBase: 'https://6aaac6cdff4dd5698b4f060c.mockapi.io/clientes',
            dados: usuario
        })),

        ...lojistas.map(usuario => ({
            urlBase: 'https://6a9872a37160beda2292ff4f.mockapi.io/lojistas',
            dados: usuario
        })),

        ...administradores.map(usuario => ({ 
            urlBase: 'https://6a98675a7160beda2292f7f2.mockapi.io/administradores',
            dados: usuario
        }))];

        usuarioEncontrado = usuarios.find(usuario => usuario.dados.email.toLowerCase() === email.toLowerCase());

        if (!usuarioEncontrado) {
            mostrarToast('E-mail não cadastrado', 'Não encontramos uma conta com esse e-mail.', 'erro');
            return;
        }

        // E-mail encontrado: abre o modal de nova senha
        modal.show();

    } catch (erro) {
        mostrarToast('Erro', 'Não foi possível verificar o e-mail. Tente novamente.', 'erro');
    }
});

formNovaSenha.addEventListener('submit', async function (evento) {
    evento.preventDefault();

    const senha = document.getElementById('senha').value;
    const senhaConfirmacao = document.getElementById('senha-confirmacao').value;


    console.log(usuarioEncontrado);

    if (!senha || !senhaConfirmacao) {
        mostrarToast('Campos obrigatórios', 'Preencha os dois campos de senha.', 'erro');
        return;
    }

    if (senha.length < 8) {
        mostrarToast('Campos de Senha', 'A senha deve conter no mínimo 8 caracteres', 'erro');
        return;
    }

    if (senha !== senhaConfirmacao) {
        mostrarToast('Campos de Senha', 'As senhas não coincidem.', 'erro');
        return;
    }

    try {
        const resposta = await fetch(
            `${usuarioEncontrado.urlBase}/${usuarioEncontrado.dados.id}`,
            {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ senha })
            }
        );

        if (!resposta.ok) {
            mostrarToast('Erro', 'Não foi possível atualizar a senha. Tente novamente.', 'erro');
            return;
        }

        mostrarToast('Sucesso', 'Senha redefinida com sucesso!', 'sucesso');
        modal.hide();

        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);

    } catch (erro) {
        mostrarToast('Erro', 'Não foi possível atualizar a senha. Tente novamente.', 'erro');
    }
});