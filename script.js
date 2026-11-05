/* =========================================================
   PERFUME — Luxury Arabic Storefront
   Vanilla ES6+. No dependencies. Organised in blocks:
   01. Helpers & storage
   02. Icon set
   03. SVG artwork (bottle, hero scene, about panel)
   04. Data (products, slides, reviews)
   05. Rendering & filtering
   06. Favourites
   07. Cart & drawer
   08. Quick view
   09. Layers, focus trap & search
   10. Hero slider
   11. Reviews carousel
   12. Stats counter
   13. Contact form
   14. Theme, nav & init
   ========================================================= */
'use strict';

/* =========================================================
   01. Helpers & storage
   ========================================================= */
const $ = (selector, context = document) => context.querySelector(selector);
const $$ = (selector, context = document) => Array.from(context.querySelectorAll(selector));

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

const formatPrice = (value) => `$${Number(value).toFixed(2)}`;
const formatNumber = (value) => new Intl.NumberFormat('en-US').format(value);

/** صياغة عربية سليمة للعدد: [المفرد، المثنى، ٣-١٠، ١١+] */
function arabicCount(count, [one, two, few, many]) {
  if (count === 1) return one;
  if (count === 2) return two;
  if (count >= 3 && count <= 10) return `${formatNumber(count)} ${few}`;
  return `${formatNumber(count)} ${many}`;
}

function priceFor(product, size) {
  if (size === 100) return Math.floor(product.price * 1.38) + 0.99;
  return product.price;
}

const storage = {
  get(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return fallback;
      const parsed = JSON.parse(raw);
      return parsed === null ? fallback : parsed;
    } catch (error) {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      /* التخزين غير متاح — نتابع بدون حفظ */
    }
  }
};

let toastTimer = null;
function showToast(message) {
  const toast = $('#toast');
  const toastText = $('#toastText');
  if (!toast || !toastText) return;
  toastText.textContent = message;
  toast.classList.add('is-visible');
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove('is-visible'), 2000);
}

/* =========================================================
   02. Icon set (inline stroke SVGs)
   ========================================================= */
const ICONS = {
  cart: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 3h3l2.6 12.2a1 1 0 0 0 1 .8h9.8a1 1 0 0 0 1-.8L21 7H6"/><circle cx="9.5" cy="20" r="1.4"/><circle cx="17" cy="20" r="1.4"/></svg>',
  heart: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-8-5.2-8-11a4.6 4.6 0 0 1 8-3 4.6 4.6 0 0 1 8 3c0 5.8-8 11-8 11z"/></svg>',
  search: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.5-4.5"/></svg>',
  chevron: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>',
  eye: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.8-7 10-7 10 7 10 7-3.8 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',
  trash: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v5M14 11v5"/></svg>',
  plus: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
  minus: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14"/></svg>',
  star: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.6l2.9 6 6.6.9-4.8 4.6 1.2 6.5-5.9-3.1-5.9 3.1 1.2-6.5L2.5 9.5l6.6-.9z"/></svg>',
  arrow: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>',
  check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12l5 5 9-10"/></svg>'
};

const STAR_SCORE = '<span class="stars" aria-hidden="true">' + ICONS.star.repeat(5) + '</span>';

/* =========================================================
   03. SVG artwork
   ========================================================= */
let svgUid = 0;

const LOTUS_PATHS = `
  <path d="M40 6c-7 8-7 18 0 26 7-8 7-18 0-26z"/>
  <path d="M40 32C30 30 24 22 22 12c10 0 17 8 18 20z"/>
  <path d="M40 32C50 30 56 22 58 12c-10 0-17 8-18 20z"/>
  <path d="M40 34C28 36 16 30 10 20c12-2 24 4 30 14z"/>
  <path d="M40 34C52 36 64 30 70 20c-12-2-24 4-30 14z"/>
  <path d="M26 40c4 3 9 4 14 4s10-1 14-4"/>`;

/**
 * يولّد زجاجة عطر SVG متناسقة لكل المنتجات.
 * يمكن استبدالها لاحقاً بصور حقيقية عبر تغيير دالة القالب في البطاقات.
 * @param {Object} cfg { glass:[light,dark], cap:[light,dark], shape:'rect'|'facet'|'crown', label, labelBg, labelFg, name }
 */
function bottleSVG(cfg = {}) {
  const uid = 'btl' + (++svgUid);
  const shape = cfg.shape || 'rect';
  const glassLight = (cfg.glass && cfg.glass[0]) || '#d9a53c';
  const glassDark = (cfg.glass && cfg.glass[1]) || '#6e4a14';
  const capLight = (cfg.cap && cfg.cap[0]) || '#f2dba0';
  const capDark = (cfg.cap && cfg.cap[1]) || '#b8914a';
  const labelText = cfg.label || 'PERFUME';
  const labelBg = cfg.labelBg || '#0d0a08';
  const labelFg = cfg.labelFg || '#e6c882';
  const name = cfg.name || 'زجاجة عطر فاخرة';
  const labelSize = labelText.length > 8 ? 6.1 : labelText.length > 6 ? 7.2 : 8.3;

  const bodyPath = shape === 'facet'
    ? 'M56 66 H104 L127 96 V230 Q127 240 117 240 H43 Q33 240 33 230 V96 Z'
    : 'M62 66 H98 Q104 66 108 72 L124 94 Q128 100 128 108 V230 Q128 240 118 240 H42 Q32 240 32 230 V108 Q32 100 36 94 L52 72 Q56 66 62 66 Z';

  const facetLines = shape === 'facet'
    ? `<path d="M56 66L33 96M104 66l23 30" stroke="#fff" stroke-opacity=".28" stroke-width="1"/>
       <path d="M40 118h80M40 170h80M80 100v128" stroke="#fff" stroke-opacity=".12" stroke-width=".8"/>`
    : '';

  let capMarkup;
  if (shape === 'crown') {
    capMarkup = `
      <path d="M57 52 L53 24 L68 35 L80 15 L92 35 L107 24 L103 52 Z" fill="url(#${uid}cap)" stroke="#6b4e1c" stroke-width=".7"/>
      <rect x="55" y="44" width="50" height="11" rx="2" fill="url(#${uid}cap)" stroke="#6b4e1c" stroke-width=".6"/>
      <circle cx="53" cy="24" r="2.2" fill="${capLight}"/>
      <circle cx="80" cy="15" r="2.2" fill="${capLight}"/>
      <circle cx="107" cy="24" r="2.2" fill="${capLight}"/>
      <path d="M60 27l2 22M80 19v27M100 27l-2 22" stroke="#fff" stroke-opacity=".25" stroke-width=".8"/>`;
  } else if (shape === 'facet') {
    capMarkup = `
      <path d="M61 54 L56 30 L74 19 H86 L104 30 L99 54 Z" fill="url(#${uid}cap)" fill-opacity=".9" stroke="#fff" stroke-opacity=".5" stroke-width=".8"/>
      <path d="M56 30l24 24M104 30L80 54M74 19v35M86 19v35M61 54h38" stroke="#fff" stroke-opacity=".32" stroke-width=".8"/>
      <rect x="58" y="48" width="44" height="8" rx="2" fill="url(#${uid}cap)"/>`;
  } else {
    capMarkup = `
      <rect x="58" y="20" width="44" height="35" rx="3.5" fill="url(#${uid}cap)" stroke="#7a5a20" stroke-width=".6"/>
      <rect x="58" y="20" width="44" height="4" rx="2" fill="#fff" fill-opacity=".38"/>
      <path d="M66 24v27M72 24v27M88 24v27M94 24v27" stroke="#6b4e1c" stroke-opacity=".35" stroke-width=".8"/>
      <rect x="56" y="47" width="48" height="8" rx="2.5" fill="url(#${uid}cap)" stroke="#7a5a20" stroke-width=".6"/>`;
  }

  return `
  <svg class="bottle-svg" viewBox="0 0 160 260" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${name}">
    <title>${name}</title>
    <defs>
      <linearGradient id="${uid}glass" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="${glassDark}"/>
        <stop offset=".18" stop-color="${glassLight}"/>
        <stop offset=".46" stop-color="${glassLight}"/>
        <stop offset=".72" stop-color="${glassDark}"/>
        <stop offset="1" stop-color="#070607"/>
      </linearGradient>
      <linearGradient id="${uid}liquid" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${glassLight}" stop-opacity=".55"/>
        <stop offset="1" stop-color="${glassDark}" stop-opacity=".96"/>
      </linearGradient>
      <linearGradient id="${uid}cap" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="${capDark}"/>
        <stop offset=".28" stop-color="${capLight}"/>
        <stop offset=".58" stop-color="${capLight}"/>
        <stop offset="1" stop-color="${capDark}"/>
      </linearGradient>
      <linearGradient id="${uid}shine" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#fff" stop-opacity=".55"/>
        <stop offset="1" stop-color="#fff" stop-opacity="0"/>
      </linearGradient>
      <clipPath id="${uid}clip"><path d="${bodyPath}"/></clipPath>
    </defs>

    <ellipse cx="80" cy="245" rx="49" ry="7" fill="#000" fill-opacity=".42"/>

    <rect x="69" y="48" width="22" height="22" rx="1.5" fill="url(#${uid}cap)"/>

    <path d="${bodyPath}" fill="url(#${uid}glass)" stroke="#fff" stroke-opacity=".34" stroke-width="1.3"/>
    <g clip-path="url(#${uid}clip)">
      <path d="M30 138 Q80 126 130 138 V244 H30 Z" fill="url(#${uid}liquid)" opacity=".62"/>
      <path d="M30 138 Q80 126 130 138" fill="none" stroke="#fff" stroke-opacity=".28" stroke-width="1"/>
      <rect x="37" y="112" width="10" height="92" rx="5" fill="url(#${uid}shine)" opacity=".7"/>
      <rect x="114" y="118" width="4" height="82" rx="2" fill="#fff" opacity=".10"/>
      ${facetLines}
    </g>

    <path d="${bodyPath}" fill="none" stroke="#fff" stroke-opacity=".18" stroke-width="1"/>

    <g>
      <rect x="50" y="112" width="60" height="76" rx="3" fill="${labelBg}" stroke="${labelFg}" stroke-opacity=".55" stroke-width=".8"/>
      <rect x="54" y="116" width="52" height="68" rx="1.5" fill="none" stroke="${labelFg}" stroke-opacity=".22" stroke-width=".6"/>
      <g transform="translate(80 127) scale(.17) translate(-40 -25)" fill="none" stroke="${labelFg}" stroke-opacity=".9" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">
        ${LOTUS_PATHS}
      </g>
      <text x="80" y="156" text-anchor="middle" font-family="Cormorant Garamond, Georgia, serif" font-weight="500" font-size="${labelSize}" letter-spacing="1.2" fill="${labelFg}">${labelText}</text>
      <path d="M64 161h32" stroke="${labelFg}" stroke-opacity=".4" stroke-width=".6"/>
      <text x="80" y="171.5" text-anchor="middle" font-family="Tajawal, Arial, sans-serif" font-size="3.2" letter-spacing="1.1" fill="${labelFg}" fill-opacity=".78">EAU DE PARFUM</text>
    </g>

    ${capMarkup}
    <ellipse cx="80" cy="20" rx="22" ry="3" fill="#fff" fill-opacity=".18"/>
  </svg>`;
}

