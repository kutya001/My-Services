import { useEffect, useMemo, useRef, useState } from 'react';
import { fill } from '../shared/site';
import { useInView } from '../shared/hooks';

/*
 * Пример управленческого дашборда на вымышленных данных (сеть магазинов техники).
 * Цифры генерируются детерминированно, поэтому одинаковы при каждом открытии.
 */
const SEASON = [0.78, 0.74, 0.92, 0.95, 1.0, 0.98, 1.02, 1.05, 1.08, 1.1, 1.16, 1.42];
const BRANCHES = [
  { share: 0.56, margin: 0.27, check: 3650 },
  { share: 0.29, margin: 0.24, check: 3100 },
  { share: 0.15, margin: 0.22, check: 2750 },
];
const CATEGORY_SHARE = [0.52, 0.23, 0.17, 0.08];
const BASE = 4_900_000;
const LOCALES = { ru: 'ru-RU', kg: 'ru-RU', en: 'en-US' };

const noise = (a, b) => {
  const x = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453;
  return x - Math.floor(x);
};

function branchSeries(b) {
  const br = BRANCHES[b];
  return SEASON.map((s, m) => {
    const revenue = Math.round(BASE * s * br.share * (0.92 + 0.16 * noise(m, b + 1)));
    const margin = br.margin + 0.03 * (noise(m + 20, b + 1) - 0.5);
    const check = br.check * (0.95 + 0.1 * noise(m + 40, b + 1));
    return { revenue, profit: Math.round(revenue * margin), receipts: Math.round(revenue / check) };
  });
}

const ALL = BRANCHES.map((_, b) => branchSeries(b));

function seriesFor(branch) {
  if (branch > 0) return ALL[branch - 1];
  return SEASON.map((_, m) => ALL.reduce(
    (acc, s) => ({ revenue: acc.revenue + s[m].revenue, profit: acc.profit + s[m].profit, receipts: acc.receipts + s[m].receipts }),
    { revenue: 0, profit: 0, receipts: 0 },
  ));
}

function niceStep(max, ticks = 4) {
  const raw = max / ticks;
  const pow = 10 ** Math.floor(Math.log10(raw));
  const n = raw / pow;
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10;
  return step * pow;
}

