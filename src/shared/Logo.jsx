import { useState } from 'react';
import { isExternal } from './site';

/** Логотип компании; если картинка не загрузилась — инициалы. */
export default function Logo({ src, name, className = '' }) {
  const [failed, setFailed] = useState(!src);
  const initials = String(name || '?')
    .split(/[\s—–-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  if (failed) {
    return (
      <span
        className={`logo-fallback flex items-center justify-center font-bold text-[0.7em] tracking-wide ${className}`}
        role="img"
        aria-label={name}
      >
        {initials}
      </span>
    );
  }
  return (
    <img
      src={src}
      alt={name}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={`${isExternal(src) ? 'object-contain bg-white p-1' : 'object-cover'} ${className}`}
    />
  );
}
