import { useEffect, useRef, useState } from 'react';
import { Check, Settings, X } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';
import { LANGUAGES, LANGUAGE_LABELS } from '@/lib/i18n';

export default function SettingsButton() {
  const { lang, setLang, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event) => {
      if (!wrapperRef.current?.contains(event.target)) setOpen(false);
    };
    const onKey = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={t('settings.open')}
        aria-expanded={open}
        title={t('settings.open')}
        className="inline-flex h-10 w-10 items-center justify-center rounded-full text-foreground/65 transition hover:bg-foreground/5 hover:text-foreground"
      >
        <Settings className="h-[18px] w-[18px]" />
      </button>

      {open && (
        <div
          role="dialog"
          aria-label={t('settings.title')}
          className="absolute right-0 top-12 z-50 w-[min(15rem,calc(100vw_-_2rem))] rounded-2xl border border-border bg-popover p-3 text-popover-foreground shadow-xl"
        >
          <div className="flex items-center justify-between gap-2 px-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
              {t('settings.title')}
            </p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={t('settings.close')}
              className="inline-flex h-6 w-6 items-center justify-center rounded-full text-foreground/40 transition hover:bg-foreground/5 hover:text-foreground"
            >
              <X className="h-3 w-3" />
            </button>
          </div>

          <p className="mt-3 px-1 text-[11.5px] font-semibold text-foreground/70">
            {t('settings.language')}
          </p>

          <div className="mt-1.5 space-y-1">
            {LANGUAGES.map((code) => {
              const active = code === lang;
              return (
                <button
                  key={code}
                  type="button"
                  onClick={() => {
                    setLang(code);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center justify-between gap-2 rounded-xl px-2.5 py-2 text-left text-[12.5px] transition ${
                    active
                      ? 'bg-foreground/8 font-semibold text-foreground'
                      : 'text-foreground/65 hover:bg-foreground/5 hover:text-foreground'
                  }`}
                >
                  {LANGUAGE_LABELS[code]}
                  {active && <Check className="h-3.5 w-3.5 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
