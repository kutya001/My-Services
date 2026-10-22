import { useEffect, useState } from 'react';
import { IS_PREVIEW, PERSON, SITE_URLS, buildVCard, downloadFile, loc } from '../shared/site';

const QR_URL = `${SITE_URLS.services}?src=qr`;

/* Визитка в телефон: QR-код на сайт (с меткой ?src=qr) и контакт в формате vCard. */
export default function BusinessCard({ t, lang }) {
  const [svg, setSvg] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    let alive = true;
    import('qrcode')
      .then(({ default: QR }) => QR.toString(QR_URL, { type: 'svg', margin: 1, errorCorrectionLevel: 'M', color: { dark: '#0f172a', light: '#ffffff' } }))
      .then((s) => alive && setSvg(s))
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  const fileBase = `${loc(PERSON.family, 'en')}_${loc(PERSON.given, 'en')}`;

  const saveContact = () => {
    if (IS_PREVIEW) { setNote(t.previewNote); return; }
    downloadFile(`${fileBase}.vcf`, buildVCard({ lang, title: t.role, url: SITE_URLS.services }), 'text/vcard;charset=utf-8');
  };

  const saveQr = async () => {
    if (IS_PREVIEW) { setNote(t.previewNote); return; }
    try {
      const { default: QR } = await import('qrcode');
      const dataUrl = await QR.toDataURL(QR_URL, { width: 1024, margin: 2, errorCorrectionLevel: 'M' });
      const blob = await (await fetch(dataUrl)).blob();
      downloadFile(`${fileBase}_QR.png`, blob, 'image/png');
    } catch { /* не критично */ }
  };

  return (
    <div className="bcard rounded-2xl border border-slate-700/50 bg-slate-800/40 p-5 flex flex-col sm:flex-row items-center gap-5">
      <div className="qr-box w-36 h-36 shrink-0 rounded-xl bg-white p-2 shadow-lg" aria-label={QR_URL} role="img">
        {svg ? <div className="w-full h-full [&>svg]:w-full [&>svg]:h-full" dangerouslySetInnerHTML={{ __html: svg }} /> : <div className="w-full h-full animate-pulse bg-slate-200 rounded" />}
      </div>
      <div className="text-center sm:text-left">
        <h3 className="font-bold text-white text-lg">{t.title}</h3>
        <p className="text-slate-400 text-sm mt-1">{t.text}</p>
        <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-4">
          <button type="button" onClick={saveContact} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold inline-flex items-center gap-2 transition-colors">
            <i className="fa-solid fa-address-card" aria-hidden="true" />{t.save}
          </button>
          <button type="button" onClick={saveQr} className="px-4 py-2 rounded-lg border border-slate-600 hover:border-blue-500 text-slate-300 hover:text-white text-sm font-bold inline-flex items-center gap-2 transition-colors">
            <i className="fa-solid fa-qrcode" aria-hidden="true" />{t.qr}
          </button>
        </div>
        {note && <p className="text-xs text-amber-400 mt-2">{note}</p>}
      </div>
    </div>
  );
}
