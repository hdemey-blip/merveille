/* ============================================================
   MARSEILLE — maquette boutique (HTML/CSS/JS pur, sans dépendance)
   Routes : #/            accueil
            #/collection  page collection
            #/produit/:id fiche produit (bleu | noir | vert)
            #/maison      accueil, section "La Maison"
   ============================================================ */

/* ---------- Catalogue : un seul produit, trois coloris ---------- */
const PRODUCT = {
  name: 'T-shirt Merveille',
  price: 85,
  sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
};

const COLORWAYS = {
  bleu: {
    id: 'bleu',
    label: 'Blanc & Bleu',
    full: 'Blanc cassé / Bleu marine',
    tee: '#f1ece1',
    print: '#1c2b5c',
    seam: 'rgba(40,30,10,.16)',
    tone: 'light',
    out: ['XXL'],
    stock: 6,
    badge: "L'original",
    photo: { file: 'etendage.jpg', label: 'Tee + short sur la corde à linge' },
  },
  noir: {
    id: 'noir',
    label: 'Noir & Blanc',
    full: 'Noir délavé / Blanc cassé',
    tee: '#1f1e1d',
    print: '#efe7d6',
    seam: 'rgba(255,255,255,.08)',
    tone: 'dark',
    out: ['XS'],
    stock: 9,
    badge: 'Nouveau',
  },
  vert: {
    id: 'vert',
    label: 'Vert & Marron',
    full: 'Vert bouteille / Marron tabac',
    tee: '#304536',
    print: '#c09062',
    seam: 'rgba(255,255,255,.07)',
    tone: 'dark',
    out: [],
    stock: 4,
    badge: 'Série limitée',
  },
};
const ORDER = ['bleu', 'noir', 'vert'];

/* ---------- Drops : lieux affichés sur la carte du hero ---------- */
const DROPS = [
  { id: 'drop-1', name: 'Vieux-Port', left: 20, locked: false },
  { id: 'auffes', name: 'Vallon des Auffes', left: 52, locked: true },
  { id: 'goudes', name: 'Les Goudes', left: 82, locked: true },
];

/* ---------- Backend Supabase (catalogue live + paiement) ---------- */
const SUPABASE_URL = 'https://auhlypjoesbfcilrreul.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1aGx5cGpvZXNiZmNpbHJyZXVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk3MjI0MzQsImV4cCI6MjEwNTI5ODQzNH0.tta14qoOGnb8yEjO4HfeeZb8etr9T2vyVZp4NelUQzo';

/* STOCK[cw][size] = { id: variant_size_id, qty } — rempli par loadCatalog() */
let STOCK = {};

