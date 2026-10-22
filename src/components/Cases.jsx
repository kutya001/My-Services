import TiltCard from './TiltCard';
import DemoDashboard from './DemoDashboard';
import MiniFlow from '../shared/MiniFlow';
import { Reveal, RevealGroup } from '../shared/Reveal';
import { IS_PREVIEW } from '../shared/site';

export default function Cases({ t, lang }) {
  return (
    <div className="space-y-12">
      <RevealGroup step={160} className="grid md:grid-cols-3 gap-6">
        {t.items.map((c, i) => {
          const steps = [
            { key: 'task', label: t.task, text: c.task, tone: 'task', icon: 'fa-circle-question' },
            { key: 'solution', label: t.solution, text: c.solution, tone: 'solution', icon: 'fa-gears' },
            c.gain ? { key: 'gain', label: t.gain, text: c.gain, tone: 'result', icon: 'fa-check' } : null,
          ].filter(Boolean);
          return (
            <div key={c.id} className="rv-item rv-flip" style={{ '--i': i }}>
              <TiltCard className="flex flex-col h-full" innerClassName="flex flex-col h-full gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center flex-shrink-0">
                    <i className={`fa-solid ${c.icon} text-blue-400 text-lg`} aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-lg font-bold text-white leading-snug">{c.title}</h3>
                    <p className="text-[11px] font-mono text-slate-500 mt-0.5">{c.stack}</p>
                  </div>
                </div>
                <MiniFlow steps={steps} />
                {IS_PREVIEW && c.todo && (
                  <p className="preview-todo mt-auto text-xs rounded-lg px-3 py-2">
                    <i className="fa-solid fa-pen mr-1.5" aria-hidden="true" />
                    {c.todo}
                  </p>
                )}
              </TiltCard>
            </div>
          );
        })}
      </RevealGroup>
      <Reveal variant="zoom">
        <DemoDashboard t={t.demo} lang={lang} />
      </Reveal>
    </div>
  );
}