/* --- مشهد الهيرو: قاعدة رخامية + وردة + زجاجة --- */
function petalPath(x, y, rotate, scale, uid) {
  return `<path d="M0 0C14-11 36-9 46 3 34 15 12 13 0 4Z" transform="translate(${x} ${y}) rotate(${rotate}) scale(${scale})" fill="url(#${uid}rosePetals)" stroke="#420610" stroke-width=".55"/>`;
}

function heroSceneSVG(glass, glassDeep) {
  const uid = 'scene' + (++svgUid);
  const light = glass || '#e8a24a';
  const deep = glassDeep || '#7a3d10';

  let roseOuter = '';
  let roseMid = '';
  let roseInner = '';
  for (let i = 0; i < 9; i += 1) {
    roseOuter += `<ellipse cx="0" cy="0" rx="47" ry="30" transform="rotate(${i * 40}) translate(9 0)" fill="url(#${uid}roseA)" stroke="#480611" stroke-width=".65"/>`;
  }
  for (let i = 0; i < 6; i += 1) {
    roseMid += `<ellipse cx="0" cy="0" rx="31" ry="21" transform="rotate(${i * 60 + 22}) translate(6 0)" fill="url(#${uid}roseB)" stroke="#4d0712" stroke-width=".55"/>`;
  }
  for (let i = 0; i < 5; i += 1) {
    roseInner += `<ellipse cx="0" cy="0" rx="17" ry="12" transform="rotate(${i * 72 + 15}) translate(3 0)" fill="url(#${uid}roseC)" stroke="#5b0915" stroke-width=".5"/>`;
  }

  return `
  <svg viewBox="0 0 620 560" xmlns="http://www.w3.org/2000/svg" role="presentation" focusable="false" aria-hidden="true">
    <defs>
      <radialGradient id="${uid}halo" cx=".5" cy=".5" r=".5">
        <stop offset="0" stop-color="#8a53c0" stop-opacity=".34"/>
        <stop offset=".55" stop-color="#6a3b96" stop-opacity=".14"/>
        <stop offset="1" stop-color="#6a3b96" stop-opacity="0"/>
      </radialGradient>
      <linearGradient id="${uid}gold" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#f6e3b0"/>
        <stop offset=".5" stop-color="#d9b66b"/>
        <stop offset="1" stop-color="#a9803d"/>
      </linearGradient>
      <linearGradient id="${uid}glass" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="${deep}"/>
        <stop offset=".2" stop-color="${light}"/>
        <stop offset=".42" stop-color="${light}"/>
        <stop offset=".72" stop-color="${deep}"/>
        <stop offset="1" stop-color="#160b04"/>
      </linearGradient>
      <linearGradient id="${uid}liquid" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${light}" stop-opacity=".7"/>
        <stop offset="1" stop-color="${deep}" stop-opacity=".98"/>
      </linearGradient>
      <linearGradient id="${uid}cap" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#8a682a"/>
        <stop offset=".25" stop-color="#f6e3b0"/>
        <stop offset=".55" stop-color="#d9b66b"/>
        <stop offset="1" stop-color="#8a682a"/>
      </linearGradient>
      <linearGradient id="${uid}marbleTop" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#2c2933"/>
        <stop offset=".45" stop-color="#16141a"/>
        <stop offset="1" stop-color="#09080b"/>
      </linearGradient>
      <linearGradient id="${uid}marbleFront" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#1d1b22"/>
        <stop offset="1" stop-color="#070609"/>
      </linearGradient>
      <linearGradient id="${uid}shine" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#fff" stop-opacity=".6"/>
        <stop offset="1" stop-color="#fff" stop-opacity="0"/>
      </linearGradient>
      <radialGradient id="${uid}roseA" cx=".35" cy=".3" r=".75">
        <stop offset="0" stop-color="#e04450"/>
        <stop offset=".55" stop-color="#a30f1e"/>
        <stop offset="1" stop-color="#570611"/>
      </radialGradient>
      <radialGradient id="${uid}roseB" cx=".4" cy=".35" r=".7">
        <stop offset="0" stop-color="#ef5a61"/>
        <stop offset=".6" stop-color="#bf1626"/>
        <stop offset="1" stop-color="#6b0714"/>
      </radialGradient>
      <radialGradient id="${uid}roseC" cx=".45" cy=".4" r=".65">
        <stop offset="0" stop-color="#f6777a"/>
        <stop offset=".6" stop-color="#cd2433"/>
        <stop offset="1" stop-color="#740a17"/>
      </radialGradient>
      <radialGradient id="${uid}rosePetals" cx=".3" cy=".25" r=".8">
        <stop offset="0" stop-color="#d63a47"/>
        <stop offset=".65" stop-color="#9d0d1c"/>
        <stop offset="1" stop-color="#4e0510"/>
      </radialGradient>
      <linearGradient id="${uid}leaf" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#2f422e"/>
        <stop offset="1" stop-color="#101a10"/>
      </linearGradient>
      <clipPath id="${uid}topClip"><ellipse cx="310" cy="449" rx="195" ry="34"/></clipPath>
      <filter id="${uid}soft" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="13"/>
      </filter>
      <filter id="${uid}softSm" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="5"/>
      </filter>
      <clipPath id="${uid}bottleClip">
        <path d="M242 446L242 248Q242 234 254 224L284 200Q293 193 293 182L293 166L327 166L327 182Q327 193 336 200L366 224Q378 234 378 248L378 446Q378 454 369 454L251 454Q242 454 242 446Z"/>
      </clipPath>
    </defs>

    <ellipse cx="310" cy="250" rx="240" ry="245" fill="url(#${uid}halo)"/>
    <ellipse cx="310" cy="518" rx="248" ry="24" fill="#000" fill-opacity=".62" filter="url(#${uid}soft)"/>

    <!-- القاعدة الرخامية -->
    <path d="M115 449V468C115 496 202 518 310 518C418 518 505 496 505 468V449C505 477 418 498 310 498C202 498 115 477 115 449Z" fill="url(#${uid}marbleFront)"/>
    <ellipse cx="310" cy="449" rx="195" ry="34" fill="url(#${uid}marbleTop)" stroke="#d9b66b" stroke-opacity=".20" stroke-width=".9"/>
    <g clip-path="url(#${uid}topClip)" opacity=".5">
      <path d="M130 448c42-17 70 8 108-2s54-22 92-11 64 15 103 1" fill="none" stroke="url(#${uid}gold)" stroke-width=".9"/>
      <path d="M152 460c35-14 66 4 98-3s58-17 93-9 43 11 77 0" fill="none" stroke="url(#${uid}gold)" stroke-width=".5" opacity=".75"/>
      <path d="M214 434c27 9 50 22 84 19s56-16 90-7" fill="none" stroke="#fff" stroke-opacity=".22" stroke-width=".5"/>
    </g>
    <path d="M142 479c52 15 95 22 168 22 74 0 117-8 168-22" fill="none" stroke="#d9b66b" stroke-opacity=".18" stroke-width=".8"/>
    <path d="M210 505c30 6 63 9 100 9 38 0 71-3 101-9" fill="none" stroke="#d9b66b" stroke-opacity=".12" stroke-width=".7"/>
    <ellipse cx="310" cy="449" rx="195" ry="34" fill="none" stroke="#f2dba0" stroke-opacity=".16" stroke-width=".7"/>

    <!-- الوردة والساق -->
    <path d="M455 430C438 462 413 482 386 498" fill="none" stroke="#22301f" stroke-width="3.4" stroke-linecap="round"/>
    <path d="M435 447C411 438 392 445 381 462 405 469 424 463 435 447Z" fill="url(#${uid}leaf)" stroke="#0a120a" stroke-width=".7"/>
    <path d="M420 475C400 466 379 474 370 490 393 497 412 491 420 475Z" fill="url(#${uid}leaf)" stroke="#0a120a" stroke-width=".7" opacity=".9"/>
    <g transform="translate(462 401)">
      <ellipse cx="0" cy="3" rx="52" ry="44" fill="#4a0610" opacity=".7"/>
      ${roseOuter}
      ${roseMid}
      ${roseInner}
      <path d="M-3 3C-11-7 1-15 9-7 17 1 8 13-2 10-10 8-9-1-2-3" fill="none" stroke="#7d0b19" stroke-width="2.4" stroke-linecap="round"/>
      <ellipse cx="-13" cy="-15" rx="9" ry="5" fill="#f47b80" opacity=".22" transform="rotate(-32 -13 -15)"/>
    </g>

    <!-- الزجاجة -->
    <ellipse cx="310" cy="452" rx="72" ry="9" fill="#000" fill-opacity=".55" filter="url(#${uid}softSm)"/>
    <path d="M242 446L242 248Q242 234 254 224L284 200Q293 193 293 182L293 166L327 166L327 182Q327 193 336 200L366 224Q378 234 378 248L378 446Q378 454 369 454L251 454Q242 454 242 446Z" fill="url(#${uid}glass)" stroke="#fff" stroke-opacity=".34" stroke-width="1.3"/>
    <g clip-path="url(#${uid}bottleClip)">
      <path d="M232 300Q310 283 388 300V460H232Z" fill="url(#${uid}liquid)" opacity=".72"/>
      <path d="M232 300Q310 283 388 300" fill="none" stroke="#fff" stroke-opacity=".25" stroke-width="1.1"/>
      <rect x="254" y="230" width="15" height="192" rx="7" fill="url(#${uid}shine)" opacity=".72"/>
      <rect x="363" y="250" width="7" height="160" rx="3.5" fill="#fff" opacity=".10"/>
      <path d="M330 240v180M345 260v130" stroke="#fff" stroke-opacity=".08" stroke-width="1"/>
    </g>

    <!-- الكاب الذهبي والرقبة -->
    <rect x="295" y="160" width="30" height="44" fill="${deep}" opacity=".85"/>
    <rect x="289" y="162" width="42" height="10" rx="2" fill="url(#${uid}cap)"/>
    <rect x="284" y="112" width="52" height="52" rx="4" fill="url(#${uid}cap)" stroke="#7a5a20" stroke-width=".7"/>
    <ellipse cx="310" cy="112" rx="26" ry="5" fill="url(#${uid}cap)" stroke="#7a5a20" stroke-width=".6"/>
    <path d="M294 120v37M302 118v40M318 118v40M326 120v37" stroke="#6b4e1c" stroke-opacity=".38" stroke-width="1"/>
    <rect x="284" y="112" width="52" height="4" rx="2" fill="#fff" fill-opacity=".30"/>

    <!-- الملصق الأسود -->
    <g>
      <rect x="258" y="286" width="104" height="94" rx="4" fill="#0a0807" stroke="#d9b66b" stroke-opacity=".55" stroke-width=".9"/>
      <rect x="264" y="292" width="92" height="82" rx="2" fill="none" stroke="#d9b66b" stroke-opacity=".20" stroke-width=".6"/>
      <g transform="translate(310 306) scale(.30) translate(-40 -25)" fill="none" stroke="url(#${uid}gold)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
        ${LOTUS_PATHS}
      </g>
      <text x="310" y="343" text-anchor="middle" font-family="Cormorant Garamond, Georgia, serif" font-weight="500" font-size="16" letter-spacing="4.5" fill="#f2dba0">PERFUME</text>
      <path d="M282 351h56" stroke="#d9b66b" stroke-opacity=".45" stroke-width=".7"/>
      <text x="310" y="364" text-anchor="middle" font-family="Tajawal, Arial, sans-serif" font-size="5" letter-spacing="2.4" fill="#d9b66b" fill-opacity=".8">EAU DE PARFUM</text>
    </g>

    <!-- معانٍ ولمعات -->
    <ellipse cx="288" cy="246" rx="9" ry="23" fill="#fff" opacity=".08" transform="rotate(16 288 246)"/>

    <!-- أوراق ورد متناثرة -->
    ${petalPath(196, 440, -18, .72, uid)}
    ${petalPath(236, 462, 12, .62, uid)}
    ${petalPath(382, 458, -8, .68, uid)}
    ${petalPath(474, 470, 24, .74, uid)}
    ${petalPath(170, 502, 18, .8, uid)}
    ${petalPath(452, 506, -14, .7, uid)}
    ${petalPath(520, 492, 35, .55, uid)}
    ${petalPath(120, 482, -28, .5, uid)}

    <circle cx="176" cy="212" r="1.6" fill="#f2dba0" opacity=".55"/>
    <circle cx="492" cy="180" r="2" fill="#f2dba0" opacity=".4"/>
    <circle cx="530" cy="322" r="1.4" fill="#f2dba0" opacity=".5"/>
    <circle cx="110" cy="338" r="1.8" fill="#f2dba0" opacity=".35"/>
  </svg>`;
}

