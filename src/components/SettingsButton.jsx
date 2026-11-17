import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, Settings, X } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';
import { LANGUAGES, LANGUAGE_LABELS } from '@/lib/i18n';

export default function SettingsButton() {
  const { lang, setLang, t } = useLanguage();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    const onKey = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t('settings.open')}
        aria-expanded={open}
        className="glass inline-flex h-9 w-9 items-center justify-center rounded-full text-foreground/65 transition hover:text-foreground"
      >
        <Settings className="h-4 w-4" />
      </button>

      {open && createPortal(
        <div
          className="fixed inset-0 z-[100] flex items-start justify-center bg-black/45 px-4 pt-24 backdrop-blur-[3px] sm:items-center sm:pt-4"
          onPointerDown={(event) => {
            if (event.target === event.currentTarget) setOpen(false);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-label={t('settings.title')}
            className="glass w-full max-w-xs rounded-3xl p-4 shadow-2xl"
          >
            <div className="flex items-center justify-between gap-2 px-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                {t('settings.title')}
              </p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={t('settings.close')}
                className="inline-flex h-7 w-7 items-center justify-center rounded-full text-foreground/40 transition hover:bg-foreground/6 hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <p className="mt-4 px-1 text-[12px] font-semibold text-foreground/70">
              {t('settings.language')}
            </p>

            <div className="mt-2 space-y-1">
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
                    className={`flex min-h-11 w-full items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-left text-[13px] transition ${
                      active
                        ? 'bg-foreground/8 font-semibold text-foreground'
                        : 'text-foreground/65 hover:bg-foreground/5 hover:text-foreground'
                    }`}
                  >
                    {LANGUAGE_LABELS[code]}
                    {active && <Check className="h-4 w-4 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </section>
        </div>,
        document.body
      )}
    </>
  );
}
