import { IS_PREVIEW, getTrafficSource, storage } from './shared/site';

const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxZryXC1jHMrRt_u8GJbtwexF-OVWaXLCfxbC6wBglLnGukZ7fmRh9ilrZJYWSp2e8X/exec';

function getGPU() {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return '—';
    const dbg = gl.getExtension('WEBGL_debug_renderer_info');
    return dbg ? (gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) || '—') : '—';
  } catch {
    return '—';
  }
}

function detectAdBlock() {
  return new Promise((resolve) => {
    const el = document.createElement('div');
    el.innerHTML = '&nbsp;';
    el.className = 'adsbox ad-banner';
    el.style.cssText = 'position:absolute;left:-9999px;height:1px;';
    document.body.appendChild(el);
    setTimeout(() => {
      resolve(el.offsetHeight === 0);
      el.remove();
    }, 100);
  });
}

function detectIncognito() {
  return new Promise((resolve) => {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      navigator.storage.estimate().then(({ quota }) => resolve(quota < 120000000)).catch(() => resolve(false));
    } else {
      resolve(false);
    }
  });
}

function getPerf() {
  const nav = performance.getEntriesByType?.('navigation')?.[0];
  if (!nav) return { dns: 0, ttfb: 0, load: 0 };
  return {
    dns: Math.round(nav.domainLookupEnd - nav.domainLookupStart) || 0,
    ttfb: Math.round(nav.responseStart - nav.requestStart) || 0,
    load: Math.round(nav.loadEventEnd - nav.startTime) || 0,
  };
}

function send(payload) {
  const body = JSON.stringify(payload);
  try {
    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: 'text/plain;charset=UTF-8' });
      if (navigator.sendBeacon(GOOGLE_SCRIPT_URL, blob)) return;
    }
  } catch { /* перейдём на fetch */ }
  fetch(GOOGLE_SCRIPT_URL, {
    method: 'POST', mode: 'no-cors', cache: 'no-cache',
    headers: { 'Content-Type': 'text/plain' }, body, keepalive: true,
  }).catch(() => {});
}

/**
 * Статистика визита: отправляется при открытии и при уходе со страницы.
 * IP и геолокация больше не собираются; источник видно по ?src= или utm_source.
 * Возвращает функцию отписки.
 */
export function startVisitTracking() {
  if (IS_PREVIEW) return () => {};

  const visits = parseInt(storage.get('_vc', '0'), 10) + 1;
  storage.set('_vc', String(visits));

  let clicked = false;
  let maxScroll = 0;
  const onClick = () => { clicked = true; };
  const onScroll = () => {
    const h = document.documentElement;
    const total = h.scrollHeight - h.clientHeight;
    if (total > 0) maxScroll = Math.max(maxScroll, Math.min(100, Math.round((h.scrollTop / total) * 100)));
  };
  window.addEventListener('click', onClick, { passive: true });
  window.addEventListener('scroll', onScroll, { passive: true });

  const startTime = performance.now();
  let isAdBlock = false;
  let isIncognito = false;

  const buildPayload = () => {
    const perf = getPerf();
    const params = new URLSearchParams(window.location.search);
    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    const source = getTrafficSource();
    return {
      city: '—',
      country: '—',
      provider: '—',
      ip: 'не собирается',
      time: new Date().toLocaleTimeString('ru-RU'),
      ua: navigator.userAgent,
      ref: source ? `src=${source} · ${document.referrer || 'Прямой заход'}` : document.referrer || 'Прямой заход',
      screen: `${window.screen.width}x${window.screen.height}`,
      tz: Intl.DateTimeFormat().resolvedOptions().timeZone || '',
      resumeText: 'Твою визитку открыли!',
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      pixelRatio: window.devicePixelRatio || 1,
      cores: navigator.hardwareConcurrency || 0,
      memory: navigator.deviceMemory || null,
      gpu: getGPU(),
      language: navigator.language || '',
      languages: (navigator.languages || []).join(','),
      connection: conn?.effectiveType || '—',
      downlink: conn?.downlink || null,
      rtt: conn?.rtt || null,
      touch: (navigator.maxTouchPoints || 0) > 0,
      platform: navigator.platform || '',
      url: window.location.href,
      utm_source: source,
      utm_medium: params.get('utm_medium') || '',
      utm_campaign: params.get('utm_campaign') || '',
      visitCount: visits,
      timeOnPage: Math.round((performance.now() - startTime) / 1000),
      scrollDepth: maxScroll,
      clicked,
      adBlock: isAdBlock,
      incognito: isIncognito,
      online: navigator.onLine,
      cookieEnabled: navigator.cookieEnabled,
      doNotTrack: navigator.doNotTrack || '0',
      colorDepth: window.screen.colorDepth || 24,
      dnsTime: perf.dns,
      ttfb: perf.ttfb,
      loadTime: perf.load,
    };
  };

  let initialSent = false;
  const fireInitial = () => {
    if (initialSent) return;
    initialSent = true;
    send(buildPayload());
  };
  Promise.all([
    detectAdBlock().then((v) => { isAdBlock = v; }),
    detectIncognito().then((v) => { isIncognito = v; }),
  ]).finally(fireInitial);
  const fallbackTimer = setTimeout(fireInitial, 2500);

  let leaveSent = false;
  const onLeave = () => {
    if (leaveSent) return;
    leaveSent = true;
    send(buildPayload());
  };
  const onVisibility = () => { if (document.visibilityState === 'hidden') onLeave(); };
  window.addEventListener('beforeunload', onLeave);
  document.addEventListener('visibilitychange', onVisibility);

  return () => {
    clearTimeout(fallbackTimer);
    window.removeEventListener('click', onClick);
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('beforeunload', onLeave);
    document.removeEventListener('visibilitychange', onVisibility);
  };
}

export async function sendContactForm(form) {
  if (IS_PREVIEW) return false;
  try {
    await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST', mode: 'no-cors', cache: 'no-cache',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ type: 'contact_form', ...form, source: getTrafficSource(), time: new Date().toLocaleString('ru-RU') }),
    });
    return true;
  } catch {
    return false;
  }
}
