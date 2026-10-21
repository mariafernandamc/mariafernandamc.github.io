// Links do currículo e do LinkedIn — é só colar os endereços aqui
const LINKS = {
  curriculo: "curriculo-maria-fernanda.pdf",
  linkedin: "https://www.linkedin.com/in/maria-fernanda-moura-417b74228/",
};

document.documentElement.classList.add("js");

const pasta = document.querySelector(".pasta");
const paineis = [...document.querySelectorAll(".painel")];
const nomes = ["sobre", "trabalhos", "contato"];

// ---------- links ----------
document.querySelectorAll("[data-link]").forEach((a) => {
  const url = LINKS[a.dataset.link];
  if (url) a.href = url;
  else a.addEventListener("click", (e) => e.preventDefault());
});

// ---------- nome letra a letra ----------
document.querySelectorAll(".nome .linha").forEach((linha) => {
  let n = 0;
  const quebrar = (no) => {
    [...no.childNodes].forEach((filho) => {
      if (filho.nodeType === 3) {
        const frag = document.createDocumentFragment();
        [...filho.textContent].forEach((ch) => {
          if (ch === " ") { frag.append(" "); return; }
          const s = document.createElement("span");
          s.className = "letra";
          s.textContent = ch;
          s.style.setProperty("--n", n++);
          frag.append(s);
        });
        filho.replaceWith(frag);
      } else if (!filho.classList.contains("sorriso")) {
        quebrar(filho);
      } else {
        filho.classList.add("letra");
        filho.style.setProperty("--n", n++ + 2);
      }
    });
  };
  quebrar(linha);
});

// ---------- revelar ao rolar ----------
const observador = new IntersectionObserver((entradas) => {
  entradas.forEach((e) => {
    if (e.isIntersecting) {
      e.target.classList.add("visivel");
      observador.unobserve(e.target);
    }
  });
}, { threshold: 0.15, rootMargin: "0px 0px -6% 0px" });

function observar(painel) {
  painel.querySelectorAll(".r, .nota, .faixa, .bloco").forEach((el, i) => {
    el.classList.remove("visivel");
    el.style.transitionDelay = el.classList.contains("faixa") ? "" : `${Math.min(i % 6, 5) * 60}ms`;
    observador.observe(el);
  });
}

// ---------- trocar de pasta ----------
const semMovimento = matchMedia("(prefers-reduced-motion: reduce)");

// Troca estilo baralho, com cada pasta independente (corpo + a própria aba):
// a pasta da frente gira, desliza para o lado e volta para trás da pilha;
// a pasta escolhida vem para frente; a terceira pasta não se mexe.
const corpo = document.querySelector(".corpo");
const DURACAO = 900;

function trocarPastas(antiga, nova) {
  const abaAntiga = document.querySelector(`.aba--${antiga}`);
  const abaNova = document.querySelector(`.aba--${nova}`);
  const r = corpo.getBoundingClientRect();
  const visivel = Math.max(0, Math.min(r.height, innerHeight - Math.max(r.top, 0) + 60));
  const largura = pasta.offsetWidth;

  // 1) cópia da pasta que sai: a aba dela + o corpo como está agora
  const saindo = document.createElement("div");
  saindo.className = "pasta-saindo";
  saindo.setAttribute("aria-hidden", "true");
  saindo.style.width = `${largura}px`;
  saindo.style.height = `${corpo.offsetTop + visivel}px`;
  const abaCopia = abaAntiga.cloneNode(true);
  abaCopia.style.zIndex = "2";
  const corpoCopia = corpo.cloneNode(true);
  corpoCopia.querySelectorAll("[id]").forEach((el) => el.removeAttribute("id"));
  corpoCopia.querySelectorAll("video").forEach((v) => v.removeAttribute("src"));
  corpoCopia.style.cssText = `position:absolute;left:0;top:${corpo.offsetTop}px;width:${largura}px;height:${visivel || r.height}px;background:${getComputedStyle(corpo).backgroundColor};overflow:hidden;`;
  saindo.append(abaCopia, corpoCopia);
  pasta.append(saindo);
  abaAntiga.style.visibility = "hidden";

  const celular = innerWidth <= 860;
  const longe = celular ? 62 : 34;
  saindo.style.transformOrigin = `${largura / 2}px ${corpo.offsetTop + 120}px`;
  const animSaida = saindo.animate([
    { transform: "none", zIndex: 3, filter: "brightness(1)" },
    { transform: `translateX(-${longe}%) translateY(40px) rotate(-6deg) scale(.92)`, zIndex: 3, filter: "brightness(.97)", offset: 0.44 },
    { transform: `translateX(-${longe + 1}%) translateY(40px) rotate(-6deg) scale(.92)`, zIndex: -1, filter: "brightness(.92)", offset: 0.46 },
    { transform: "none", zIndex: -1, filter: "brightness(1)" },
  ], { duration: DURACAO, easing: "cubic-bezier(.65,0,.35,1)" });
  animSaida.onfinish = () => { saindo.remove(); abaAntiga.style.visibility = ""; };

  // 2) a pasta escolhida (corpo + a aba dela) vem de trás para frente,
  //    as duas peças com o mesmo movimento e o mesmo ponto de apoio (o topo da pasta)
  const ox = largura / 2, oy = corpo.offsetTop;
  const chegada = [
    { transform: "scale(.985)", filter: "brightness(.94)" },
    { transform: "scale(.988)", filter: "brightness(.96)", offset: 0.45 },
    { transform: "none", filter: "brightness(1)" },
  ];
  const opcoes = { duration: DURACAO, easing: "cubic-bezier(.3,0,.2,1)" };
  corpo.style.transformOrigin = `${ox}px 0px`;
  abaNova.style.transformOrigin = `${ox - abaNova.offsetLeft}px ${oy - abaNova.offsetTop}px`;
  corpo.animate(chegada, opcoes);
  abaNova.animate(chegada, opcoes);
}