export default function DemoDashboard({ t, lang }) {
  const [branch, setBranch] = useState(0);
  const [metric, setMetric] = useState('revenue');
  const [asTable, setAsTable] = useState(false);
  const [hover, setHover] = useState(null);
  const [viewRef, inView] = useInView({ threshold: 0.25 });
  const locale = LOCALES[lang] || 'ru-RU';
  // График рисуется в реальных пикселях, чтобы подписи не мельчали на телефоне
  const plotRef = useRef(null);
  const [W, setW] = useState(640);
  useEffect(() => {
    const el = plotRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(([e]) => setW(Math.max(280, Math.round(e.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, [asTable]);

  const fmt = useMemo(() => {
    const nf1 = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 });
    const nf0 = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 });
    return {
      compact: (v) => (v >= 1e6 ? `${nf1.format(v / 1e6)} ${t.units.m}` : v >= 1e3 ? `${nf0.format(v / 1e3)} ${t.units.k}` : nf0.format(v)),
      full: (v) => nf0.format(v),
      pct: (v) => `${nf1.format(v * 100)}%`,
    };
  }, [locale, t.units.m, t.units.k]);

  const data = useMemo(() => seriesFor(branch), [branch]);
  const totals = data.reduce((a, d) => ({ revenue: a.revenue + d.revenue, profit: a.profit + d.profit, receipts: a.receipts + d.receipts }), { revenue: 0, profit: 0, receipts: 0 });
  const values = data.map((d) => d[metric]);
  const maxVal = Math.max(...values);
  const maxIdx = values.indexOf(maxVal);
  const step = niceStep(maxVal);
  const top = Math.ceil(maxVal / step) * step;
  const ticks = [];
  for (let v = 0; v <= top + 1; v += step) ticks.push(v);

  const H = W < 480 ? 220 : 260;
  const pad = { l: 48, r: 6, t: 22, b: 28 };
  const pw = W - pad.l - pad.r;
  const ph = H - pad.t - pad.b;
  const band = pw / 12;
  const bw = Math.min(20, band * 0.6);
  const everyOther = band < 30;
  const y = (v) => pad.t + ph - (v / top) * ph;

  const cats = CATEGORY_SHARE.map((s, i) => ({ name: t.categories[i], value: Math.round(totals.revenue * s) }));
  const catMax = Math.max(...cats.map((c) => c.value));
  const kpis = [
    [t.kpi.revenue, `${fmt.compact(totals.revenue)} ${t.currency}`],
    [t.kpi.profit, `${fmt.compact(totals.profit)} ${t.currency}`],
    [t.kpi.margin, fmt.pct(totals.profit / totals.revenue)],
    [t.kpi.check, `${fmt.full(totals.revenue / totals.receipts)} ${t.currency}`],
  ];
  const chartTitle = fill(t.chartTitle, { metric: t.metrics[metric] });

  const barPath = (x, yTop, w, h) => {
    const r = Math.min(4, h, w / 2);
    return `M${x},${yTop + h} V${yTop + r} Q${x},${yTop} ${x + r},${yTop} H${x + w - r} Q${x + w},${yTop} ${x + w},${yTop + r} V${yTop + h} Z`;
  };

  return (
    <div ref={viewRef} className={`dash rounded-2xl p-4 sm:p-6 ${inView ? 'dash-in' : ''}`}>
      <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
        <div>
          <h3 className="dash-title text-lg font-bold">{t.title}</h3>
          <p className="dash-muted text-sm mt-1">{t.subtitle}</p>
        </div>
        <span className="dash-badge text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">{t.badge}</span>
      </div>

      {/* Фильтры — одной строкой над всем дашбордом */}
      <div className="flex flex-wrap items-center gap-2 mb-5">
        <div className="dash-seg flex flex-wrap rounded-lg p-1" role="group" aria-label={t.title}>
          {t.branches.map((b, i) => (
            <button key={b} type="button" onClick={() => setBranch(i)} aria-pressed={branch === i}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${branch === i ? 'dash-seg-on' : 'dash-seg-off'}`}>
              {b}
            </button>
          ))}
        </div>
        <div className="dash-seg flex rounded-lg p-1" role="group" aria-label={chartTitle}>
          {Object.entries(t.metrics).map(([key, label]) => (
            <button key={key} type="button" onClick={() => setMetric(key)} aria-pressed={metric === key}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${metric === key ? 'dash-seg-on' : 'dash-seg-off'}`}>
              {label}
            </button>
          ))}
        </div>
        <button type="button" onClick={() => setAsTable((v) => !v)} className="dash-link text-xs font-semibold ml-auto px-2 py-1.5">
          <i className={`fa-solid ${asTable ? 'fa-chart-column' : 'fa-table'} mr-1.5`} aria-hidden="true" />
          {asTable ? t.chart : t.table}
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {kpis.map(([label, value]) => (
          <div key={label} className="dash-tile rounded-xl p-3" style={{ '--i': kpis.findIndex((k) => k[0] === label) }}>
            <div className="dash-muted text-[11px]">{label}</div>
            <div className="dash-title text-lg sm:text-xl font-bold mt-0.5">{value}</div>
          </div>
        ))}
      </div>

      {asTable ? (
        <div className="overflow-x-auto">
          <table className="dash-table w-full text-sm">
            <thead>
              <tr><th>{t.month}</th><th>{t.metrics.revenue}, {t.currency}</th><th>{t.metrics.profit}, {t.currency}</th></tr>
            </thead>
            <tbody>
              {data.map((d, i) => (
                <tr key={t.months[i]}><td>{t.months[i]}</td><td>{fmt.full(d.revenue)}</td><td>{fmt.full(d.profit)}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid lg:grid-cols-[1fr_16rem] gap-5">
          <div className="min-w-0">
            <div className="dash-muted text-xs font-semibold mb-2">{chartTitle}</div>
            <div className="relative" ref={plotRef}>
              <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} className="w-full h-auto block" role="img" aria-label={chartTitle}>
                {ticks.map((v) => (
                  <g key={v}>
                    <line x1={pad.l} x2={W - pad.r} y1={y(v)} y2={y(v)} className="dash-grid" />
                    <text x={pad.l - 8} y={y(v) + 4} textAnchor="end" className="dash-axis">{fmt.compact(v)}</text>
                  </g>
                ))}
                {data.map((d, i) => {
                  const v = d[metric];
                  const x = pad.l + band * i + (band - bw) / 2;
                  const h = Math.max(1, ph * (v / top));
                  return (
                    <g key={t.months[i]}>
                      <path d={barPath(x, y(v), bw, h)} className={`dash-bar ${hover === i ? 'dash-bar-on' : ''}`} style={{ '--i': i }} />
                      {(!everyOther || i % 2 === 0) && (
                        <text x={pad.l + band * i + band / 2} y={H - 8} textAnchor="middle" className="dash-axis">{t.months[i]}</text>
                      )}
                      {i === maxIdx && (
                        <text x={x + bw / 2} y={y(v) - 7} textAnchor="middle" className="dash-label dash-fade">{fmt.compact(v)}</text>
                      )}
                      <rect
                        x={pad.l + band * i} y={pad.t} width={band} height={ph}
                        fill="transparent" tabIndex={0} role="button"
                        aria-label={`${t.months[i]}: ${fmt.full(v)} ${t.currency}`}
                        onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}
                        onFocus={() => setHover(i)} onBlur={() => setHover(null)}
                        className="dash-hit"
                      />
                    </g>
                  );
                })}
              </svg>
              {hover !== null && (
                <div
                  className="dash-tip pointer-events-none absolute -translate-x-1/2 -translate-y-full rounded-lg px-2.5 py-1.5 text-xs whitespace-nowrap"
                  style={{ left: `${((pad.l + band * hover + band / 2) / W) * 100}%`, top: `${(y(values[hover]) / H) * 100}%` }}
                >
                  <div className="dash-muted">{t.months[hover]}</div>
                  <div className="font-bold">{fmt.full(values[hover])} {t.currency}</div>
                </div>
              )}
            </div>
          </div>
          <div>
            <div className="dash-muted text-xs font-semibold mb-3">{t.categoriesTitle}</div>
            <ul className="space-y-3">
              {cats.map((c) => (
                <li key={c.name}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="dash-title">{c.name}</span>
                    <span className="dash-muted">{fmt.compact(c.value)}</span>
                  </div>
                  <div className="dash-track h-2 rounded-full">
                    <div className="dash-fill h-2 rounded-full" style={{ width: inView ? `${(c.value / catMax) * 100}%` : '0%' }} />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
      <p className="dash-muted text-[11px] mt-4">
        <i className="fa-solid fa-circle-info mr-1.5" aria-hidden="true" />
        {t.note}
      </p>
    </div>
  );
}
