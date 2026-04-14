import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'zh', label: '中文' },
];

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('language', lng);
    setOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const current = LANGUAGES.find((l) => l.code === i18n.language) || LANGUAGES[0];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-2.5 py-1.5 text-sm text-[#9AA7BD] hover:border-[#00FF9A]/30 hover:text-[#E7EDF7] transition-colors"
      >
        {/* Globe icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="h-4 w-4"
        >
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 01-1.2-.444 6.008 6.008 0 011.2-4.136A6.015 6.015 0 016 3.14a6.015 6.015 0 011.668.307 6.008 6.008 0 011.2 4.136 6.012 6.012 0 01-1.2.444A8.026 8.026 0 016 8.25a8.026 8.026 0 01-1.668-.223zM6 10a9.97 9.97 0 01-2.247-.309A6.01 6.01 0 006 14.474a6.01 6.01 0 004.247-4.783A9.97 9.97 0 016 10zm3.753 4.474A6.01 6.01 0 0014 10a9.97 9.97 0 01-2.247.309 8.026 8.026 0 01-1.668.223 8.026 8.026 0 01-1.668-.223A9.97 9.97 0 016.247 10 6.01 6.01 0 009.753 14.474zM10 10a8.026 8.026 0 01-1.668-.223 6.012 6.012 0 01-1.2-.444 6.008 6.008 0 011.2-4.136A6.015 6.015 0 0110 4.86a6.015 6.015 0 011.668.307 6.008 6.008 0 011.2 4.136 6.012 6.012 0 01-1.2.444A8.026 8.026 0 0110 10z"
            clipRule="evenodd"
          />
        </svg>
        <span>{current.code === 'zh' ? '中文' : 'EN'}</span>
        {/* Chevron */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`}
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 mt-1.5 w-32 overflow-hidden rounded-xl border border-white/10 bg-[#0B1220] shadow-lg shadow-black/30 z-50">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => changeLanguage(lang.code)}
              className={`flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors ${
                i18n.language === lang.code
                  ? 'text-[#00FF9A] bg-[#00FF9A]/10'
                  : 'text-[#9AA7BD] hover:bg-white/5 hover:text-[#E7EDF7]'
              }`}
            >
              {i18n.language === lang.code && (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                  <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                </svg>
              )}
              <span className={i18n.language === lang.code ? 'ml-0' : 'ml-[1.375rem]'}>
                {lang.label}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
