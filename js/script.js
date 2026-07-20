// ================= LOADING SCREEN =================
window.addEventListener("load", () => {
    setTimeout(() => {
        const loader = document.getElementById("loading-screen");
        if (!loader) return;
        loader.classList.add("hide");
        setTimeout(() => loader.remove(), 700);
    }, 1800);
});

document.addEventListener("DOMContentLoaded", () => {
    const hora = new Date().getHours();
    let saudacao = "BOM DIA";
    if (hora >= 12 && hora < 18) saudacao = "BOA TARDE";
    else if (hora >= 18 || hora < 5) saudacao = "BOA NOITE";
    document.getElementById("greeting-text").innerText = saudacao;

    carregarClimaReal();
    iniciarCarrossel();
    gerarQRCode();
    iniciarShimmer();
});

// ================= CLIMA =================
async function carregarClimaReal() {
    try {
        const url = "https://api.open-meteo.com/v1/forecast?latitude=-22.6644&longitude=-44.9983&current=temperature_2m,weather_code,is_day&hourly=temperature_2m,weather_code&timezone=America%2FSao_Paulo&forecast_days=1";
        const resposta = await fetch(url);
        const dados = await resposta.json();
        const tempAtual = Math.round(dados.current.temperature_2m);
        const wmoCode = dados.current.weather_code;
        const isDay = dados.current.is_day;
        const climaInfo = interpretarClima(wmoCode, isDay);
        document.querySelector('.weather-badge').innerHTML = `<i class="${climaInfo.icon}"></i> ${tempAtual}°C`;
        document.getElementById("weather-main-temp").innerText = `${tempAtual}°C`;
        document.getElementById("weather-main-icon").className = `${climaInfo.icon} weather-main-icon`;
        document.getElementById("weather-subtitle-text").innerText = climaInfo.texto;
        const tempManha = Math.round(dados.hourly.temperature_2m[9]);
        const climaManha = interpretarClima(dados.hourly.weather_code[9], 1);
        const tempTarde = Math.round(dados.hourly.temperature_2m[15]);
        const climaTarde = interpretarClima(dados.hourly.weather_code[15], 1);
        const tempNoite = Math.round(dados.hourly.temperature_2m[20]);
        const climaNoite = interpretarClima(dados.hourly.weather_code[20], 0);
        document.getElementById("temp-manha").innerText = `${tempManha}°C`;
        document.getElementById("icon-manha").className = climaManha.icon;
        document.getElementById("icon-manha").style.color = "#A3B8CC";
        document.getElementById("temp-tarde").innerText = `${tempTarde}°C`;
        document.getElementById("icon-tarde").className = climaTarde.icon;
        document.getElementById("icon-tarde").style.color = "#FFA726";
        document.getElementById("temp-noite").innerText = `${tempNoite}°C`;
        document.getElementById("icon-noite").className = climaNoite.icon;
        document.getElementById("icon-noite").style.color = "#78909C";
    } catch (erro) {
        document.getElementById("weather-subtitle-text").innerText = "Parcialmente Nublado";
        document.getElementById("weather-main-temp").innerText = "24°C";
    }
}

function interpretarClima(codigo, isDay) {
    const solLua = isDay ? "fa-sun" : "fa-moon";
    const cloudSolLua = isDay ? "fa-cloud-sun" : "fa-cloud-moon";
    let icone = "fas " + solLua;
    let texto = isDay ? "Céu Limpo" : "Céu Estrelado";
    if (codigo === 1 || codigo === 2) { icone = "fas " + cloudSolLua; texto = "Parcialmente Nublado"; }
    else if (codigo === 3) { icone = "fas fa-cloud"; texto = "Nublado"; }
    else if (codigo === 45 || codigo === 48) { icone = "fas fa-smog"; texto = "Neblina"; }
    else if (codigo >= 51 && codigo <= 55) { icone = "fas fa-cloud-rain"; texto = "Chuvisco"; }
    else if (codigo >= 61 && codigo <= 65) { icone = "fas fa-cloud-showers-heavy"; texto = "Chuva"; }
    else if (codigo >= 80 && codigo <= 82) { icone = "fas fa-cloud-showers-water"; texto = "Pancadas de Chuva"; }
    else if (codigo >= 95 && codigo <= 99) { icone = "fas fa-poo-storm"; texto = "Tempestade"; }
    return { icon: icone, texto: texto };
}

