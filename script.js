// script.js - Vertical Final (Lógica Direta)

const DEFAULT_VIDEO_ID = "1764628151406x909721458907021300"; 
const API_URL_BASE = "https://bluemidia.digital/version-test/api/1.1/wf/get_video_data";

// Elementos DOM
const logoImg = document.getElementById('logo-img');
const logoContainer = document.getElementById('logo-container');
const produtoImg = document.getElementById('produto-img');
const produtoImgGhost = document.getElementById('produto-img-ghost');
const produtoContainer = document.getElementById('produto-container');
const descricaoTexto = document.getElementById('descricao-texto');
const descricaoContainer = document.getElementById('descricao-container');
const precoTexto = document.getElementById('preco-texto');
const precoContainer = document.getElementById('preco-container');
const seloImg = document.getElementById('selo-img');
const seloContainer = document.getElementById('selo-container');
const footerContainer = document.getElementById('info-inferior-wrapper'); 
const qrcodeContainer = document.getElementById('qrcode-container');
const qrcodeImg = document.getElementById('qrcode-img');
const qrTexto = document.getElementById('qr-texto');

// Elementos que entram e saem na animação
const elementosRotativos = [
    produtoContainer, seloContainer, descricaoContainer, precoContainer, footerContainer
];

const TEMPO_SLOT_TOTAL = 15000;
const TEMPO_TRANSICAO = 800;

// --- INICIALIZAÇÃO ---
document.addEventListener('DOMContentLoaded', () => {
    const queryParams = new URLSearchParams(window.location.search);
    const videoId = queryParams.get('video_id') || DEFAULT_VIDEO_ID;
    
    init(videoId);
});

async function init(videoId) {
    console.log("🎬 Iniciando vídeo:", videoId);
    try {
        const res = await fetch(`${API_URL_BASE}?video_id=${videoId}`);
        const data = await res.json();

        if (data && data.response) {
            const { configCliente, configTemplate, produtos } = data.response;
            
            // Aplica Configuração Geral (Cores e Logo)
            applyConfig(configCliente, configTemplate);
            
            // Filtra produtos válidos (usando o nome exato do campo: nome_text)
            const validos = produtos.filter(p => p && p.nome_text);
            
            if (validos.length > 0) {
                console.log("✅ Produtos carregados:", validos.length);
                startRotation(validos);
            } else {
                console.warn("⚠️ Nenhum produto válido encontrado.");
            }
        }
    } catch (e) {
        console.error("❌ Erro fatal:", e);
    }
}

// --- FUNÇÕES PRINCIPAIS ---

function applyConfig(cliente, template) {
    // Salva cor no cache para o próximo load
    if(template.cor_01_text) localStorage.setItem('cache_cor_fundo', template.cor_01_text);

    // Aplica Cores (Usando os nomes exatos com _text)
    const root = document.documentElement;
    
    if(template.cor_01_text) {
        root.style.setProperty('--cor-fundo-principal', template.cor_01_text);
        root.style.setProperty('--cor-bg-preco', template.cor_01_text);
    }
    if(template.cor_02_text) {
        root.style.setProperty('--cor-destaque-luz-borda', template.cor_02_text);
        root.style.setProperty('--cor-seta-qr', template.cor_02_text);
    }
    if(template.cor_03_text) root.style.setProperty('--cor-faixas', template.cor_03_text);
    if(template.cor_texto_01_text) root.style.setProperty('--cor-texto-descricao', template.cor_texto_01_text);
    if(template.cor_texto_02_text) {
        root.style.setProperty('--cor-texto-preco', template.cor_texto_02_text);
        root.style.setProperty('--cor-texto-footer', template.cor_texto_02_text);
    }

    // Aplica Logo
    if (cliente.logo_mercado_url_text) {
        logoImg.src = formatURL(cliente.logo_mercado_url_text);
    }
    
    // Mostra elementos estáticos
    logoContainer.classList.add('fadeIn');
}

async function startRotation(items) {
    let index = 0;
    let tempoPorItem = Math.max(5000, TEMPO_SLOT_TOTAL / items.length);

    while (true) { // Loop infinito
        const item = items[index];
        
        // Preload e Atualização
        await preloadImagesForSlide(item);
        updateContent(item);
        
        // Animação Entrada
        await playEntrance();
        
        // Tempo de exibição (descontando transições)
        await sleep(tempoPorItem - TEMPO_TRANSICAO - 500);
        
        // Animação Saída
        await playExit();
        
        // Próximo item
        index = (index + 1) % items.length;
    }
}

function updateContent(item) {
    console.log("📦 Exibindo:", item.nome_text);

    // 1. Imagens
    const imgUrl = formatURL(item.imagem_produto_text);
    produtoImg.src = imgUrl;
    if(produtoImgGhost) produtoImgGhost.src = imgUrl;

    // 2. Textos
    descricaoTexto.textContent = item.nome_text;
    precoTexto.textContent = item.valor_text;

    // 3. QR Code (O CAMPO CRÍTICO)
    // Usamos t_qr_produto_text pois é o que vimos no seu JSON
    if (item.t_qr_produto_text) {
        qrcodeImg.src = formatURL(item.t_qr_produto_text);
        qrcodeContainer.style.display = 'flex'; 
    } else {
        qrcodeContainer.style.display = 'none'; // Esconde se não tiver
    }
    
    if (qrTexto) qrTexto.textContent = item.texto_qr_text || "Aproveite";

    // 4. Selo
    if (item.selo_produto_text) {
        seloImg.src = formatURL(item.selo_produto_text);
        seloContainer.style.display = 'flex';
    } else {
        seloContainer.style.display = 'none';
    }
}

// --- ANIMAÇÕES ---
async function playEntrance() {
    elementosRotativos.forEach(el => el.className = 'elemento-animado'); // Reset classes
    
    if(seloContainer.style.display !== 'none') seloContainer.classList.add('stampIn');
    produtoContainer.classList.add('slideInUp');
    
    setTimeout(() => descricaoContainer.classList.add('slideInLeft'), 200);
    setTimeout(() => precoContainer.classList.add('popIn'), 400);
    
    if(qrcodeContainer.style.display !== 'none') footerContainer.classList.add('slideInUp');
    
    await sleep(TEMPO_TRANSICAO);
}

async function playExit() {
    produtoContainer.classList.add('slideOutDown');
    descricaoContainer.classList.add('slideOutDown');
    precoContainer.classList.add('slideOutDown');
    seloContainer.classList.add('slideOutDown');
    footerContainer.classList.add('slideOutDown');
    await sleep(500);
}

// --- UTILITÁRIOS ---
function formatURL(url) {
    if (!url) return '';
    if (url.startsWith('//')) return 'https:' + url;
    if (!url.startsWith('http')) return 'https://' + url;
    return url;
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function preloadSingleImage(url) {
    return new Promise(resolve => {
        if (!url) return resolve();
        const img = new Image();
        img.onload = resolve;
        img.onerror = resolve;
        img.src = formatURL(url);
    });
}

async function preloadImagesForSlide(item) {
    const promises = [];
    if (item.imagem_produto_text) promises.push(preloadSingleImage(item.imagem_produto_text));
    if (item.selo_produto_text) promises.push(preloadSingleImage(item.selo_produto_text));
    if (item.t_qr_produto_text) promises.push(preloadSingleImage(item.t_qr_produto_text));
    await Promise.all(promises);
}
