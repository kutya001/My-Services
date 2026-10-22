import { useEffect, useRef, useState } from 'react';
import { useInView } from '../shared/hooks';

/*
 * «Почему мне доверяют» — схема-звезда: в центре фото, вокруг причины.
 * Лучи прорисовываются из центра, причины выплывают по очереди;
 * наведение (или фокус с клавиатуры) подсвечивает луч и показывает причину в центре.
 * Координаты лучей считаются в реальных пикселях, поэтому линии не искажаются.
 */
export default function WhyTrust({ t, photo }) {
  const [ref, inView] = useInView({ threshold: 0.2 });
  const boxRef = useRef(null);
  const nodeRefs = useRef([]);
  const [box, setBox] = useState({ w: 1000, h: 560 });
  const [sizes, setSizes] = useState([]);
  const [active, setActive] = useState(null);
  const n = t.items.length;
  const points = t.items.map((_, i) => {
    const a = (-90 + (360 / n) * i) * (Math.PI / 180);
    return { x: 50 + 37 * Math.cos(a), y: 50 + 39 * Math.sin(a) };
  });
  const cur = active !== null ? t.items[active] : null;

  useEffect(() => {
    const el = boxRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return undefined;
    const measure = () => {
      const w = Math.round(el.clientWidth);
      const h = Math.round(el.clientHeight);
      if (w > 0 && h > 0) setBox((b) => (b.w === w && b.h === h ? b : { w, h }));
      const next = nodeRefs.current.map((n) => (n ? { w: n.offsetWidth, h: n.offsetHeight } : null));
      setSizes((prev) => (JSON.stringify(prev) === JSON.stringify(next) ? prev : next));
    };
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    nodeRefs.current.forEach((n) => n && ro.observe(n));
    measure();
    return () => ro.disconnect();
  }, [n]);

  // луч идёт от края круга в центре до края карточки, на конце — «порт»
  const cx = box.w / 2;
  const cy = box.h / 2;
  const HUB_R = 96;
  const rays = points.map((p, i) => {
    const px = (p.x / 100) * box.w;
    const py = (p.y / 100) * box.h;
    const dx = px - cx;
    const dy = py - cy;
    const len = Math.hypot(dx, dy) || 1;
    const ux = dx / len;
    const uy = dy / len;
    const s = sizes[i] || { w: 256, h: 130 };
    const t = Math.min(ux ? s.w / 2 / Math.abs(ux) : Infinity, uy ? s.h / 2 / Math.abs(uy) : Infinity);
    const r = (v) => Math.round(v * 10) / 10;
    return { x1: r(cx + ux * HUB_R), y1: r(cy + uy * HUB_R), x2: r(px - ux * (t + 8)), y2: r(py - uy * (t + 8)) };
  });

  return (
    <div ref={ref} className={`trust ${inView ? 'is-in' : ''}`}>
      {/* Компьютер: звезда */}
      <div ref={boxRef} className="hidden lg:block relative mx-auto max-w-5xl h-[560px]">
        <svg className="absolute inset-0 w-full h-full overflow-visible" viewBox={`0 0 ${box.w} ${box.h}`} aria-hidden="true">
          {rays.map((r, i) => {
            const d = `M ${r.x1} ${r.y1} L ${r.x2} ${r.y2}`;
            return (
              <g key={i} className={active === i ? 'trust-on' : ''} style={{ '--i': i }}>
                <path d={d} pathLength="1" className="trust-ray" />
                <circle cx={r.x1} cy={r.y1} r="3" className="trust-port trust-port-in" />
                <circle cx={r.x2} cy={r.y2} r="4.5" className="trust-port" />
                {active === i && (
                  <circle r="4" className="trust-signal">
                    <animateMotion dur="1.1s" repeatCount="indefinite" path={d} />
                  </circle>
                )}
              </g>
            );
          })}
        </svg>
        <div className="trust-hub trust-hub-center absolute left-1/2 top-1/2 w-44 h-44 rounded-full flex flex-col items-center justify-center text-center p-4">
          <div className="trust-hub-photo w-16 h-16 rounded-full overflow-hidden mb-2">
            {cur ? (
              <span key={active} className="trust-hub-swap w-full h-full flex items-center justify-center trust-hub-icon"><i className={`fa-solid ${cur.icon} text-2xl`} aria-hidden="true" /></span>
            ) : (
              <img src={photo} alt="" className="w-full h-full object-cover" />
            )}
          </div>
          <div key={active ?? 'hub'} className="trust-hub-swap text-sm font-bold text-white leading-tight">{cur ? cur.title : t.hubTitle}</div>
          {!cur && <div className="text-[11px] text-slate-400 mt-1">{t.hubText}</div>}
        </div>
        {t.items.map((w, i) => (
          <div
            key={w.title}
            ref={(el) => { nodeRefs.current[i] = el; }}
            className="trust-node absolute w-64"
            style={{ left: `${points[i].x}%`, top: `${points[i].y}%`, '--i': i }}
            onMouseEnter={() => setActive(i)}
            onMouseLeave={() => setActive(null)}
            onFocus={() => setActive(i)}
            onBlur={() => setActive(null)}
            tabIndex={0}
          >
            <div className={`trust-card rounded-2xl border border-slate-700/60 bg-slate-800/50 backdrop-blur-md p-4 flex items-start gap-3 ${active === i ? 'trust-card-on' : ''}`}>
              <div className="trust-icon w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0">
                <i className={`fa-solid ${w.icon}`} aria-hidden="true" />
              </div>
              <div>
                <h4 className="font-semibold text-white text-sm">{w.title}</h4>
                <p className="text-slate-400 text-xs mt-1 leading-relaxed">{w.text}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Телефон и планшет: центр сверху, причины веером вниз */}
      <div className="lg:hidden max-w-xl mx-auto">
        <div className="trust-hub trust-hub-m mx-auto w-28 h-28 rounded-full flex flex-col items-center justify-center text-center mb-6">
          <div className="trust-hub-photo w-14 h-14 rounded-full overflow-hidden mb-1"><img src={photo} alt="" className="w-full h-full object-cover" /></div>
          <div className="text-xs font-bold text-white px-2 leading-tight">{t.hubTitle}</div>
        </div>
        <ol className="relative pl-10">
          <span className="trust-vline" aria-hidden="true" />
          {t.items.map((w, i) => (
            <li key={w.title} className="trust-node-m relative mb-4" style={{ '--i': i }}>
              <span className="trust-dot absolute -left-[33px] top-5" aria-hidden="true" />
              <div className="rounded-2xl border border-slate-700/60 bg-slate-800/50 p-4 flex items-start gap-3">
                <div className="trust-icon w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <i className={`fa-solid ${w.icon}`} aria-hidden="true" />
                </div>
                <div>
                  <h4 className="font-semibold text-white text-sm">{w.title}</h4>
                  <p className="text-slate-400 text-xs mt-1 leading-relaxed">{w.text}</p>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
