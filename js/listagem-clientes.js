import { mostrarToast } from "./toast.js";

const URL_USUARIOS = 'https://6aaac6cdff4dd5698b4f060c.mockapi.io/usuarios';

let clientes = []; // usuários com o perfil Cliente

// "2026-08-28" -> "28/08/2026"
function formatarData(data) {
    if (!data) return '-';
    const [ano, mes, dia] = data.split('-');
    return `${dia}/${mes}/${ano}`;
}

// Aceita o telefone com ou sem máscara.
function formatarTelefone(telefone) {
    const digitos = String(telefone ?? '').replace(/\D/g, '');

    if (digitos.length === 11) return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 7)}-${digitos.slice(7)}`;
    if (digitos.length === 10) return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 6)}-${digitos.slice(6)}`;

    return telefone || '-';
}

function formatarCPF(cpf) {
    const digitos = String(cpf ?? '').replace(/\D/g, '');

    if (digitos.length === 11) {
        return `${digitos.slice(0, 3)}.${digitos.slice(3, 6)}.${digitos.slice(6, 9)}-${digitos.slice(9)}`;
    }

    return cpf || '-';
}

// Uma linha com uma mensagem ocupando a tabela inteira.
function mostrarMensagemTabela(texto) {
    const corpo = document.getElementById('tabela-clientes-lista');
    corpo.innerHTML = '';

    const linha = document.createElement('tr');
    const celula = document.createElement('td');
    celula.colSpan = 3;
    celula.className = 'text-center py-4';
    celula.textContent = texto;

    linha.append(celula);
    corpo.append(linha);
}

// A linha inteira abre o modal.
function criarLinhaCliente(cliente) {
    const linha = document.createElement('tr');
    linha.className = 'pedido-linha linha-clicavel';
    linha.dataset.usuarioId = cliente.id;
    linha.dataset.bsToggle = 'modal';
    linha.dataset.bsTarget = '#modalDetalhesUsuario';

    const textos = [cliente.nomeCompleto, cliente.email, formatarTelefone(cliente.telefone)];

    for (const texto of textos) {
        const celula = document.createElement('td');
        celula.className = 'linha-celula';
        celula.textContent = texto || '-';
        linha.append(celula);
    }

    return linha;
}

function renderizarClientes() {
    if (clientes.length === 0) {
        mostrarMensagemTabela('Nenhum cliente encontrado.');
        return;
    }

    const corpo = document.getElementById('tabela-clientes-lista');
    corpo.innerHTML = '';

    for (const cliente of clientes) {
        corpo.append(criarLinhaCliente(cliente));
    }
}

async function carregarClientes() {
    mostrarMensagemTabela('Carregando...');

    try {
        const resposta = await fetch(URL_USUARIOS);
        if (!resposta.ok) throw new Error('Falha ao buscar os usuários');

        const usuarios = await resposta.json();

        // Cliente é quem tem o perfil "Cliente".
        // Em ordem alfabética pelo nome.
        clientes = usuarios
            .filter(usuario => (usuario.perfis ?? []).includes('Cliente'))
            .sort((a, b) => String(a.nomeCompleto).localeCompare(String(b.nomeCompleto), 'pt-BR'));

        renderizarClientes();

    } catch (erro) {
        console.error(erro);
        mostrarMensagemTabela('Não foi possível carregar os clientes.');
        mostrarToast('Erro', 'Não foi possível carregar os clientes. Tente novamente.', 'erro');
    }
}

function conectarDetalhes() {
    const modalElemento = document.getElementById('modalDetalhesUsuario');

    // Ao abrir, relatedTarget é a linha clicada: dela sai o id do cliente
    modalElemento.addEventListener('show.bs.modal', function (evento) {
        const idCliente = evento.relatedTarget?.dataset.usuarioId;
        const cliente = clientes.find(item => String(item.id) === String(idCliente));

        if (!cliente) {
            evento.preventDefault(); // Não abre um modal vazio
            return;
        }

        document.getElementById('tituloDetalhesUsuario').textContent = cliente.nomeCompleto || '—';
        document.getElementById('detalhes-usuario-email').textContent = cliente.email || '—';
        document.getElementById('detalhes-usuario-cpf').textContent = formatarCPF(cliente.cpf);
        document.getElementById('detalhes-usuario-telefone').textContent = formatarTelefone(cliente.telefone);
        document.getElementById('detalhes-usuario-nascimento').textContent = formatarData(cliente.dataNascimento);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    carregarClientes();
    conectarDetalhes();
});