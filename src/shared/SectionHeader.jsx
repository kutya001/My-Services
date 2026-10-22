import { RevealGroup } from './Reveal';

/** Заголовок раздела: метка, заголовок и подзаголовок выплывают по очереди. */
export default function SectionHeader({ tag, title, subtitle, className = 'mb-12 md:mb-14' }) {
  return (
    <RevealGroup step={120} className={`text-center ${className}`}>
      {tag && (
        <span className="section-tag rv-item rv-pop inline-block text-blue-400 font-mono text-xs tracking-[0.2em] uppercase border border-blue-500/20 px-3 py-1 rounded-full" style={{ '--i': 0 }}>
          {tag}
        </span>
      )}
      <h2 className="rv-item rv-blur text-3xl md:text-4xl font-bold mt-4 text-balance" style={{ '--i': 1 }}>{title}</h2>
      {subtitle && (
        <p className="rv-item rv-up text-slate-400 mt-3 max-w-2xl mx-auto text-sm md:text-base" style={{ '--i': 2 }}>{subtitle}</p>
      )}
    </RevealGroup>
  );
}