function abrirClimaModal() { document.getElementById("weather-modal").classList.add("active"); }
function fecharClimaModal() { document.getElementById("weather-modal").classList.remove("active"); }

// ================= QR CODE =================
function gerarQRCode() {
    const container = document.getElementById("qrcode-container");
    if (!container || typeof QRCode === "undefined") return;
    try {
        new QRCode(container, {
            text: window.location.href,
            width: 180, height: 180,
            colorDark: "#3E332A", colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.H
        });
    } catch (e) {
        container.innerHTML = '<i class="fas fa-qrcode" style="font-size:160px;color:#3E332A;"></i>';
    }
}

function abrirQrModal() { document.getElementById("page-qr-modal").classList.add("active"); }
function fecharQrModal() { document.getElementById("page-qr-modal").classList.remove("active"); }

// ================= WHATSAPP (ESCOLHA DA POUSADA) =================
function abrirWhatsModal() { document.getElementById("whats-modal").classList.add("active"); }
function fecharWhatsModal() { document.getElementById("whats-modal").classList.remove("active"); }

// ================= LOCALIZAÇÃO (ESCOLHA DA POUSADA) =================
function abrirLocalModal() { document.getElementById("local-modal").classList.add("active"); }
function fecharLocalModal() { document.getElementById("local-modal").classList.remove("active"); }

// ================= GALERIA (POUSADA 1 / POUSADA 2) — CARROSSEL =================
const FOTOS_POUSADA1 = Array.from({ length: 17 }, (_, i) => `assets/img/pousada1-${String(i + 1).padStart(2, "0")}.jpeg`);
const FOTOS_POUSADA2 = Array.from({ length: 15 }, (_, i) => `assets/img/pousada2-${String(i + 1).padStart(2, "0")}.jpeg`);

const carrosseis = {};

function criarCarrosselFotos(trackId, dotsId, fotos, nomePousada) {
    const track = document.getElementById(trackId);
    const dotsContainer = document.getElementById(dotsId);
    if (!track || !dotsContainer) return;

    track.innerHTML = fotos.map(src =>
        `<div class="photo-slide"><img src="${src}" alt="${nomePousada}" loading="lazy" onclick="abrirLightbox('${src}')"></div>`
    ).join("");
    dotsContainer.innerHTML = "";

    const total = fotos.length;
    let atual = 0, autoplay, startX = 0, startY = 0, isDragging = false;

    fotos.forEach((_, i) => {
        const dot = document.createElement("div");
        dot.className = "photo-dot" + (i === 0 ? " active" : "");
        dot.addEventListener("click", () => { irParaSlide(i); resetAutoplay(); });
        dotsContainer.appendChild(dot);
    });

    function irParaSlide(index) {
        atual = (index + total) % total;
        track.style.transform = `translateX(-${atual * 100}%)`;
        dotsContainer.querySelectorAll(".photo-dot").forEach((d, i) => d.classList.toggle("active", i === atual));
    }

    function resetAutoplay() { clearInterval(autoplay); autoplay = setInterval(() => irParaSlide(atual + 1), 3200); }

    track.addEventListener("touchstart", e => {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        isDragging = true;
        clearInterval(autoplay);
    }, { passive: true });

    track.addEventListener("touchend", e => {
        if (!isDragging) return;
        const dx = startX - e.changedTouches[0].clientX;
        const dy = startY - e.changedTouches[0].clientY;
        if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 35) {
            irParaSlide(dx > 0 ? atual + 1 : atual - 1);
        }
        isDragging = false;
        resetAutoplay();
    }, { passive: true });

    track.addEventListener("mousedown", e => { startX = e.clientX; isDragging = true; clearInterval(autoplay); });
    track.addEventListener("mouseup", e => {
        if (!isDragging) return;
        const dx = startX - e.clientX;
        if (Math.abs(dx) > 35) irParaSlide(dx > 0 ? atual + 1 : atual - 1);
        isDragging = false;
        resetAutoplay();
    });

    resetAutoplay();
    carrosseis[trackId] = { pausar: () => clearInterval(autoplay), retomar: resetAutoplay };
}

