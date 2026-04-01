import { useState, useEffect, useRef } from 'react';
import RU from './data-service.json';
import EN from './data-service-en.json';
import KG from './data-service-kg.json';
import InteractiveBackground from './components/InteractiveBackground';
import TiltCard from './components/TiltCard';

const LANGS = { ru: RU, en: EN, kg: KG };

const BASE = import.meta.env.BASE_URL;
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxZryXC1jHMrRt_u8GJbtwexF-OVWaXLCfxbC6wBglLnGukZ7fmRh9ilrZJYWSp2e8X/exec';

/* ───── Reusable: Modal ───── */
function Modal({ open, onClose, children }) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 md:p-8 shadow-2xl animate-modal-in"
        onClick={e => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white text-xl transition-colors">
          <i className="fa-solid fa-xmark" />
        </button>
        {children}
      </div>
    </div>
  );
}

/* ───── Reusable: Section wrapper with scroll animation ───── */
function Section({ id, children, className = '' }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return (
    <section
      id={id}
      ref={ref}
      className={`w-full transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} ${className}`}
    >
      {children}
    </section>
  );
}

/* ───── Reusable: Section header ───── */
function SectionHeader({ tag, title, subtitle }) {
  return (
    <div className="text-center mb-12 md:mb-16">
      {tag && (
        <span className="text-blue-400 font-mono text-xs tracking-[0.2em] uppercase border border-blue-500/20 px-3 py-1 rounded-full">
          {tag}
        </span>
      )}
      <h2 className="text-3xl md:text-4xl font-bold mt-4">{title}</h2>
      {subtitle && <p className="text-slate-400 mt-3 max-w-2xl mx-auto text-sm md:text-base">{subtitle}</p>}
    </div>
  );
}

/* ───── FAQ Item (accordion) ───── */
function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-slate-700/50 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 text-left hover:bg-slate-800/30 transition-colors"
      >
        <span className="font-semibold text-white pr-4">{q}</span>
        <i className={`fa-solid fa-chevron-down text-blue-400 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${open ? 'max-h-60 opacity-100' : 'max-h-0 opacity-0'}`}>
        <p className="px-5 pb-5 text-slate-400 text-sm leading-relaxed">{a}</p>
      </div>
    </div>
  );
}