/* --- لوحة «من نحن» الرخامية --- */
function renderAboutArt() {
  const target = $('#aboutArt');
  if (!target) return;
  const bottle = bottleSVG({
    glass: ['#e0a253', '#6d3a10'],
    cap: ['#f2dba0', '#8a6a2a'],
    shape: 'facet',
    label: 'PERFUME',
    labelBg: '#0a0806',
    name: 'زجاجة عطر فاخرة على قاعدة رخامية'
  });
  target.innerHTML = `
    <div class="art-glow"></div>
    <svg class="art-veins" viewBox="0 0 600 500" preserveAspectRatio="none" aria-hidden="true">
      <path d="M-20 120C90 90 150 160 240 130S420 60 620 110" fill="none" stroke="#d9b66b" stroke-opacity=".22" stroke-width=".8"/>
      <path d="M-10 320C120 280 190 350 300 320S500 250 620 300" fill="none" stroke="#d9b66b" stroke-opacity=".15" stroke-width=".6"/>
      <path d="M80 480C170 410 240 470 330 430S480 380 590 440" fill="none" stroke="#fff" stroke-opacity=".08" stroke-width=".7"/>
      <path d="M420 20C380 120 470 180 430 280S360 410 410 510" fill="none" stroke="#d9b66b" stroke-opacity=".12" stroke-width=".6"/>
    </svg>
    <svg class="art-lotus" viewBox="0 0 80 50" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      ${LOTUS_PATHS}
    </svg>
    <div class="art-pedestal" aria-hidden="true"></div>
    <div class="art-bottle">${bottle}</div>
    <div class="art-seal" aria-hidden="true"><strong>EST.</strong><span>1998</span></div>
  `;
}

/* =========================================================
   04. Data
   ========================================================= */
