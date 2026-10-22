import { useInView } from './hooks';

/*
 * Появление при прокрутке. Варианты (variant): up, down, left, right, zoom, pop, flip, blur, scatter.
 * Reveal — один блок; RevealGroup — дети с классом rv-item появляются по очереди (style --i = номер).
 * Стили — в shared/base.css. При «Уменьшить движение» и при печати всё видно сразу.
 */
export function Reveal({ as: Tag = 'div', variant = 'up', delay = 0, threshold = 0.15, className = '', style, children, ...rest }) {
  const [ref, inView] = useInView({ threshold });
  return (
    <Tag ref={ref} className={`reveal rv-${variant} ${inView ? 'is-in' : ''} ${className}`} style={{ '--d': `${delay}ms`, ...style }} {...rest}>
      {children}
    </Tag>
  );
}

export function RevealGroup({ as: Tag = 'div', step = 90, delay = 0, threshold = 0.12, className = '', style, children, ...rest }) {
  const [ref, inView] = useInView({ threshold });
  return (
    <Tag ref={ref} className={`rv-group ${inView ? 'is-in' : ''} ${className}`} style={{ '--step': `${step}ms`, '--d': `${delay}ms`, ...style }} {...rest}>
      {children}
    </Tag>
  );
}

/** Псевдослучайный «разброс» для варианта scatter: из хаоса в порядок. */
export function scatter(i, spread = 1) {
  const r = (n) => {
    const x = Math.sin((i + 1) * 12.9898 + n * 78.233) * 43758.5453;
    return x - Math.floor(x);
  };
  return {
    '--sx': `${Math.round((r(1) - 0.5) * 160 * spread)}px`,
    '--sy': `${Math.round((r(2) - 0.5) * 90 * spread)}px`,
    '--sr': `${Math.round((r(3) - 0.5) * 24 * spread)}deg`,
    '--i': i,
  };
}