function abrirLightbox(src) {
    document.getElementById("lightbox-img").src = src;
    document.getElementById("lightbox-modal").classList.add("active");
}
function fecharLightbox() {
    document.getElementById("lightbox-modal").classList.remove("active");
}

function mostrarGaleria(numero, botaoElemento) {
    document.querySelectorAll(".pousada-toggle-btn").forEach(b => b.classList.remove("active"));
    botaoElemento.classList.add("active");
    document.getElementById("carousel-1").style.display = numero === 1 ? "block" : "none";
    document.getElementById("carousel-2").style.display = numero === 2 ? "block" : "none";
}

document.addEventListener("DOMContentLoaded", function() {
    criarCarrosselFotos("galeria-1", "dots-galeria-1", FOTOS_POUSADA1, "Pousada da Terezinha");
    criarCarrosselFotos("galeria-2", "dots-galeria-2", FOTOS_POUSADA2, "Pousada 2");
});

document.addEventListener("click", function(e) {
    const qrModal = document.getElementById("page-qr-modal");
    const weatherModal = document.getElementById("weather-modal");
    const whatsModal = document.getElementById("whats-modal");
    const localModal = document.getElementById("local-modal");
    const lightboxModal = document.getElementById("lightbox-modal");
    if (e.target === qrModal) fecharQrModal();
    if (e.target === weatherModal) fecharClimaModal();
    if (e.target === whatsModal) fecharWhatsModal();
    if (e.target === localModal) fecharLocalModal();
    if (e.target === lightboxModal) fecharLightbox();
});

// ================= COMPARTILHAMENTO =================
function compartilharSite() {
    if (navigator.share) {
        navigator.share({ title: 'Pousada da Terezinha', text: 'Veja os contatos das nossas pousadas!', url: window.location.href })
            .then(() => fecharQrModal()).catch(() => {});
    } else {
        navigator.clipboard.writeText(window.location.href).then(() => {
            mostrarToastGlobal("<i class='fas fa-link'></i> Link copiado!");
            fecharQrModal();
        });
    }
}

// ================= PIX + CONFETTI =================
function copiarPix(botaoElemento, chavePix) {
    navigator.clipboard.writeText(chavePix).then(() => {
        const htmlOriginal = botaoElemento.innerHTML;
        botaoElemento.innerHTML = `
            <div style="display:flex;align-items:center;justify-content:center;width:100%;gap:10px;color:#2E7D32;font-weight:600;font-size:15px;padding:6px 0;">
                <i class="fas fa-check-circle"></i> Chave PIX Copiada!
            </div>`;
        botaoElemento.style.background = "rgba(232,245,233,0.7)";
        botaoElemento.style.borderColor = "rgba(76,175,80,0.3)";
        dispararConfetti();
        mostrarToastGlobal("<i class='fas fa-check-circle' style='color:#4CAF50;'></i> Chave CNPJ Copiada!");
        setTimeout(() => {
            botaoElemento.innerHTML = htmlOriginal;
            botaoElemento.style.background = "";
            botaoElemento.style.borderColor = "";
        }, 2200);
    }).catch(err => console.error("Erro ao copiar:", err));
}

