import { mostrarToast } from "./toast.js";
import { mostrarSenha } from "./mostrarSenha.js";

mostrarSenha();

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
        const respostaUsuarios = await fetch ("https://6aaac6cdff4dd5698b4f060c.mockapi.io/usuarios");

        const usuarios = await respostaUsuarios.json();

        usuarioEncontrado = usuarios.find(usuario => usuario.email.toLowerCase() === email.toLowerCase());

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
            `https://6aaac6cdff4dd5698b4f060c.mockapi.io/usuarios/${usuarioEncontrado.id}`,
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