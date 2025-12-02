// script.js - DIAGNÓSTICO (Template 01 Horizontal)

const DEFAULT_VIDEO_ID = "1764628151406x909721458907021300"; 
const API_URL_BASE = "https://bluemidia.digital/version-test/api/1.1/wf/get_video_data";

// --- URL & API ---
const queryParams = new URLSearchParams(window.location.search);
let video_id = queryParams.get('video_id') || DEFAULT_VIDEO_ID;
const API_URL_FINAL = `${API_URL_BASE}?video_id=${video_id}`;

console.log("🛠️ INICIANDO DIAGNÓSTICO...");
console.log("🔗 URL API:", API_URL_FINAL);

// Elementos DOM
const logoImg = document.getElementById('logo-img');
const logoContainer = document.getElementById('logo-container');
const produtoImg = document.getElementById('produto-img');
const descricaoTexto = document.getElementById('descricao-texto');
const precoTexto = document.getElementById('preco-texto');
const seloImg = document.getElementById('selo-img');
const seloContainer = document.getElementById('selo-container');
const qrcodeImg = document.getElementById('qrcode-img');
const qrTexto = document.getElementById('qr-texto');

// Elementos Animados (Verificação de existência)
const produtoContainer = document.getElementById('produto-container');
const descricaoContainer = document.getElementById('descricao-container');
const precoContainer = document.getElementById('preco-container');
const infoInferiorWrapper = document.getElementById('info-inferior-wrapper');

const elementosRotativos = [
    produtoContainer, seloContainer, descricaoContainer, precoContainer, infoInferiorWrapper
];

const TEMPO_SLOT_TOTAL = 15000;
const TEMPO_TRANSICAO = 800;

function formatURL(url) {
    if (!url) return '';
    url = url.trim();
    if (url.startsWith('http') || url.startsWith('//')) return url.startsWith('//') ? 'https:' + url : url;
    return 'https://' + url;
}

function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

function preloadSingleImage(url) {
    return new Promise((resolve) => {
        if (!url) { resolve(); return; }
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = () => resolve();
        img.src = formatURL(url);
    });
}

async function preloadImagesForSlide(item) {
    const promises = [];
    const imgProd = item.Imagem_produto || item.imagem_produto || item.imagem_produto_text;
    if (imgProd) promises.push(preloadSingleImage(imgProd));
    await Promise.all(promises);
}

// --- APLICAÇÃO DE CORES ---
function applyConfig(configC, configT) {
    console.log("🎨 APLICANDO CORES...");
    console.log("-> Dados Template:", configT);
    console.log("-> Dados Cliente:", configC);

    const r = document.documentElement;
    
    // Tenta ler com ou sem _text
    const c01 = configT.cor_01 || configT.cor_01_text;
    if(c01) {
        console.log("✅ Cor Fundo Aplicada:", c01);
        r.style.setProperty('--cor-fundo-principal', c01);
        r.style.setProperty('--cor-bg-preco', c01);
    } else {
        console.warn("⚠️ Cor Fundo (cor_01) não encontrada!");
    }
    
    const c02 = configT.cor_02 || configT.cor_02_text;
    if(c02) r.style.setProperty('--cor-fundo-secundario', c02);
    
    const c03 = configT.cor_03 || configT.cor_03_text;
    if(c03) r.style.setProperty('--cor-seta-qr', c03);

    // Textos
    const corTxt1 = configT.cor_texto_01 || configT.cor_texto_1 || configT.cor_texto_01_text;
    if(corTxt1) r.style.setProperty('--cor-texto-descricao', corTxt1);
    
    const corTxt2 = configT.cor_texto_02 || configT.cor_texto_2 || configT.cor_texto_02_text;
    if(corTxt2) r.style.setProperty('--cor-texto-preco', corTxt2);

    // Logo
    const logoUrl = configC.LOGO_MERCADO_URL || configC.logo_mercado_url_text;
    if (logoUrl) {
        console.log("✅ Logo encontrada:", logoUrl);
        if(logoImg) logoImg.src = formatURL(logoUrl);
        if(logoContainer) logoContainer.classList.add('fadeIn');
    } else {
        console.warn("⚠️ Logo não encontrada no Cliente!");
    }
}

