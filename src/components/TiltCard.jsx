import { useRef } from 'react';

/*
 * Карточка с 3D-наклоном и световым пятном под курсором. Файл совпадает в резюме и визитке.
 * Наклон работает только с мышью и выключается при «Уменьшить движение».
 */
let tiltAllowed = null;
const canTilt = () => {
  if (tiltAllowed === null) {
    try {
      tiltAllowed = window.matchMedia('(hover: hover) and (pointer: fine)').matches
        && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch {
      tiltAllowed = false;
    }
  }
  return tiltAllowed;
};

export default function TiltCard({ children, className = '', innerClassName = '', ...rest }) {
  const ref = useRef(null);
  const frame = useRef(0);

  const onMove = (e) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    el.style.setProperty('--mx', `${x}px`);
    el.style.setProperty('--my', `${y}px`);
    if (!canTilt()) return;
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      const rx = ((y - r.height / 2) / (r.height / 2)) * -6;
      const ry = ((x - r.width / 2) / (r.width / 2)) * 6;
      el.style.transform = `perspective(1000px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) scale3d(1.02, 1.02, 1.02)`;
    });
  };

  const onLeave = () => {
    cancelAnimationFrame(frame.current);
    if (ref.current) ref.current.style.transform = '';
  };

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={`tilt-card bg-slate-800/50 backdrop-blur-md border border-slate-700/50 rounded-2xl p-6 shadow-xl relative overflow-hidden group ${className}`}
      {...rest}
    >
      <div className="tilt-spotlight" aria-hidden="true" />
      <div className={`relative z-10 ${innerClassName}`}>{children}</div>
    </div>
  );
}
