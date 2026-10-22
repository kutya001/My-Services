import { useEffect, useRef } from 'react';

/*
 * Фон из частиц. Файл совпадает в резюме и визитке.
 * mode="free"  — частицы свободно плавают (резюме).
 * mode="order" — «хаос → система»: при прокрутке частицы выстраиваются в ровную сетку (визитка).
 * color — RGB-строка, например "59, 130, 246".
 */
const MAX_PARTICLES = 140;
const LINK_DIST = 140;
const GRID_STEP = 110;

export default function InteractiveBackground({ mode = 'free', color = '59, 130, 246' }) {
  const canvasRef = useRef(null);
  const colorRef = useRef(color);
  colorRef.current = color;

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return undefined;

    let reduced = false;
    try { reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { /* нет matchMedia */ }
    let finePointer = true;
    try { finePointer = window.matchMedia('(pointer: fine)').matches; } catch { /* нет matchMedia */ }

    let w = 0;
    let h = 0;
    let raf = 0;
    let particles = [];
    let grid = { cols: 1, rows: 1, step: GRID_STEP, ox: 0, oy: 0 };
    let order = 0;
    const mouse = { x: -9999, y: -9999, r: 150 };

    const targetOrder = () => {
      if (mode !== 'order') return 0;
      const y = window.scrollY || 0;
      return Math.max(0, Math.min(1, y / (window.innerHeight * 0.9)));
    };

    const layoutGrid = () => {
      const cols = Math.max(3, Math.round(w / GRID_STEP));
      const rows = Math.max(4, Math.round(h / GRID_STEP));
      const step = Math.min(w / cols, h / rows);
      grid = { cols, rows, step, ox: (w - step * (cols - 1)) / 2, oy: (h - step * (rows - 1)) / 2 };
    };

    const makeParticles = () => {
      layoutGrid();
      const count = mode === 'order'
        ? Math.min(MAX_PARTICLES, grid.cols * grid.rows)
        : Math.min(MAX_PARTICLES, Math.round((w * h) / 9000));
      // Узлы сетки перемешаны, чтобы частицы «собирались» с разных концов экрана
      const nodes = Array.from({ length: grid.cols * grid.rows }, (_, i) => i).sort(() => Math.random() - 0.5);
      particles = Array.from({ length: count }, (_, i) => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: Math.random() - 0.5,
        vy: Math.random() - 0.5,
        size: Math.random() * 2 + 1,
        node: nodes[i % nodes.length],
        ox: 0,
        oy: 0,
        phase: Math.random() * Math.PI * 2,
      }));
    };

    const resize = (force) => {
      const nw = window.innerWidth;
      const nh = window.innerHeight;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const widthChanged = nw !== w;
      // На телефонах высота «прыгает» из-за адресной строки — частицы пересоздаём только при смене ширины
      w = nw;
      h = nh;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (force || widthChanged || !particles.length) makeParticles();
      else layoutGrid();
      if (reduced) draw(0);
    };

    const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

    const draw = (time) => {
      const rgb = colorRef.current;
      ctx.clearRect(0, 0, w, h);
      const e = ease(order);
      const pts = particles.map((p) => {
        const col = p.node % grid.cols;
        const row = Math.floor(p.node / grid.cols) % grid.rows;
        const breathe = e > 0 && !reduced ? Math.sin(time / 1400 + p.phase) * 1.5 : 0;
        const gx = grid.ox + col * grid.step;
        const gy = grid.oy + row * grid.step + breathe;
        return { x: p.x * (1 - e) + gx * e + p.ox, y: p.y * (1 - e) + gy * e + p.oy, s: p.size * (1 - e) + 1.8 * e };
      });

      const freeD2 = LINK_DIST * LINK_DIST;
      const gridD2 = (grid.step * 1.08) ** 2;
      const thr2 = freeD2 * (1 - e) + gridD2 * e;
      ctx.lineWidth = 1;
      for (let a = 0; a < pts.length; a++) {
        for (let b = a + 1; b < pts.length; b++) {
          const dx = pts[a].x - pts[b].x;
          const dy = pts[a].y - pts[b].y;
          const d2 = dx * dx + dy * dy;
          if (d2 >= thr2) continue;
          const alpha = (1 - d2 / freeD2) * (1 - e) + 0.55 * e;
          if (alpha <= 0.02) continue;
          ctx.strokeStyle = `rgba(${rgb}, ${alpha.toFixed(3)})`;
          ctx.beginPath();
          ctx.moveTo(pts[a].x, pts[a].y);
          ctx.lineTo(pts[b].x, pts[b].y);
          ctx.stroke();
        }
      }
      ctx.fillStyle = `rgba(${rgb}, 0.55)`;
      for (const p of pts) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.s, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const step = (time) => {
      raf = requestAnimationFrame(step);
      order += (targetOrder() - order) * 0.06;
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx = -p.vx;
        if (p.y < 0 || p.y > h) p.vy = -p.vy;
        // Отталкивание от курсора с мягким возвратом
        const dx = p.x + p.ox - mouse.x;
        const dy = p.y + p.oy - mouse.y;
        const dist = Math.hypot(dx, dy);
        if (dist < mouse.r && dist > 0.01) {
          const force = ((mouse.r - dist) / mouse.r) * 3;
          p.ox += (dx / dist) * force;
          p.oy += (dy / dist) * force;
        }
        p.ox *= 0.92;
        p.oy *= 0.92;
      }
      draw(time);
    };

    const onMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };
    const onLeave = () => {
      mouse.x = -9999;
      mouse.y = -9999;
    };
    const onResize = () => resize(false);

    resize(true);
    window.addEventListener('resize', onResize);
    if (!reduced) {
      if (finePointer) {
        window.addEventListener('mousemove', onMove, { passive: true });
        document.addEventListener('mouseleave', onLeave);
      }
      order = targetOrder();
      raf = requestAnimationFrame(step);
    } else {
      order = targetOrder() > 0.5 ? 1 : 0;
      draw(0);
      if (mode === 'order') {
        // Без анимации: просто показываем нужное состояние
        const onScroll = () => {
          const next = targetOrder() > 0.5 ? 1 : 0;
          if (next !== order) {
            order = next;
            draw(0);
          }
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => {
          window.removeEventListener('resize', onResize);
          window.removeEventListener('scroll', onScroll);
        };
      }
    }

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseleave', onLeave);
    };
  }, [mode]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="particles-bg fixed top-0 left-0 w-full h-full pointer-events-none z-0 opacity-40"
    />
  );
}
