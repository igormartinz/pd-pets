// URLs base do MockAPI, cada recurso direcionado ao seus respectivos endpoints
const API_URL_ADMINISTRADOR_CHAMADOS = "https://6a98675a7160beda2292f7f2.mockapi.io";
const API_URL_CATEGORIA_LOJISTA = "https://6a9872a37160beda2292ff4f.mockapi.io";
const API_URL_CLIENTE = "https://6aaac6cdff4dd5698b4f060c.mockapi.io";

// Configuração de perfil

const configPerfil = {
    cliente: {
        url: `${API_URL_CLIENTE}/clientes`,
        dashboard: "dashboard-cliente.html"
    },
    lojista: {
        url: `${API_URL_CATEGORIA_LOJISTA}/lojistas`,
        dashboard: "dashboard-cliente.html",
        dashboardLojista: "dashboard-lojista.html"
    },
    administrador: {
        url: `${API_URL_ADMINISTRADOR_CHAMADOS}/administradores`,
        dashboard: "dashboard-cliente.html",
        dashboardLojista: "dashboard-lojista.html",
        dashboardAdministrador: "dashboard-administrador.html",
    }
};

// Toasts reutilizados para a página de login

function mostrarToast(tipo, título, mensagem) {
    const toastId = tipo === "sucesso" ? "toast-sucesso" : "toast-erro";
    console.log(toastId);

    const toastElemento = document.getElementById(toastId);

    toastElemento.querySelector(".toast-header strong").textContent = título;
    toastElemento.querySelector(".toast-body").textContent = mensagem;

    const toast = bootstrap.Toast.getOrCreateInstance(toastElemento);
    toast.show();
}

// Descobre qual perfil foi selecionado pelo usuário

function pegarPerfilSelecionado() {
    return document.querySelector('input[name="perfil"]:checked').value;
}

// busca o perfil pelo e-mail cadastrado no MockAPI

async function BuscarUsuarioPorCredenciais(url, email, senha) {
    try {
        const resp = await fetch(`${url}?email=${encodeURIComponent(email)}`)

        if (!resp.ok) {
            throw new Error("Erro ao consultar o usuário");
        }

        const usuarios = await resp.json();

        return usuarios.find(usuario => {
            usuario.email?.toLowerCase() === email.toLowerCase() && usuario.senha === senha;
        })
    } catch (error) {
        console.error("Erro ao buscar o usuário no MockAPI", error);
        return null;
    }
}

// Obtém o nome do usuário conforme o seu perfil

function nomeUsuario(usuario, perfil) {
    if (perfil === "cliente") return usuario.nomeCompleto;
    if (perfil === "lojista") return usuario.nomeResponsavel;
    return usuario.nome;
}

// Salva a sessão do usuário no localStorage (Não salva a senha)

function salvarSessao(usuario, perfil) {
    const dadosSessao = {
        id: usuario.id,
        nome: nomeUsuario(usuario, perfil),
        email: usuario.email,
        perfil: perfil
    };

    if (perfil === "Lojista") {
        dadosSessao.nomeEmpresa = usuario.nomeEmpresa;
    }

    localStorage.setItem("usuarioLogado", JSON.stringify(dadosSessao));
}

async function iniciarLogin(email, senha, perfil) {
    const config = configPerfil[perfil];

    const usuario = await BuscarUsuarioPorCredenciais(config.url, email, senha);

    if (!usuario) {
        mostrarToast("erro", "Credenciais inválidas", "E-mail ou senha incorretos.")
    }

    if (perfil === "lojista") {
        if (usuario.status === "Pendente") {
            mostrarToast("erro", "Cadastro em análise", "Seu cadastro ainda está em análise. Você receberá acesso assim que for aprovado.");
            return null;
        }

        if (usuario.status === "Inativo") {
            mostrarToast("erro", "Loja desativada", "Sua loja está desativada.");
            return null;
        }
    }
}

document.addEventListener('DOMContentLoaded', function () {
    const radioCliente = document.getElementById('cliente');
    const radiosVisiveis = document.querySelectorAll('#lojista, #administrador');

    for (const radio of radiosVisiveis) {
        radio.dataset.jaEstavaMarcado = radio.checked;

        radio.addEventListener('click', function () {
            if (this.dataset.jaEstavaMarcado === 'true') {
                // já estava marcado: volta pro perfil Cliente
                radioCliente.checked = true;
            }

            // atualiza o estado de todos pra próxima checagem
            for (const r of radiosVisiveis) {
                r.dataset.jaEstavaMarcado = r.checked;
            }
        });
    }
});