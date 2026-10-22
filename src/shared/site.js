// Общие утилиты резюме и визитки. Папка src/shared должна совпадать в обоих репозиториях.
import { flushSync } from 'react-dom';

/** Сборка-превью: без отправки статистики и заявок, со скрытыми подсказками для автора. */
export const IS_PREVIEW = import.meta.env.VITE_PREVIEW === '1';

export const LANGS = ['ru', 'kg', 'en'];

export const SITE_URLS = {
  resume: 'https://kutya001.github.io/KutEmpResume/',
  services: 'https://kutya001.github.io/My-Services/',
};

export const PERSON = {
  name: { ru: 'Омуралиев Кутман', kg: 'Өмүралиев Кутман', en: 'Kutman Omuraliev' },
  given: { ru: 'Кутман', kg: 'Кутман', en: 'Kutman' },
  family: { ru: 'Омуралиев', kg: 'Өмүралиев', en: 'Omuraliev' },
  phone: '+996500888268',
  phoneDisplay: '+996 500 888 268',
  email: 'kutmanomuraliev012@gmail.com',
  whatsapp: '996500888268',
  telegram: 'kutya_omuraliev',
  instagram: '_omuraliev_kutman_',
  github: 'kutya001',
  // Вставьте ссылку на профиль LinkedIn — кнопка появится на обоих сайтах сама.
  linkedin: '',
};

export const LINKS = {
  phone: `tel:${PERSON.phone}`,
  email: `mailto:${PERSON.email}`,
  whatsapp: `https://wa.me/${PERSON.whatsapp}`,
  telegram: `https://t.me/${PERSON.telegram}`,
  instagram: `https://www.instagram.com/${PERSON.instagram}/`,
  github: `https://github.com/${PERSON.github}`,
  linkedin: PERSON.linkedin,
};

export const whatsappLink = (text) =>
  text ? `${LINKS.whatsapp}?text=${encodeURIComponent(text)}` : LINKS.whatsapp;

/* ── Хранилище: в приватном режиме и встроенных просмотрщиках может быть недоступно ── */
export const storage = {
  get(key, fallback = null) {
    try { return window.localStorage.getItem(key) ?? fallback; } catch { return fallback; }
  },
  set(key, value) {
    try { window.localStorage.setItem(key, value); } catch { /* недоступно — не страшно */ }
  },
};

export const sessionStore = {
  get(key) {
    try { return window.sessionStorage.getItem(key); } catch { return null; }
  },
  set(key, value) {
    try { window.sessionStorage.setItem(key, value); } catch { /* недоступно */ }
  },
};

/* ── Параметры ссылки: ?lang=en, ?src=tg ── */
export function getParam(name) {
  try { return new URLSearchParams(window.location.search).get(name); } catch { return null; }
}

export function getInitialLang(storageKey) {
  const fromUrl = (getParam('lang') || '').toLowerCase();
  if (LANGS.includes(fromUrl)) return fromUrl;
  const saved = storage.get(storageKey);
  return LANGS.includes(saved) ? saved : 'ru';
}

/** Держит ?lang= в адресе, чтобы скопированная ссылка открывалась на том же языке. */
export function syncLangToUrl(lang) {
  try {
    const url = new URL(window.location.href);
    if (lang === 'ru') url.searchParams.delete('lang');
    else url.searchParams.set('lang', lang);
    if (url.href !== window.location.href) window.history.replaceState(window.history.state, '', url.href);
  } catch { /* адрес менять нельзя — не страшно */ }
}

/** Источник перехода: ?src=hh, ?src=tg, ?src=qr или utm_source. */
export function getTrafficSource() {
  return (getParam('src') || getParam('utm_source') || '').trim().slice(0, 40);
}

/* ── Движение ── */
export function prefersReducedMotion() {
  try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; }
}

/**
 * Плавная смена темы или языка через View Transitions API.
 * kind: 'circle' — тема раскрывается кругом от кнопки, иначе мягкое перетекание.
 */
export function withViewTransition(update, { kind = 'fade', x, y } = {}) {
  const doc = document;
  if (typeof doc.startViewTransition !== 'function' || prefersReducedMotion()) {
    update();
    return;
  }
  const root = doc.documentElement;
  const circle = kind === 'circle' && Number.isFinite(x) && Number.isFinite(y);
  root.classList.add(circle ? 'vt-circle' : 'vt-fade');
  let transition;
  try {
    transition = doc.startViewTransition(() => flushSync(update));
  } catch {
    root.classList.remove('vt-circle', 'vt-fade');
    update();
    return;
  }
  if (circle) {
    transition.ready
      .then(() => {
        const r = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
        root.animate(
          { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] },
          { duration: 600, easing: 'cubic-bezier(.4,0,.2,1)', pseudoElement: '::view-transition-new(root)' },
        );
      })
      .catch(() => {});
  }
  transition.finished.finally(() => root.classList.remove('vt-circle', 'vt-fade'));
}

export const centerOf = (el) => {
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
};

