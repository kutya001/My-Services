import { useEffect, useState } from 'react';
import { useInView, useReducedMotion } from './hooks';

/** Число, которое «докручивается» до значения, когда появляется на экране. */
export default function CountUp({ value, suffix = '', duration = 1300, className = '' }) {
  const [ref, inView] = useInView({ threshold: 0.3 });
  const reduced = useReducedMotion();
  const [shown, setShown] = useState(reduced ? value : 0);

  useEffect(() => {
    if (!inView) return undefined;
    if (reduced) {
      setShown(value);
      return undefined;
    }
    let raf = 0;
    let t0 = 0;
    const step = (t) => {
      if (!t0) t0 = t;
      const k = Math.min(1, (t - t0) / duration);
      const eased = 1 - Math.pow(1 - k, 3);
      setShown(Math.round(value * eased));
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [inView, value, reduced, duration]);

  return (
    <span ref={ref} className={className} style={{ fontVariantNumeric: 'tabular-nums' }}>
      {shown}
      {suffix}
    </span>
  );
}
