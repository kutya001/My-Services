import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import RU from './data-service.json';
import EN from './data-service-en.json';
import KG from './data-service-kg.json';
import CAREER_LOCAL from './shared/career.json';
import InteractiveBackground from './components/InteractiveBackground';
import TiltCard from './components/TiltCard';
import Cases from './components/Cases';
import Quiz from './components/Quiz';
import Testimonials from './components/Testimonials';
import BusinessCard from './components/BusinessCard';
import Roadmap from './components/Roadmap';
import WhyTrust from './components/WhyTrust';
import Deliverables from './components/Deliverables';
import SiteNav from './shared/SiteNav';
import SectionHeader from './shared/SectionHeader';
import { Reveal, RevealGroup, scatter } from './shared/Reveal';
import StickyWhatsApp from './components/StickyWhatsApp';
import Logo from './shared/Logo';
import { startVisitTracking, sendContactForm } from './tracking';
import { initAnonymousAnalytics } from './shared/analytics';
import {
  IS_PREVIEW, LINKS, SITE_URLS, getInitialLang, syncLangToUrl, storage, loc, fill, yearVars,
  formatRange, withViewTransition, centerOf, whatsappLink, isExternal, isValidCareer,
} from './shared/site';

const LANGS_DATA = { ru: RU, en: EN, kg: KG };
const BASE = import.meta.env.BASE_URL;
const THEME_KEY = 'site_theme';
const THEMES = ['light', 'dark', 'warm'];
const THEME_COLORS = { dark: '#020617', light: '#f8fafc', warm: '#f6efe4' };
const PARTICLE_COLORS = { dark: '59, 130, 246', light: '37, 99, 235', warm: '217, 119, 6' };

/* ───── Модальное окно ───── */
function Modal({ open, onClose, closeLabel, children }) {
  useEffect(() => {
    if (!open) return undefined;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onClose} role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 md:p-8 shadow-2xl animate-modal-in"
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" onClick={onClose} aria-label={closeLabel} className="absolute top-4 right-4 text-slate-400 hover:text-white text-xl transition-colors">
          <i className="fa-solid fa-xmark" aria-hidden="true" />
        </button>
        {children}
      </div>
    </div>
  );
}

/* ───── Секция: появление задают блоки внутри ───── */
function Section({ id, children, className = '' }) {
  return <section id={id} className={`w-full scroll-mt-20 ${className}`}>{children}</section>;
}

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-slate-700/50 rounded-xl overflow-hidden">
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="w-full flex items-center justify-between p-5 text-left hover:bg-slate-800/30 transition-colors">
        <span className="font-semibold text-white pr-4">{q}</span>
        <i className={`fa-solid fa-chevron-down text-blue-400 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${open ? 'max-h-60 opacity-100' : 'max-h-0 opacity-0'}`}>
        <p className="px-5 pb-5 text-slate-400 text-sm leading-relaxed">{a}</p>
      </div>
    </div>
  );
}

