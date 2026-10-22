import { Fragment, useEffect, useRef, useState } from 'react';
import { useReducedMotion } from '../shared/hooks';
import { fill } from '../shared/site';

const STEP_COLORS = {
  blue: 'from-blue-500 to-blue-600',
  cyan: 'from-cyan-500 to-cyan-600',
  green: 'from-emerald-500 to-emerald-600',
  yellow: 'from-amber-500 to-amber-600',
  orange: 'from-orange-500 to-orange-600',
  purple: 'from-purple-500 to-purple-600',
};
const STEP_HEX = { blue: '#3b82f6', cyan: '#06b6d4', green: '#10b981', yellow: '#f59e0b', orange: '#f97316', purple: '#a855f7' };

/*
 * «Понятный путь»: этапы как маршрут.
 * Сверху — липкая шкала прогресса (10 точек по фазам, текущий этап и фаза).
 * Ниже — линия по центру: она заполняется при прокрутке, бегущая точка показывает,
 * где вы сейчас; карточки выплывают с размытием, номер этапа «загорается»,
 * а строка «На выходе» открывается, когда этап пройден.
 */
export default function Roadmap({ t }) {
  const steps = t.steps;
  const total = steps.length;
  const reduced = useReducedMotion();
  const wrapRef = useRef(null);
  const itemRefs = useRef([]);
  const [progress, setProgress] = useState(reduced ? 1 : 0);
  const [reached, setReached] = useState(reduced ? total : 0);
  const [seen, setSeen] = useState(reduced ? total : 0);
  // цвет линии совпадает с цветом этапа в том месте, где стоит его номер
  const [stops, setStops] = useState('');

  useEffect(() => {
    if (reduced) {
      setProgress(1); setReached(total); setSeen(total);
      return undefined;
    }
    let raf = 0;
    const calc = () => {
      raf = 0;
      const el = wrapRef.current;
      if (!el) return;
      const vh = window.innerHeight;
      const line = vh * 0.58;
      const r = el.getBoundingClientRect();
      setProgress(Math.max(0, Math.min(1, (line - r.top) / r.height)));
      let nReached = 0;
      let nSeen = 0;
      itemRefs.current.forEach((node) => {
        if (!node) return;
        const top = node.getBoundingClientRect().top;
        if (top + 24 < line) nReached += 1;
        if (top < vh * 0.9) nSeen += 1;
      });
      setReached(nReached);
      setSeen(nSeen);
      const st = itemRefs.current
        .map((node, i) => (node ? `${STEP_HEX[steps[i].color] || STEP_HEX.blue} ${(((node.getBoundingClientRect().top + 28 - r.top) / r.height) * 100).toFixed(1)}%` : null))
        .filter(Boolean)
        .join(', ');
      setStops(st);
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(calc); };
    calc();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [reduced, total, steps]);

  const currentIdx = Math.max(0, reached - 1);
  const currentStep = steps[currentIdx];
  const currentPhase = t.phases.find((p) => currentStep.step >= p.from && currentStep.step <= p.to) || t.phases[0];
  const goTo = (i) => itemRefs.current[i]?.scrollIntoView({ behavior: 'smooth', block: 'center' });

  return (
    <div className="road">
      {/* Липкая шкала прогресса */}
      <div className="road-overview sticky z-20 mx-auto max-w-4xl rounded-2xl border border-slate-700/60 bg-slate-950/80 backdrop-blur-lg px-4 py-3 mb-10">
        <div className="flex items-center justify-between gap-3 mb-2.5">
          <span className="text-xs font-semibold text-white flex items-center gap-2 min-w-0">
            <i className={`fa-solid ${currentPhase.icon} text-blue-400`} aria-hidden="true" />
            <span className="truncate">{currentPhase.name}</span>
          </span>
          <span className="text-[11px] font-mono text-slate-400 flex-shrink-0">
            {fill(t.stepOf, { n: reached > 0 ? reached : 1, total })}
          </span>
        </div>
        <div className="flex items-center gap-1 sm:gap-1.5" role="list">
          {steps.map((s, i) => {
            const phaseIdx = t.phases.findIndex((p) => s.step >= p.from && s.step <= p.to);
            const newPhase = i > 0 && t.phases[phaseIdx]?.from === s.step;
            return (
              <Fragment key={s.step}>
                {newPhase && <span className="road-ov-gap" aria-hidden="true" />}
                <button
                  type="button"
                  role="listitem"
                  onClick={() => goTo(i)}
                  title={`${s.step}. ${s.name}`}
                  aria-label={`${s.step}. ${s.name}`}
                  className={`road-ov-dot flex-1 ${i < reached ? 'on' : ''} ${i === currentIdx && reached > 0 ? 'cur' : ''}`}
                >
                  <span className={`bg-gradient-to-r ${STEP_COLORS[s.color] || STEP_COLORS.blue}`} />
                </button>
              </Fragment>
            );
          })}
        </div>
        <div className="hidden md:flex mt-2 text-[10px] uppercase tracking-wider text-slate-500">
          {t.phases.map((p) => (
            <span key={p.name} className={`road-ov-phase ${p === currentPhase && reached > 0 ? 'on' : ''}`} style={{ flex: p.to - p.from + 1 }}>
              {p.name}
            </span>
          ))}
        </div>
      </div>

      <p className="text-center text-xs text-slate-500 -mt-6 mb-8"><i className="fa-solid fa-route mr-1.5" aria-hidden="true" />{t.hint}</p>

      <div ref={wrapRef} className="relative max-w-5xl mx-auto">
        {/* Линия маршрута и «бегущая точка» */}
        <div className="road-track" aria-hidden="true">
          <div
            className="road-fill"
            style={{
              clipPath: `inset(0 0 ${(100 - progress * 100).toFixed(2)}% 0 round 3px)`,
              backgroundImage: stops ? `linear-gradient(to bottom, ${stops})` : undefined,
            }}
          />
          <span className="road-traveler" style={{ top: `${progress * 100}%` }} />
        </div>

        <ol className="relative">
          {steps.map((s, i) => {
            const phase = t.phases.find((p) => p.from === s.step);
            const on = i < reached;
            const isCur = i === currentIdx && reached > 0;
            const side = i % 2 === 0 ? 'road-left' : 'road-right';
            return (
              <Fragment key={s.step}>
                {phase && (
                  <li className={`road-phase ${i < seen ? 'seen' : ''}`}>
                    <span className="road-phase-pill">
                      <i className={`fa-solid ${phase.icon}`} aria-hidden="true" />
                      {phase.name}
                    </span>
                  </li>
                )}
                <li
                  ref={(node) => { itemRefs.current[i] = node; }}
                  className={`road-step ${side} ${i < seen ? 'seen' : ''} ${on ? 'on' : ''} ${isCur ? 'cur' : ''}`}
                >
                  <button type="button" onClick={() => goTo(i)} className={`road-node bg-gradient-to-br ${STEP_COLORS[s.color] || STEP_COLORS.blue}`} aria-label={`${s.step}. ${s.name}`}>
                    <span className="road-num">{s.step}</span>
                    <i className="fa-solid fa-check road-check" aria-hidden="true" />
                  </button>
                  <div className="road-card rounded-2xl border border-slate-700/60 bg-slate-800/50 backdrop-blur-md p-4 sm:p-5">
                    <div className="flex items-start justify-between gap-3 mb-1.5">
                      <h4 className="font-bold text-white text-base leading-snug">{s.name}</h4>
                      {s.duration && <span className="text-[10px] text-slate-400 font-mono bg-slate-800 border border-slate-700 px-2 py-0.5 rounded-full whitespace-nowrap">{s.duration}</span>}
                    </div>
                    <p className="text-slate-400 text-sm leading-relaxed">{s.desc}</p>
                    {s.result && (
                      <div className="road-result mt-3 flex items-center gap-2 text-xs rounded-lg px-3 py-2">
                        <i className="fa-solid fa-file-circle-check" aria-hidden="true" />
                        <span><b>{t.resultLabel}:</b> {s.result}</span>
                      </div>
                    )}
                  </div>
                </li>
              </Fragment>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
