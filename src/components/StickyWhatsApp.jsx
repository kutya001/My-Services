import { useEffect, useState } from 'react';
import { whatsappLink } from '../shared/site';

/* Плавающая кнопка WhatsApp на телефоне: появляется после первого экрана и прячется у блока контактов. */
export default function StickyWhatsApp({ text, label }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    let contactVisible = false;
    const update = () => setShow(window.scrollY > window.innerHeight * 0.8 && !contactVisible);
    const contact = document.getElementById('contact');
    let obs;
    if (contact && typeof IntersectionObserver !== 'undefined') {
      obs = new IntersectionObserver(([e]) => { contactVisible = e.isIntersecting; update(); }, { threshold: 0.1 });
      obs.observe(contact);
    }
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => {
      window.removeEventListener('scroll', update);
      obs?.disconnect();
    };
  }, []);

  return (
    <a
      href={whatsappLink(text)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      title={label}
      className={`sticky-wa md:hidden fixed z-40 w-14 h-14 rounded-full flex items-center justify-center text-white text-2xl shadow-xl transition-all duration-300 ${show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6 pointer-events-none'}`}
    >
      <i className="fa-brands fa-whatsapp" aria-hidden="true" />
    </a>
  );
}