const PRODUCTS = [
  {
    id: 'armani', name: 'جورجيو أرماني', type: 'عطر فاخر للرجال', cat: 'men', price: 109.99,
    tone: 't-red', badge: 'الأكثر مبيعاً', rating: '4.9', newRank: 4,
    desc: 'حضور قوي يبدأ بلمسة حمضية مشرقة ويستقر في دفء الأخشاب والعنبر. عطر يليق بالرجل الذي لا يشرح نفسه، بل يُترك أثره.',
    notes: { top: ['برغموت', 'ليمون', 'فلفل وردي'], heart: ['لافندر', 'ياسمين', 'إيلنغ إيلنغ'], base: ['عنبر', 'خشب الصندل', 'مسك'] },
    bottle: { shape: 'rect', glass: ['#e5444d', '#6c0a14'], cap: ['#f2dba0', '#8a6a2a'], label: 'ARMANI', labelBg: '#120a0b' }
  },
  {
    id: 'aventus', name: 'كنيد أفنتوس', type: 'عطر رجالي مميز', cat: 'men', price: 129.99,
    tone: 't-gold', badge: 'أيقونة', rating: '5.0', newRank: 8,
    desc: 'أسطورة عطرية تجمع نضارة الأناناس مع دخانية البتولا والمسك. عطر للمناسبات التي تستحق أن تُذكر.',
    notes: { top: ['أناناس', 'تفاح', 'برغموت'], heart: ['بتولا', 'ياسمين', 'باتشولي'], base: ['مسك', 'عنبر', 'فانيليا'] },
    bottle: { shape: 'crown', glass: ['#e0a53c', '#6e4a14'], cap: ['#f2dba0', '#8a6a2a'], label: 'CREED', labelBg: '#2a1e0c' }
  },
  {
    id: 'monparis', name: 'مون باريس', type: 'عطر نسائي ساحر', cat: 'women', price: 89.99,
    tone: 't-pink', badge: 'جديد', rating: '4.8', newRank: 14,
    desc: 'رومانسية باريسية في زجاجة: توت العليق البري يعانق البيوني والفانيليا، ليمنحك حضوراً أنثوياً لا يُنسى.',
    notes: { top: ['توت العليق', 'فراولة', 'برغموت'], heart: ['بيوني', 'ياسمين', 'ورد'], base: ['مسك أبيض', 'فانيليا', 'باتشولي'] },
    bottle: { shape: 'facet', glass: ['#f4a9c4', '#b8628a'], cap: ['#ffe3ef', '#d9a0bc'], label: 'YSL', labelBg: '#1a0d14' }
  },
  {
    id: 'bleu', name: 'بلو دي شانيل', type: 'عطر رجالي فاخر', cat: 'men', price: 99.99,
    tone: 't-blue', badge: 'حصري', rating: '4.9', newRank: 11,
    desc: 'أناقة هادئة وقوة حضور. عطر خشبي عبق يفتح على الحمضيات وينتهي بعمق الصندل والمسك.',
    notes: { top: ['جريب فروت', 'ليمون', 'نعناع'], heart: ['زنجبيل', 'ياسمين', 'جوزة الطيب'], base: ['صندل', 'أرز', 'مسك'] },
    bottle: { shape: 'rect', glass: ['#1a1c28', '#050507'], cap: ['#c9ccd6', '#5c5f6a'], label: 'BLEU', labelBg: '#08090c', labelFg: '#e8e8e8' }
  },
  {
    id: 'lavie', name: 'لانكوم لا في إست بيل', type: 'عطر نسائي أيقوني', cat: 'women', price: 119.99,
    tone: 't-rose', badge: 'الأكثر أنوثة', rating: '4.9', newRank: 9,
    desc: 'احتفال بالحياة والأنوثة: زهر البرتقال والياسمين يرقصان مع فانيليا دافئة، لتوقيع عطري مشرق.',
    notes: { top: ['زهر البرتقال', 'كمثرى', 'توت أسود'], heart: ['ياسمين', 'إيلنغ إيلنغ', 'بيوني'], base: ['فانيليا', 'مسك', 'باتشولي'] },
    bottle: { shape: 'facet', glass: ['#e995a6', '#8f3b55'], cap: ['#f2dba0', '#8a6a2a'], label: 'LANCOME', labelBg: '#1b0d11' }
  },
  {
    id: 'oudwood', name: 'توم فورد أوود وود', type: 'عطر للجنسين دافئ', cat: 'unisex', price: 149.99,
    tone: 't-amber', badge: 'فخامة شرقية', rating: '4.9', newRank: 12,
    desc: 'عود نادر يتشابك مع خشب الصندل والتوابل، ليصنع حضوراً غامضاً يملأ المكان ويبقى في الذاكرة.',
    notes: { top: ['توابل', 'برغموت', 'زعفران'], heart: ['خشب الصندل', 'عود', 'ورد'], base: ['عنبر', 'مسك', 'فانيليا'] },
    bottle: { shape: 'rect', glass: ['#c98a45', '#5d3110'], cap: ['#3a2a1a', '#110d08'], label: 'TOM FORD', labelBg: '#0b0906' }
  },
  {
    id: 'libre', name: 'إيف سان لوران ليبر', type: 'عطر نسائي جسور', cat: 'women', price: 139.99,
    tone: 't-violet', badge: 'إصدار محدود', rating: '4.7', newRank: 13,
    desc: 'توليفة جسورة بين لافندر شرقي وزهر البرتقال، تتحول إلى أنوثة حرة لا تطلب الإذن.',
    notes: { top: ['لافندر', 'ماندرين', 'برغموت'], heart: ['زهر البرتقال', 'ياسمين', 'ورد'], base: ['فانيليا', 'مسك', 'أرز'] },
    bottle: { shape: 'rect', glass: ['#7d5bb8', '#3a1f68'], cap: ['#f2dba0', '#8a6a2a'], label: 'YSL', labelBg: '#140e1f' }
  },
  {
    id: 'sauvage', name: 'ديور سوفاج', type: 'عطر رجالي عصري', cat: 'men', price: 124.99,
    tone: 't-sapphire', badge: 'الأكثر رجولة', rating: '4.9', newRank: 10,
    desc: 'نضارة صحراوية واسعة: برغموت كاليدونيا يعانق الفلفل ثم يستقر على العنبر الرمادي. عطر الحرية والحضور.',
    notes: { top: ['برغموت', 'فلفل', 'ليمون'], heart: ['لافندر', 'فلفل سيشوان', 'زعتر'], base: ['عنبر رمادي', 'مسك', 'خشب الأرز'] },
    bottle: { shape: 'rect', glass: ['#2b5fa8', '#0a1c3d'], cap: ['#c9ccd6', '#5c5f6a'], label: 'SAUVAGE', labelBg: '#080c14', labelFg: '#e8eef8' }
  },
  {
    id: 'porsche', name: 'بورش ديزاين', type: 'عطر للجنسين جليدي', cat: 'unisex', price: 159.99,
    tone: 't-graphite', badge: 'نادر', rating: '4.6', newRank: 7,
    desc: 'هندسة عطرية دقيقة: نفحات معدنية باردة تذوب في خشب الأرز والمسك. عطر لمن يفضّل التميّز بصمت.',
    notes: { top: ['ليمون', 'نعناع', 'فلفل'], heart: ['أرز', 'باتشولي', 'لافندر'], base: ['مسك', 'عنبر', 'خشب'] },
    bottle: { shape: 'facet', glass: ['#9aa0ad', '#3b3f49'], cap: ['#2f3138', '#0e0f12'], label: 'PORSCHE', labelBg: '#101114', labelFg: '#e6e8ee' }
  },
  {
    id: 'narciso', name: 'نارسيسو رودريغيز', type: 'عطر نسائي أنثوي', cat: 'women', price: 104.99,
    tone: 't-blush', badge: 'دافئ', rating: '4.8', newRank: 6,
    desc: 'أنوثة ناعمة تُحتضن بالمسك والزهور البيضاء. عطر يشبه بشرة ثانية، هادئ وأصيل.',
    notes: { top: ['زهر البرتقال', 'بيوني', 'كمثرى'], heart: ['مسك', 'ورد', 'ياسمين'], base: ['صندل', 'فانيليا', 'عنبر'] },
    bottle: { shape: 'rect', glass: ['#f3c4bc', '#b77d78'], cap: ['#f7e6d8', '#c9a68f'], label: 'NARCISO', labelBg: '#1a1112' }
  },
  {
    id: 'aqua', name: 'أكوا دي جيو', type: 'عطر للجنسين منعش', cat: 'unisex', price: 114.99,
    tone: 't-teal', badge: 'صيفي', rating: '4.7', newRank: 5,
    desc: 'نسيم البحر ولون السماء: حمضيات مشرقة تلتقي بالملاحظات المائية والمسك، ليمنحك انتعاشاً راقياً.',
    notes: { top: ['جريب فروت', 'ليمون', 'نعناع'], heart: ['إكليل الجبل', 'ياسمين مائي', 'خيار'], base: ['مسك أبيض', 'خشب', 'عنبر'] },
    bottle: { shape: 'rect', glass: ['#6fcfc9', '#1c6f70'], cap: ['#cfd6dd', '#6e7a84'], label: 'ACQUA', labelBg: '#071415' }
  },
  {
    id: 'jockeys', name: 'جوكي إسنس', type: 'عطر للجنسين غامض', cat: 'unisex', price: 98.99,
    tone: 't-plum', badge: 'ليلي', rating: '4.6', newRank: 3,
    desc: 'توابل شرقية وورود داكنة في تركيبة غامضة، تفتح على الفلفل وتغلق على دفء العود والمسك.',
    notes: { top: ['فلفل', 'كافور', 'برغموت'], heart: ['ورد', 'ياسمين', 'قرفة'], base: ['عود', 'مسك', 'عنبر'] },
    bottle: { shape: 'facet', glass: ['#7d3f7a', '#3a123c'], cap: ['#f2dba0', '#8a6a2a'], label: 'ESSENCE', labelBg: '#130a14' }
  },
  {
    id: 'code', name: 'أرماني كود', type: 'عطر رجالي ليلي', cat: 'men', price: 134.99,
    tone: 't-noir', badge: 'سهرات', rating: '4.8', newRank: 2,
    desc: 'عطر السهرات بامتياز: لافندر وتوابل دافئة تعانق خشب الصندل والعنبر، لحضور لا يمر مرور الكرام.',
    notes: { top: ['برغموت', 'ليمون', 'لافندر'], heart: ['نجيل الهند', 'ياسمين', 'فلفل'], base: ['عنبر', 'خشب الصندل', 'مسك'] },
    bottle: { shape: 'rect', glass: ['#3a3a48', '#0c0c11'], cap: ['#c9ccd6', '#5c5f6a'], label: 'CODE', labelBg: '#08080b', labelFg: '#e8e8e8' }
  },
  {
    id: 'valentino', name: 'فالنتينو بورن إن روما', type: 'عطر نسائي رومانسي', cat: 'women', price: 127.99,
    tone: 't-copper', badge: 'رومانسي', rating: '4.7', newRank: 1,
    desc: 'روما في لحظة غروب: أزهار بيضاء وفواكه ناضجة على قاعدة من العنبر والمسك. أناقة إيطالية بلمسة معاصرة.',
    notes: { top: ['توت العليق', 'برغموت', 'كمثرى'], heart: ['ياسمين', 'بيوني', 'زنبق'], base: ['عنبر', 'مسك', 'خشب الصندل'] },
    bottle: { shape: 'crown', glass: ['#d08a63', '#7a3b24'], cap: ['#f2dba0', '#8a6a2a'], label: 'VALENTINO', labelBg: '#1a0e0a' }
  }
];

const HERO_SLIDES = [
  {
    kicker: 'عطور فاخرة .. بإحساس يدوم',
    title: 'اكتشف عالم',
    gold: 'العطور',
    sub: 'مزيج مثالي من الأناقة والجاذبية',
    glass: ['#e8a24a', '#7a3d10']
  },
  {
    kicker: 'إصدارات حصرية لهذا الموسم',
    title: 'ارتقِ بحضورك',
    gold: 'بأرقى العطور',
    sub: 'روائح شرقية وغربية تُخلّد أثرك',
    glass: ['#b23a4a', '#521019']
  },
  {
    kicker: 'هدية الأناقة .. لِمن تحب',
    title: 'لحظات لا تُنسى',
    gold: 'بعبق فاخر',
    sub: 'اختر هديتك من تشكيلتنا المحدودة',
    glass: ['#5d7fb8', '#1a2a4d']
  }
];

const REVIEWS = [
  { name: 'نورة العتيبي', city: 'الرياض', quote: 'من أول رشّة عرفت أنه عطري. التغليف وصل كأنه هدية من متحف، والرائحة تدوم أكثر من عشر ساعات. تجربة تستحق كل ريال.' },
  { name: 'عبدالله الحربي', city: 'جدة', quote: 'تعامل راقٍ من الفريق، وسرعة في الشحن. طلبت أفنتوس ووصل قبل الموعد بيومين. العطر أصلي وأكثر من رائع.' },
  { name: 'ريم القحطاني', city: 'الدمام', quote: 'مون باريس صار توقيعي اليومي. كل من يقابلني يسألني عنه! خدمة العملاء ساعدتني في الاختيار بذوق واحترافية.' },
  { name: 'فيصل الشمري', city: 'الكويت', quote: 'جربت متاجر كثيرة، لكن مستوى الفخامة هنا مختلف. الزجاجة والتغليف والرسالة اليدوية… كل تفصيل محسوب.' },
  { name: 'لمى السالم', city: 'دبي', quote: 'أهديت والدتي عطر توم فورد، وكانت سعيدة لدرجة لا تُوصف. تجربة شراء سلسة وتغليف إهداء في غاية الأناقة.' },
  { name: 'محمد العامري', city: 'الدوحة', quote: 'العطور أصلية ومختارة بعناية. أحب أنهم يقدمون وصف النفحات بدقة، فتختار بثقة دون تجربة.' },
  { name: 'سارة الزهراني', city: 'مكة', quote: 'وصلت الحقيبة في نفس اليوم! والرائحة تبقى على الثوب أياماً. صرت لا أشتري عطوري إلا من هنا.' },
  { name: 'خالد المطيري', city: 'المنامة', quote: 'خدمة الاستشارة العطرية كانت مفيدة جداً. اقترحوا لي عطراً لم أكن سأختاره بنفسي، والنتيجة كانت مذهلة.' }
];

/* =========================================================
   05. State & rendering
   ========================================================= */
const state = {
  filter: 'all',
  sort: 'newest',
  favs: [],
  cart: [],
  qvProduct: null,
  qvSize: 50,
  qvQty: 1
};

// استرجاع آمن مع التحقق من البيانات
(function restoreState() {
  const favs = storage.get('perfume_favs', []);
  if (Array.isArray(favs)) state.favs = favs.filter((id) => PRODUCTS.some((p) => p.id === id));

  const cart = storage.get('perfume_cart', []);
  if (Array.isArray(cart)) {
    state.cart = cart
      .filter((item) => item && PRODUCTS.some((p) => p.id === item.id) && (item.size === 50 || item.size === 100))
      .map((item) => ({
        id: item.id,
        size: item.size === 100 ? 100 : 50,
        qty: Math.min(9, Math.max(1, Number(item.qty) || 1))
      }));
  }
})();

const productById = (id) => PRODUCTS.find((product) => product.id === id);
const isFavourite = (id) => state.favs.includes(id);
const cartKey = (id, size) => `${id}|${size}`;

