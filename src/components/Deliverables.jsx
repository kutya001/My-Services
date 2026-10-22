import { useInView } from '../shared/hooks';

/*
 * «На выходе — конкретные артефакты» как конвейер:
 * карточки-документы появляются по очереди, стрелки между ними прорисовываются,
 * по стрелкам бегут «пакеты данных». На компьютере — змейка 3 × 2, на телефоне — столбик.
 */
const POS = [
  'lg:col-start-1 lg:row-start-1',
  'lg:col-start-2 lg:row-start-1',
  'lg:col-start-3 lg:row-start-1',
  'lg:col-start-3 lg:row-start-2',
  'lg:col-start-2 lg:row-start-2',
  'lg:col-start-1 lg:row-start-2',
];
// куда ведёт стрелка от карточки на компьютере
const ARROW = ['right', 'right', 'down', 'left', 'left', null];

export default function Deliverables({ items, stepLabel }) {
  const [ref, inView] = useInView({ threshold: 0.15 });
  return (
    <div ref={ref} className={`pipe grid gap-10 lg:gap-x-12 lg:gap-y-14 lg:grid-cols-3 ${inView ? 'is-in' : ''}`}>
      {items.map((d, i) => (
        <div key={d.name} className={`pipe-cell relative ${POS[i] || ''}`} style={{ '--i': i }}>
          <div className="pipe-card relative h-full rounded-2xl border border-slate-700/60 bg-slate-800/40 backdrop-blur-md p-5 flex items-start gap-4">
            <div className="pipe-doc flex-shrink-0" aria-hidden="true">
              <i className={`fa-solid ${d.icon}`} />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-1">{stepLabel} {String(i + 1).padStart(2, '0')}</div>
              <h4 className="font-bold text-white text-sm">{d.name}</h4>
              <p className="text-slate-400 text-xs mt-1">{d.desc}</p>
              {d.format && <span className="pipe-format inline-block text-[11px] mt-2 px-2 py-0.5 rounded-md">{d.format}</span>}
            </div>
          </div>
          {i < items.length - 1 && (
            <>
              <span className={`pipe-arrow pipe-arrow-${ARROW[i]} hidden lg:block`} aria-hidden="true"><span className="pipe-packet" /></span>
              <span className="pipe-arrow pipe-arrow-down-m lg:hidden" aria-hidden="true"><span className="pipe-packet" /></span>
            </>
          )}
        </div>
      ))}
    </div>
  );
}
