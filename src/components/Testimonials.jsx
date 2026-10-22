import TiltCard from './TiltCard';
import { IS_PREVIEW } from '../shared/site';

/* Отзывы показываются, только когда в данных есть реальные тексты. В превью — шаблон с подсказкой. */
export default function Testimonials({ t }) {
  if (t.items.length) {
    return (
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {t.items.map((item) => (
          <TiltCard key={item.name + item.text.slice(0, 12)} className="flex flex-col h-full" innerClassName="flex flex-col h-full gap-4">
            <i className="fa-solid fa-quote-left text-2xl text-blue-400/60" aria-hidden="true" />
            <blockquote className="text-slate-300 text-sm leading-relaxed flex-1">{item.text}</blockquote>
            <div className="flex items-center gap-3">
              {item.photo ? (
                <img src={item.photo} alt="" className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <span className="logo-fallback w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold">
                  {item.name.split(' ').map((w) => w[0]).slice(0, 2).join('')}
                </span>
              )}
              <div>
                <div className="font-semibold text-white text-sm">{item.name}</div>
                {item.role && <div className="text-xs text-slate-500">{item.role}</div>}
              </div>
            </div>
          </TiltCard>
        ))}
      </div>
    );
  }
  if (!IS_PREVIEW) return null;
  return (
    <div className="preview-slot max-w-3xl mx-auto rounded-2xl p-6 grid md:grid-cols-[1fr_1.1fr] gap-6 items-center">
      <div>
        <h3 className="font-bold text-amber-300 mb-2"><i className="fa-solid fa-pen mr-2" aria-hidden="true" />{t.previewTitle}</h3>
        <p className="text-sm text-slate-400">{t.previewText}</p>
      </div>
      <div className="rounded-xl border border-dashed border-slate-600 p-4 opacity-80">
        <i className="fa-solid fa-quote-left text-xl text-slate-500" aria-hidden="true" />
        <p className="text-sm text-slate-400 mt-2 italic">{t.previewExample.text}</p>
        <p className="text-xs text-slate-500 mt-3">{t.previewExample.name} · {t.previewExample.role}</p>
      </div>
    </div>
  );
}