function favButton(product, extraClass = '') {
  const active = isFavourite(product.id);
  return `<button class="fav-btn ${extraClass}" type="button" data-fav="${product.id}" aria-pressed="${active}" aria-label="${active ? `إزالة ${product.name} من المفضلة` : `إضافة ${product.name} إلى المفضلة`}">${ICONS.heart}</button>`;
}

function renderFeatured() {
  const grid = $('#featuredGrid');
  if (!grid) return;
  grid.innerHTML = PRODUCTS.slice(0, 4).map((product) => `
    <article class="featured-card tone-surface ${product.tone}">
      <div class="featured-info">
        <span class="featured-badge">${product.badge}</span>
        <h3>${product.name}</h3>
        <p class="card-type">${product.type}</p>
        <p class="price">${formatPrice(product.price)}</p>
        <button class="btn btn-gold card-add" type="button" data-add="${product.id}" data-default-label="أضف إلى السلة">
          ${ICONS.cart}<span>أضف إلى السلة</span>
        </button>
      </div>
      <button class="featured-visual" type="button" data-open="${product.id}" aria-label="عرض سريع: ${product.name}">
        <span class="bottle-wrap">${bottleSVG(product.bottle)}</span>
      </button>
      ${favButton(product)}
    </article>
  `).join('');
}

function getVisibleProducts() {
  let list = PRODUCTS.filter((product) => state.filter === 'all' || product.cat === state.filter);

  if (state.sort === 'price-asc') list = list.slice().sort((a, b) => a.price - b.price);
  else if (state.sort === 'price-desc') list = list.slice().sort((a, b) => b.price - a.price);
  else list = list.slice().sort((a, b) => b.newRank - a.newRank);

  return list;
}

function renderCatalog() {
  const grid = $('#productGrid');
  const empty = $('#catalogEmpty');
  const count = $('#resultsCount');
  if (!grid) return;

  const list = getVisibleProducts();

  grid.innerHTML = list.map((product) => `
    <article class="product-card">
      <button class="product-media tone-surface ${product.tone}" type="button" data-open="${product.id}" aria-label="عرض سريع: ${product.name}">
        <span class="product-badge">${product.badge}</span>
        <span class="bottle-wrap">${bottleSVG(product.bottle)}</span>
        <span class="quick-hint">${ICONS.eye} عرض سريع</span>
      </button>
      ${favButton(product)}
      <div class="product-info">
        <h3>${product.name}</h3>
        <p class="card-type">${product.type}</p>
        <p class="product-note-line">${product.notes.top.join(' · ')}</p>
        <div class="product-buy">
          <p class="price">${formatPrice(product.price)}</p>
          <button class="catalog-add" type="button" data-add="${product.id}" data-default-label="أضف" aria-label="أضف ${product.name} إلى الحقيبة">
            ${ICONS.cart}<span>أضف</span>
          </button>
        </div>
      </div>
    </article>
  `).join('');

  if (empty) empty.hidden = list.length !== 0;
  if (count) {
    const catLabel = { all: 'الكل', men: 'رجالي', women: 'نسائي', unisex: 'للجنسين' }[state.filter];
    const perfumeWord = arabicCount(list.length, ['عطر واحد', 'عطرين', 'عطور', 'عطراً']);
    count.textContent = list.length
      ? `عرض ${perfumeWord}${state.filter !== 'all' ? ` — ${catLabel}` : ''}`
      : 'لا توجد نتائج مطابقة';
  }
}

/* الفلاتر والترتيب */
function setupCatalogControls() {
  const chips = $('#filterChips');
  if (chips) {
    chips.addEventListener('click', (event) => {
      const chip = event.target.closest('[data-filter]');
      if (!chip) return;
      state.filter = chip.dataset.filter;
      $$('.chip', chips).forEach((button) => {
        const active = button === chip;
        button.classList.toggle('is-active', active);
        button.setAttribute('aria-pressed', String(active));
      });
      renderCatalog();
    });
  }

  const sort = $('#sortSelect');
  if (sort) {
    sort.addEventListener('change', () => {
      state.sort = sort.value;
      renderCatalog();
    });
  }
}

/* =========================================================
   06. Favourites
   ========================================================= */
