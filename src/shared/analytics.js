import { IS_PREVIEW } from './site';

/*
 * Анонимная статистика посещений без cookies и сбора IP — GoatCounter (бесплатно для личных сайтов).
 * Зарегистрируйтесь на goatcounter.com, впишите сюда код сайта (например 'kutman'),
 * и счётчик включится. Пока строка пустая — ничего не подключается.
 */
export const GOATCOUNTER_CODE = '';

export function initAnonymousAnalytics() {
  if (IS_PREVIEW || !GOATCOUNTER_CODE) return;
  try {
    const s = document.createElement('script');
    s.async = true;
    s.src = 'https://gc.zgo.at/count.js';
    s.dataset.goatcounter = `https://${GOATCOUNTER_CODE}.goatcounter.com/count`;
    document.head.appendChild(s);
  } catch { /* не критично */ }
}
