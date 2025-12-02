// script.js - Versão Vertical BLINDADA (Correção de Erros e Layout)

const DEFAULT_VIDEO_ID = "1764628151406x909721458907021300"; 
const API_URL_BASE = "https://bluemidia.digital/version-test/api/1.1/wf/get_video_data";

// --- URL & API ---
const queryParams = new URLSearchParams(window.location.search);
let video_id = queryParams.get('video_id');
if (!video_id) {
    console.log("Usando ID padrão de teste.");
    video_id = DEFAULT_VIDEO_ID;
}

const API_URL_FINAL = `${API_URL_BASE}?video_id=${video_id}`;
const CACHE_KEY = `hortifruti_vert_${video_id}`;

// Variáveis Globais
let configCliente = {}, configTemplate = {}, produtos = [];

// --- ELEMENTOS DO DOM (Com Fallbacks de Segurança) ---
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

// CORREÇÃO DE ID: Tenta encontrar pelos dois nomes possíveis para evitar erro nulo
const footerContainer = document.getElementById('info-inferior-wrapper') || document.getElementById('footer-container');

const qrcodeContainer = document.getElementById('qrcode-container');
const qrcodeImg = document.getElementById('qrcode-img');
const qrTexto = document.getElementById('qr-texto');

// Lista de elementos animados (Filtrada para não quebrar se algum faltar)
const elementosRotativos = [
    produtoContainer, seloContainer, descricaoContainer, precoContainer, footerContainer, qrcodeContainer
].filter(el => el !== null);

const TEMPO_SLOT_TOTAL = 15000;
const TEMPO_TRANSICAO = 800;

// --- FUNÇÕES AUXILIARES ---
function formatURL(url) {
    if (!url) return '';
    url = url.trim();
    if (url.startsWith('http') || url.startsWith('//')) return url.startsWith('//') ? 'https:' + url : url;
    return 'https://' + url;
}

function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

// Função Segura para Adicionar Classes (Evita o erro "Cannot read property of null")
function safeAddClass(element, className) {
    if (element && className) {
        element.classList.add(className);
    }
}

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
    
    const imgSelo = item.Selo_Produto || item.selo_produto || item.selo_produto_text;
    if (imgSelo) promises.push(preloadSingleImage(imgSelo));
    
    const imgQR = item.QR_produto || item.qr_produto || item.t_qr_produto_text;
    if (imgQR) promises.push(preloadSingleImage(imgQR));
    
    await Promise.all(promises);
}

// --- APLICAÇÃO DE CORES ---
function applyConfig(configC, configT) {
    const r = document.documentElement;
    console.log("🎨 Aplicando Cores:", configT);

    // 1. Cores de Fundo
    const c01 = configT.cor_01 || configT.cor_01_text;
    if(c01) {
        r.style.setProperty('--cor-fundo-principal', c01);
        r.style.setProperty('--cor-bg-preco', c01);
    }

    // 2. Cor de Destaque (Amarelo/Rodapé)
    const c02 = configT.cor_02 || configT.cor_02_text;
    if(c02) {
        r.style.setProperty('--cor-fundo-secundario', c02); // Fundo da curva inferior
        r.style.setProperty('--cor-destaque-luz-borda', c02);
        r.style.setProperty('--cor-seta-qr', c02);
    }
    
    // 3. Outras Cores
    const c03 = configT.cor_03 || configT.cor_03_text;
    if(c03) r.style.setProperty('--cor-faixas', c03);

    // 4. Textos
    const txt1 = configT.cor_texto_01 || configT.cor_texto_1 || configT.cor_texto_01_text;
    if(txt1) r.style.setProperty('--cor-texto-placa', txt1);
    
    const txt2 = configT.cor_texto_02 || configT.cor_texto_2 || configT.cor_texto_02_text;
    if(txt2) {
        r.style.setProperty('--cor-texto-preco', txt2);
        r.style.setProperty('--cor-texto-footer', txt2);
    }

    // 5. Logo
    const logoUrl = configC.LOGO_MERCADO_URL || configC.logo_mercado_url_text;
    if (logoUrl && logoImg) {
        logoImg.src = formatURL(logoUrl);
    }
    
    // Animações de entrada (Usando função segura)
    safeAddClass(logoContainer, 'fadeIn');
    safeAddClass(footerContainer, 'fadeIn');
}