function syncFavouriteButtons() {
  $$('[data-fav]').forEach((button) => {
    const id = button.dataset.fav;
    const product = productById(id);
    const active = isFavourite(id);
    button.setAttribute('aria-pressed', String(active));
    button.setAttribute('aria-label', active
      ? `إزالة ${product ? product.name : 'العطر'} من المفضلة`
      : `إضافة ${product ? product.name : 'العطر'} إلى المفضلة`);
  });

  const qvHeart = $('.qv-heart');
  if (qvHeart) {
    const product = state.qvProduct;
    if (product) {
      const active = isFavourite(product.id);
      qvHeart.setAttribute('aria-pressed', String(active));
      qvHeart.setAttribute('aria-label', active ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة');
    }
  }
}

function toggleFavourite(id) {
  const product = productById(id);
  if (!product) return;
  if (isFavourite(id)) {
    state.favs = state.favs.filter((fav) => fav !== id);
    showToast('أُزيل من المفضلة');
  } else {
    state.favs.push(id);
    showToast('أُضيف إلى المفضلة ♥');
  }
  storage.set('perfume_favs', state.favs);
  syncFavouriteButtons();
}

/* =========================================================
   07. Cart
   ========================================================= */
const cartBadge = () => $('#cartBadge');

function cartQuantity() {
  return state.cart.reduce((total, item) => total + item.qty, 0);
}

function cartSubtotal() {
  return state.cart.reduce((total, item) => {
    const product = productById(item.id);
    return product ? total + priceFor(product, item.size) * item.qty : total;
  }, 0);
}

function persistCart() {
  storage.set('perfume_cart', state.cart);
}

function pulseBadge() {
  const badge = cartBadge();
  if (!badge) return;
  badge.classList.remove('pulse');
  // إعادة تشغيل الحركة
  void badge.offsetWidth;
  badge.classList.add('pulse');
  window.setTimeout(() => badge.classList.remove('pulse'), 500);
}

function addToCart(id, size = 50, qty = 1) {
  const product = productById(id);
  if (!product) return;
  const safeSize = size === 100 ? 100 : 50;
  const existing = state.cart.find((item) => item.id === id && item.size === safeSize);
  if (existing) existing.qty = Math.min(9, existing.qty + qty);
  else state.cart.push({ id, size: safeSize, qty: Math.min(9, Math.max(1, qty)) });

  persistCart();
  renderCart();
  pulseBadge();
}

function changeCartQty(key, delta) {
  const item = state.cart.find((entry) => cartKey(entry.id, entry.size) === key);
  if (!item) return;
  item.qty = Math.min(9, item.qty + delta);
  if (item.qty <= 0) state.cart = state.cart.filter((entry) => entry !== item);
  persistCart();
  renderCart(true, key, delta > 0 ? 'inc' : 'dec');
  pulseBadge();
}

function removeCartItem(key) {
  state.cart = state.cart.filter((entry) => cartKey(entry.id, entry.size) !== key);
  persistCart();
  renderCart();
  showToast('أُزيل العطر من الحقيبة');
}

function renderCart(focusAfter = false, focusKey = '', focusAction = '') {
  const itemsBox = $('#cartItems');
  const emptyBox = $('#cartEmpty');
  const footer = $('#cartFooter');
  const subtotal = $('#cartSubtotal');
  if (!itemsBox || !emptyBox || !footer) return;

  const totalQty = cartQuantity();
  const badge = cartBadge();
  if (badge) {
    badge.textContent = String(totalQty);
    badge.classList.toggle('is-empty', totalQty === 0);
  }
  const cartOpenBtn = $('#cartOpen');
  if (cartOpenBtn) {
    const pieces = arabicCount(totalQty, ['قطعة واحدة', 'قطعتان', 'قطع', 'قطعة']);
    cartOpenBtn.setAttribute('aria-label', `فتح حقيبة التسوق — ${pieces}`);
  }

  itemsBox.innerHTML = state.cart.map((item) => {
    const product = productById(item.id);
    if (!product) return '';
    const key = cartKey(item.id, item.size);
    const lineTotal = priceFor(product, item.size) * item.qty;
    return `
      <article class="cart-item">
        <div class="cart-thumb tone-surface ${product.tone}">${bottleSVG(product.bottle)}</div>
        <div class="cart-item-info">
          <div class="cart-item-top">
            <h3>${product.name}</h3>
            <button class="cart-remove" type="button" data-remove="${key}" aria-label="إزالة ${product.name} من الحقيبة">${ICONS.trash}</button>
          </div>
          <p class="cart-meta">${item.size} مل · <span dir="ltr">${formatPrice(priceFor(product, item.size))}</span></p>
          <div class="cart-item-foot">
            <div class="qty-stepper" aria-label="كمية ${product.name}">
              <button type="button" data-cart-action="dec" data-key="${key}" aria-label="تقليل الكمية" ${item.qty <= 1 ? 'disabled' : ''}>${ICONS.minus}</button>
              <output aria-live="polite">${item.qty}</output>
              <button type="button" data-cart-action="inc" data-key="${key}" aria-label="زيادة الكمية" ${item.qty >= 9 ? 'disabled' : ''}>${ICONS.plus}</button>
            </div>
            <strong class="cart-line-total">${formatPrice(lineTotal)}</strong>
          </div>
        </div>
      </article>`;
  }).join('');

  const isEmpty = state.cart.length === 0;
  emptyBox.hidden = !isEmpty;
  footer.hidden = isEmpty;
  itemsBox.hidden = isEmpty;
  if (subtotal) subtotal.textContent = formatPrice(cartSubtotal());

  if (focusAfter) {
    const selector = `[data-cart-action="${focusAction}"][data-key="${focusKey}"]`;
    const nextFocus = itemsBox.querySelector(selector);
    if (nextFocus) nextFocus.focus({ preventScroll: true });
  }
}

function setupCart() {
  const itemsBox = $('#cartItems');
  const openBtn = $('#cartOpen');
  const checkout = $('#checkoutBtn');
  const emptyShop = $('#emptyShopBtn');

  renderCart();

  if (openBtn) {
    openBtn.addEventListener('click', () => {
      renderCart();
      openLayer(layers.cart);
    });
  }

  if (itemsBox) {
    itemsBox.addEventListener('click', (event) => {
      const action = event.target.closest('[data-cart-action]');
      if (action) {
        changeCartQty(action.dataset.key, action.dataset.cartAction === 'inc' ? 1 : -1);
        return;
      }
      const remove = event.target.closest('[data-remove]');
      if (remove) removeCartItem(remove.dataset.remove);
    });
  }

  if (checkout) {
    checkout.addEventListener('click', () => {
      if (!state.cart.length) return;
      state.cart = [];
      persistCart();
      renderCart();
      closeLayer(layers.cart, false);
      showToast('تم استلام طلبك بنجاح — سنتواصل معك قريباً');
    });
  }

  if (emptyShop) {
    emptyShop.addEventListener('click', () => {
      closeLayer(layers.cart, false);
      const target = $('#products');
      if (target) {
        window.setTimeout(() => target.scrollIntoView({ behavior: prefersReducedMotion.matches ? 'auto' : 'smooth' }), 80);
      }
    });
  }
}

/* =========================================================
   08. Quick view
   ========================================================= */
function renderQuickView() {
  const product = state.qvProduct;
  if (!product) return;
  const visual = $('#qvVisual');
  const details = $('#qvDetails');
  if (!visual || !details) return;

  visual.className = `qv-visual tone-surface ${product.tone}`;
  visual.innerHTML = `
    <span class="qv-tone-label">${product.badge}</span>
    <div class="bottle-wrap">${bottleSVG(product.bottle)}</div>`;

  const active = isFavourite(product.id);
  const currentPrice = priceFor(product, state.qvSize);

  details.innerHTML = `
    <p class="qv-type">${product.type}</p>
    <div class="qv-title-row">
      <h2 id="qvName">${product.name}</h2>
      <button class="qv-heart" type="button" data-fav="${product.id}" aria-pressed="${active}" aria-label="${active ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}">${ICONS.heart}</button>
    </div>
    <div class="qv-rating">${STAR_SCORE}<span>${product.rating} — تقييمات موثّقة</span></div>
    <p class="qv-price"><span data-qv-price>${formatPrice(currentPrice)}</span> <small data-qv-size-label>لعبوة ${state.qvSize} مل</small></p>
    <p class="qv-desc">${product.desc}</p>

    <div class="qv-notes">
      <div class="note-col"><h4>النفحات العليا</h4><p>${product.notes.top.join('، ')}</p></div>
      <div class="note-col"><h4>قلب العطر</h4><p>${product.notes.heart.join('، ')}</p></div>
      <div class="note-col"><h4>القاعدة</h4><p>${product.notes.base.join('، ')}</p></div>
    </div>

    <p class="qv-label">اختر الحجم</p>
    <div class="size-options" role="group" aria-label="حجم العطر">
      <button class="size-chip ${state.qvSize === 50 ? 'is-active' : ''}" type="button" data-size="50" aria-pressed="${state.qvSize === 50}">50 مل — ${formatPrice(priceFor(product, 50))}</button>
      <button class="size-chip ${state.qvSize === 100 ? 'is-active' : ''}" type="button" data-size="100" aria-pressed="${state.qvSize === 100}">100 مل — ${formatPrice(priceFor(product, 100))}</button>
    </div>

    <div class="qv-actions">
      <div class="qty-stepper" aria-label="الكمية">
        <button type="button" data-qv-qty="dec" aria-label="تقليل الكمية" ${state.qvQty <= 1 ? 'disabled' : ''}>${ICONS.minus}</button>
        <output data-qv-output aria-live="polite">${state.qvQty}</output>
        <button type="button" data-qv-qty="inc" aria-label="زيادة الكمية" ${state.qvQty >= 9 ? 'disabled' : ''}>${ICONS.plus}</button>
      </div>
      <button class="btn btn-gold qv-add" type="button" data-qv-add>
        ${ICONS.cart}<span>أضف إلى الحقيبة</span>
      </button>
    </div>`;
}

function openQuickView(id) {
  const product = productById(id);
  if (!product) return;
  state.qvProduct = product;
  state.qvSize = 50;
  state.qvQty = 1;
  renderQuickView();
  openLayer(layers.qv);
}

function setupQuickView() {
  const details = $('#qvDetails');
  if (!details) return;

  details.addEventListener('click', (event) => {
    const product = state.qvProduct;
    if (!product) return;

    const sizeBtn = event.target.closest('[data-size]');
    if (sizeBtn) {
      state.qvSize = Number(sizeBtn.dataset.size) === 100 ? 100 : 50;
      $$('.size-chip', details).forEach((chip) => {
        const isActive = Number(chip.dataset.size) === state.qvSize;
        chip.classList.toggle('is-active', isActive);
        chip.setAttribute('aria-pressed', String(isActive));
      });
      const priceEl = $('[data-qv-price]', details);
      const sizeLabel = $('[data-qv-size-label]', details);
      if (priceEl) priceEl.textContent = formatPrice(priceFor(product, state.qvSize));
      if (sizeLabel) sizeLabel.textContent = `لعبوة ${state.qvSize} مل`;
      return;
    }

    const qtyBtn = event.target.closest('[data-qv-qty]');
    if (qtyBtn) {
      state.qvQty = Math.min(9, Math.max(1, state.qvQty + (qtyBtn.dataset.qvQty === 'inc' ? 1 : -1)));
      const output = $('[data-qv-output]', details);
      if (output) output.textContent = String(state.qvQty);
      const dec = $('[data-qv-qty="dec"]', details);
      const inc = $('[data-qv-qty="inc"]', details);
      if (dec) dec.disabled = state.qvQty <= 1;
      if (inc) inc.disabled = state.qvQty >= 9;
      return;
    }

    const addBtn = event.target.closest('[data-qv-add]');
    if (addBtn) {
      addToCart(product.id, state.qvSize, state.qvQty);
      showToast('تمت إضافة العطر إلى حقيبتك');
      const label = addBtn.querySelector('span');
      if (label && !addBtn.classList.contains('is-added')) {
        addBtn.classList.add('is-added');
        label.textContent = 'تمت الإضافة ✓';
        window.setTimeout(() => {
          addBtn.classList.remove('is-added');
          if (label.isConnected) label.textContent = 'أضف إلى الحقيبة';
        }, 1200);
      }
    }
  });
}

/* =========================================================
   09. Layers, focus trap & search
   ========================================================= */
const layers = {
  menu: $('#menuLayer'),
  search: $('#searchLayer'),
  cart: $('#cartLayer'),
  qv: $('#qvLayer')
};

let activeLayer = null;
let focusBeforeLayer = null;

function getFocusable(container) {
  if (!container) return [];
  const selector = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
  return $$(selector, container).filter((element) => {
    if (element.closest('[inert]')) return false;
    if (element.getAttribute('aria-hidden') === 'true') return false;
    return element.getClientRects().length > 0;
  });
}

function openLayer(layer, focusTarget = null) {
  if (!layer) return;

  // نحفظ العنصر الذي فُتحت منه الطبقة حتى عند الانتقال بين طبقتين (مثل البحث ← العرض السريع)
  let restoreTarget = focusBeforeLayer;
  if (activeLayer && activeLayer !== layer) {
    const currentFocus = document.activeElement;
    closeLayer(activeLayer, false);
    if (!restoreTarget && currentFocus instanceof HTMLElement && !currentFocus.closest('[inert]')) {
      restoreTarget = currentFocus;
    }
  }
  if (!focusBeforeLayer) {
    focusBeforeLayer = restoreTarget || (document.activeElement instanceof HTMLElement ? document.activeElement : null);
  }

  activeLayer = layer;
  layer.inert = false;
  layer.removeAttribute('inert');
  layer.setAttribute('aria-hidden', 'false');
  layer.classList.add('is-open');
  document.body.classList.add('layer-open');

  if (layer === layers.menu) {
    const menuButton = $('#menuOpen');
    if (menuButton) menuButton.setAttribute('aria-expanded', 'true');
  }

  const target = focusTarget || getFocusable(layer)[0];
  if (target) {
    window.setTimeout(() => {
      if (activeLayer === layer) target.focus({ preventScroll: true });
    }, 80);
  }
}

function closeLayer(layer = activeLayer, restoreFocus = true) {
  if (!layer) return;
  layer.classList.remove('is-open');
  layer.setAttribute('aria-hidden', 'true');
  layer.inert = true;

  if (layer === layers.menu) {
    const menuButton = $('#menuOpen');
    if (menuButton) menuButton.setAttribute('aria-expanded', 'false');
  }

  if (activeLayer === layer) activeLayer = null;

  if (!activeLayer) {
    document.body.classList.remove('layer-open');
    if (restoreFocus && focusBeforeLayer instanceof HTMLElement) {
      focusBeforeLayer.focus({ preventScroll: true });
    }
    focusBeforeLayer = null;
  }
}

function setupLayers() {
  Object.values(layers).forEach((layer) => {
    if (!layer) return;
    layer.addEventListener('click', (event) => {
      if (event.target.closest('[data-close]')) closeLayer(layer);
    });
  });

  document.addEventListener('keydown', (event) => {
    if (!activeLayer) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      closeLayer(activeLayer);
      return;
    }

    if (event.key !== 'Tab') return;
    const focusable = getFocusable(activeLayer);
    if (!focusable.length) {
      event.preventDefault();
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement;

    if (event.shiftKey && (active === first || !activeLayer.contains(active))) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && (active === last || !activeLayer.contains(active))) {
      event.preventDefault();
      first.focus();
    }
  });
}

/* --- البحث المباشر --- */
const SEARCH_CATEGORY_LABELS = { men: 'رجالي', women: 'نسائي', unisex: 'للجنسين' };

function searchProducts(query) {
  const term = query.trim().toLowerCase();
  if (!term) return PRODUCTS.slice(0, 4);
  const categoryMatch = Object.entries(SEARCH_CATEGORY_LABELS).find(([, label]) => label.includes(term) || term.includes(label));
  return PRODUCTS.filter((product) => {
    const haystack = [
      product.name,
      product.type,
      product.desc,
      ...product.notes.top,
      ...product.notes.heart,
      ...product.notes.base,
      SEARCH_CATEGORY_LABELS[product.cat]
    ].join(' ').toLowerCase();
    return haystack.includes(term) || (categoryMatch && product.cat === categoryMatch[0]);
  });
}

