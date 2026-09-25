const formCadastro = document.getElementById('form-cadastro');


formCadastro.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const nomeCompleto = document.getElementById('nome').value;
    const cpf = document.getElementById('cpf').value;
    const telefone = document.getElementById('telefone').value;
    const email = document.getElementById('email').value;
    const dataNascimento = document.getElementById('data-nascimento').value;
    const senha = document.getElementById('senha').value;
    const senhaConfirmacao = document.getElementById('senha-confirmacao').value;
    
    const cep = document.getElementById('cep').value;
    const rua = document.getElementById('rua').value;
    const numero = document.getElementById('numero').value;
    const complemento = document.getElementById('complemento').value;
    const bairro = document.getElementById('bairro').value;
    const cidade = document.getElementById('cidade').value;
    const estado = document.getElementById('estado').value;




    if (!nomeCompleto) {
        mostrarToast('Campo Nome', 'Preencha todos os campos.', 'erro');
        return;
    }

    if (!email) {
        mostrarToast('Campo Email', 'Preencha todos os campos.', 'erro');
        return;
    }

    if (!cpf) {
        mostrarToast('Campo CPF', 'Preencha todos os campos.', 'erro');
        return;
    }

    if (!telefone) {
        mostrarToast('Campo Telefone', 'Preencha todos os campos.', 'erro');
        return;
    }

    if (!dataNascimento) {
        mostrarToast('Campo Data de Nascimento', 'Preencha todos os campos.', 'erro');
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

    if (!cep) {
        mostrarToast('Campo CEP', 'Preencha todos os campos.', 'erro');
        return;
    }

    if (!estado) {
        mostrarToast('Campo Estado', 'Preencha todos os campos.', 'erro');
        return;
    }

    if (!cidade) {
        mostrarToast('Campo Cidade', 'Preencha todos os campos.', 'erro');
        return;
    }

    if (!rua) {
        mostrarToast('Campo Rua', 'Preencha todos os campos.', 'erro');
        return;
    }

    if (!bairro) {
        mostrarToast('Campo Bairro', 'Preencha todos os campos.', 'erro');
        return;
    }

    if (!numero) {
        mostrarToast('Campo Número', 'Preencha todos os campos.', 'erro');
        return;
    }

    try {

        // Faz uma requisição para clientes
        const resposta = await fetch(`https://6aaac6cdff4dd5698b4f060c.mockapi.io/clientes`);
        const clientes = await resposta.json();

        // Testa se já existe E-mail e CPF cadastrados
        for (const cliente of clientes) {
            if (cliente.email == email) {
                mostrarToast('Campo E-mail', 'E-mail já cadastrado', 'erro');
                return;
            }

            if (cliente.cpf == cpf) {
                mostrarToast('Compo CPF', 'CPF já cadastrado', 'erro');
                return;
            }
        }

        // Cria o cliente
        const respostaCliente = await fetch(
            'https://6aaac6cdff4dd5698b4f060c.mockapi.io/clientes',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    nomeCompleto,
                    cpf,
                    dataNascimento,
                    telefone,
                    email,
                    senha
                })
            }
        );

        if (!respostaCliente.ok) {
            mostrarToast('Erro', 'Não foi possível realizar o cadastro', 'erro');
            return;
        }

        // Obtém o cliente criado
        const clienteCriado = await respostaCliente.json();

        const respostaEnderco = await fetch(
            'https://6aaac6cdff4dd5698b4f060c.mockapi.io/enderecos',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    cep,
                    rua,
                    numero,
                    complemento,
                    cidade,
                    bairro,
                    estado,
                    principal: true,
                    clienteId: clienteCriado.id
                })
            }
        );

        if (!respostaCliente.ok || !respostaEnderco.ok) {
            mostrarToast('Erro', 'Não foi possível realizar o cadastro', 'erro');
            return;
        }

        mostrarToast('Sucesso', 'Cadastro realizado com sucesso!', 'sucesso');

        formCadastro.reset();

        setTimeout(() => {
            window.location.href = '../pages/login.html';
        }, 2000);

    } catch (erro) {
        mostrarToast('Erro', 'Erro ao realizar o cadastro. Tente novamente.', 'erro');
    }

});

function mostrarToast(titulo, mensagem, tipo) {
    const toastElemento = document.getElementById('toast');
    const indicador = document.getElementById('toast-indicador');
    const tituloElemento = document.getElementById('toast-titulo');
    const mensagemElemento = document.getElementById('toast-mensagem');

    tituloElemento.textContent = titulo;
    mensagemElemento.textContent = mensagem;

    // Remove classes anteriores
    tituloElemento.classList.remove(
        'text-success',
        'text-danger',
        'text-warning',
        'text-primary'
    );

    // Define o estilo de acordo com o tipo
    switch (tipo) {
        case 'sucesso':
            indicador.classList.add('bg-success');
            tituloElemento.classList.add('text-success');
            break;

        case 'erro':
            indicador.classList.add('bg-danger');
            tituloElemento.classList.add('text-danger');
            break;

        case 'aviso':
            indicador.classList.add('bg-warning');
            tituloElemento.classList.add('text-warning');
            break;

        case 'info':
            indicador.classList.add('bg-primary');
            tituloElemento.classList.add('text-primary');
            break;
    }

    const toast = bootstrap.Toast.getOrCreateInstance(toastElemento);
    toast.show();
}