// --- ATUALIZA CONTEÚDO ---
function updateContent(item) {
    console.log("🔄 Atualizando Produto:", item.nome);

    // Imagem
    const imgUrl = formatURL(item.Imagem_produto || item.imagem_produto || item.imagem_produto_text);
    if(produtoImg) produtoImg.src = imgUrl;
    if(produtoImgGhost) produtoImgGhost.src = imgUrl;

    // Textos
    if(descricaoTexto) descricaoTexto.textContent = item.nome || item.nome_text;
    if(precoTexto) precoTexto.textContent = item.valor || item.valor_text;
    
    // QR Code (Busca Robusta)
    const qrUrl = item.QR_produto || item.qr_produto || item.t_qr_produto_text;
    if(qrcodeImg && qrUrl) {
        qrcodeImg.src = formatURL(qrUrl);
        if(qrcodeContainer) qrcodeContainer.style.display = 'flex';
    } else {
        // Se quiser esconder quando não tiver QR:
        // if(qrcodeContainer) qrcodeContainer.style.display = 'none';
    }
    
    const txtQR = item.Texto_QR || item.texto_qr || item.texto_qr_text;
    if(qrTexto) qrTexto.textContent = txtQR || "Ofertas";

    // Selo
    const seloUrl = item.Selo_Produto || item.selo_produto || item.selo_produto_text;
    if(seloImg && seloUrl){
        seloImg.src = formatURL(seloUrl);
        if(seloContainer) seloContainer.style.display = 'flex';
    } else if(seloContainer) {
        seloContainer.style.display = 'flex'; 
    }
}

// --- ANIMAÇÕES ---
async function playEntrance() {
    elementosRotativos.forEach(el => { el.className = 'elemento-animado'; });
    
    safeAddClass(seloContainer, 'slideInDown');
    safeAddClass(produtoContainer, 'slideInUp');
    
    setTimeout(() => { safeAddClass(descricaoContainer, 'slideInLeft'); }, 200);
    setTimeout(() => { safeAddClass(precoContainer, 'popIn'); }, 400);
    safeAddClass(footerContainer, 'slideInUp');
    
    await sleep(TEMPO_TRANSICAO);
}

async function playExit() {
    elementosRotativos.forEach(el => { el.className = 'elemento-animado'; });
    
    safeAddClass(produtoContainer, 'slideOutDown');
    safeAddClass(descricaoContainer, 'slideOutDown');
    safeAddClass(precoContainer, 'slideOutDown');
    safeAddClass(seloContainer, 'slideOutDown'); 
    safeAddClass(footerContainer, 'slideOutDown');
    
    await sleep(500);
}

async function startRotation(items) {
    if(!items || items.length === 0) return;
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
        console.log("Iniciando Vertical. Buscando:", API_URL_FINAL);
        const cached = localStorage.getItem(CACHE_KEY);
        
        // Estratégia de Cache: Carrega rápido, atualiza depois
        if (cached) {
            const data = JSON.parse(cached);
            runApp(data);
            fetchData().then(newData => {
                if(newData) localStorage.setItem(CACHE_KEY, JSON.stringify(newData));
            });
        } else {
            const data = await fetchData();
            if(data) {
                localStorage.setItem(CACHE_KEY, JSON.stringify(data));
                runApp(data);
            }
        }
    } catch (e) { console.error("Erro Fatal:", e); }
}

async function fetchData() {
    try {
        const res = await fetch(API_URL_FINAL);
        if(!res.ok) throw new Error("Erro API: " + res.status);
        return await res.json();
    } catch (e) { 
        console.error("Falha no fetch:", e);
        return null; 
    }
}

function runApp(data) {
    if (!data || !data.response) {
        console.error("Dados inválidos recebidos:", data);
        return;
    }
    configCliente = data.response.configCliente;
    configTemplate = data.response.configTemplate;
    produtos = data.response.produtos;

    if(produtos) {
        const validos = produtos.filter(p => p && (p.nome || p.nome_text));
        
        console.log("Produtos válidos:", validos);

        if(validos.length > 0) {
            applyConfig(configCliente, configTemplate);
            startRotation(validos);
        } else {
            console.warn("Nenhum produto válido encontrado.");
        }
    }
}

document.addEventListener('DOMContentLoaded', init);