function abrir(nome, { rolar = true, animar = true } = {}) {
  if (!nomes.includes(nome)) nome = "sobre";
  const atual = pasta.dataset.ativa;
  const trocou = atual !== nome;

  if (trocou && rolar) {
    const topo = pasta.getBoundingClientRect().top + scrollY - 16;
    if (scrollY > topo) scrollTo({ top: topo, behavior: "instant" });
  }
  if (trocou && animar && !semMovimento.matches) {
    trocarPastas(atual, nome);
  }

  paineis.forEach((p) => {
    const ativo = p.dataset.painel === nome;
    p.hidden = !ativo;
    if (ativo && trocou) {
      p.classList.remove("entrando");
      void p.offsetWidth;
      p.classList.add("entrando");
    }
    if (!ativo) p.querySelectorAll("video").forEach((v) => v.pause());
  });
  document.querySelectorAll(".aba").forEach((aba) => {
    const ativa = aba.dataset.ir === nome;
    aba.setAttribute("aria-selected", ativa);
  });
  pasta.dataset.ativa = nome;
  observar(document.querySelector(`[data-painel="${nome}"]`));
  // mantém o endereço limpo (sem #sobre, #trabalhos...); links com # continuam funcionando ao abrir
  if (location.hash) history.replaceState(null, "", location.pathname + location.search);
}

document.querySelectorAll("[data-ir]").forEach((el) =>
  el.addEventListener("click", (e) => { e.preventDefault(); abrir(el.dataset.ir); })
);
document.querySelectorAll(".subir").forEach((b) =>
  b.addEventListener("click", () => scrollTo({ top: 0, behavior: "smooth" }))
);
addEventListener("hashchange", () => abrir(location.hash.slice(1)));

// ---------- foto com leve inclinação 3D ----------
const foto = document.querySelector(".foto");
const fotoImg = foto.querySelector(".foto__img");
if (matchMedia("(hover: hover)").matches) {
  foto.addEventListener("mousemove", (e) => {
    const r = foto.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    fotoImg.style.transform = `rotateY(${x * 10}deg) rotateX(${-y * 10}deg)`;
  });
  foto.addEventListener("mouseleave", () => { fotoImg.style.transform = ""; });
}

// ---------- vídeos: em loop, sem som, tocando só quando aparecem na tela ----------
const videos = document.querySelectorAll(".video video");
videos.forEach((v) => { v.muted = true; v.defaultMuted = true; });
const tocador = new IntersectionObserver((entradas) => {
  entradas.forEach((e) => {
    const v = e.target;
    if (e.isIntersecting) { const p = v.play(); if (p) p.catch(() => {}); }
    else v.pause();
  });
}, { threshold: 0.25 });
videos.forEach((v) => tocador.observe(v));

abrir(location.hash.slice(1) || "sobre", { rolar: false, animar: false });
