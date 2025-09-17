// Variáveis (mantive os nomes que você pediu)
let Catalogo = [];
let idCounter = 0;

class Livro {
    constructor(id, titulo, categoria, imagem, sinopse, preco) {
        this.id = id;
        this.categoria = categoria;
        this.titulo = titulo;
        this.imagem = imagem; // pode ser URL ou data:base64...
        this.sinopse = sinopse;
        this.preco = preco;
    }
}

// ---------- utilidades de storage ----------
function guardarCatalogo() {
    try {
        localStorage.setItem("Catalogo", JSON.stringify(Catalogo));
        localStorage.setItem("idCounter", String(idCounter));
    } catch (err) {
        console.error("Erro ao salvar no localStorage:", err);
    }
}

function seedCatalogo() {
    Catalogo = [
        new Livro(0, "O Senhor dos Anéis", "Fantasia",
            "https://m.media-amazon.com/images/I/91b0C2YNSrL.jpg",
            "Uma jornada épica pela Terra Média.", 79.90),

        new Livro(1, "1984", "Ficção Científica",
            "https://m.media-amazon.com/images/I/71kxa1-0AfL.jpg",
            "Um futuro distópico onde o Big Brother vigia todos.", 39.90),

        new Livro(2, "Dom Casmurro", "Clássico",
            "https://m.media-amazon.com/images/I/81kGR8C4xkL.jpg",
            "Obra clássica de Machado de Assis.", 29.90)
    ];
    idCounter = Catalogo.reduce((max, it) => Math.max(max, it.id), -1) + 1;
    guardarCatalogo();
}

// Carrega o catálogo ao abrir a página — robusto e com seed
function carregarCatalogo() {
    const catalogoSalvo = localStorage.getItem("Catalogo");
    const idSalvo = localStorage.getItem("idCounter");

    if (catalogoSalvo) {
        try {
            const parsed = JSON.parse(catalogoSalvo);
            if (Array.isArray(parsed) && parsed.length > 0) {
                Catalogo = parsed;
            } else {
                // se parseou mas está vazio -> cria seed
                seedCatalogo();
                return;
            }
        } catch (err) {
            console.warn("JSON inválido no Catalogo. Recriando seed.", err);
            seedCatalogo();
            return;
        }
    } else {
        // nada salvo -> cria seed
        seedCatalogo();
        return;
    }

    // define idCounter de forma segura
    if (idSalvo) {
        idCounter = parseInt(idSalvo, 10) || Catalogo.reduce((max, it) => Math.max(max, it.id), -1) + 1;
    } else {
        idCounter = Catalogo.reduce((max, it) => Math.max(max, it.id), -1) + 1;
    }
}

// Função para resetar (útil para testes)
function resetCatalogo() {
    localStorage.removeItem("Catalogo");
    localStorage.removeItem("idCounter");
    location.reload();
}

// ---------- mostrar / esconder ----------
function showCriar() {
    const conteiner = document.getElementById("criarLivro");
    if (conteiner) conteiner.style.display = "block";
}
function hideCriar() {
    const conteiner = document.getElementById("criarLivro");
    if (conteiner) conteiner.style.display = "none";
}

function showEditar(id) {
    const livro = Catalogo.find(i => i.id === id);
    const sectionOrForm = document.getElementById("editarLivro");
    if (!livro || !sectionOrForm) return;

    // pega o form (se section contém o form, usamos ele)
    let form = sectionOrForm;
    if (sectionOrForm.tagName !== 'FORM') {
        form = sectionOrForm.querySelector('form');
        if (!form) return;
    }

    // Preenche os inputs
    const inputTitulo = form.querySelector('#edit_titulo');
    const inputCategoria = form.querySelector('#edit_categoria');
    const inputSinopse = form.querySelector('#edit_sinopse');
    const inputPreco = form.querySelector('#edit_preco');

    if (inputTitulo) inputTitulo.value = livro.titulo;
    if (inputCategoria) inputCategoria.value = livro.categoria;
    if (inputSinopse) inputSinopse.value = livro.sinopse;
    if (inputPreco) inputPreco.value = livro.preco;

    // armazenar a imagem atual no atributo do form para caso o usuário não faça upload de nova
    form.setAttribute("data-imagem", livro.imagem);
    form.setAttribute("data-id", id);
    form.style.display = "block";
}

function hideEditar() {
    const sectionOrForm = document.getElementById("editarLivro");
    if (!sectionOrForm) return;
    let form = sectionOrForm;
    if (sectionOrForm.tagName !== 'FORM') form = sectionOrForm.querySelector('form') || sectionOrForm;
    form.style.display = "none";
}