function renderSearchResults() {
  const input = $('#searchInput');
  const box = $('#searchResults');
  const status = $('#searchStatus');
  if (!input || !box) return;

  const query = input.value;
  const results = searchProducts(query);

  box.innerHTML = results.map((product) => `
    <button class="search-result" type="button" data-open="${product.id}" aria-label="عرض ${product.name}">
      <span class="search-thumb tone-surface ${product.tone}">${bottleSVG(product.bottle)}</span>
      <span class="search-result-text">
        <strong>${product.name}</strong>
        <small>${product.type}</small>
      </span>
      <span class="price">${formatPrice(product.price)}</span>
    </button>
  `).join('');

  if (status) {
    if (!query.trim()) status.textContent = 'الأكثر رواجاً هذا الأسبوع';
    else if (results.length) {
      const resultWord = arabicCount(results.length, ['نتيجة واحدة', 'نتيجتان', 'نتائج', 'نتيجة']);
      status.textContent = `${resultWord} لـ «${query.trim()}»`;
    } else status.textContent = 'لا توجد عطور مطابقة — جرّب كلمة أخرى';
  }

  if (!results.length) {
    box.innerHTML = `<p class="search-empty">لم نجد عطراً بهذا الوصف. جرّب: عود، ياسمين، نسائي…</p>`;
  }
}

function setupSearch() {
  const openBtn = $('#searchOpen');
  const input = $('#searchInput');
  const results = $('#searchResults');
  if (openBtn) {
    openBtn.addEventListener('click', () => {
      renderSearchResults();
      openLayer(layers.search, input);
      if (input) {
        window.setTimeout(() => {
          input.focus({ preventScroll: true });
          input.select();
        }, 90);
      }
    });
  }

  if (input) {
    input.addEventListener('input', renderSearchResults);
    input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        const first = results ? results.querySelector('[data-open]') : null;
        if (first) first.click();
      } else if (event.key === 'ArrowDown' && results) {
        const first = results.querySelector('[data-open]');
        if (first) {
          event.preventDefault();
          first.focus();
        }
      }
    });
  }
}

/* --- مستمعات عامة للأزرار المولّدة --- */
function setupGlobalActions() {
  document.addEventListener('click', (event) => {
    const fav = event.target.closest('[data-fav]');
    if (fav) {
      event.preventDefault();
      toggleFavourite(fav.dataset.fav);
      return;
    }

    const openBtn = event.target.closest('[data-open]');
    if (openBtn) {
      event.preventDefault();
      // openLayer يتولّى إغلاق البحث مع الحفاظ على عنصر إعادة التركيز
      openQuickView(openBtn.dataset.open);
      return;
    }

    const addBtn = event.target.closest('[data-add]');
    if (addBtn) {
      event.preventDefault();
      addToCart(addBtn.dataset.add, 50, 1);
      showToast('تمت إضافة العطر إلى حقيبتك');
      const label = addBtn.querySelector('span');
      if (label && !addBtn.classList.contains('is-added')) {
        const original = addBtn.dataset.defaultLabel || label.textContent;
        addBtn.classList.add('is-added');
        label.textContent = 'تمت الإضافة ✓';
        window.setTimeout(() => {
          addBtn.classList.remove('is-added');
          if (label.isConnected) label.textContent = original;
        }, 1200);
      }
    }
  });

  const menuOpen = $('#menuOpen');
  if (menuOpen) menuOpen.addEventListener('click', () => openLayer(layers.menu));

  const menuLayer = layers.menu;
  if (menuLayer) {
    menuLayer.addEventListener('click', (event) => {
      const link = event.target.closest('a[href^="#"]');
      if (!link) return;
      const target = document.querySelector(link.getAttribute('href'));
      if (!target) return;
      event.preventDefault();
      const href = link.getAttribute('href');
      closeLayer(menuLayer, false);
      window.setTimeout(() => {
        target.scrollIntoView({ behavior: prefersReducedMotion.matches ? 'auto' : 'smooth' });
        try { history.replaceState(null, '', href); } catch (error) { /* تجاهل */ }
        const targetLink = $('.nav-link[data-section="' + href.slice(1) + '"]');
        if (targetLink) targetLink.focus({ preventScroll: true });
      }, 90);
    });
  }
}

/* =========================================================
   10. Hero slider
   ========================================================= */
function setupHero() {
  const section = $('.hero');
  const copy = $('#heroCopy');
  const scene = $('#heroScene');
  const dotsBox = $('#heroDots');
  const kicker = $('#heroKicker');
  const titleMain = $('#heroTitleMain');
  const titleGold = $('#heroTitleGold');
  const sub = $('#heroSub');
  if (!section || !scene || !dotsBox) return;

  let index = 0;
  let timer = null;
  let paused = false;
  let touchStartX = 0;
  let touchStartY = 0;

  dotsBox.innerHTML = HERO_SLIDES.map((slide, slideIndex) => `
    <button class="hero-dot ${slideIndex === 0 ? 'is-active' : ''}" type="button"
      data-slide="${slideIndex}" aria-label="الشريحة ${slideIndex + 1}: ${slide.gold}"
      aria-current="${slideIndex === 0 ? 'true' : 'false'}"></button>
  `).join('');

  function applySlide(slideIndex, animate) {
    index = slideIndex;
    const slide = HERO_SLIDES[slideIndex];

    if (kicker) kicker.textContent = slide.kicker;
    if (titleMain) titleMain.textContent = slide.title;
    if (titleGold) titleGold.textContent = slide.gold;
    if (sub) sub.textContent = slide.sub;
    if (scene) scene.innerHTML = heroSceneSVG(slide.glass[0], slide.glass[1]);

    if (animate && !prefersReducedMotion.matches) {
      if (copy) {
        copy.classList.remove('swap');
        void copy.offsetWidth;
        copy.classList.add('swap');
      }
      if (scene) {
        scene.classList.remove('swap');
        void scene.offsetWidth;
        scene.classList.add('swap');
      }
    }

    $$('.hero-dot', dotsBox).forEach((dot, dotIndex) => {
      const active = dotIndex === slideIndex;
      dot.classList.toggle('is-active', active);
      dot.setAttribute('aria-current', active ? 'true' : 'false');
    });
  }

  function stopAutoplay() {
    window.clearInterval(timer);
    timer = null;
  }

  function startAutoplay() {
    stopAutoplay();
    if (prefersReducedMotion.matches) return;
    timer = window.setInterval(() => {
      if (!paused && activeLayer === null) applySlide((index + 1) % HERO_SLIDES.length, true);
    }, 5000);
  }

  function goTo(slideIndex, animate = true) {
    applySlide((slideIndex + HERO_SLIDES.length) % HERO_SLIDES.length, animate);
    startAutoplay();
  }

  dotsBox.addEventListener('click', (event) => {
    const dot = event.target.closest('[data-slide]');
    if (dot) goTo(Number(dot.dataset.slide));
  });

  section.addEventListener('mouseenter', () => { paused = true; });
  section.addEventListener('mouseleave', () => { paused = false; });
  section.addEventListener('focusin', () => { paused = true; });
  section.addEventListener('focusout', (event) => {
    if (!section.contains(event.relatedTarget)) paused = false;
  });

  section.addEventListener('touchstart', (event) => {
    if (!event.touches.length) return;
    touchStartX = event.touches[0].clientX;
    touchStartY = event.touches[0].clientY;
    paused = true;
  }, { passive: true });

  section.addEventListener('touchend', (event) => {
    if (!event.changedTouches.length) return;
    const deltaX = event.changedTouches[0].clientX - touchStartX;
    const deltaY = event.changedTouches[0].clientY - touchStartY;
    if (Math.abs(deltaX) > 44 && Math.abs(deltaX) > Math.abs(deltaY)) {
      goTo(index + (deltaX < 0 ? 1 : -1));
    }
    paused = false;
  }, { passive: true });

  applySlide(0, false);
  startAutoplay();

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopAutoplay();
    else startAutoplay();
  });

  if (typeof prefersReducedMotion.addEventListener === 'function') {
    prefersReducedMotion.addEventListener('change', startAutoplay);
  }
}

/* =========================================================
   11. Reviews carousel
   ========================================================= */
function renderReviews() {
  const track = $('#reviewsTrack');
  if (!track) return;

  track.innerHTML = REVIEWS.map((review) => `
    <article class="review-card" aria-label="رأي ${review.name} من ${review.city}">
      <div class="review-top">
        <span class="review-avatar" aria-hidden="true">${review.name.trim().charAt(0)}</span>
        <div class="review-meta">
          <span class="review-name">${review.name}</span>
          <span class="review-city">${review.city}</span>
        </div>
      </div>
      <div class="stars" role="img" aria-label="تقييم خمس نجوم من خمس">
        ${ICONS.star.repeat(5)}
      </div>
      <blockquote class="review-quote">«${review.quote}»</blockquote>
    </article>
  `).join('');
}

