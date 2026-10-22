import { useEffect, useState } from 'react';
import { LANGS } from './site';

/*
 * Верхняя панель — одинаковая в резюме и визитке:
 * логотип, ссылки на разделы, переключатель трёх тем и языков RU / KG / EN, меню на телефоне.
 */
export const THEMES = [
  { id: 'light', icon: 'fa-sun' },
  { id: 'dark', icon: 'fa-moon' },
  { id: 'warm', icon: 'fa-mug-hot' },
];

export function ThemeSwitch({ labels, theme, onTheme }) {
  return (
    <div className="flex items-center bg-slate-800/50 p-1 rounded-lg border border-slate-700" role="group" aria-label={labels.themeGroup}>
      {THEMES.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={(e) => onTheme(t.id, e.currentTarget)}
          aria-pressed={theme === t.id}
          title={labels.theme[t.id]}
          aria-label={labels.theme[t.id]}
          className={`w-8 h-7 rounded-md text-xs transition-all ${theme === t.id ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
        >
          <i className={`fa-solid ${t.icon}`} aria-hidden="true" />
        </button>
      ))}
    </div>
  );
}

export function LangSwitch({ label, lang, onLang }) {
  return (
    <div className="flex bg-slate-800/50 p-1 rounded-lg border border-slate-700" role="group" aria-label={label}>
      {LANGS.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => onLang(l)}
          aria-pressed={lang === l}
          className={`px-2.5 sm:px-3 py-1 text-xs font-bold rounded-md uppercase transition-all ${lang === l ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}

/**
 * links: [{ id, label }] — разделы страницы; external: [{ href, label }] — внешние ссылки;
 * action: { label, icon, onClick } — кнопка справа от ссылок (например PDF);
 * desktopCount — сколько ссылок показывать на широком экране (остальные — в меню).
 */
const BREAKPOINTS = {
  lg: { show: 'hidden lg:flex', hide: 'flex lg:hidden', menu: 'lg:hidden' },
  xl: { show: 'hidden xl:flex', hide: 'flex xl:hidden', menu: 'xl:hidden' },
};

export default function SiteNav({ brand, brandHref, links, external = [], action, labels, theme, onTheme, lang, onLang, desktopCount, breakpoint = 'lg' }) {
  const bp = BREAKPOINTS[breakpoint] || BREAKPOINTS.lg;
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const desktopLinks = desktopCount ? links.slice(0, desktopCount) : links;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <nav className={`site-nav fixed top-0 w-full z-50 bg-slate-950/80 backdrop-blur-lg border-b border-slate-800/50 transition-shadow ${scrolled ? 'shadow-lg' : ''}`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        <a href={brandHref} className="brand-mark font-bold text-xl tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
          {brand}
        </a>

        <div className={`${bp.show} gap-5 text-sm font-medium text-slate-400 items-center`}>
          {desktopLinks.map((l) => (
            <a key={l.id} href={`#${l.id}`} className="nav-link hover:text-blue-400 transition-colors">{l.label}</a>
          ))}
          {external.map((x) => (
            <a key={x.href} href={x.href} target="_blank" rel="noopener noreferrer" className="nav-link hover:text-blue-400 transition-colors inline-flex items-center gap-1.5">
              {x.label}
              <i className="fa-solid fa-arrow-up-right-from-square text-[10px]" aria-hidden="true" />
            </a>
          ))}
          {action && (
            <button type="button" onClick={action.onClick} className="hover:text-blue-400 transition-colors flex items-center gap-1.5 border-l border-slate-800 pl-5 font-medium">
              <i className={`fa-solid ${action.icon} text-blue-400`} aria-hidden="true" />
              {action.label}
            </button>
          )}
        </div>

        <div className={`${bp.show} items-center gap-2`}>
          <ThemeSwitch labels={labels} theme={theme} onTheme={onTheme} />
          <LangSwitch label={labels.language} lang={lang} onLang={onLang} />
        </div>

        <div className={`${bp.hide} items-center gap-2`}>
          <LangSwitch label={labels.language} lang={lang} onLang={onLang} />
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={labels.menu}
            className="w-10 h-10 rounded-lg border border-slate-700 bg-slate-800/50 text-slate-300 flex items-center justify-center"
          >
            <i className={`fa-solid ${open ? 'fa-xmark' : 'fa-bars'}`} aria-hidden="true" />
          </button>
        </div>
      </div>

      {open && (
        <div id="mobile-menu" className={`${bp.menu} bg-slate-950/95 backdrop-blur-lg border-t border-slate-800/50 px-4 sm:px-6 pb-5 pt-2 animate-menu-in`}>
          <div className="grid grid-cols-2 gap-1">
            {links.map((l) => (
              <a key={l.id} href={`#${l.id}`} onClick={() => setOpen(false)} className="text-slate-300 hover:text-blue-400 py-2.5 text-sm font-medium transition-colors">
                {l.label}
              </a>
            ))}
            {external.map((x) => (
              <a key={x.href} href={x.href} target="_blank" rel="noopener noreferrer" className="text-slate-300 hover:text-blue-400 py-2.5 text-sm font-medium transition-colors">
                {x.label} <i className="fa-solid fa-arrow-up-right-from-square text-[10px] ml-1" aria-hidden="true" />
              </a>
            ))}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 mt-3 pt-3 border-t border-slate-800/60">
            {action ? (
              <button type="button" onClick={() => { setOpen(false); action.onClick(); }} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-bold flex items-center gap-2">
                <i className={`fa-solid ${action.icon}`} aria-hidden="true" /> {action.label}
              </button>
            ) : <span />}
            <ThemeSwitch labels={labels} theme={theme} onTheme={onTheme} />
          </div>
        </div>
      )}
    </nav>
  );
}