function PainItem({ icon, title, text }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-slate-700/50 rounded-xl overflow-hidden hover:border-blue-500/30 transition-colors">
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="w-full flex items-center gap-3 p-4 text-left hover:bg-slate-800/30 transition-colors">
        <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
          <i className={`fa-solid ${icon} text-blue-400 text-sm`} aria-hidden="true" />
        </div>
        <span className="font-semibold text-white flex-1 text-sm">{title}</span>
        <i className={`fa-solid fa-chevron-down text-blue-400 text-xs transition-transform duration-300 ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>
      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${open ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
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
  const [photoLightbox, setPhotoLightbox] = useState(false);
  const [career, setCareer] = useState(CAREER_LOCAL);

  // Язык и тема
  const [lang, setLang] = useState(() => getInitialLang('site_lang'));
  const [theme, setTheme] = useState(() => {
    const saved = storage.get(THEME_KEY);
    return THEMES.includes(saved) ? saved : 'dark';
  });
  const D = LANGS_DATA[lang] || LANGS_DATA.ru;
  const years = useMemo(() => yearVars(career, lang), [career, lang]);

  // Форма
  const [formData, setFormData] = useState({ name: '', contact: '', message: '' });
  const [formStatus, setFormStatus] = useState(null);
  const [mvpTip, setMvpTip] = useState(false);

  useEffect(() => {
    storage.set('site_lang', lang);
    syncLangToUrl(lang);
    document.documentElement.lang = lang === 'kg' ? 'ky' : lang;
    document.title = D.meta.title;
  }, [lang, D.meta.title]);

  useEffect(() => {
    storage.set(THEME_KEY, theme);
    document.documentElement.setAttribute('data-site-theme', theme);
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLORS[theme]);
  }, [theme]);

  const changeTheme = (t, el) => {
    if (t === theme) return;
    const { x, y } = el ? centerOf(el) : {};
    withViewTransition(() => setTheme(t), { kind: 'circle', x, y });
  };
  const changeLang = (l) => {
    setMobileNav(false);
    if (l !== lang) withViewTransition(() => setLang(l));
  };

  // Статистика визитов (без IP) и анонимный счётчик, если подключён
  useEffect(() => {
    const stop = startVisitTracking();
    initAnonymousAnalytics();
    return stop;
  }, []);

  // Опыт работы — с сайта резюме, чтобы новую должность хватило добавить в одном месте
  useEffect(() => {
    if (IS_PREVIEW) return undefined;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 4000);
    fetch(`${SITE_URLS.resume}career.json`, { signal: ctrl.signal, cache: 'no-cache' })
      .then((r) => (r.ok ? r.json() : null))
      .then((remote) => { if (isValidCareer(remote)) setCareer({ ...remote, remote: true }); })
      .catch(() => {})
      .finally(() => clearTimeout(timer));
    return () => { clearTimeout(timer); ctrl.abort(); };
  }, []);

  const careerImg = useCallback((p) => {
    if (!p) return '';
    if (isExternal(p)) return p;
    return career.remote ? `${SITE_URLS.resume}${p}` : `${BASE}${p}`;
  }, [career.remote]);

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (IS_PREVIEW) {
      setFormStatus('preview');
      setTimeout(() => setFormStatus(null), 5000);
      return;
    }
    setFormStatus('sending');
    const ok = await sendContactForm(formData);
    setFormStatus(ok ? 'success' : 'error');
    if (ok) setFormData({ name: '', contact: '', message: '' });
    setTimeout(() => setFormStatus(null), 5000);
  };

  const scrollTo = (id) => {
    setMobileNav(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const discussQuiz = (message) => {
    setFormData((f) => ({ ...f, message }));
    scrollTo('contact');
    setTimeout(() => document.getElementById('cf-name')?.focus({ preventScroll: true }), 700);
  };

  const closeAbout = useCallback(() => setAboutModal(false), []);
  const closeService = useCallback(() => setServiceModal(null), []);

  const navLinks = [
    ['services', D.nav.services],
    ['about', D.nav.about],
    ['cases', D.nav.cases],
    ['roadmap', D.nav.roadmap],
    ['pricing', D.nav.pricing],
    ['contact', D.nav.contact],
  ];

  const servicesCareer = career.jobs.filter((j) => j.services !== false);
  const skillLevels = [
    [D.ui.advanced, 'advanced', 'text-blue-400 border-blue-500/50'],
    [D.ui.intermediate, 'intermediate', 'text-purple-400 border-purple-500/50'],
    [D.ui.basic, 'basic', 'text-slate-400 border-slate-600'],
  ];
  const showTestimonials = D.testimonials.items.length > 0 || IS_PREVIEW;
  const waText = D.whatsapp.text;

  return (
    <div className="relative w-full site">
      <InteractiveBackground mode="order" color={PARTICLE_COLORS[theme]} />

      <SiteNav
        brand="KO"
        brandHref="#hero"
        links={navLinks.map(([id, label]) => ({ id, label }))}
        external={[{ href: SITE_URLS.resume, label: D.nav.resume }]}
        labels={{ theme: D.theme, themeGroup: D.ui.themeGroup, language: D.ui.language, menu: D.ui.menu }}
        theme={theme}
        onTheme={changeTheme}
        lang={lang}
        onLang={changeLang}
        breakpoint="xl"
      />

      <main className="relative z-10 max-w-6xl mx-auto px-4 md:px-6 pt-24 pb-20 flex flex-col gap-24 md:gap-32">

        {/* ═══ HERO ═══ */}
        <section id="hero" className="scroll-mt-20">
          <RevealGroup step={140} threshold={0} className="flex flex-col items-center text-center pt-6 md:pt-10">
          <button type="button" className="rv-item rv-pop relative mb-6 cursor-pointer group rounded-full" style={{ '--i': 0 }} onClick={() => setPhotoLightbox(true)} aria-label={D.ui.openPhoto}>
            <div className="hero-photo w-32 h-32 md:w-44 md:h-44 rounded-full border-2 border-blue-500/50 p-1 transition-transform duration-300 group-hover:scale-105">
              <img src={`${BASE}MyImage.jpeg`} alt={D.about.name} className="w-full h-full rounded-full object-cover" />
            </div>
            <div className="absolute inset-0 rounded-full flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-colors">
              <i className="fa-solid fa-expand text-white text-lg opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true" />
            </div>
          </button>

          {photoLightbox && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md" onClick={() => setPhotoLightbox(false)}>
              <button type="button" aria-label={D.ui.close} className="absolute top-6 right-6 text-white/70 hover:text-white text-2xl z-10 transition-colors">
                <i className="fa-solid fa-xmark" aria-hidden="true" />
              </button>
              <img src={`${BASE}MyImage.jpeg`} alt={D.about.name} className="max-w-full max-h-[90vh] rounded-2xl shadow-2xl animate-modal-in object-contain" onClick={(e) => e.stopPropagation()} />
            </div>
          )}

          <h1 className="rv-item rv-blur text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tight mb-4 leading-tight text-balance" style={{ '--i': 1 }}>{D.hero.title}</h1>

          <p className="rv-item rv-up text-base md:text-xl text-slate-400 max-w-2xl mb-6 leading-relaxed" style={{ '--i': 2 }}>
            {D.hero.subtitle}{' '}
            <span className="relative inline-block cursor-help" onMouseEnter={() => setMvpTip(true)} onMouseLeave={() => setMvpTip(false)} onClick={() => setMvpTip(!mvpTip)}>
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

          <div className="rv-item rv-up flex flex-wrap justify-center gap-3 md:gap-6 mb-8" style={{ '--i': 3 }}>
            {D.hero.trustPoints.map((t) => (
              <span key={t} className="flex items-center gap-2 text-xs md:text-sm text-slate-400">
                <i className="fa-solid fa-circle-check text-blue-400" aria-hidden="true" />
                {fill(t, years)}
              </span>
            ))}
          </div>

          <div className="rv-item rv-up flex flex-col sm:flex-row gap-3 mb-4" style={{ '--i': 4 }}>
            <button type="button" onClick={() => scrollTo('contact')} className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold text-sm shadow-lg shadow-blue-500/25 transition-all hover:-translate-y-0.5">
              {D.hero.ctaPrimary}
            </button>
            <button type="button" onClick={() => scrollTo('services')} className="px-8 py-3.5 rounded-xl border border-slate-600 hover:border-blue-500 text-slate-300 hover:text-white font-bold text-sm transition-all hover:-translate-y-0.5">
              {D.hero.ctaSecondary}
            </button>
          </div>
          <p className="rv-item rv-fade text-xs text-slate-500 max-w-md" style={{ '--i': 5 }}>{D.hero.microText}</p>
          </RevealGroup>
        </section>

        {/* ═══ PAIN POINTS ═══ */}
        <Section id="pain-points">
          <SectionHeader title={D.painPoints.title} subtitle={D.painPoints.subtitle} />
          <RevealGroup step={110} className="max-w-2xl mx-auto space-y-3">
            {D.painPoints.items.map((p, i) => (
              <div key={p.title} className="rv-item rv-scatter" style={scatter(i, 1.4)}>
                <PainItem icon={p.icon} title={p.title} text={p.text} />
              </div>
            ))}
          </RevealGroup>
        </Section>

        {/* ═══ ABOUT ME ═══ */}
        <Section id="about">
          <SectionHeader tag={D.about.tag} title={D.about.title} />
          <div className="max-w-3xl mx-auto">
            <Reveal variant="zoom">
            <TiltCard innerClassName="flex flex-col gap-5">
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
              <RevealGroup step={90} delay={250} className="flex flex-wrap gap-2">
                {D.about.proofPoints.map((p, i) => (
                  <span key={p} className="rv-item rv-pop text-xs bg-slate-800 border border-slate-700 text-slate-300 px-3 py-1 rounded-full" style={{ '--i': i }}>{fill(p, years)}</span>
                ))}
              </RevealGroup>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                <button type="button" onClick={() => setAboutModal(true)} className="text-blue-400 hover:text-blue-300 text-sm font-semibold flex items-center gap-2 transition-colors">
                  {D.about.detailsBtn} <i className="fa-solid fa-arrow-right text-xs" aria-hidden="true" />
                </button>
                <a href={SITE_URLS.resume} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 text-sm font-semibold flex items-center gap-2 transition-colors">
                  <i className="fa-solid fa-file-lines text-xs" aria-hidden="true" /> {D.about.resumeBtn}
                  <i className="fa-solid fa-arrow-up-right-from-square text-[10px]" aria-hidden="true" />
                </a>
              </div>
            </TiltCard>
            </Reveal>
            <Reveal variant="left" delay={200} as="blockquote" className="mt-6 border-l-2 border-blue-500/50 pl-4 text-slate-400 text-sm italic">{D.about.quote}</Reveal>
          </div>
        </Section>

        {/* About Modal */}
        <Modal open={aboutModal} onClose={closeAbout} closeLabel={D.ui.close}>
          <h2 className="text-2xl font-bold mb-6">{D.ui.aboutModalTitle}</h2>

          <h3 className="text-lg font-bold text-blue-400 mb-4"><i className="fa-solid fa-briefcase mr-2" aria-hidden="true" />{D.ui.career}</h3>
          <div className="relative mb-8">
            <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-blue-500 via-cyan-500 to-slate-700 opacity-40" />
            <div className="space-y-0">
              {servicesCareer.map((j, i) => (
                <div key={j.id} className="relative flex items-start gap-4 pl-0 group animate-career-item" style={{ animationDelay: `${i * 0.1}s` }}>
                  <div className="relative z-10 flex-shrink-0">
                    <div className="w-10 h-10 rounded-full border-2 border-blue-500/50 bg-slate-900 overflow-hidden group-hover:border-blue-400 transition-colors shadow-md">
                      <Logo src={careerImg(j.img)} name={loc(j.company, lang)} className="w-full h-full" />
                    </div>
                  </div>
                  <div className="bg-slate-800/40 border border-slate-700/40 rounded-lg p-3 flex-1 mb-3 group-hover:border-blue-500/30 group-hover:bg-slate-800/60 transition-all">
                    <div className="flex justify-between items-start flex-wrap gap-1">
                      <span className="font-semibold text-white text-sm">{loc(j.role, lang)}</span>
                      <span className="text-[10px] text-slate-500 font-mono bg-slate-800 px-1.5 py-0.5 rounded">{formatRange(j.start, j.end, lang)}</span>
                    </div>
                    <p className="text-blue-400 text-xs mt-0.5">{loc(j.company, lang)}</p>
                    <p className="text-slate-400 text-xs mt-1 leading-relaxed">{loc(j.desc, lang)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <h3 className="text-lg font-bold text-blue-400 mb-3"><i className="fa-solid fa-layer-group mr-2" aria-hidden="true" />{D.ui.techStack}</h3>
          <div className="mb-6 space-y-2">
            {skillLevels.map(([label, level, cls]) => (
              <div key={level}>
                <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">{label}</span>
                <div className="flex flex-wrap gap-2 mt-1">
                  {career.skills.filter((s) => s.level === level).map((s) => (
                    <span key={s.id} className={`text-xs px-2.5 py-1 rounded-md border bg-slate-800/30 ${cls}`}>{loc(s.name, lang)}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <h3 className="text-lg font-bold text-blue-400 mb-3"><i className="fa-solid fa-graduation-cap mr-2" aria-hidden="true" />{D.ui.education}</h3>
          <div className="space-y-2 mb-6">
            {D.about.modal.education.map((e, i) => (
              <div key={e.name} className="bg-slate-800/30 border border-slate-700/40 rounded-lg p-3 flex items-center gap-3 animate-career-item hover:border-blue-500/30 transition-colors" style={{ animationDelay: `${i * 0.15}s` }}>
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center flex-shrink-0">
                  <i className="fa-solid fa-graduation-cap text-blue-400 text-sm" aria-hidden="true" />
                </div>
                <div className="flex-1"><span className="text-slate-200 text-sm font-medium">{e.name}</span></div>
                <span className="text-xs text-slate-500 font-mono bg-slate-800 px-2 py-0.5 rounded">{e.year}</span>
              </div>
            ))}
          </div>

          <h3 className="text-lg font-bold text-blue-400 mb-3"><i className="fa-solid fa-certificate mr-2" aria-hidden="true" />{D.ui.courses}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {D.about.modal.courses.map((c, i) => (
              <div key={c.name} className="bg-slate-800/30 border border-slate-700/40 rounded-lg p-3 flex items-center gap-3 animate-career-item hover:border-purple-500/30 transition-colors" style={{ animationDelay: `${i * 0.12}s` }}>
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center flex-shrink-0">
                  <i className="fa-solid fa-certificate text-purple-400 text-xs" aria-hidden="true" />
                </div>
                <div className="flex-1 min-w-0"><span className="text-slate-200 text-xs font-medium block truncate">{c.name}</span></div>
                <span className="text-[10px] text-slate-500 font-mono flex-shrink-0">{c.year}</span>
              </div>
            ))}
          </div>
        </Modal>

        {/* ═══ SERVICES ═══ */}
        <Section id="services">
          <SectionHeader tag={D.services.tag} title={D.services.title} subtitle={D.services.subtitle} />
          <RevealGroup step={150} className="grid md:grid-cols-3 gap-6">
            {D.services.items.map((s, i) => (
              <div key={s.id} className={`rv-item ${['rv-left', 'rv-up', 'rv-right'][i % 3]}`} style={{ '--i': i }}>
              <TiltCard className="flex flex-col h-full" innerClassName="flex flex-col h-full">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center mb-4">
                  <i className={`fa-solid ${s.icon} text-blue-400 text-xl`} aria-hidden="true" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{s.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-5 flex-1">{s.tagline}</p>
                <div className="flex flex-col gap-2 mt-auto">
                  <button type="button" onClick={() => setServiceModal(i)} className="text-blue-400 hover:text-blue-300 text-sm font-semibold flex items-center gap-1 transition-colors">
                    {D.ui.moreDetails} <i className="fa-solid fa-arrow-right text-xs" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollTo(s.id === 'analytics_reporting' ? 'cases' : 'contact')}
                    className="w-full py-2.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 text-sm font-semibold transition-colors"
                  >
                    {s.cta}
                  </button>
                </div>
              </TiltCard>
              </div>
            ))}
          </RevealGroup>
        </Section>

        <Modal open={serviceModal !== null} onClose={closeService} closeLabel={D.ui.close}>
          {serviceModal !== null && (() => {
            const s = D.services.items[serviceModal];
            return (
              <>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                    <i className={`fa-solid ${s.icon} text-blue-400`} aria-hidden="true" />
                  </div>
                  <h2 className="text-2xl font-bold">{s.title}</h2>
                </div>
                <p className="text-slate-300 mb-5">{s.tagline}</p>
                <h4 className="font-bold text-white mb-2"><i className="fa-solid fa-triangle-exclamation text-amber-400 mr-2" aria-hidden="true" />{D.ui.whenNeeded}</h4>
                <ul className="list-disc list-inside text-slate-400 text-sm space-y-1 mb-5">{s.whenNeeded.map((w) => <li key={w}>{w}</li>)}</ul>
                <h4 className="font-bold text-white mb-2"><i className="fa-solid fa-list-check text-green-400 mr-2" aria-hidden="true" />{D.ui.includes}</h4>
                <ul className="list-disc list-inside text-slate-400 text-sm space-y-1 mb-5">{s.includes.map((w) => <li key={w}>{w}</li>)}</ul>
                <h4 className="font-bold text-white mb-2"><i className="fa-solid fa-flag-checkered text-blue-400 mr-2" aria-hidden="true" />{D.ui.result}</h4>
                <p className="text-slate-400 text-sm leading-relaxed mb-6">{s.result}</p>
                <button type="button" onClick={() => { setServiceModal(null); setTimeout(() => scrollTo(s.id === 'analytics_reporting' ? 'cases' : 'contact'), 300); }} className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold text-sm transition-all">
                  {s.cta}
                </button>
              </>
            );
          })()}
        </Modal>

        {/* ═══ DELIVERABLES ═══ */}
        <Section id="deliverables">
          <SectionHeader title={D.deliverables.title} subtitle={D.deliverables.subtitle} />
          <Deliverables items={D.deliverables.items} stepLabel={D.deliverables.flowLabel} />
        </Section>

        {/* ═══ CASES ═══ */}
        <Section id="cases">
          <SectionHeader tag={D.cases.tag} title={D.cases.title} subtitle={D.cases.subtitle} />
          <Cases t={D.cases} lang={lang} />
        </Section>

        {/* ═══ WHY TRUST ═══ */}
        <Section id="why-trust">
          <SectionHeader title={D.whyTrust.title} />
          <WhyTrust t={D.whyTrust} photo={`${BASE}MyImage.jpeg`} />
        </Section>

        {/* ═══ TESTIMONIALS (только с реальными отзывами) ═══ */}
        {showTestimonials && (
          <Section id="testimonials">
            <SectionHeader tag={D.testimonials.tag} title={D.testimonials.title} />
            <Reveal variant="up"><Testimonials t={D.testimonials} /></Reveal>
          </Section>
        )}

        {/* ═══ ROADMAP ═══ */}
        <Section id="roadmap">
          <SectionHeader tag={D.roadmap.tag} title={D.roadmap.title} subtitle={D.roadmap.subtitle} />
          <Roadmap t={D.roadmap} />
        </Section>

        {/* ═══ PRICING ═══ */}
        <Section id="pricing">
          <SectionHeader tag={D.pricing.tag} title={D.pricing.title} subtitle={D.pricing.subtitle} />
          <RevealGroup step={120} className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {D.pricing.items.map((p, i) => (
              <div key={p.service} className="rv-item rv-flip" style={{ '--i': i }}>
              <TiltCard className="flex flex-col h-full" innerClassName="flex flex-col h-full">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                    <i className={`fa-solid ${p.icon} text-blue-400`} aria-hidden="true" />
                  </div>
                  <h4 className="font-bold text-white text-sm leading-tight">{p.service}</h4>
                </div>
                <p className="text-slate-400 text-xs leading-relaxed mb-4 flex-1">{p.desc}</p>
                <span className="price text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">{p.price}</span>
              </TiltCard>
              </div>
            ))}
          </RevealGroup>
          <Reveal variant="fade" as="p" className="text-center text-slate-500 text-sm mt-6">{D.pricing.note}</Reveal>
          <Reveal variant="pop" className="text-center mt-6">
            <button type="button" onClick={() => scrollTo('contact')} className="px-8 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold text-sm shadow-lg shadow-blue-500/25 transition-all hover:-translate-y-0.5">
              {D.ui.discussTask}
            </button>
          </Reveal>
        </Section>

        {/* ═══ QUIZ ═══ */}
        <Section id="quiz">
          <SectionHeader tag={D.quiz.tag} title={D.quiz.title} subtitle={D.quiz.subtitle} />
          <Reveal variant="zoom"><Quiz key={lang} t={D.quiz} onDiscuss={discussQuiz} /></Reveal>
        </Section>

        {/* ═══ FAQ ═══ */}
        <Section id="faq">
          <SectionHeader title={D.faq.title} />
          <RevealGroup step={80} className="max-w-2xl mx-auto space-y-3">
            {D.faq.items.map((f, i) => (
              <div key={f.q} className={`rv-item ${i % 2 ? 'rv-right' : 'rv-left'}`} style={{ '--i': i }}>
                <FAQItem q={f.q} a={f.a} />
              </div>
            ))}
          </RevealGroup>
        </Section>

        {/* ═══ CONTACT ═══ */}
        <Section id="contact">
          <SectionHeader title={D.contact.title} subtitle={D.contact.subtitle} />
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Reveal variant="left">
              <h3 className="text-lg font-bold mb-4">{D.contact.formTitle}</h3>
              <form onSubmit={handleFormSubmit} className="space-y-3">
                <label className="sr-only" htmlFor="cf-name">{D.contact.namePlaceholder}</label>
                <input id="cf-name" type="text" required autoComplete="name" value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={D.contact.namePlaceholder}
                  className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors text-sm" />
                <label className="sr-only" htmlFor="cf-contact">{D.contact.contactPlaceholder}</label>
                <input id="cf-contact" type="text" required value={formData.contact}
                  onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                  placeholder={D.contact.contactPlaceholder}
                  className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors text-sm" />
                <label className="sr-only" htmlFor="cf-message">{D.contact.messagePlaceholder}</label>
                <textarea id="cf-message" required rows={4} value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder={D.contact.messagePlaceholder}
                  className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors resize-none text-sm" />
                <button type="submit" disabled={formStatus === 'sending'}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 disabled:opacity-50 text-white font-bold text-sm transition-all flex items-center justify-center gap-2">
                  <i className="fas fa-paper-plane" aria-hidden="true" />
                  {formStatus === 'sending' ? D.contact.sending : D.contact.sendBtn}
                </button>
              </form>

              <div aria-live="polite">
                {formStatus === 'success' && (
                  <div className="mt-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 flex items-center gap-3 animate-modal-in">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0"><i className="fa-solid fa-check text-emerald-400" aria-hidden="true" /></div>
                    <p className="text-emerald-300 text-sm">{D.contact.success}</p>
                  </div>
                )}
                {formStatus === 'error' && (
                  <div className="mt-4 bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center gap-3 animate-modal-in">
                    <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0"><i className="fa-solid fa-xmark text-red-400" aria-hidden="true" /></div>
                    <p className="text-red-300 text-sm">{D.contact.error}</p>
                  </div>
                )}
                {formStatus === 'preview' && (
                  <div className="mt-4 bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-amber-300 text-sm animate-modal-in">{D.contact.previewNotice}</div>
                )}
              </div>
              <p className="text-slate-500 text-xs mt-4">{D.contact.afterFormText}</p>
            </Reveal>

            <div className="flex flex-col gap-3">
              <RevealGroup step={90} className="grid grid-cols-2 gap-3 content-start">
                {D.contact.channels.map((c, i) => {
                  const href = c.href.includes('wa.me') ? whatsappLink(waText) : c.href;
                  return (
                    <a key={c.label} href={href} target={href.startsWith('tel') ? undefined : '_blank'} rel="noopener noreferrer"
                      style={{ '--i': i }}
                      className="rv-item rv-pop contact-tile bg-slate-800/40 border border-slate-700/50 rounded-xl p-4 flex flex-col items-center text-center gap-2 hover:border-blue-500/40 hover:bg-slate-800/60 transition-all group">
                      <i className={`${c.icon.startsWith('fab') ? c.icon : `fa-solid ${c.icon}`} text-2xl text-slate-400 group-hover:text-blue-400 transition-colors`} aria-hidden="true" />
                      <span className="font-semibold text-white text-sm">{c.label}</span>
                      <span className="text-xs text-slate-400">{c.value}</span>
                    </a>
                  );
                })}
              </RevealGroup>
              <Reveal variant="flip" delay={300}><BusinessCard t={D.card} lang={lang} /></Reveal>
            </div>
          </div>
        </Section>

        {/* ═══ BOTTOM CTA ═══ */}
        <Section id="bottom-cta" className="text-center">
          <Reveal variant="zoom" className="cta-glow bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-2xl p-8 md:p-12 max-w-3xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold mb-3">{D.bottomCTA.title}</h2>
            <p className="text-slate-400 text-sm md:text-base mb-6">{D.bottomCTA.subtitle}</p>
            <button type="button" onClick={() => scrollTo('contact')} className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold text-sm shadow-lg shadow-blue-500/25 transition-all hover:-translate-y-0.5">
              {D.bottomCTA.btn}
            </button>
          </Reveal>
        </Section>
      </main>

      {/* ───── Footer ───── */}
      <footer className="relative z-10 border-t border-slate-800/50 py-8">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="brand-mark font-bold text-xl tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300 mb-3 inline-block">
            KO
          </button>
          <div className="flex justify-center flex-wrap gap-x-5 gap-y-2 text-sm mb-3">
            <a href={SITE_URLS.resume} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-blue-400 transition-colors">{D.nav.resume}</a>
            <a href={LINKS.github} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-blue-400 transition-colors">
              <i className="fa-brands fa-github mr-1.5" aria-hidden="true" />GitHub
            </a>
            {LINKS.linkedin && (
              <a href={LINKS.linkedin} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-blue-400 transition-colors">
                <i className="fa-brands fa-linkedin mr-1.5" aria-hidden="true" />LinkedIn
              </a>
            )}
          </div>
          <p className="text-slate-500 text-sm">{fill(D.footer.copyright, years)}</p>
        </div>
      </footer>

      <StickyWhatsApp text={waText} label={D.whatsapp.sticky} />
    </div>
  );
}