function setupReviewsCarousel() {
  const carousel = $('#reviewsCarousel');
  const viewport = carousel ? carousel.querySelector('.reviews-viewport') : null;
  const track = $('#reviewsTrack');
  const dotsBox = $('#reviewsDots');
  const prevBtn = $('#reviewsPrev');
  const nextBtn = $('#reviewsNext');
  const section = $('.reviews');
  if (!carousel || !viewport || !track || !dotsBox) return;

  let index = 0;
  let perView = 3;
  let maxIndex = 0;
  let timer = null;
  let paused = false;
  let touchStartX = 0;
  let touchStartY = 0;

  function metrics() {
    const firstCard = track.querySelector('.review-card');
    if (!firstCard) return { cardWidth: 1, gap: 0, viewportWidth: 1 };
    const gap = parseFloat(getComputedStyle(track).columnGap) || 20;
    return {
      cardWidth: firstCard.getBoundingClientRect().width,
      gap,
      viewportWidth: viewport.clientWidth
    };
  }

  function buildDots() {
    dotsBox.innerHTML = Array.from({ length: maxIndex + 1 }, (_, dotIndex) => `
      <button class="carousel-dot ${dotIndex === index ? 'is-active' : ''}" type="button"
        data-review-page="${dotIndex}" aria-label="صفحة الآراء ${dotIndex + 1}"
        aria-current="${dotIndex === index ? 'true' : 'false'}"></button>
    `).join('');
  }

  function update() {
    const { cardWidth, gap } = metrics();
    const step = cardWidth + gap;
    // في RTL يتحرك المسار نحو اليمين لكشف البطاقات التالية
    track.style.transform = `translateX(${index * step}px)`;

    $$('.carousel-dot', dotsBox).forEach((dot, dotIndex) => {
      const active = dotIndex === index;
      dot.classList.toggle('is-active', active);
      dot.setAttribute('aria-current', active ? 'true' : 'false');
    });
  }

  function measure() {
    const { cardWidth, gap, viewportWidth } = metrics();
    perView = Math.max(1, Math.round((viewportWidth + gap) / (cardWidth + gap)));
    maxIndex = Math.max(0, REVIEWS.length - perView);
    index = Math.min(index, maxIndex);
    buildDots();
    update();
  }

  function goTo(nextIndex) {
    if (maxIndex <= 0) return;
    index = nextIndex;
    if (index < 0) index = maxIndex;
    if (index > maxIndex) index = 0;
    update();
    restart();
  }

  function stop() {
    window.clearInterval(timer);
    timer = null;
  }

  function restart() {
    stop();
    if (prefersReducedMotion.matches) return;
    timer = window.setInterval(() => {
      if (!paused && activeLayer === null && !document.hidden) goTo(index + 1);
    }, 5000);
  }

  if (prevBtn) prevBtn.addEventListener('click', () => goTo(index - 1));
  if (nextBtn) nextBtn.addEventListener('click', () => goTo(index + 1));

  dotsBox.addEventListener('click', (event) => {
    const dot = event.target.closest('[data-review-page]');
    if (dot) goTo(Number(dot.dataset.reviewPage));
  });

  if (section) {
    section.addEventListener('keydown', (event) => {
      if (event.target.matches('input, textarea, select')) return;
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        goTo(index + 1);
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        goTo(index - 1);
      }
    });

    section.addEventListener('mouseenter', () => { paused = true; });
    section.addEventListener('mouseleave', () => { paused = false; });
    section.addEventListener('focusin', () => { paused = true; });
    section.addEventListener('focusout', (event) => {
      if (!section.contains(event.relatedTarget)) paused = false;
    });
  }

  viewport.addEventListener('touchstart', (event) => {
    if (!event.touches.length) return;
    touchStartX = event.touches[0].clientX;
    touchStartY = event.touches[0].clientY;
    paused = true;
  }, { passive: true });

  viewport.addEventListener('touchend', (event) => {
    if (!event.changedTouches.length) return;
    const deltaX = event.changedTouches[0].clientX - touchStartX;
    const deltaY = event.changedTouches[0].clientY - touchStartY;
    if (Math.abs(deltaX) > 42 && Math.abs(deltaX) > Math.abs(deltaY)) {
      goTo(index + (deltaX < 0 ? 1 : -1));
    }
    paused = false;
  }, { passive: true });

  window.addEventListener('resize', measure, { passive: true });
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(measure).catch(() => {});
  }

  measure();
  restart();

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
    else restart();
  });

  if (typeof prefersReducedMotion.addEventListener === 'function') {
    prefersReducedMotion.addEventListener('change', restart);
  }
}

/* =========================================================
   12. Stats count-up
   ========================================================= */
function setupStats() {
  const values = $$('.stat-value');
  if (!values.length) return;

  function setFinal(el) {
    const target = Number(el.dataset.count) || 0;
    el.textContent = formatNumber(target) + (el.dataset.suffix || '');
  }

  function animate(el) {
    if (prefersReducedMotion.matches || document.hidden) {
      setFinal(el);
      return;
    }
    const target = Number(el.dataset.count) || 0;
    const suffix = el.dataset.suffix || '';
    const duration = 1700;
    const start = performance.now();
    // شبكة أمان: نضمن الوصول إلى القيمة النهائية حتى لو توقّف requestAnimationFrame
    const safety = window.setTimeout(() => setFinal(el), duration + 800);

    function frame(now) {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(target * eased);
      el.textContent = formatNumber(current) + suffix;
      if (progress < 1) requestAnimationFrame(frame);
      else {
        window.clearTimeout(safety);
        setFinal(el);
      }
    }
    requestAnimationFrame(frame);
  }

  if (!('IntersectionObserver' in window)) {
    values.forEach(setFinal);
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      animate(entry.target);
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.45 });

  values.forEach((value) => observer.observe(value));
}

/* =========================================================
   13. Contact form
   ========================================================= */
function setupContact() {
  const form = $('#contactForm');
  const success = $('#contactSuccess');
  const reset = $('#contactReset');
  const status = $('#formStatus');
  const submit = $('#contactSubmit');
  if (!form || !success || !submit) return;

  const submitLabel = submit.querySelector('.btn-label');

  const fields = {
    name: {
      el: $('#fieldName'),
      validate: (value) => value.trim().length >= 3 || 'يرجى إدخال اسمك الكامل (٣ أحرف على الأقل).'
    },
    email: {
      el: $('#fieldEmail'),
      validate: (value) => value.trim() === ''
        ? 'يرجى إدخال بريدك الإلكتروني.'
        : (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim()) || 'صيغة البريد الإلكتروني غير صحيحة.')
    },
    phone: {
      el: $('#fieldPhone'),
      validate: (value) => {
        const digits = value.replace(/[^\d]/g, '');
        if (!value.trim()) return 'يرجى إدخال رقم الهاتف.';
        return (digits.length >= 8 && digits.length <= 15 && /^[+\d][\d\s()-]+$/.test(value.trim())) || 'يرجى إدخال رقم هاتف صحيح.';
      }
    },
    subject: {
      el: $('#fieldSubject'),
      validate: (value) => value.trim().length >= 3 || 'يرجى كتابة موضوع الرسالة.'
    },
    message: {
      el: $('#fieldMessage'),
      validate: (value) => value.trim().length >= 10 || 'اكتب رسالة من ١٠ أحرف على الأقل.'
    }
  };

  function showError(field, message) {
    if (!field.el) return;
    const wrapper = field.el.closest('.field');
    const error = wrapper ? wrapper.querySelector('.field-error') : null;
    if (wrapper) wrapper.classList.add('is-invalid');
    if (error) error.textContent = message;
    field.el.setAttribute('aria-invalid', 'true');
  }

  function clearError(field) {
    if (!field.el) return;
    const wrapper = field.el.closest('.field');
    const error = wrapper ? wrapper.querySelector('.field-error') : null;
    if (wrapper) wrapper.classList.remove('is-invalid');
    if (error) error.textContent = '';
    field.el.removeAttribute('aria-invalid');
  }

  function validateField(field) {
    if (!field.el) return true;
    const result = field.validate(field.el.value);
    if (result === true) {
      clearError(field);
      return true;
    }
    showError(field, result);
    return false;
  }

  Object.values(fields).forEach((field) => {
    if (!field.el) return;
    field.el.addEventListener('input', () => {
      if (field.el.closest('.field').classList.contains('is-invalid')) validateField(field);
    });
    field.el.addEventListener('blur', () => {
      if (field.el.value.trim() !== '') validateField(field);
    });
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (status) status.textContent = '';

    let firstInvalid = null;
    Object.values(fields).forEach((field) => {
      const valid = validateField(field);
      if (!valid && !firstInvalid) firstInvalid = field.el;
    });

    if (firstInvalid) {
      if (status) status.textContent = 'يرجى تصحيح الحقول المحددة ثم المحاولة مرة أخرى.';
      firstInvalid.focus({ preventScroll: false });
      return;
    }

    submit.disabled = true;
    if (submitLabel) submitLabel.textContent = 'جارٍ الإرسال…';
    if (status) status.textContent = 'جارٍ إرسال رسالتك، لحظات من فضلك…';

    window.setTimeout(() => {
      form.hidden = true;
      success.hidden = false;
      if (status) status.textContent = '';
      submit.disabled = false;
      if (submitLabel) submitLabel.textContent = 'إرسال الرسالة';
      const heading = success.querySelector('h3');
      if (heading) {
        heading.setAttribute('tabindex', '-1');
        heading.focus({ preventScroll: true });
      }
    }, 1200);
  });

  if (reset) {
    reset.addEventListener('click', () => {
      success.hidden = true;
      form.hidden = false;
      form.reset();
      Object.values(fields).forEach(clearError);
      if (status) status.textContent = '';
      const firstName = fields.name.el;
      if (firstName) firstName.focus({ preventScroll: true });
    });
  }
}

/* =========================================================
   14. Theme, navigation & init
   ========================================================= */
function setupTheme() {
  const toggle = $('#themeToggle');
  const meta = $('#metaThemeColor');
  if (!toggle) return;

  function apply(theme, persist) {
    document.documentElement.dataset.theme = theme;
    const isLight = theme === 'light';
    toggle.setAttribute('aria-pressed', String(isLight));
    toggle.setAttribute('aria-label', isLight ? 'التبديل إلى الوضع الداكن' : 'التبديل إلى الوضع الفاتح');
    if (meta) meta.setAttribute('content', isLight ? '#f5f0e8' : '#0a090c');
    if (persist) {
      try { localStorage.setItem('perfume_theme', theme); } catch (error) { /* ignore */ }
    }
  }

  const initial = document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
  apply(initial, false);

  toggle.addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
    apply(next, true);
  });
}

function setupNavigation() {
  const header = $('#siteHeader');
  const sectionIds = ['home', 'products', 'about', 'reviews', 'contact'];
  const sections = sectionIds.map((id) => document.getElementById(id)).filter(Boolean);
  const links = $$('.nav-link');
  let ticking = false;

  function update() {
    ticking = false;
    const navHeight = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 78;
    const offset = navHeight + 110;
    let current = 'home';

    sections.forEach((section) => {
      if (section.getBoundingClientRect().top <= offset) current = section.id;
    });

    const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
    if (atBottom) current = 'contact';

    links.forEach((link) => {
      const active = link.dataset.section === current;
      link.classList.toggle('active', active);
      if (active) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });

    if (header) header.classList.toggle('is-scrolled', window.scrollY > 8);
  }

  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  update();
}

function init() {
  renderFeatured();
  renderCatalog();
  setupCatalogControls();
  renderAboutArt();
  renderReviews();
  setupHero();
  setupReviewsCarousel();
  setupLayers();
  setupSearch();
  setupCart();
  setupQuickView();
  setupGlobalActions();
  setupStats();
  setupContact();
  setupTheme();
  setupNavigation();
  syncFavouriteButtons();
  renderCart();

  const year = $('#year');
  if (year) year.textContent = String(new Date().getFullYear());
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

/* == END OF SCRIPT == */