function dispararConfetti() {
    const colors = ["#B8895A","#E8D5C0","#D4A96A","#8A6238","#F5E6D3","#C4A882","#FFD700"];
    const container = document.querySelector(".app-screen") || document.body;
    const rect = container.getBoundingClientRect();

    for (let i = 0; i < 60; i++) {
        const el = document.createElement("div");
        el.style.cssText = `
            position:fixed;
            left:${rect.left + Math.random() * rect.width}px;
            top:${rect.top + rect.height * 0.5}px;
            width:${6 + Math.random() * 6}px;
            height:${6 + Math.random() * 6}px;
            background:${colors[Math.floor(Math.random() * colors.length)]};
            border-radius:${Math.random() > 0.5 ? '50%' : '2px'};
            pointer-events:none;
            z-index:99999;
            opacity:1;
        `;
        document.body.appendChild(el);
        const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI;
        const speed = 4 + Math.random() * 8;
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed;
        let x = 0, y = 0, vy2 = vy, opacity = 1;
        let frame = 0;
        const animate = () => {
            frame++;
            vy2 += 0.35;
            x += vx;
            y += vy2;
            opacity -= 0.018;
            el.style.transform = `translate(${x}px, ${y}px) rotate(${frame * 8}deg)`;
            el.style.opacity = opacity;
            if (opacity > 0) requestAnimationFrame(animate);
            else el.remove();
        };
        setTimeout(() => requestAnimationFrame(animate), Math.random() * 300);
    }
}

// ================= SHIMMER NOS CARDS =================
function iniciarShimmer() {
    document.querySelectorAll(".card-item, .premium-pix-banner, .cafe-card").forEach(card => {
        card.addEventListener("touchstart", function() {
            this.classList.add("shimmer-active");
        }, { passive: true });
        card.addEventListener("touchend", function() {
            setTimeout(() => this.classList.remove("shimmer-active"), 400);
        }, { passive: true });
    });
}

// ================= ACORDEÃO =================
function toggleAccordion(triggerElement) {
    const container = triggerElement.parentElement;
    const bodyElement = container.querySelector(".accordion-body");
    const isActive = container.classList.contains("active");
    if (isActive) {
        container.classList.remove("active");
        bodyElement.style.maxHeight = null;
    } else {
        container.classList.add("active");
        bodyElement.style.maxHeight = bodyElement.scrollHeight + "px";
    }
}

// ================= CARROSSEL (COM SWIPE) =================
function iniciarCarrossel() {
    const track = document.getElementById("reviews-track");
    const dotsContainer = document.getElementById("review-dots");
    if (!track || !dotsContainer) return;
    const cards = track.querySelectorAll(".review-card");
    const total = cards.length;
    let atual = 0, autoplay, startX = 0, startY = 0, isDragging = false;

    cards.forEach((_, i) => {
        const dot = document.createElement("div");
        dot.className = "review-dot" + (i === 0 ? " active" : "");
        dot.addEventListener("click", () => { irParaSlide(i); resetAutoplay(); });
        dotsContainer.appendChild(dot);
    });

    function irParaSlide(index) {
        atual = (index + total) % total;
        track.style.transform = `translateX(-${atual * 100}%)`;
        dotsContainer.querySelectorAll(".review-dot").forEach((d, i) => d.classList.toggle("active", i === atual));
    }

    function resetAutoplay() { clearInterval(autoplay); autoplay = setInterval(() => irParaSlide(atual + 1), 4200); }

    // Touch swipe
    track.addEventListener("touchstart", e => {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        isDragging = true;
        clearInterval(autoplay);
    }, { passive: true });

    track.addEventListener("touchend", e => {
        if (!isDragging) return;
        const dx = startX - e.changedTouches[0].clientX;
        const dy = startY - e.changedTouches[0].clientY;
        if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 35) {
            irParaSlide(dx > 0 ? atual + 1 : atual - 1);
        }
        isDragging = false;
        resetAutoplay();
    }, { passive: true });

    // Mouse drag (desktop)
    track.addEventListener("mousedown", e => { startX = e.clientX; isDragging = true; clearInterval(autoplay); });
    track.addEventListener("mouseup", e => {
        if (!isDragging) return;
        const dx = startX - e.clientX;
        if (Math.abs(dx) > 35) irParaSlide(dx > 0 ? atual + 1 : atual - 1);
        isDragging = false;
        resetAutoplay();
    });

    resetAutoplay();
}

// ================= TOAST GLOBAL =================
function mostrarToastGlobal(conteudoHTML) {
    const toast = document.getElementById("copy-toast");
    toast.innerHTML = conteudoHTML;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 2800);
}
