// script.js - Versão FINAL com Lógica de URL (ex: ?ordem=2)

// ##################################################################
//  COLE A URL DA SUA API (DO GOOGLE APPS SCRIPT) AQUI
// ##################################################################
const API_URL = "https://script.google.com/macros/s/AKfycbwdo-HzLZF1-_cOOJAG9L79y59kNEpaH52fdp2nuVIAGif5A3XX-dWnZ8eXouev1xXYQg/exec"; 
// ##################################################################


// --- Configuração dos Dados (AGORA VAZIOS, VIRÃO DA API) ---
let configMercado = {};
let produtos = [];
// --- Fim da Configuração ---


// Elementos do DOM
const logoContainer = document.getElementById('logo-container');
const produtoContainer = document.getElementById('produto-container');
const descricaoContainer = document.getElementById('descricao-container');
const precoContainer = document.getElementById('preco-container');

const logoImg = document.getElementById('logo-img');
const produtoImg = document.getElementById('produto-img');
const descricaoTexto = document.getElementById('descricao-texto');
const precoTexto = document.getElementById('preco-texto');

const elementosAnimadosProduto = [produtoContainer, descricaoContainer, precoContainer];

// --- Constantes de Tempo ---
const PRODUTOS_POR_LOTE = 3; // Mostrar 3 produtos
const DURACAO_TOTAL_SLOT = 15000; // 15 segundos
const DURACAO_POR_PRODUTO = DURACAO_TOTAL_SLOT / PRODUTOS_POR_LOTE; // 5000ms (5s) por produto

const ANIMATION_DELAY = 800; // 0.8s
const EXIT_ANIMATION_DURATION = 500; // 0.5s

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// 1. Função para APLICAR A CONFIGURAÇÃO DO MERCADO (Cores e Logo)
function applyConfig(config) {
    document.documentElement.style.setProperty('--cor-fundo-principal', config.COR_FUNDO_PRINCIPAL);
    document.documentElement.style.setProperty('--cor-fundo-secundario', config.COR_FUNDO_SECUNDARIO);
    document.documentElement.style.setProperty('--cor-texto-descricao', config.COR_TEXTO_DESCRICaO);
    document.documentElement.style.setProperty('--cor-texto-preco', config.COR_TEXTO_PRECO);
    logoImg.src = config.LOGO_MERCADO_URL;
    logoContainer.classList.add('slideInUp'); 
}

// 2. Função para ATUALIZAR o conteúdo do PRODUTO
function updateContent(item) {
    produtoImg.src = item.IMAGEM_PRODUTO_URL;
    descricaoTexto.textContent = item.NOME_PRODUTO;
    precoTexto.textContent = item.PRECO;

    const precoElement = document.getElementById('preco-texto');
    precoContainer.classList.remove('typewriter');
    void precoContainer.offsetWidth; 
    precoContainer.style.animation = 'none'; 
    
    const steps = (item.PRECO && item.PRECO.length > 0) ? item.PRECO.length : 1;
    const duration = steps * 0.15; 
    
    precoContainer.style.animation = `typewriter ${duration}s steps(${steps}) forwards`;
}

// 3. Função para EXECUTAR a sequência de animação de ENTRADA do PRODUTO
async function playEntranceAnimation() {
    elementosAnimadosProduto.forEach(el => el.classList.remove('fadeOut'));
    produtoContainer.classList.add('slideInRight');
    await sleep(ANIMATION_DELAY);
    descricaoContainer.classList.add('slideInLeft');
    await sleep(ANIMATION_DELAY);
    precoContainer.classList.add('typewriter');
}

// 4. Função para EXECUTAR a animação de SAÍDA do PRODUTO
async function playExitAnimation() {
    elementosAnimadosProduto.forEach(el => {
        el.className = 'elemento-animado';
        el.classList.add('fadeOut');
    });
    await sleep(EXIT_ANIMATION_DURATION);
    elementosAnimadosProduto.forEach(el => el.classList.add('hidden'));
}

// 5. Roda a "Micro-Rotação" (os 3 produtos)
function runInternalRotation(items) {
    async function showNextProduct(subIndex) {
        // Se a planilha tiver menos de 3 produtos (ex: só 2), ele repete o primeiro.
        const item = items[subIndex % items.length];
        
        if (subIndex > 0) {
            await playExitAnimation();
        }
        updateContent(item);
        await playEntranceAnimation();
    }
    showNextProduct(0);
    setTimeout(() => showNextProduct(1), DURACAO_POR_PRODUTO);
    setTimeout(() => showNextProduct(2), DURACAO_POR_PRODUTO * 2);
}

// 6. NOVA FUNÇÃO: Lê parâmetros da URL (ex: ?ordem=2)
function getURLParameter(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}


// 7. FUNÇÃO DE INICIALIZAÇÃO (Modificada para ler a URL)
async function init() {
    try {
        // 1. Lê o parâmetro 'ordem' da URL. O padrão é '1' se não houver.
        const ordem = parseInt(getURLParameter('ordem') || '1');
        
        // 2. Busca TODOS os dados da API (sem cache)
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error('Falha ao carregar dados da API: ' + response.statusText);
        const data = await response.json();
        
        configMercado = data.configMercado;
        produtos = data.produtos;
        
        if (!produtos || produtos.length === 0) {
            throw new Error("Nenhum produto na planilha.");
        }

        // 3. Aplica as cores e o logo do mercado
        applyConfig(configMercado);
        
        // 4. CALCULA o lote de produtos com base no parâmetro 'ordem'
        // (ordem=1) -> startIndex = (1 - 1) * 3 = 0 (Produtos 0, 1, 2)
        // (ordem=2) -> startIndex = (2 - 1) * 3 = 3 (Produtos 3, 4, 5)
        // (ordem=3) -> startIndex = (3 - 1) * 3 = 6 (Produtos 6, 7, 8)
        const startIndex = (ordem - 1) * PRODUTOS_POR_LOTE;

        // 5. Pega os 3 produtos para ESTE template
        const itemsToShow = [
            produtos[startIndex], 
            produtos[startIndex + 1], 
            produtos[startIndex + 2]
        ].filter(Boolean); // '.filter(Boolean)' remove 'undefined' se o lote for incompleto

        // 6. Verifica se o lote está vazio (ex: ?ordem=20 e só tem 5 produtos)
        if (itemsToShow.length === 0) {
            console.warn(`Parâmetro 'ordem=${ordem}' não encontrou produtos. Mostrando o primeiro lote.`);
            // Fallback: mostra o primeiro lote para não ficar em branco
            const fallbackItems = [produtos[0], produtos[1], produtos[2]].filter(Boolean);
            runInternalRotation(fallbackItems);
        } else {
            // 7. Inicia a micro-rotação com os produtos corretos
            runInternalRotation(itemsToShow);
        }

    } catch (error) {
        console.error("Erro no init():", error);
        descricaoTexto.textContent = "Erro ao carregar API.";
    }
}

// Inicia tudo
document.addEventListener('DOMContentLoaded', init);