// ---------- CRUD e binds ----------
document.addEventListener('DOMContentLoaded', () => {
    carregarCatalogo();
    mostrarLivros();
    listarLivros();
    hideCriar();
    hideEditar();

    // localizar o form de criar (pode estar direto com id 'novoLivro')
    const formNovo = document.getElementById('novoLivro') || document.querySelector('#criarLivro form');
    if (formNovo) {
        formNovo.addEventListener('submit', function(e) {
            e.preventDefault();

            const id = idCounter++;
            const titulo = (formNovo.querySelector('#titulo') || {}).value || "";
            const categoria = (formNovo.querySelector('#categoria') || {}).value || "";
            const sinopse = (formNovo.querySelector('#sinopse') || {}).value || "";
            const preco = (formNovo.querySelector('#preco') || {}).value || "";

            const imagemInput = formNovo.querySelector('#imagem');

            // helper para finalizar criação
            const finalizarCriacao = (imagemValor) => {
                const novoLivroOBJ = new Livro(id, titulo, categoria, imagemValor || "", sinopse, preco);
                Catalogo.push(novoLivroOBJ);
                guardarCatalogo();
                mostrarLivros();
                listarLivros();
                // reset e esconder
                if (typeof formNovo.reset === 'function') formNovo.reset();
                hideCriar();
            };

            if (imagemInput && imagemInput.files && imagemInput.files[0]) {
                const file = imagemInput.files[0];
                const reader = new FileReader();
                reader.onload = function(ev) {
                    finalizarCriacao(ev.target.result); // base64
                };
                reader.onerror = function() {
                    console.error("Erro ao ler arquivo de imagem.");
                    finalizarCriacao("");
                };
                reader.readAsDataURL(file);
            } else if (imagemInput && imagemInput.value) {
                // caso o input seja um text/URL (fallback)
                finalizarCriacao(imagemInput.value);
            } else {
                finalizarCriacao("");
            }
        });
    }

    // localizar o form de editar - pode ser o form com id 'editarLivro' ou dentro da section
    let sectionEditar = document.getElementById('editarLivro');
    let formEditar = null;
    if (sectionEditar) {
        formEditar = (sectionEditar.tagName === 'FORM') ? sectionEditar : sectionEditar.querySelector('form');
    }

    if (formEditar) {
        formEditar.addEventListener('submit', function(e) {
            e.preventDefault();
            const idAttr = formEditar.getAttribute('data-id');
            const id = idAttr ? parseInt(idAttr, 10) : NaN;
            if (Number.isNaN(id)) return;

            const index = Catalogo.findIndex(i => i.id === id);
            if (index === -1) return;

            const titulo = (formEditar.querySelector('#edit_titulo') || {}).value || "";
            const categoria = (formEditar.querySelector('#edit_categoria') || {}).value || "";
            const sinopse = (formEditar.querySelector('#edit_sinopse') || {}).value || "";
            const preco = (formEditar.querySelector('#edit_preco') || {}).value || "";

            const imagemInput = formEditar.querySelector('#edit_imagem');
            const imagemAtual = formEditar.getAttribute('data-imagem') || Catalogo[index].imagem || "";

            const aplicarEdicao = (imagemValor) => {
                Catalogo[index].titulo = titulo;
                Catalogo[index].categoria = categoria;
                Catalogo[index].imagem = imagemValor || "";
                Catalogo[index].sinopse = sinopse;
                Catalogo[index].preco = preco;

                guardarCatalogo();
                listarLivros();
                mostrarLivros();
                if (typeof formEditar.reset === 'function') formEditar.reset();
                hideEditar();
            };

            if (imagemInput && imagemInput.files && imagemInput.files[0]) {
                const file = imagemInput.files[0];
                const reader = new FileReader();
                reader.onload = function(ev) {
                    aplicarEdicao(ev.target.result);
                };
                reader.onerror = function() {
                    console.error("Erro ao ler arquivo de imagem na edição.");
                    aplicarEdicao(imagemAtual);
                };
                reader.readAsDataURL(file);
            } else if (imagemInput && imagemInput.value) {
                // se input for text/URL
                aplicarEdicao(imagemInput.value);
            } else {
                aplicarEdicao(imagemAtual);
            }
        });
    }
});

// ---------- Remover ----------
function removerLivro(id) {
    const index = Catalogo.findIndex(i => i.id === id);
    if (index !== -1) {
        Catalogo.splice(index, 1);
        guardarCatalogo();
        listarLivros();
        mostrarLivros();
    }
}

// ---------- Exibição ----------
function mostrarLivros() {
    const conteiner = document.getElementById('catalogo');
    if (!conteiner) return;

    let html = '';
    Catalogo.forEach(function(item) {
        html += `
            <div class="book-card">
                <div class="book-info book-card:hover">
                    <div class="card img">
                        <img class="book-image" src="${item.imagem || ''}" alt="${item.titulo}">
                    </div>
                    <p class="book-title">${item.titulo}</p>
                    <p>${item.categoria}</p>
                    <p><b>Sinopse</b></p>
                    <p>${item.sinopse}</p>
                    <p class="book-price">R$ ${parseFloat(item.preco || 0).toFixed(2)}</p>
                    <p>Código do produto: ${item.id + 1}</p>
                </div>
            </div>
        `;
    });

    conteiner.innerHTML = html;
}

function listarLivros() {
    const conteiner = document.getElementById('listarLivros');
    if (!conteiner) return;

    let html = '';
    Catalogo.forEach(function(item) {
        html += `
            <tr class="table-admin tbody td">
                <td><p>${item.id + 1}</p></td>
                <td><p class="book-title">${item.titulo}</p></td>
                <td><p>${item.categoria}</p></td>
                <td><div class="card img"><img class="book-image" src="${item.imagem || ''}" alt="${item.titulo}"></div></td>
                <td><p>${item.sinopse}</p></td>
                <td><p>R$ ${parseFloat(item.preco || 0).toFixed(2)}</p></td>
                <td>
                    <button class="btn-edit" onclick="showEditar(${item.id})">Editar livro</button>
                    <button class="btn-delete" onclick="removerLivro(${item.id})">Remover</button>
                </td>
            </tr>
        `;
    });

    conteiner.innerHTML = html;
}