/* ── Локализация ── */
export const loc = (value, lang) =>
  value == null ? '' : typeof value === 'string' ? value : value[lang] ?? value.ru ?? '';

export const fill = (str, vars) =>
  String(str ?? '').replace(/\{(\w+)\}/g, (m, key) => (vars[key] ?? m));

const MONTHS = {
  ru: ['Янв', 'Фев', 'Март', 'Апр', 'Май', 'Июнь', 'Июль', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'],
  kg: ['Янв', 'Фев', 'Март', 'Апр', 'Май', 'Июнь', 'Июль', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'],
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
};
const PRESENT = { ru: 'Наст. время', kg: 'Учурда', en: 'Present' };

export const ymToIndex = (ym) => {
  const [y, m] = String(ym).split('-').map(Number);
  return y * 12 + (m - 1);
};

export const nowIndex = () => {
  const d = new Date();
  return d.getFullYear() * 12 + d.getMonth();
};

export const formatYm = (ym, lang) => {
  const i = ymToIndex(ym);
  return `${(MONTHS[lang] || MONTHS.ru)[i % 12]} ${Math.floor(i / 12)}`;
};

export const formatRange = (start, end, lang) =>
  `${formatYm(start, lang)} — ${end ? formatYm(end, lang) : PRESENT[lang] || PRESENT.ru}`;

/** Месяцев в должности, включая первый и последний. */
export const monthsInRole = (start, end) => (end ? ymToIndex(end) : nowIndex()) - ymToIndex(start) + 1;

export function formatDuration(months, lang) {
  const y = Math.floor(months / 12);
  const m = months % 12;
  const parts = [];
  if (lang === 'en') {
    if (y) parts.push(`${y} yr`);
    if (m) parts.push(`${m} mo`);
  } else if (lang === 'kg') {
    if (y) parts.push(`${y} ж.`);
    if (m) parts.push(`${m} ай`);
  } else {
    if (y) parts.push(`${y} ${ruPlural(y, 'г.', 'г.', 'л.')}`);
    if (m) parts.push(`${m} мес.`);
  }
  return parts.join(' ');
}

function ruPlural(n, one, few, many) {
  const a = n % 10;
  const b = n % 100;
  if (a === 1 && b !== 11) return one;
  if (a >= 2 && a <= 4 && (b < 12 || b > 14)) return few;
  return many;
}

/** «6+ лет», «3+ года», «6+ years», «6+ жыл». */
export function yearsLabel(n, lang) {
  if (lang === 'en') return `${n}+ years`;
  if (lang === 'kg') return `${n}+ жыл`;
  return `${n}+ ${ruPlural(n, 'год', 'года', 'лет')}`;
}

/** Стаж и число компаний — считаются по датам, не устаревают. */
export function careerStats(career) {
  const now = nowIndex();
  const total = Math.floor((now - ymToIndex(career.careerStart) + 1) / 12);
  const focus = Math.floor((now - ymToIndex(career.dataFocusStart) + 1) / 12);
  const companies = new Set(career.jobs.map((j) => loc(j.company, 'ru'))).size;
  return { total, focus, companies };
}

export const yearVars = (career, lang) => {
  const s = careerStats(career);
  return { total: yearsLabel(s.total, lang), focus: yearsLabel(s.focus, lang), companies: s.companies, year: new Date().getFullYear() };
};

export const currentJob = (career) => career.jobs.find((j) => !j.end) || null;

/** Проверка формы данных карьеры (например, загруженных с сайта резюме). */
export const isValidCareer = (c) =>
  !!c && Array.isArray(c.jobs) && c.jobs.length > 0 && c.jobs.every((j) => j.start && j.role && j.company) && typeof c.careerStart === 'string';

/* ── Контакт в телефон (vCard) ── */
export function buildVCard({ lang, title, url }) {
  const esc = (s) => String(s).replace(/([,;\\])/g, '\\$1');
  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `N:${esc(loc(PERSON.family, lang))};${esc(loc(PERSON.given, lang))};;;`,
    `FN:${esc(`${loc(PERSON.given, lang)} ${loc(PERSON.family, lang)}`)}`,
    title ? `TITLE:${esc(title)}` : null,
    `TEL;TYPE=CELL:${PERSON.phone}`,
    `EMAIL;TYPE=INTERNET:${PERSON.email}`,
    `URL:${url}`,
    `X-SOCIALPROFILE;TYPE=telegram:${LINKS.telegram}`,
    `X-SOCIALPROFILE;TYPE=github:${LINKS.github}`,
    PERSON.linkedin ? `X-SOCIALPROFILE;TYPE=linkedin:${PERSON.linkedin}` : null,
    'END:VCARD',
  ].filter(Boolean);
  return lines.join('\r\n') + '\r\n';
}

/** Скачивание файла, собранного на странице. */
export function downloadFile(filename, content, mime) {
  try {
    const blob = content instanceof Blob ? content : new Blob([content], { type: mime });
    const href = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = href;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(href), 4000);
    return true;
  } catch {
    return false;
  }
}

/* ── Картинки ── */
export const isExternal = (p) => /^https?:\/\//.test(p || '');