/* ───── Pain Point Accordion ───── */
function PainItem({ icon, title, text }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-slate-700/50 rounded-xl overflow-hidden hover:border-blue-500/30 transition-colors">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-slate-800/30 transition-colors"
      >
        <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
          <i className={`fa-solid ${icon} text-blue-400 text-sm`} />
        </div>
        <span className="font-semibold text-white flex-1 text-sm">{title}</span>
        <i className={`fa-solid fa-chevron-down text-blue-400 text-xs transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
      </button>
      <div className={`overflow-hidden transition-all duration-400 ease-in-out ${open ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
        <p className="px-4 pb-4 pl-[3.25rem] text-slate-400 text-sm leading-relaxed">{text}</p>
      </div>
    </div>
  );
}

/* ═════════════════ MAIN APP ═════════════════ */
export default function App() {
  const [mobileNav, setMobileNav] = useState(false);
  const [aboutModal, setAboutModal] = useState(false);
  const [serviceModal, setServiceModal] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const [photoLightbox, setPhotoLightbox] = useState(false);

  // Language & Theme
  const [lang, setLang] = useState(() => localStorage.getItem('site_lang') || 'ru');
  const [theme, setTheme] = useState(() => localStorage.getItem('site_theme') || 'dark');
  const D = LANGS[lang] || LANGS.ru;

  // Contact form
  const [formData, setFormData] = useState({ name: '', contact: '', message: '' });
  const [formStatus, setFormStatus] = useState(null);

  // Tooltip for MVP
  const [mvpTip, setMvpTip] = useState(false);

  // Persist language
  useEffect(() => { localStorage.setItem('site_lang', lang); }, [lang]);

  // Persist theme & apply to HTML
  useEffect(() => {
    localStorage.setItem('site_theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');
  const cycleLang = (l) => { setLang(l); setMobileNav(false); };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Analytics ping (with ref guard to prevent double-fire in StrictMode)
  const analyticsRef = useRef(false);
  useEffect(() => {
    if (analyticsRef.current) return;
    if (sessionStorage.getItem('site_viewed')) return;
    analyticsRef.current = true;
    const bd = {
      time: new Date().toLocaleTimeString('ru-RU'),
      tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
      ua: navigator.userAgent,
      ref: document.referrer || 'Прямой заход',
      screen: `${window.screen.width}x${window.screen.height}`,
    };
    const fire = (p) => {
      fetch(GOOGLE_SCRIPT_URL, { method: 'POST', mode: 'no-cors', cache: 'no-cache', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify(p) })
        .then(() => sessionStorage.setItem('site_viewed', 'true')).catch(() => {});
    };
    (async () => {
      try {
        const c = new AbortController();
        const t = setTimeout(() => c.abort(), 2000);
        const r = await fetch('https://ipapi.co/json/', { signal: c.signal });
        clearTimeout(t);
        if (r.ok) { const g = await r.json(); fire({ ...bd, city: g.city || '?', country: g.country_name || '?', ip: g.ip || '?', provider: g.org || '?' }); }
        else throw 0;
      } catch { fire({ ...bd, city: '?', country: '?', ip: '?', provider: '?' }); }
    })();
  }, []);

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormStatus('sending');
    try {
      await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST', mode: 'no-cors', cache: 'no-cache',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ type: 'contact_form', ...formData, time: new Date().toLocaleString('ru-RU') }),
      });
      setFormStatus('success');
      setFormData({ name: '', contact: '', message: '' });
      setTimeout(() => setFormStatus(null), 5000);
    } catch {
      setFormStatus('error');
      setTimeout(() => setFormStatus(null), 5000);
    }
  };

  const scrollTo = (id) => {
    setMobileNav(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const navLinks = [
    ['services', D.nav.services],
    ['about', D.nav.about],
    ['roadmap', D.nav.roadmap],
    ['pricing', D.nav.pricing],
    ['contact', D.nav.contact],
  ];

  const stepColors = {
    blue: 'from-blue-500 to-blue-600',
    cyan: 'from-cyan-500 to-cyan-600',
    green: 'from-emerald-500 to-emerald-600',
    yellow: 'from-amber-500 to-amber-600',
    orange: 'from-orange-500 to-orange-600',
    purple: 'from-purple-500 to-purple-600',
  };

  return (
    <div className="relative w-full">
      <InteractiveBackground />

      {/* ───── Навигация ───── */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-slate-950/95 backdrop-blur-lg shadow-lg border-b border-slate-800/50' : 'bg-transparent'}`}>
        <div className="max-w-6xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <button onClick={() => scrollTo('hero')} className="font-bold text-xl tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
            KO
          </button>
          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400">
            {navLinks.map(([id, label]) => (
              <button key={id} onClick={() => scrollTo(id)} className="hover:text-blue-400 transition-colors">{label}</button>
            ))}
            {/* Lang switcher */}
            <div className="flex items-center gap-1 border-l border-slate-700 pl-4 ml-2">
              {['ru', 'en', 'kg'].map(l => (
                <button key={l} onClick={() => cycleLang(l)}
                  className={`text-xs font-bold uppercase px-1.5 py-0.5 rounded transition-colors ${lang === l ? 'text-blue-400 bg-blue-500/10' : 'text-slate-500 hover:text-slate-300'}`}
                >{l}</button>
              ))}
            </div>
            {/* Theme toggle */}
            <button onClick={toggleTheme} className="text-slate-400 hover:text-blue-400 transition-colors text-base" title={theme === 'dark' ? D.ui?.themeLight : D.ui?.themeDark}>
              <i className={`fa-solid ${theme === 'dark' ? 'fa-sun' : 'fa-moon'}`} />
            </button>
          </div>
          {/* Mobile burger */}
          <div className="md:hidden flex items-center gap-3">
            {/* Mobile lang */}
            <div className="flex items-center gap-0.5">
              {['ru', 'en', 'kg'].map(l => (
                <button key={l} onClick={() => cycleLang(l)}
                  className={`text-[10px] font-bold uppercase px-1 py-0.5 rounded transition-colors ${lang === l ? 'text-blue-400 bg-blue-500/10' : 'text-slate-500'}`}
                >{l}</button>
              ))}
            </div>
            {/* Mobile theme */}
            <button onClick={toggleTheme} className="text-slate-400 hover:text-blue-400 transition-colors text-sm">
              <i className={`fa-solid ${theme === 'dark' ? 'fa-sun' : 'fa-moon'}`} />
            </button>
            <button onClick={() => setMobileNav(!mobileNav)} className="text-slate-300 text-xl">
              <i className={`fa-solid ${mobileNav ? 'fa-xmark' : 'fa-bars'}`} />
            </button>
          </div>
        </div>
        {/* Mobile menu */}
        {mobileNav && (
          <div className="md:hidden bg-slate-950/95 backdrop-blur-lg border-t border-slate-800/50 px-6 pb-4 flex flex-col gap-3">
            {navLinks.map(([id, label]) => (
              <button key={id} onClick={() => scrollTo(id)} className="text-slate-300 hover:text-blue-400 text-left py-2 text-sm font-medium transition-colors">{label}</button>
            ))}
          </div>
        )}
      </nav>

      <main className="relative z-10 max-w-6xl mx-auto px-4 md:px-6 pt-24 pb-20 flex flex-col gap-24 md:gap-32">

        {/* ═══ HERO ═══ */}
        <section id="hero" className="flex flex-col items-center text-center pt-6 md:pt-10">
          <div className="relative mb-6 cursor-pointer group" onClick={() => setPhotoLightbox(true)}>
            <div className="w-32 h-32 md:w-44 md:h-44 rounded-full border-2 border-blue-500/50 p-1 transition-transform duration-300 group-hover:scale-105">
              <img src={`${BASE}MyImage.jpeg`} alt="Омуралиев Кутман" className="w-full h-full rounded-full object-cover" />
            </div>
            <div className="absolute inset-0 rounded-full flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-colors">
              <i className="fa-solid fa-expand text-white text-lg opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>

          {/* Photo lightbox */}
          {photoLightbox && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md" onClick={() => setPhotoLightbox(false)}>
              <button className="absolute top-6 right-6 text-white/70 hover:text-white text-2xl z-10 transition-colors"><i className="fa-solid fa-xmark" /></button>
              <img src={`${BASE}MyImage.jpeg`} alt="Омуралиев Кутман" className="max-w-full max-h-[90vh] rounded-2xl shadow-2xl animate-modal-in object-contain" onClick={e => e.stopPropagation()} />
            </div>
          )}

          <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tight mb-4 leading-tight">
            {D.hero.title}
          </h1>

          <p className="text-base md:text-xl text-slate-400 max-w-2xl mb-6 leading-relaxed">
            {D.hero.subtitle}{' '}
            <span
              className="relative inline-block cursor-help"
              onMouseEnter={() => setMvpTip(true)}
              onMouseLeave={() => setMvpTip(false)}
              onClick={() => setMvpTip(!mvpTip)}
            >
              <span className="text-blue-400 font-semibold border-b border-dashed border-blue-400">{D.hero.subtitleMVP}</span>
              {mvpTip && (
                <span className="fixed md:absolute inset-x-4 bottom-20 md:inset-x-auto md:bottom-full md:left-1/2 md:-translate-x-1/2 md:mb-3 md:w-80 bg-slate-800 border border-slate-600 text-slate-200 text-xs leading-relaxed rounded-xl p-4 shadow-xl z-[60] animate-modal-in">
                  {D.hero.mvpTooltip}
                  <span className="hidden md:block absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-800" />
                </span>
              )}
            </span>{' '}
            {D.hero.subtitleEnd}
          </p>

          {/* Trust points */}
          <div className="flex flex-wrap justify-center gap-3 md:gap-6 mb-8">
            {D.hero.trustPoints.map((t, i) => (
              <span key={i} className="flex items-center gap-2 text-xs md:text-sm text-slate-400">
                <i className="fa-solid fa-circle-check text-blue-400" />
                {t}
              </span>
            ))}
          </div>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <button onClick={() => scrollTo('contact')} className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold text-sm shadow-lg shadow-blue-500/25 transition-all hover:-translate-y-0.5">
              {D.hero.ctaPrimary}
            </button>
            <button onClick={() => scrollTo('services')} className="px-8 py-3.5 rounded-xl border border-slate-600 hover:border-blue-500 text-slate-300 hover:text-white font-bold text-sm transition-all hover:-translate-y-0.5">
              {D.hero.ctaSecondary}
            </button>
          </div>
          <p className="text-xs text-slate-500 max-w-md">{D.hero.microText}</p>
        </section>

        {/* ═══ PAIN POINTS ═══ */}
        <Section id="pain-points">
          <SectionHeader title={D.painPoints.title} subtitle={D.painPoints.subtitle} />
          <div className="max-w-2xl mx-auto space-y-3">
            {D.painPoints.items.map((p, i) => (
              <PainItem key={i} icon={p.icon} title={p.title} text={p.text} />
            ))}
          </div>
        </Section>

        {/* ═══ ABOUT ME ═══ */}
        <Section id="about">
          <SectionHeader tag={D.about.tag} title={D.about.title} />
          <div className="max-w-3xl mx-auto">
            <TiltCard className="flex flex-col gap-5">
              <div className="flex items-center gap-5">
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-full border-2 border-blue-500/30 p-0.5 flex-shrink-0">
                  <img src={`${BASE}MyImage.jpeg`} alt={D.about.name} className="w-full h-full rounded-full object-cover" />
                </div>
                <div>
                  <h3 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">{D.about.name}</h3>
                  <p className="text-blue-400 text-sm font-medium mt-1">{D.about.role}</p>
                </div>
              </div>
              <p className="text-slate-300 text-sm leading-relaxed">{D.about.shortText}</p>
              <div className="flex flex-wrap gap-2">
                  {D.about.proofPoints.map((p, i) => (
                    <span key={i} className="text-xs bg-slate-800 border border-slate-700 text-slate-300 px-3 py-1 rounded-full">{p}</span>
                  ))}
                </div>
                <button
                  onClick={() => setAboutModal(true)}
                  className="text-blue-400 hover:text-blue-300 text-sm font-semibold flex items-center gap-2 transition-colors"
                >
                  {D.about.detailsBtn} <i className="fa-solid fa-arrow-right text-xs" />
                </button>
            </TiltCard>
            <blockquote className="mt-6 border-l-2 border-blue-500/50 pl-4 text-slate-400 text-sm italic">
              {D.about.quote}
            </blockquote>
          </div>
        </Section>

        {/* About Modal */}
        <Modal open={aboutModal} onClose={() => setAboutModal(false)}>
          <h2 className="text-2xl font-bold mb-6">{D.ui.aboutModalTitle}</h2>

          {/* ── Career Roadmap ── */}
          <h3 className="text-lg font-bold text-blue-400 mb-4"><i className="fa-solid fa-briefcase mr-2" />{D.ui.career}</h3>
          <div className="relative mb-8">
            {/* Vertical line */}
            <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-blue-500 via-cyan-500 to-slate-700 opacity-40" />
            <div className="space-y-0">
              {D.about.modal.career.map((j, i) => (
                <div key={i} className="relative flex items-start gap-4 pl-0 group animate-career-item" style={{ animationDelay: `${i * 0.1}s` }}>
                  {/* Node dot + company image */}
                  <div className="relative z-10 flex-shrink-0">
                    <div className="w-10 h-10 rounded-full border-2 border-blue-500/50 bg-slate-900 overflow-hidden group-hover:border-blue-400 transition-colors shadow-md">
                      <img src={`${BASE}${j.img}`} alt={j.company} className="w-full h-full object-cover" />
                    </div>
                  </div>
                  {/* Content card */}
                  <div className="bg-slate-800/40 border border-slate-700/40 rounded-lg p-3 flex-1 mb-3 group-hover:border-blue-500/30 group-hover:bg-slate-800/60 transition-all">
                    <div className="flex justify-between items-start flex-wrap gap-1">
                      <span className="font-semibold text-white text-sm">{j.role}</span>
                      <span className="text-[10px] text-slate-500 font-mono bg-slate-800 px-1.5 py-0.5 rounded">{j.dates}</span>
                    </div>
                    <p className="text-blue-400 text-xs mt-0.5">{j.company}</p>
                    <p className="text-slate-400 text-xs mt-1 leading-relaxed">{j.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Tech Stack ── */}
          <h3 className="text-lg font-bold text-blue-400 mb-3"><i className="fa-solid fa-layer-group mr-2" />{D.ui.techStack}</h3>
          <div className="mb-6 space-y-2">
            {[
              [D.ui.advanced, D.about.modal.skills.advanced, 'text-blue-400 border-blue-500/50'],
              [D.ui.intermediate, D.about.modal.skills.intermediate, 'text-purple-400 border-purple-500/50'],
              [D.ui.basic, D.about.modal.skills.basic, 'text-slate-400 border-slate-600'],
            ].map(([label, items, cls]) => (
              <div key={label}>
                <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">{label}</span>
                <div className="flex flex-wrap gap-2 mt-1">
                  {items.map((s, i) => (
                    <span key={i} className={`text-xs px-2.5 py-1 rounded-md border bg-slate-800/30 ${cls}`}>{s}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* ── Education ── */}
          <h3 className="text-lg font-bold text-blue-400 mb-3"><i className="fa-solid fa-graduation-cap mr-2" />{D.ui.education}</h3>
          <div className="space-y-2 mb-6">
            {D.about.modal.education.map((e, i) => (
              <div key={i} className="bg-slate-800/30 border border-slate-700/40 rounded-lg p-3 flex items-center gap-3 animate-career-item hover:border-blue-500/30 transition-colors" style={{ animationDelay: `${i * 0.15}s` }}>
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center flex-shrink-0">
                  <i className="fa-solid fa-graduation-cap text-blue-400 text-sm" />
                </div>
                <div className="flex-1">
                  <span className="text-slate-200 text-sm font-medium">{e.name}</span>
                </div>
                <span className="text-xs text-slate-500 font-mono bg-slate-800 px-2 py-0.5 rounded">{e.year}</span>
              </div>
            ))}
          </div>

          {/* ── Courses ── */}
          <h3 className="text-lg font-bold text-blue-400 mb-3"><i className="fa-solid fa-certificate mr-2" />{D.ui.courses}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {D.about.modal.courses.map((c, i) => (
              <div key={i} className="bg-slate-800/30 border border-slate-700/40 rounded-lg p-3 flex items-center gap-3 animate-career-item hover:border-purple-500/30 transition-colors" style={{ animationDelay: `${i * 0.12}s` }}>
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center flex-shrink-0">
                  <i className="fa-solid fa-certificate text-purple-400 text-xs" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-slate-200 text-xs font-medium block truncate">{c.name}</span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono flex-shrink-0">{c.year}</span>
              </div>
            ))}
          </div>
        </Modal>

        {/* ═══ SERVICES ═══ */}
        <Section id="services">
          <SectionHeader tag={D.services.tag} title={D.services.title} subtitle={D.services.subtitle} />
          <div className="grid md:grid-cols-3 gap-6">
            {D.services.items.map((s, i) => (
              <TiltCard key={i} className="flex flex-col h-full">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center mb-4">
                  <i className={`fa-solid ${s.icon} text-blue-400 text-xl`} />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{s.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-5 flex-1">{s.tagline}</p>
                <div className="flex flex-col gap-2 mt-auto">
                  <button onClick={() => setServiceModal(i)} className="text-blue-400 hover:text-blue-300 text-sm font-semibold flex items-center gap-1 transition-colors">
                    {D.ui.moreDetails} <i className="fa-solid fa-arrow-right text-xs" />
                  </button>
                  <button onClick={() => scrollTo('contact')} className="w-full py-2.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 text-sm font-semibold transition-colors">
                    {s.cta}
                  </button>
                </div>
              </TiltCard>
            ))}
          </div>
        </Section>

        {/* Service Detail Modal */}
        <Modal open={serviceModal !== null} onClose={() => setServiceModal(null)}>
          {serviceModal !== null && (() => {
            const s = D.services.items[serviceModal];
            return (
              <>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                    <i className={`fa-solid ${s.icon} text-blue-400`} />
                  </div>
                  <h2 className="text-2xl font-bold">{s.title}</h2>
                </div>
                <p className="text-slate-300 mb-5">{s.tagline}</p>

                <h4 className="font-bold text-white mb-2"><i className="fa-solid fa-triangle-exclamation text-amber-400 mr-2" />{D.ui.whenNeeded}</h4>
                <ul className="list-disc list-inside text-slate-400 text-sm space-y-1 mb-5">
                  {s.whenNeeded.map((w, i) => <li key={i}>{w}</li>)}
                </ul>

                <h4 className="font-bold text-white mb-2"><i className="fa-solid fa-list-check text-green-400 mr-2" />{D.ui.includes}</h4>
                <ul className="list-disc list-inside text-slate-400 text-sm space-y-1 mb-5">
                  {s.includes.map((w, i) => <li key={i}>{w}</li>)}
                </ul>

                <h4 className="font-bold text-white mb-2"><i className="fa-solid fa-flag-checkered text-blue-400 mr-2" />{D.ui.result}</h4>
                <p className="text-slate-400 text-sm leading-relaxed mb-6">{s.result}</p>

                <button onClick={() => { setServiceModal(null); setTimeout(() => scrollTo('contact'), 300); }} className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold text-sm transition-all">
                  {s.cta}
                </button>
              </>
            );
          })()}
        </Modal>

        {/* ═══ DELIVERABLES ═══ */}
        <Section id="deliverables">
          <SectionHeader title={D.deliverables.title} subtitle={D.deliverables.subtitle} />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {D.deliverables.items.map((d, i) => (
              <div key={i} className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-5 flex items-start gap-4 hover:border-blue-500/30 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                  <i className={`fa-solid ${d.icon} text-blue-400`} />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">{d.name}</h4>
                  <p className="text-slate-400 text-xs mt-1">{d.desc}</p>
                  {d.format && <span className="text-xs text-blue-400/70 mt-1 inline-block">{d.format}</span>}
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* ═══ WHY TRUST ═══ */}
        <Section id="why-trust">
          <SectionHeader title={D.whyTrust.title} />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-4xl mx-auto">
            {D.whyTrust.items.map((w, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <i className={`fa-solid ${w.icon} text-blue-400 text-sm`} />
                </div>
                <div>
                  <h4 className="font-semibold text-white text-sm">{w.title}</h4>
                  <p className="text-slate-400 text-xs mt-1 leading-relaxed">{w.text}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* ═══ ROADMAP / CURVED ROAD ═══ */}
        <Section id="roadmap">
          <SectionHeader tag={D.roadmap.tag} title={D.roadmap.title} subtitle={D.roadmap.subtitle} />
          <div className="relative max-w-4xl mx-auto">
            {/* SVG curved road (desktop) */}
            <svg className="hidden md:block absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none">
              <path
                d="M 50% 0 Q 80% 10%, 50% 20% Q 20% 30%, 50% 40% Q 80% 50%, 50% 60% Q 20% 70%, 50% 80% Q 80% 90%, 50% 100%"
                fill="none" stroke="url(#roadGrad)" strokeWidth="2" strokeDasharray="8 4" className="animate-road-dash" opacity="0.3"
              />
              <defs>
                <linearGradient id="roadGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" /><stop offset="50%" stopColor="#10b981" /><stop offset="100%" stopColor="#a855f7" />
                </linearGradient>
              </defs>
            </svg>

            <div className="grid md:grid-cols-2 gap-x-8 gap-y-0">
              {D.roadmap.steps.map((s, idx) => {
                const isLeft = idx % 2 === 0;
                return (
                  <div
                    key={s.step}
                    className={`relative flex items-start gap-3 md:gap-4 mb-6 animate-road-item ${isLeft ? 'md:col-start-1' : 'md:col-start-2'}`}
                    style={{ animationDelay: `${idx * 0.15}s` }}
                  >
                    {/* Numbered circle */}
                    <div className={`relative z-10 w-11 h-11 rounded-full bg-gradient-to-br ${stepColors[s.color] || stepColors.blue} flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-lg shadow-${s.color === 'blue' ? 'blue' : s.color === 'green' ? 'emerald' : s.color === 'purple' ? 'purple' : 'amber'}-500/20`}>
                      {s.step}
                    </div>
                    {/* Card */}
                    <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-4 flex-1 hover:border-slate-600 hover:bg-slate-800/60 transition-all group">
                      <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
                        <h4 className="font-bold text-white text-sm group-hover:text-blue-300 transition-colors">{s.name}</h4>
                        {s.duration && <span className="text-[10px] text-slate-500 font-mono bg-slate-800 px-2 py-0.5 rounded">{s.duration}</span>}
                      </div>
                      <p className="text-slate-400 text-xs leading-relaxed">{s.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Section>

        {/* ═══ PRICING ═══ */}
        <Section id="pricing">
          <SectionHeader tag={D.pricing.tag} title={D.pricing.title} subtitle={D.pricing.subtitle} />
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {D.pricing.items.map((p, i) => (
              <TiltCard key={i} className="flex flex-col">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                    <i className={`fa-solid ${p.icon} text-blue-400`} />
                  </div>
                  <h4 className="font-bold text-white text-sm leading-tight">{p.service}</h4>
                </div>
                <p className="text-slate-400 text-xs leading-relaxed mb-4 flex-1">{p.desc}</p>
                <span className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
                  {p.price}
                </span>
              </TiltCard>
            ))}
          </div>
          <p className="text-center text-slate-500 text-sm mt-6">{D.pricing.note}</p>
          <div className="text-center mt-6">
            <button onClick={() => scrollTo('contact')} className="px-8 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold text-sm shadow-lg shadow-blue-500/25 transition-all hover:-translate-y-0.5">
              {D.ui.discussTask}
            </button>
          </div>
        </Section>

        {/* ═══ FAQ ═══ */}
        <Section id="faq">
          <SectionHeader title={D.faq.title} />
          <div className="max-w-2xl mx-auto space-y-3">
            {D.faq.items.map((f, i) => (
              <FAQItem key={i} q={f.q} a={f.a} />
            ))}
          </div>
        </Section>

        {/* ═══ CONTACT ═══ */}
        <Section id="contact">
          <SectionHeader title={D.contact.title} subtitle={D.contact.subtitle} />

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Form */}
            <div>
              <h3 className="text-lg font-bold mb-4">{D.contact.formTitle}</h3>
              <form onSubmit={handleFormSubmit} className="space-y-3">
                <input
                  type="text" required value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={D.contact.namePlaceholder}
                  className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors text-sm"
                />
                <input
                  type="text" required value={formData.contact}
                  onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                  placeholder={D.contact.contactPlaceholder}
                  className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors text-sm"
                />
                <textarea
                  required rows={4} value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder={D.contact.messagePlaceholder}
                  className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors resize-none text-sm"
                />
                <button
                  type="submit" disabled={formStatus === 'sending'}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 disabled:opacity-50 text-white font-bold text-sm transition-all flex items-center justify-center gap-2"
                >
                  <i className="fas fa-paper-plane" />
                  {formStatus === 'sending' ? D.contact.sending : D.contact.sendBtn}
                </button>
              </form>

              {/* Toast notification */}
              {formStatus === 'success' && (
                <div className="mt-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 flex items-center gap-3 animate-modal-in">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                    <i className="fa-solid fa-check text-emerald-400" />
                  </div>
                  <p className="text-emerald-300 text-sm">{D.contact.success}</p>
                </div>
              )}
              {formStatus === 'error' && (
                <div className="mt-4 bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center gap-3 animate-modal-in">
                  <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                    <i className="fa-solid fa-xmark text-red-400" />
                  </div>
                  <p className="text-red-300 text-sm">{D.contact.error}</p>
                </div>
              )}

              <p className="text-slate-500 text-xs mt-4">{D.contact.afterFormText}</p>
            </div>

            {/* Contact channels */}
            <div className="grid grid-cols-2 gap-3 content-start">
              {D.contact.channels.map((c, i) => (
                <a
                  key={i}
                  href={c.href}
                  target={c.href.startsWith('tel') ? undefined : '_blank'}
                  rel="noopener noreferrer"
                  className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4 flex flex-col items-center text-center gap-2 hover:border-blue-500/40 hover:bg-slate-800/60 transition-all group"
                >
                  <i className={`${c.icon.startsWith('fab') ? c.icon : `fa-solid ${c.icon}`} text-2xl text-slate-400 group-hover:text-blue-400 transition-colors`} />
                  <span className="font-semibold text-white text-sm">{c.label}</span>
                  <span className="text-xs text-slate-400">{c.value}</span>
                </a>
              ))}
            </div>
          </div>
        </Section>

        {/* ═══ BOTTOM CTA ═══ */}
        <Section id="bottom-cta" className="text-center">
          <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-2xl p-8 md:p-12 max-w-3xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold mb-3">{D.bottomCTA.title}</h2>
            <p className="text-slate-400 text-sm md:text-base mb-6">{D.bottomCTA.subtitle}</p>
            <button onClick={() => scrollTo('contact')} className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold text-sm shadow-lg shadow-blue-500/25 transition-all hover:-translate-y-0.5">
              {D.bottomCTA.btn}
            </button>
          </div>
        </Section>
      </main>

      {/* ───── Footer ───── */}
      <footer className="relative z-10 border-t border-slate-800/50 py-8">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="font-bold text-xl tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300 mb-3 inline-block">
            KO
          </button>
          <p className="text-slate-500 text-sm">{D.footer.copyright}</p>
        </div>
      </footer>
    </div>
  );
}