// --- ATUALIZA CONTEÚDO ---
function updateContent(item) {
    console.log("🔄 ATUALIZANDO PRODUTO:", item);

    // Imagem
    const imgUrl = formatURL(item.Imagem_produto || item.imagem_produto || item.imagem_produto_text);
    if(produtoImg) produtoImg.src = imgUrl;
    
    // Nome
    const nome = item.nome || item.nome_text;
    if(descricaoTexto) descricaoTexto.textContent = nome;
    console.log("-> Nome:", nome);

    // Preço
    const preco = item.valor || item.valor_text;
    if(precoTexto) precoTexto.textContent = preco;
    console.log("-> Preço:", preco);
    
    // Selo
    const seloUrl = item.Selo_Produto || item.selo_produto || item.selo_produto_text;
    if(seloImg && seloUrl){
        seloImg.src = formatURL(seloUrl);
        if(seloContainer) seloContainer.style.display = 'flex';
    } else if(seloContainer) {
        seloContainer.style.display = 'none';
    }

    // QR Code
    const qrUrl = item.QR_produto || item.qr_produto || item.t_qr_produto_text;
    if(qrcodeImg && qrUrl) qrcodeImg.src = formatURL(qrUrl);
    
    const txtQR = item.Texto_QR || item.texto_qr || item.texto_qr_text;
    if(qrTexto) qrTexto.textContent = txtQR || "Venha Conferir";
}

// --- ANIMAÇÕES ---
async function playEntrance() {
    if(!elementosRotativos[0]) return;
    elementosRotativos.forEach(el => { if(el) el.className = 'elemento-animado'; });
    
    if(produtoContainer) produtoContainer.classList.add('slideInLeft');
    if(seloContainer) setTimeout(() => { seloContainer.classList.add('stampIn'); }, 200);
    if(descricaoContainer) descricaoContainer.classList.add('slideInRight');
    if(precoContainer) precoContainer.classList.add('elasticUp');
    if(infoInferiorWrapper) infoInferiorWrapper.classList.add('slideInUp');
    
    await sleep(TEMPO_TRANSICAO);
}

async function playExit() {
    if(!elementosRotativos[0]) return;
    elementosRotativos.forEach(el => { if(el) el.className = 'elemento-animado'; });
    
    if(produtoContainer) produtoContainer.classList.add('slideOutLeft');
    if(seloContainer) seloContainer.classList.add('slideOutLeft');
    if(descricaoContainer) descricaoContainer.classList.add('slideOutRight');
    if(precoContainer) precoContainer.classList.add('slideOutRight');
    if(infoInferiorWrapper) infoInferiorWrapper.classList.add('slideOutLeft');
    
    await sleep(500);
}

async function startRotation(items) {
    if(!items || items.length === 0) return;
    console.log("▶️ Iniciando Rotação com", items.length, "itens.");
    
    let tempoPorItem = Math.max(5000, TEMPO_SLOT_TOTAL / items.length); 

    for (let i = 0; i < items.length; i++) {
        await preloadImagesForSlide(items[i]);
        updateContent(items[i]);
        await playEntrance();
        await sleep(tempoPorItem - TEMPO_TRANSICAO - 500);
        if (i < items.length) await playExit();
    }
    startRotation(items);
}

// --- INICIALIZAÇÃO ---
async function init() {
    try {
        const res = await fetch(API_URL_FINAL);
        const data = await res.json();
        
        console.log("📦 DADOS COMPLETOS DA API:", data); // AQUI VEREMOS TUDO

        if (data && data.response) {
            const configCliente = data.response.configCliente;
            const configTemplate = data.response.configTemplate;
            const produtos = data.response.produtos;

            if(!configCliente || !configTemplate) {
                console.error("❌ ERRO: Configuração faltando!");
                return;
            }

            // Filtro para achar produtos válidos
            // Tenta achar 'nome' ou 'nome_text'
            const validos = produtos ? produtos.filter(p => p && (p.nome || p.nome_text)) : [];
            
            console.log("✅ Produtos Válidos encontrados:", validos);

            applyConfig(configCliente, configTemplate);
            
            if(validos.length > 0) {
                startRotation(validos);
            } else {
                console.warn("⚠️ Nenhum produto válido encontrado. Verifique os nomes 'nome' ou 'nome_text' no console acima.");
            }
        }
    } catch (e) { console.error("❌ ERRO FATAL:", e); }
}

document.addEventListener('DOMContentLoaded', init);
