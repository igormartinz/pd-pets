# 🐾 PD PETS
 
Marketplace voltado ao mundo pet, conectando **clientes**, **lojistas** e a **administração da plataforma** em um único ambiente de compra e venda.
 
## Sobre o projeto
 
**PD PETS** é uma plataforma de e-commerce onde diferentes lojistas parceiros podem cadastrar e vender produtos voltados a pets, enquanto clientes navegam por um catálogo, montam pedidos com itens de lojas e acompanham toda a jornada de compra.
 
A plataforma conta com três perfis de acesso:
 
- **Cliente** - navega pelo catálogo, gerencia carrinho, pedidos, endereços, animais de estimação, favoritos e chamados de suporte.
- **Lojista** - cadastra e gerencia seus produtos, controla estoque, acompanha pedidos recebidos e avaliações.
- **Administrador** - gerencia clientes, lojistas, categorias, pedidos e chamados da plataforma, além de aprovar novos lojistas.
 
## Tecnologias utilizadas
 
- **HTML5**
- **CSS3**
- **JavaScript**
- **Bootstrap**
- **MockAPI**
- **Git**
- **Vercel**
 
## Como executar
 
Este projeto não possui dependências. Para executar:

1. Clone o repositório
2. Abra a pasta do projeto
3. Abra o arquivo `index.html` no navegador

Navegue para as outras página a partir da página `index.html`

 
## Estrutura de arquivos

```
pd-pets/   
|   
|-- index.html     # Página inicial da plataforma   
|-- pages/         # Pasta com as páginas da plataforma      
|-- css/           # Pasta de arquivos com estilização visual da plataforma   
|-- js/            # Lógica e integração com MockAPI  
|-- img/           # Imagens presentes na plataforma
|-- img-produtos/  # Imagens dos produtos presentes no catálogo
|-- icons/         # Icones presentes na plataforma
|-- README.md      # Informações e instruções do projeto   
``` 
 
## Endpoint do MockAPI utilizado
 
**URL base:** `https://6a887ded7b483fa21fe90f43.mockapi.io/:endpoint`
 
## Padrão de Commits e Branches
 
### Commits
Seguimos o padrão **Conventional Commits**, com os seguintes tipos utilizados no projeto:
 
| Tipo | Uso |
|---|---|
| `feat` | Nova funcionalidade |
| `fix` | Correção de bug |
| `docs` | Alterações em documentação |
 
**Exemplos:**
```
feat: implementa funcionalidade de login por perfil
fix: corrige cálculo do valor total no carrinho
docs: atualiza seção de endpoint no README
```
 
### Branches
| Prefixo | Uso |
|---|---|
| `feature/` | Desenvolvimento de novas funcionalidades |
| `fix/` | Correção de bugs |
| `docs/` | Atualizações de documentação |
 
**Exemplos:** `feature/catalogo-de-produtos`, `fix/calculo-carrinho`, `docs/readme`
 
 
## Padrão de Classes e Arquivos
 
Todos os nomes de **arquivos** e **classes CSS** seguem o padrão: letras minúsculas, palavras separadas por hífen.
 
**Arquivos:**
```
catalogo-de-produtos.html
detalhes-do-produto.js
dashboard-lojista.css
```
 
**Classes CSS:**
```
btn-primary
card-produto
input-busca
```
 
## Links
 
**Figma:** [PD Pets | Figma](https://www.figma.com/design/fFfusPQVNcBCZX3wW8n5lf/PD-Pets?node-id=1-3&p=f&t=05ducMCSeWKtq9I1-0)    
**Repositório:** [PD Pets | GitHub](https://github.com/igormartinz/pd-pets)   
**Deploy:** [PD Pets | Vercel](https://pdpets.vercel.app/)   