async function loadCatalog() {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/variant_sizes?select=id,size,stock_qty,product_variants(colorway_key)`,
      { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } }
    );
    if (!res.ok) return;
    const rows = await res.json();
    const map = {};
    rows.forEach((r) => {
      const cw = r.product_variants.colorway_key;
      (map[cw] ??= {})[r.size] = { id: r.id, qty: r.stock_qty };
    });
    STOCK = map;
    ORDER.forEach((cw) => {
      if (!STOCK[cw]) return;
      COLORWAYS[cw].out = PRODUCT.sizes.filter((s) => (STOCK[cw][s]?.qty ?? 0) <= 0);
    });
    render(); /* rafraîchit la vue courante avec le vrai stock */
  } catch { /* hors-ligne : on garde le stock de secours codé en dur */ }
}

function stockLabel(cw, size) {
  const qty = STOCK[cw]?.[size]?.qty;
  if (qty == null) return `Plus que ${COLORWAYS[cw].stock} pièces dans cette taille`;
  if (qty <= 0) return 'Rupture de stock dans cette taille';
  if (qty <= 3) return `Plus que ${qty} pièce${qty > 1 ? 's' : ''} — dernières pièces`;
  return `Plus que ${qty} pièces dans cette taille`;
}

/* ---------- Helpers ---------- */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const euro = (n) => n.toFixed(2).replace('.', ',') + ' €';

function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('is-on');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => t.classList.remove('is-on'), 2600);
}

const store = {
  get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* navigation privée */ } },
};

function photo(file, label, cls = '', framed = false) {
  return `<div class="photo ${cls}" data-file="${file}" data-ph="${label}"><img src="images/${file}" alt="${label}" loading="lazy">${framed ? '<span class="gold-frame"></span>' : ''}</div>`;
}

/* ---------- Wordmark : MARSEILLE en colline + Bonne Mère dorée ---------- */
const LETTERS = [['M', .42], ['E', .56], ['R', .7, true], ['V', .84], ['E', 1], ['I', .9], ['L', .74], ['L', .58], ['E', .44]];

function wordmark() {
  const letters = LETTERS.map(([l, h, cross]) =>
    `<span class="wm__l" style="--h:${h}">${cross ? '<i class="wm__cross"></i>' : ''}${l}</span>`).join('');
  return `<svg class="wm__statue" viewBox="0 0 40 104" aria-hidden="true"><use href="#statue" fill="url(#gold)"/></svg><span class="wm__letters">${letters}</span>`;
}

/* ---------- Le t-shirt (dos = grand logo, face = petit logo cœur) ---------- */
function tee(cw, view = 'back') {
  const c = COLORWAYS[cw];
  const collar = view === 'front'
    ? `<path d="M248 44 Q300 102 352 44 Q300 68 248 44Z" fill="rgba(0,0,0,.34)"/>
       <path d="M244 42 Q300 104 356 42" fill="none" stroke="${c.tee}" stroke-width="14" stroke-linecap="round"/>
       <path d="M244 42 Q300 104 356 42" fill="none" stroke="${c.seam}" stroke-width="14" stroke-linecap="round" opacity=".7"/>
       <path d="M252 50 Q300 108 348 50" fill="none" stroke="${c.seam}" stroke-width="1.2" stroke-dasharray="3 3"/>`
    : `<path d="M244 42 Q300 68 356 42" fill="none" stroke="${c.tee}" stroke-width="12" stroke-linecap="round"/>
       <path d="M244 42 Q300 68 356 42" fill="none" stroke="${c.seam}" stroke-width="12" stroke-linecap="round" opacity=".6"/>
       <path d="M250 50 Q300 74 350 50" fill="none" stroke="${c.seam}" stroke-width="1.2" stroke-dasharray="3 3"/>`;

  const print = view === 'back'
    ? `<div class="tee__print"><span class="wm">${wordmark()}</span></div>`
    : `<div class="tee__chest"><span class="wm">${wordmark()}</span></div>`;

  return `<div class="tee tee--${view} tee--${c.tone}" style="--tee:${c.tee};--print:${c.print}" role="img" aria-label="${PRODUCT.name} ${c.full}, vue ${view === 'back' ? 'dos' : 'face'}">
    <svg viewBox="0 0 600 640" aria-hidden="true">
      <ellipse class="tee__shadow" cx="300" cy="614" rx="210" ry="12" fill="#000"/>
      <use href="#teeShape" fill="${c.tee}"/>
      <g clip-path="url(#teeClip)">
        <rect width="600" height="640" fill="url(#teeLight)"/>
        <rect width="600" height="640" filter="url(#fabric)" opacity="${c.tone === 'dark' ? .22 : .1}"/>
        <ellipse cx="190" cy="470" rx="70" ry="210" fill="url(#teeFold)"/>
        <ellipse cx="425" cy="500" rx="60" ry="170" fill="url(#teeFold)"/>
        <ellipse cx="300" cy="610" rx="260" ry="30" fill="url(#teeFold)"/>
        <path d="M160 70 Q150 160 132 236 M440 70 Q450 160 468 236" stroke="${c.seam}" stroke-width="1.6" fill="none"/>
        <path d="M44 146 Q62 204 88 254 M556 146 Q538 204 512 254 M130 580 Q300 600 470 580" stroke="${c.seam}" stroke-width="1.3" fill="none" stroke-dasharray="3 3"/>
      </g>
      ${collar}
      <use href="#teeShape" fill="none" stroke="rgba(0,0,0,.14)" stroke-width="1"/>
    </svg>
    ${print}
  </div>`;
}

function heroMap() {
  const pins = DROPS.map((d) => `
    <button class="hero-map__pin ${d.locked ? 'is-locked' : ''}"
      style="left:${d.left}%"
      ${d.locked ? 'data-locked' : `data-scroll="${d.id}"`}
      aria-label="${d.name}${d.locked ? ' — bientôt' : ''}">
      <span class="hero-map__label">${d.name}</span>
      <span class="hero-map__dot"></span>
    </button>`).join('');

  return `<div class="hero-map">
    <svg class="hero-map__coast" viewBox="0 0 400 46" preserveAspectRatio="none" aria-hidden="true">
      <path d="M0 30 Q60 6 120 22 T240 18 T400 32"/>
    </svg>
    <div class="hero-map__pins">${pins}</div>
  </div>`;
}

/* ---------- Composants ---------- */
function swatch(cw, active, asLink = true) {
  const c = COLORWAYS[cw];
  const tag = asLink ? 'a' : 'span';
  const href = asLink ? ` href="#/produit/${cw}"` : '';
  return `<${tag}${href} class="swatch ${asLink && active ? 'is-active' : ''} ${!asLink ? '' : ''}" style="--a:${c.tee};--b:${c.print}" title="${c.full}" aria-label="${c.full}"></${tag}>`;
}

function card(cw) {
  const c = COLORWAYS[cw];
  return `<article class="card reveal">
    <a href="#/produit/${cw}" class="card__media">
      <span class="card__badge">${c.badge}</span>
      ${tee(cw, 'back')}
      ${tee(cw, 'front')}
      <span class="card__quick"><button class="btn btn--full" data-quick="${cw}">Ajout rapide — M</button></span>
    </a>
    <div class="card__info">
      <h3 class="card__title"><a href="#/produit/${cw}">${PRODUCT.name} | ${c.label}</a></h3>
      <p class="card__price">${euro(PRODUCT.price)}</p>
    </div>
    <div class="card__swatches">${ORDER.map((k) => swatch(k, k === cw)).join('')}</div>
  </article>`;
}

/* Tuile de collection : photo 4:5 + petit sur-titre en bas à gauche */
function tile(href, file, label, title) {
  return `<a href="${href}" class="tile reveal">
    ${photo(file, label, '', true)}
    <p class="tile__label kicker">${title}</p>
  </a>`;
}

/* Bannière pleine largeur, hauteur fixe (md = 700 px, lg = 900 px) */
function banner(href, file, label, title, size, pos) {
  return `<a href="${href}" class="overlay-banner overlay-banner--${size} reveal">
    ${photo(file, label, '', true)}
    <div class="overlay-banner__content ${pos}">
      <p class="kicker">${title}</p>
      <span class="link">Découvrir</span>
    </div>
  </a>`;
}

/* ============================================================
   Vues
   ============================================================ */
function viewHome() {
  return `
  <section class="overlay-banner overlay-banner--hero">
    ${photo('hero.jpg', 'Terrasse face à la mer', '', true)}
    <div class="overlay-banner__shade"></div>
    <div class="overlay-banner__content is-top-center">
      <p class="kicker">Drop n°1 — Été 2026</p>
      <h1 class="display">Le Merveille</h1>
      <a href="#/collection" class="btn btn--light">Découvrir le drop</a>
    </div>
    ${heroMap()}
  </section>

  <section class="collection-split">
    ${tile('#/produit/bleu', 'etendage.jpg', 'Le linge qui sèche au Panier', "L'original")}
    ${tile('#/collection', 'soiree.jpg', 'Soirée sur le port', 'Tout le drop')}
  </section>

  <section class="product-grid-section" id="drop-1">
    <div class="section-title"><h2>Drop n°1 — Vieux-Port</h2><a href="#/collection">Tout voir</a></div>
    <div class="product-grid">${ORDER.map(card).join('')}</div>
  </section>

  ${banner('#/produit/vert', 'voiture.png', 'Ancienne décapotable, tee-shirt posé sur le capot', 'Direction le large', 'md', 'is-top-right')}

  <section class="collection-split">
    ${tile('#/produit/bleu', 'riva.png', 'Riva en bois dans le port', 'Au port')}
    ${tile('#/collection', 'blackjack.png', 'Table de black-jack au coucher du soleil', 'Le soir venu')}
  </section>

  ${banner('#/collection', 'sunset.jpg', 'Marche solitaire au coucher du soleil', 'Il fait toujours beau à Marseille', 'lg', 'is-bottom-left')}

  <section class="maison" id="maison">
    <div class="maison__inner reveal">
      <svg class="maison__mark" viewBox="0 0 40 104" aria-hidden="true"><use href="#statue" fill="url(#gold)"/></svg>
      <p class="kicker">La Maison</p>
      <h2 class="display">Née entre le Panier et la mer</h2>
      <p>On a grandi avec le linge tendu d'une façade à l'autre, les tee-shirts délavés par le sel et la silhouette dorée de la Bonne Mère au-dessus de la ville. Ce premier drop, c'est ça : un seul tee-shirt, fait pour durer, décliné en trois teintes qui sentent l'été à Marseille.</p>
      <p>Coton lourd 240 g/m², sérigraphie à l'ancienne, dorure à la main. 300 pièces numérotées par teinte, jamais rééditées.</p>
      <a href="#/collection" class="btn btn--ghost">Découvrir le drop</a>
    </div>
  </section>`;
}

function viewCollection(filter = 'all') {
  const list = ORDER.filter((k) => filter === 'all' || COLORWAYS[k].tone === filter);
  return `
  <div class="crumbs"><a href="#/">Accueil</a> / Le T-shirt</div>
  <section class="collection-hero">
    <p class="kicker">Drop n°1 — Été 2026</p>
    <h1 class="display">Le T-shirt</h1>
    <p>Une seule pièce, trois teintes. Le logo MERVEILLE en colline, la Bonne Mère en or au sommet — comme vue depuis le Vieux-Port.</p>
  </section>
  <div class="toolbar">
    <div class="toolbar__filters">
      <button data-filter="all" class="${filter === 'all' ? 'is-active' : ''}">Tout</button>
      <button data-filter="light" class="${filter === 'light' ? 'is-active' : ''}">Teintes claires</button>
      <button data-filter="dark" class="${filter === 'dark' ? 'is-active' : ''}">Teintes foncées</button>
    </div>
    <span>${list.length} produit${list.length > 1 ? 's' : ''}</span>
  </div>
  <div class="product-grid product-grid--page">${list.map(card).join('')}</div>`;
}

function viewSuccess() {
  return `
  <section class="collection-hero">
    <p class="kicker">Commande confirmée</p>
    <h1 class="display">Merci !</h1>
    <p>Ta commande a bien été enregistrée. Un e-mail de confirmation te parviendra une fois le paiement vérifié.</p>
    <a href="#/collection" class="btn">Continuer mes achats</a>
  </section>`;
}

function viewProduct(cw) {
  const c = COLORWAYS[cw];
  const slides = [
    { thumb: tee(cw, 'back'), main: tee(cw, 'back') },
    { thumb: tee(cw, 'front'), main: tee(cw, 'front') },
    { thumb: tee(cw, 'back'), main: `<div class="gallery__zoom">${tee(cw, 'back')}</div>` },
  ];
  if (c.photo) slides.push({ thumb: photo(c.photo.file, c.photo.label), main: photo(c.photo.file, c.photo.label) });

  const firstAvail = PRODUCT.sizes.find((s) => s === 'M' && !c.out.includes(s)) || PRODUCT.sizes.find((s) => !c.out.includes(s));

  return `
  <div class="crumbs"><a href="#/">Accueil</a> / <a href="#/collection">Le T-shirt</a> / ${c.label}</div>
  <section class="pdp" data-cw="${cw}">
    <div class="gallery">
      <div class="gallery__thumbs">
        ${slides.map((s, i) => `<button class="gallery__thumb ${i === 0 ? 'is-active' : ''}" data-slide="${i}" aria-label="Image ${i + 1}">${s.thumb}</button>`).join('')}
      </div>
      <div class="gallery__main">
        ${slides.map((s, i) => `<div class="gallery__slide ${i === 0 ? 'is-active' : ''}">${s.main}</div>`).join('')}
        <button class="gallery__arrow gallery__arrow--prev" data-step="-1" aria-label="Précédent">‹</button>
        <button class="gallery__arrow gallery__arrow--next" data-step="1" aria-label="Suivant">›</button>
      </div>
    </div>

    <div class="pdp__info">
      <p class="kicker pdp__kicker">Drop n°1 · ${c.badge}</p>
      <h1>${PRODUCT.name}</h1>
      <p class="pdp__price">${euro(PRODUCT.price)}</p>
      <p class="pdp__tax">TTC — frais de livraison calculés à l'étape suivante.</p>

      <div class="opt">
        <div class="opt__label"><span>Couleur : <b>${c.full}</b></span></div>
        <div class="opt__row">${ORDER.map((k) => swatch(k, k === cw).replace('class="swatch', 'class="swatch swatch--lg')).join('')}</div>
      </div>

      <div class="opt">
        <div class="opt__label"><span>Taille : <b data-size-label>${firstAvail}</b></span><a href="#" data-fake>Guide des tailles</a></div>
        <div class="opt__row">
          ${PRODUCT.sizes.map((s) => `<button class="size ${c.out.includes(s) ? 'is-out' : ''} ${s === firstAvail ? 'is-active' : ''}" data-size="${s}" ${c.out.includes(s) ? 'disabled' : ''}>${s}</button>`).join('')}
        </div>
      </div>

      <p class="stock" data-stock>${stockLabel(cw, firstAvail)}</p>

      <div class="buy">
        <div class="qty"><button data-q="-1" aria-label="Moins">−</button><span data-qty>1</span><button data-q="1" aria-label="Plus">+</button></div>
        <button class="btn" data-add>Ajouter au panier</button>
      </div>
      <p class="edition">Série limitée · 300 pièces numérotées · expédition sous 48 h</p>

      <details class="acc" open>
        <summary>Description</summary>
        <div class="acc__body">
          <p style="margin-top:0">Le tee-shirt de la maison. Dans le dos, MERVEILLE dessiné comme la ville vue du port : les lettres montent vers la colline et la Bonne Mère, dorée à la feuille, veille au sommet. Sur le cœur, la même signature en petit.</p>
          <p style="margin-bottom:0">Coloris ${c.full.toLowerCase()}.</p>
        </div>
      </details>
      <details class="acc">
        <summary>Composition &amp; entretien</summary>
        <div class="acc__body"><ul><li>100 % coton peigné, 240 g/m²</li><li>Coupe oversize, épaules tombantes</li><li>Sérigraphie à l'eau + dorure</li><li>Lavage à 30 °C sur l'envers, pas de sèche-linge</li></ul></div>
      </details>
      <details class="acc">
        <summary>Livraison &amp; retours</summary>
        <div class="acc__body">Livraison offerte en France dès 150 €. Expédition depuis Marseille sous 48 h. Retours gratuits sous 30 jours.</div>
      </details>
      <details class="acc">
        <summary>Broderie personnalisée</summary>
        <div class="acc__body">Ajoute tes initiales ou ton quartier brodés sous le logo cœur (+15 €). Ex. : « LE PANIER », « ENDOUME », « L'ESTAQUE ».</div>
      </details>
    </div>
  </section>

  <section class="product-grid-section" style="padding-top:0">
    <div class="section-title"><h2>Les autres teintes</h2><a href="#/collection">Tout voir</a></div>
    <div class="product-grid">${ORDER.filter((k) => k !== cw).map(card).join('')}</div>
  </section>`;
}

/* ============================================================
   Routeur
   ============================================================ */
const app = $('#app');
let collectionFilter = 'all';

function render() {
  const hash = location.hash.replace(/^#/, '') || '/';
  const [, route, param] = hash.split('/');
  let html;
  let hero = false;

  if (route === 'collection') {
    html = viewCollection(collectionFilter);
    document.title = 'Le T-shirt — MERVEILLE';
  } else if (route === 'produit' && COLORWAYS[param]) {
    html = viewProduct(param);
    document.title = `${PRODUCT.name} ${COLORWAYS[param].label} — MERVEILLE`;
  } else if (route === 'commande' && param === 'succes') {
    html = viewSuccess();
    document.title = 'Merci — MERVEILLE';
    cart = [];
    saveCart();
  } else {
    html = viewHome();
    hero = true;
    document.title = 'MERVEILLE — Maison du Vieux-Port';
  }

  app.innerHTML = html;
  document.body.classList.toggle('has-hero', hero);
  document.body.classList.remove('nav-open');

  const navLinks = $$('.header__nav a');
  const currentLink = navLinks.find((a) => a.getAttribute('href') === '#' + hash);
  navLinks.forEach((a) => a.classList.toggle('is-current', a === currentLink));

  checkImages(app);
  observeReveal();
  onScroll();

  if (route === 'maison') {
    requestAnimationFrame(() => $('#maison')?.scrollIntoView());
  } else {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }
  if (route === 'produit') bindProduct();
}

window.addEventListener('hashchange', render);

/* ---------- Photos manquantes -> visuel de remplacement ---------- */
function markMissing(img) { img.closest('.photo')?.classList.add('is-missing'); }
document.addEventListener('error', (e) => { if (e.target.tagName === 'IMG') markMissing(e.target); }, true);
function checkImages(root) {
  $$('.photo img', root).forEach((img) => { if (img.complete && img.naturalWidth === 0) markMissing(img); });
}

/* ---------- Apparition au scroll ---------- */
const io = 'IntersectionObserver' in window
  ? new IntersectionObserver((entries) => entries.forEach((en) => {
    if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
  }), { rootMargin: '0px 0px -8% 0px' })
  : null;
function observeReveal() {
  $$('.reveal:not(.is-in)').forEach((el) => (io ? io.observe(el) : el.classList.add('is-in')));
}

/* ---------- Header au scroll ---------- */
const header = $('#header');
function onScroll() { header.classList.toggle('is-scrolled', window.scrollY > 40); }
window.addEventListener('scroll', onScroll, { passive: true });

/* ---------- Barre d'annonce rotative ---------- */
(() => {
  const msgs = $$('.announcement__msg');
  let i = 0;
  setInterval(() => {
    msgs[i].classList.remove('is-active');
    i = (i + 1) % msgs.length;
    msgs[i].classList.add('is-active');
  }, 4000);
})();

/* ---------- Menu mobile ---------- */
$('#burger').addEventListener('click', () => document.body.classList.toggle('nav-open'));

/* ============================================================
   Fiche produit : galerie, tailles, quantité
   ============================================================ */
function bindProduct() {
  const pdp = $('.pdp');
  const cw = pdp.dataset.cw;
  const slides = $$('.gallery__slide', pdp);
  const thumbs = $$('.gallery__thumb', pdp);
  let current = 0;
  let qty = 1;
  let size = $('.size.is-active', pdp)?.dataset.size;

  const go = (n) => {
    current = (n + slides.length) % slides.length;
    slides.forEach((s, i) => s.classList.toggle('is-active', i === current));
    thumbs.forEach((t, i) => t.classList.toggle('is-active', i === current));
  };

  pdp.addEventListener('click', (e) => {
    const t = e.target.closest('[data-slide],[data-step],[data-size],[data-q],[data-add]');
    if (!t) return;
    if (t.dataset.slide) go(+t.dataset.slide);
    if (t.dataset.step) go(current + +t.dataset.step);
    if (t.dataset.size && !t.disabled) {
      size = t.dataset.size;
      $$('.size', pdp).forEach((b) => b.classList.toggle('is-active', b === t));
      $('[data-size-label]', pdp).textContent = size;
      $('[data-stock]', pdp).textContent = stockLabel(cw, size);
    }
    if (t.dataset.q) {
      qty = Math.max(1, Math.min(10, qty + +t.dataset.q));
      $('[data-qty]', pdp).textContent = qty;
    }
    if (t.hasAttribute('data-add')) {
      addToCart(cw, size, qty);
      openDrawer();
    }
  });
}

/* ============================================================
   Panier
   ============================================================ */
const FREE_SHIP = 150;
let cart = store.get('mrs-cart', []);

function addToCart(cw, size, qty = 1) {
  const line = cart.find((l) => l.cw === cw && l.size === size);
  if (line) line.qty += qty; else cart.push({ cw, size, qty });
  saveCart();
}
function saveCart() { store.set('mrs-cart', cart); renderCart(); }

function renderCart() {
  const count = cart.reduce((n, l) => n + l.qty, 0);
  const total = cart.reduce((n, l) => n + l.qty * PRODUCT.price, 0);
  const countEl = $('#cartCount');
  countEl.textContent = count;
  countEl.classList.toggle('is-on', count > 0);

  const left = FREE_SHIP - total;
  $('#drawerShip').innerHTML = `${left > 0 ? `Plus que <b>${euro(left)}</b> pour la livraison offerte` : 'Livraison <b>offerte</b> 🎉'}
    <div class="drawer__bar"><i style="width:${Math.min(100, (total / FREE_SHIP) * 100)}%"></i></div>`;

  if (!cart.length) {
    $('#drawerItems').innerHTML = `<div class="drawer__empty"><p>Ton panier est vide.</p><a href="#/collection" class="btn" data-close-drawer>Découvrir le drop</a></div>`;
    $('#drawerFoot').innerHTML = '';
    return;
  }

  $('#drawerItems').innerHTML = cart.map((l, i) => `
    <div class="line">
      <a href="#/produit/${l.cw}" class="line__img" data-close-drawer>${tee(l.cw, 'back')}</a>
      <div>
        <h4>${PRODUCT.name}</h4>
        <p>${COLORWAYS[l.cw].full} · ${l.size}</p>
        <div class="qty"><button data-line="${i}" data-d="-1" aria-label="Moins">−</button><span>${l.qty}</span><button data-line="${i}" data-d="1" aria-label="Plus">+</button></div>
      </div>
      <div class="line__right"><span>${euro(l.qty * PRODUCT.price)}</span><button data-remove="${i}">Retirer</button></div>
    </div>`).join('');

  $('#drawerFoot').innerHTML = `
    <div class="drawer__total"><span>Sous-total</span><span>${euro(total)}</span></div>
    <small>Taxes incluses. Livraison calculée au paiement.</small>
    <button class="btn btn--full" data-checkout>Paiement</button>`;
}

$('#drawerItems').addEventListener('click', (e) => {
  const d = e.target.closest('[data-d]');
  const r = e.target.closest('[data-remove]');
  if (d) {
    const l = cart[+d.dataset.line];
    l.qty += +d.dataset.d;
    if (l.qty < 1) cart.splice(+d.dataset.line, 1);
    saveCart();
  }
  if (r) { cart.splice(+r.dataset.remove, 1); saveCart(); }
});

function openDrawer() {
  $('#drawer').classList.add('is-on');
  $('#overlay').classList.add('is-on');
  document.body.classList.add('no-scroll');
}
function closeDrawer() {
  $('#drawer').classList.remove('is-on');
  $('#overlay').classList.remove('is-on');
  document.body.classList.remove('no-scroll');
}
$('#cartBtn').addEventListener('click', openDrawer);
$('#drawerClose').addEventListener('click', closeDrawer);
$('#overlay').addEventListener('click', closeDrawer);

/* ---------- Clics globaux ---------- */
document.addEventListener('click', (e) => {
  const mapPin = e.target.closest('[data-scroll]');
  if (mapPin) {
    document.getElementById(mapPin.dataset.scroll)?.scrollIntoView({ behavior: 'smooth' });
    return;
  }
  const locked = e.target.closest('[data-locked]');
  if (locked) {
    e.preventDefault();
    document.body.classList.remove('nav-open');
    toast('Prochain drop — bientôt');
    return;
  }
  const quick = e.target.closest('[data-quick]');
  if (quick) {
    e.preventDefault();
    const cw = quick.dataset.quick;
    const size = COLORWAYS[cw].out.includes('M') ? 'L' : 'M';
    addToCart(cw, size, 1);
    openDrawer();
    return;
  }
  const filter = e.target.closest('[data-filter]');
  if (filter) {
    collectionFilter = filter.dataset.filter;
    app.innerHTML = viewCollection(collectionFilter);
    observeReveal();
    return;
  }
  if (e.target.closest('[data-close-drawer]')) closeDrawer();
  if (e.target.closest('[data-checkout]')) { e.preventDefault(); startCheckout(); }
  if (e.target.closest('[data-fake]')) { e.preventDefault(); toast('Maquette — page non créée'); }
});

/* ---------- Paiement (Stripe Checkout via edge function Supabase) ---------- */
async function startCheckout() {
  if (!cart.length) return;

  const items = cart.map((l) => {
    const row = STOCK[l.cw]?.[l.size];
    return row ? { variant_size_id: row.id, quantity: l.qty } : null;
  });

  if (items.some((it) => !it)) {
    toast('Stock indisponible pour un article — vérifie ton panier');
    return;
  }

  const btn = $('[data-checkout]');
  if (btn) { btn.disabled = true; btn.textContent = 'Redirection…'; }

  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/create-checkout-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ items }),
    });
    const data = await res.json();
    if (!res.ok || !data.url) throw new Error(data.error || 'Paiement indisponible');
    window.location.href = data.url;
  } catch (err) {
    toast(err.message || 'Paiement indisponible pour le moment');
    if (btn) { btn.disabled = false; btn.textContent = 'Paiement'; }
  }
}

document.addEventListener('submit', (e) => {
  if (e.target.matches('[data-fake-form]')) {
    e.preventDefault();
    closePopup();
    toast('Maquette — inscription non envoyée');
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') { closeDrawer(); closePopup(); document.body.classList.remove('nav-open'); }
});

/* ---------- Popup "Rejoins la famille" ---------- */
function closePopup() {
  $('#popup').classList.remove('is-on');
  store.set('mrs-popup', 1);
}
$('#popupClose').addEventListener('click', closePopup);
$('#popup').addEventListener('click', (e) => { if (e.target.id === 'popup') closePopup(); });
if (!store.get('mrs-popup', 0)) setTimeout(() => $('#popup').classList.add('is-on'), 6000);

/* ---------- Init ---------- */
$$('[data-wordmark]').forEach((el) => { el.innerHTML = wordmark(); });
checkImages(document);
renderCart();
render();
loadCatalog();
