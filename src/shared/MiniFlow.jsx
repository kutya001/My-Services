import { RevealGroup } from './Reveal';

/*
 * Мини-схема «задача → решение → результат»: узлы появляются по очереди,
 * соединительная линия прорисовывается сверху вниз.
 * steps: [{ key, label, text, tone: 'task' | 'solution' | 'result', icon }]
 */
export default function MiniFlow({ steps, className = '' }) {
  return (
    <RevealGroup as="ol" step={220} className={`miniflow ${className}`}>
      {steps.map((s, i) => (
        <li key={s.key} className={`mf-step mf-${s.tone} rv-item rv-left`} style={{ '--i': i }}>
          <span className="mf-dot" aria-hidden="true">
            <i className={`fa-solid ${s.icon}`} />
          </span>
          <div className="mf-body min-w-0">
            <div className="mf-label text-[11px] uppercase tracking-wider font-bold">{s.label}</div>
            <p className={`text-sm mt-0.5 ${s.tone === 'task' ? 'text-slate-400' : 'text-slate-300'}`}>{s.text}</p>
          </div>
        </li>
      ))}
    </RevealGroup>
  );
}
